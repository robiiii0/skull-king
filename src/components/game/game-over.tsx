"use client";

import { useEffect, useState, useRef } from "react";
import type { ClientGameState } from "@/types/game";
import { saveMatchResults, updateMyStats } from "@/lib/save-match";
import type { EloResult } from "@/lib/save-match";
import { getRank } from "@/lib/ranks";

interface GameOverProps {
  gameState: ClientGameState;
}

export function GameOver({ gameState }: GameOverProps) {
  const [eloResults, setEloResults] = useState<EloResult[]>([]);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);

  const sorted = [...gameState.players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const medals = ["🥇", "🥈", "🥉"];
  const isHost = gameState.myId === gameState.hostId;
  const me = gameState.players.find((p) => p.player.id === gameState.myId);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    setSaving(true);

    const tasks: Promise<void>[] = [];

    // Host creates the match record and match_players in DB
    if (isHost) {
      tasks.push(
        saveMatchResults(gameState).then((results) => {
          if (results) setEloResults(results);
        })
      );
    }

    // Every player updates their own profile (respects RLS)
    if (me?.player.name) {
      const myName = me.player.name;
      tasks.push(
        updateMyStats(gameState, myName).then((result) => {
          if (result) {
            setEloResults((prev) => {
              // If host already set results for everyone, skip duplicate
              if (prev.some((r) => r.player_id === result.player_id))
                return prev;
              return [...prev, result];
            });
          }
        })
      );
    }

    Promise.all(tasks).then(() => setSaving(false));
  }, [isHost, gameState, me?.player.name]);

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
