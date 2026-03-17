export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface RoundData {
  bid: number | null;
  actual: number | null;
  bonus: number;
  score: number;
  readyForNext: boolean;
}

export interface PlayerGameState {
  player: Player;
  rounds: RoundData[];
  totalScore: number;
}

export type GamePhase =
  | "lobby"
  | "playing"
  | "round-summary"
  | "game-over";

export interface GameRoom {
  code: string;
  hostId: PlayerId;
  players: Map<PlayerId, PlayerGameState>;
  currentRound: number;
  phase: GamePhase;
  createdAt: number;
}

export interface ClientGameState {
  code: string;
  hostId: PlayerId;
  players: PlayerGameState[];
  currentRound: number;
  phase: GamePhase;
  myId: PlayerId;
}

export interface ServerToClientEvents {
  "room:state": (state: ClientGameState) => void;
  "room:error": (message: string) => void;
}

export interface ClientToServerEvents {
  "room:create": (
    playerName: string,
    callback: (code: string) => void
  ) => void;
  "room:join": (
    code: string,
    playerName: string,
    callback: (success: boolean, error?: string) => void
  ) => void;
  "room:rejoin": (
    code: string,
    playerName: string,
    callback: (success: boolean) => void
  ) => void;
  "game:start": () => void;
  "round:submit": (bid: number, actual: number, bonus: number) => void;
  "round:ready": () => void;
}
