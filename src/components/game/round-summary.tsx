"use client";

import type { ClientGameState } from "@/types/game";

interface RoundSummaryProps {
  gameState: ClientGameState;
  onReady: () => void;
}

export function RoundSummary({ gameState, onReady }: RoundSummaryProps) {
  const roundIdx = gameState.currentRound - 1;
  const me = gameState.players.find((p) => p.player.id === gameState.myId);
  const isReady = me?.rounds[roundIdx].readyForNext ?? false;

  const readyCount = gameState.players.filter(
    (p) => p.rounds[roundIdx].readyForNext
  ).length;
  const totalPlayers = gameState.players.length;

  const sorted = [...gameState.players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <h2 className="skull-title text-2xl">Résultats - Manche {gameState.currentRound}</h2>

      <div className="w-full max-w-sm space-y-2">
        {sorted.map((p, idx) => {
          const rd = p.rounds[roundIdx];
          const isMe = p.player.id === gameState.myId;
          return (
            <div
              key={p.player.id}
              className={`card flex items-center gap-3 py-3 ${
                isMe ? "border-gold/40 bg-gold/5" : ""
              }`}
            >
              <span className="text-bone-dim text-sm w-6">{idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {p.player.name}
                  {isMe && (
                    <span className="text-gold text-xs ml-1">(toi)</span>
                  )}
                </div>
                <div className="text-xs text-bone-dim">
                  Annoncé {rd.bid} → Réalisé {rd.actual}
                  {rd.bonus > 0 && ` (+${rd.bonus} bonus)`}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`skull-title text-xl ${
                    rd.score >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {rd.score > 0 ? "+" : ""}
                  {rd.score}
                </span>
                <div className="text-xs text-bone-dim">
                  Total: {p.totalScore}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-sm">
        <button
          className={`w-full py-4 text-lg ${isReady ? "btn-outline opacity-60" : "btn-gold"}`}
          onClick={onReady}
          disabled={isReady}
        >
          {isReady
            ? `En attente... (${readyCount}/${totalPlayers})`
            : gameState.currentRound >= 10
            ? "Voir le classement final"
            : "Manche suivante"}
        </button>
        {!isReady && readyCount > 0 && (
          <p className="text-center text-bone-dim/50 text-xs mt-2">
            {readyCount}/{totalPlayers} joueur{readyCount > 1 ? "s" : ""} prêt
            {readyCount > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
