"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameState } from "@/hooks/use-game-state";
import { RoundInput } from "@/components/game/round-input";
import { RoundSummary } from "@/components/game/round-summary";
import { Scoreboard } from "@/components/game/scoreboard";
import { GameOver } from "@/components/game/game-over";

export default function GamePage() {
  const router = useRouter();
  const {
    isConnected,
    gameState,
    error,
    rejoinRoom,
    submitRound,
    markReady,
  } = useGameState();

  // Try to rejoin on mount if no gameState
  useEffect(() => {
    if (!isConnected || gameState) return;

    const code = sessionStorage.getItem("sk-room");
    const name = sessionStorage.getItem("sk-name") || localStorage.getItem("sk-player-name");

    if (code && name) {
      rejoinRoom(code, name).then((success) => {
        if (!success) {
          router.replace("/");
        }
      });
    } else {
      router.replace("/");
    }
  }, [isConnected, gameState, rejoinRoom, router]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-bone-dim animate-pulse">Connexion...</div>
      </div>
    );
  }

  if (gameState.phase === "game-over") {
    return <GameOver gameState={gameState} />;
  }

  return (
    <div className="flex flex-col min-h-dvh pb-16">
      {/* Round header */}
      <div className="bg-navy-light/80 backdrop-blur border-b border-gold/10 px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="skull-title text-xl">
              Manche {gameState.currentRound}/10
            </h1>
            <p className="text-bone-dim text-xs">
              {gameState.currentRound} carte{gameState.currentRound > 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-bone-dim uppercase tracking-widest">
              {gameState.phase === "playing" && "En jeu"}
              {gameState.phase === "round-summary" && "R\u00e9sultats"}
            </div>
          </div>
        </div>
      </div>

      {/* Phase content */}
      <div className="flex-1 px-5">
        {error && (
          <div className="text-danger text-sm text-center bg-danger/10 rounded-lg py-2 px-4 mt-4">
            {error}
          </div>
        )}

        {gameState.phase === "playing" && (
          <RoundInput gameState={gameState} onSubmit={submitRound} />
        )}
        {gameState.phase === "round-summary" && (
          <RoundSummary gameState={gameState} onReady={markReady} />
        )}
      </div>

      {/* Scoreboard drawer */}
      <Scoreboard gameState={gameState} />
    </div>
  );
}
