"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/use-game-state";
import { supabase } from "@/lib/supabase";
import { getRank } from "@/lib/ranks";
import { Avatar } from "@/components/avatar";

interface PlayerInfo {
  username: string;
  avatar_url: string | null;
  elo: number;
}

export default function LobbyPage() {
  const router = useRouter();
  const { code } = useParams<{ code: string }>();
  const { isConnected, rejoinRoom, gameState, startGame } = useGameState();
  const [playerInfos, setPlayerInfos] = useState<Map<string, PlayerInfo>>(
    new Map()
  );

  // On mount (or refresh), rejoin if we don't have gameState yet
  useEffect(() => {
    if (!isConnected || gameState) return;

    const name =
      sessionStorage.getItem("sk-name") ||
      localStorage.getItem("sk-player-name");
    if (!name) {
      router.replace("/");
      return;
    }

    rejoinRoom(code, name).then((success) => {
      if (!success) {
        sessionStorage.removeItem("sk-room");
        sessionStorage.removeItem("sk-name");
        router.replace("/");
      }
    });
  }, [isConnected, gameState, code, rejoinRoom, router]);

  // Fetch player profiles from Supabase
  useEffect(() => {
    if (!gameState) return;
    const usernames = gameState.players.map((p) => p.player.name);
    supabase
      .from("players")
      .select("username, avatar_url, elo")
      .in("username", usernames)
      .then(({ data }) => {
        if (data) {
          const map = new Map<string, PlayerInfo>();
          for (const p of data) map.set(p.username, p);
          setPlayerInfos(map);
        }
      });
  }, [gameState?.players.length]);

  // Transition to game when host starts
  useEffect(() => {
    if (gameState && gameState.phase !== "lobby") {
      router.push(`/game/${gameState.code}`);
    }
  }, [gameState, router]);

  const players = gameState?.players ?? [];
  const canStart = players.length >= 2;
  const isHost = gameState?.myId === gameState?.hostId;

  return (
    <div className="flex flex-col items-center min-h-dvh px-6 py-8">
      <button
        onClick={() => router.push("/")}
        className="self-start text-bone-dim hover:text-bone text-sm mb-6"
      >
        &larr; Retour
      </button>

      <h1 className="skull-title text-3xl mb-8">Lobby</h1>

      {!gameState ? (
        <div className="text-bone-dim animate-pulse">Connexion...</div>
      ) : (
        <>
          {/* Room code display */}
          <div className="card text-center mb-8 w-full max-w-sm">
            <p className="text-bone-dim text-sm mb-2 uppercase tracking-widest">
              Code du lobby
            </p>
            <div className="skull-title text-5xl tracking-[0.3em] select-all">
              {gameState.code}
            </div>
            <p className="text-bone-dim/60 text-xs mt-3">
              Partage ce code aux autres joueurs
            </p>
          </div>

          {/* Player list */}
          <div className="w-full max-w-sm mb-8">
            <h2 className="text-sm text-bone-dim uppercase tracking-widest mb-3">
              Joueurs ({players.length}/8)
            </h2>
            <div className="space-y-2">
              {players.map((p) => {
                const info = playerInfos.get(p.player.name);
                const rank = info ? getRank(info.elo) : null;
                return (
                  <div
                    key={p.player.id}
                    className="card flex items-center gap-3 py-3"
                  >
                    <div className="relative">
                      <Avatar
                        url={info?.avatar_url ?? null}
                        username={p.player.name}
                        size={36}
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-navy-light ${
                          p.player.isConnected ? "bg-success" : "bg-danger"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">
                        {p.player.name}
                      </span>
                      {rank && (
                        <span className="text-xs" style={{ color: rank.color }}>
                          {rank.icon} {rank.name}
                        </span>
                      )}
                    </div>
                    {p.player.isHost && (
                      <span className="text-gold text-xs uppercase tracking-wider">
                        H&ocirc;te
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start button (host only) */}
          {isHost ? (
            <>
              <button
                className="btn-gold w-full max-w-sm text-lg py-4"
                onClick={() => startGame()}
                disabled={!canStart}
              >
                {canStart ? "Lancer la partie" : "En attente de joueurs..."}
              </button>
              {!canStart && (
                <p className="text-bone-dim/50 text-xs mt-2">
                  Minimum 2 joueurs requis
                </p>
              )}
            </>
          ) : (
            <p className="text-bone-dim animate-pulse">
              En attente du lancement par l&apos;h&ocirc;te...
            </p>
          )}
        </>
      )}
    </div>
  );
}
