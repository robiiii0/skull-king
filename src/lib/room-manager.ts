import type { Server } from "socket.io";
import type {
  GameRoom,
  PlayerGameState,
  RoundData,
  ClientGameState,
  PlayerId,
} from "@/types/game";
import { computeRoundScore } from "./scoring";

const rooms = new Map<string, GameRoom>();
const playerRooms = new Map<PlayerId, string>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code: string;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

function createEmptyRounds(): RoundData[] {
  return Array.from({ length: 10 }, () => ({
    bid: null,
    actual: null,
    bonus: 0,
    score: 0,
    readyForNext: false,
  }));
}

function serializeRoom(room: GameRoom, forPlayerId: PlayerId): ClientGameState {
  return {
    code: room.code,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
    currentRound: room.currentRound,
    phase: room.phase,
    myId: forPlayerId,
  };
}

function broadcastState(room: GameRoom, io: Server) {
  for (const [playerId] of room.players) {
    const state = serializeRoom(room, playerId);
    io.to(playerId).emit("room:state", state);
  }
}

export function createRoom(
  socketId: PlayerId,
  playerName: string,
  io: Server
): string {
  const code = generateCode();
  const playerState: PlayerGameState = {
    player: {
      id: socketId,
      name: playerName,
      isHost: true,
      isConnected: true,
    },
    rounds: createEmptyRounds(),
    totalScore: 0,
  };

  const room: GameRoom = {
    code,
    hostId: socketId,
    players: new Map([[socketId, playerState]]),
    currentRound: 1,
    phase: "lobby",
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  playerRooms.set(socketId, code);
  broadcastState(room, io);
  return code;
}

export function joinRoom(
  code: string,
  socketId: PlayerId,
  playerName: string,
  io: Server
): { success: boolean; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { success: false, error: "Lobby introuvable" };
  if (room.phase !== "lobby")
    return { success: false, error: "La partie a déjà commencé" };
  if (room.players.size >= 8)
    return { success: false, error: "Lobby plein (max 8 joueurs)" };

  const existingNames = Array.from(room.players.values()).map(
    (p) => p.player.name
  );
  if (existingNames.includes(playerName))
    return { success: false, error: "Ce nom est déjà pris" };

  const playerState: PlayerGameState = {
    player: {
      id: socketId,
      name: playerName,
      isHost: false,
      isConnected: true,
    },
    rounds: createEmptyRounds(),
    totalScore: 0,
  };

  room.players.set(socketId, playerState);
  playerRooms.set(socketId, code.toUpperCase());
  broadcastState(room, io);
  return { success: true };
}

export function rejoinRoom(
  code: string,
  socketId: PlayerId,
  playerName: string,
  io: Server
): boolean {
  const upperCode = code.toUpperCase();
  const room = rooms.get(upperCode);
  if (!room) return false;

  // Cancel any pending room cleanup
  const pendingTimer = roomCleanupTimers.get(upperCode);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    roomCleanupTimers.delete(upperCode);
  }

  for (const [oldId, state] of room.players) {
    if (state.player.name === playerName) {
      // Allow rejoin whether connected or not (handles fast refresh)
      if (oldId !== socketId) {
        room.players.delete(oldId);
        playerRooms.delete(oldId);
      }
      state.player.id = socketId;
      state.player.isConnected = true;
      if (room.hostId === oldId) room.hostId = socketId;
      room.players.set(socketId, state);
      playerRooms.set(socketId, upperCode);
      broadcastState(room, io);
      return true;
    }
  }
  return false;
}

export function startGame(socketId: PlayerId, io: Server): string | null {
  const code = playerRooms.get(socketId);
  if (!code) return "Pas dans un lobby";
  const room = rooms.get(code);
  if (!room) return "Lobby introuvable";
  if (room.hostId !== socketId) return "Seul l'hôte peut lancer la partie";
  if (room.players.size < 2) return "Il faut au moins 2 joueurs";
  if (room.phase !== "lobby") return "La partie a déjà commencé";

  room.phase = "playing";
  room.currentRound = 1;
  broadcastState(room, io);
  return null;
}

export function submitRound(
  socketId: PlayerId,
  bid: number,
  actual: number,
  bonus: number,
  io: Server
): string | null {
  const code = playerRooms.get(socketId);
  if (!code) return "Pas dans une partie";
  const room = rooms.get(code);
  if (!room) return "Partie introuvable";
  if (room.phase !== "playing") return "Ce n'est pas le moment";

  const player = room.players.get(socketId);
  if (!player) return "Joueur introuvable";

  const roundIdx = room.currentRound - 1;
  if (bid < 0 || bid > room.currentRound) return "Annonce invalide";
  if (actual < 0 || actual > room.currentRound) return "Plis réalisés invalide";

  player.rounds[roundIdx].bid = bid;
  player.rounds[roundIdx].actual = actual;
  player.rounds[roundIdx].bonus = bonus;

  const allDone = Array.from(room.players.values()).every(
    (p) => p.rounds[roundIdx].bid !== null && p.rounds[roundIdx].actual !== null
  );
  if (allDone) {
    for (const p of room.players.values()) {
      const rd = p.rounds[roundIdx];
      rd.score = computeRoundScore(rd.bid!, rd.actual!, room.currentRound, rd.bonus);
      p.totalScore = p.rounds.reduce((sum, r) => sum + r.score, 0);
    }
    room.phase = "round-summary";
  }

  broadcastState(room, io);
  return null;
}

export function markReady(socketId: PlayerId, io: Server): string | null {
  const code = playerRooms.get(socketId);
  if (!code) return "Pas dans une partie";
  const room = rooms.get(code);
  if (!room) return "Partie introuvable";
  if (room.phase !== "round-summary") return "Ce n'est pas le moment";

  const player = room.players.get(socketId);
  if (!player) return "Joueur introuvable";

  const roundIdx = room.currentRound - 1;
  player.rounds[roundIdx].readyForNext = true;

  const allReady = Array.from(room.players.values()).every(
    (p) => p.rounds[roundIdx].readyForNext
  );

  if (allReady) {
    if (room.currentRound >= 10) {
      room.phase = "game-over";
    } else {
      room.currentRound++;
      room.phase = "playing";
    }
  }

  broadcastState(room, io);
  return null;
}

const roomCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function handleDisconnect(socketId: PlayerId, io: Server) {
  const code = playerRooms.get(socketId);
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  const player = room.players.get(socketId);
  if (!player) return;

  player.player.isConnected = false;

  const anyConnected = Array.from(room.players.values()).some(
    (p) => p.player.isConnected
  );
  if (!anyConnected) {
    // Delay room deletion to allow reconnection (e.g. page refresh)
    const timer = setTimeout(() => {
      const currentRoom = rooms.get(code);
      if (!currentRoom) return;
      const stillNoOne = Array.from(currentRoom.players.values()).every(
        (p) => !p.player.isConnected
      );
      if (stillNoOne) {
        rooms.delete(code);
        for (const [pid] of currentRoom.players) playerRooms.delete(pid);
      }
      roomCleanupTimers.delete(code);
    }, 15_000); // 15 seconds grace period
    roomCleanupTimers.set(code, timer);
    return;
  }

  // Cancel any pending cleanup if someone is still connected
  const pendingTimer = roomCleanupTimers.get(code);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    roomCleanupTimers.delete(code);
  }

  broadcastState(room, io);
}

// Cleanup stale rooms every 30 min
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.createdAt < twoHoursAgo) {
      for (const [pid] of room.players) playerRooms.delete(pid);
      rooms.delete(code);
    }
  }
}, 30 * 60 * 1000);
