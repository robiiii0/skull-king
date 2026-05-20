"use client";

import type { ClientGameState } from "@/types/game";
import type { EloResult } from "@/lib/save-match";
import { getRank } from "@/lib/ranks";

interface GameOverProps {
  gameState: ClientGameState;
  eloResults: EloResult[];
  saving: boolean;
}

export function GameOver({ gameState, eloResults, saving }: GameOverProps) {
  const sorted = [...gameState.players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const medals = ["🥇", "🥈", "🥉"];

  function getEloChange(playerName: string): EloResult | undefined {
    return eloResults.find((r) => r.username === playerName);
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 min-h-dvh">
      <div className="text-center">
        <div className="text-6xl mb-4">☠️</div>
        <h1 className="skull-title text-4xl mb-2">Partie terminee !</h1>
        <p className="text-bone-dim">10 manches jouees</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {sorted.map((p, idx) => {
          const isMe = p.player.id === gameState.myId;
          const elo = getEloChange(p.player.name);
          return (
            <div
              key={p.player.id}
              className={`card flex items-center gap-3 ${
                idx === 0
                  ? "border-gold/50 bg-gold/10 py-5"
                  : "py-3"
              } ${isMe ? "ring-1 ring-gold/30" : ""}`}
            >
              <span className="text-2xl w-10 text-center">
                {medals[idx] || `${idx + 1}.`}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${idx === 0 ? "text-lg" : ""}`}>
                  {p.player.name}
                  {isMe && (
                    <span className="text-gold text-xs ml-1">(toi)</span>
                  )}
                </div>
                {elo && (
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span>{getRank(elo.elo_after).icon}</span>
                    <span
                      className={
                        elo.elo_change >= 0 ? "text-success" : "text-danger"
                      }
                    >
                      {elo.elo_change > 0 ? "+" : ""}
                      {elo.elo_change} ELO
                    </span>
                    <span className="text-bone-dim">
                      ({elo.elo_after})
                    </span>
                  </div>
                )}
              </div>
              <span
                className={`skull-title ${
                  idx === 0 ? "text-3xl" : "text-xl"
                } ${p.totalScore >= 0 ? "text-gold" : "text-danger"}`}
              >
                {p.totalScore}
              </span>
            </div>
          );
        })}
      </div>

      {saving && (
        <p className="text-bone-dim text-sm animate-pulse">
          Sauvegarde des resultats...
        </p>
      )}

      <button
        className="btn-outline mt-4"
        onClick={() => (window.location.href = "/")}
      >
        Nouvelle partie
      </button>
    </div>
  );
}
