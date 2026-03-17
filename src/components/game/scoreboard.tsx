"use client";

import { useState } from "react";
import type { ClientGameState } from "@/types/game";

interface ScoreboardProps {
  gameState: ClientGameState;
}

export function Scoreboard({ gameState }: ScoreboardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sorted = [...gameState.players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <>
      {/* Floating icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-navy-mid border-2 border-gold/40
                   flex items-center justify-center shadow-lg shadow-black/40
                   active:scale-90 transition-transform"
        aria-label="Classement"
      >
        <span className="text-2xl">🏆</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-navy-light border-t border-gold/20
                    rounded-t-2xl transition-transform duration-300 ease-out ${
                      isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
        style={{ maxHeight: "80vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-bone-dim/30" />
        </div>

        <div className="px-5 pb-2 flex items-center justify-between">
          <h2 className="skull-title text-xl">Classement</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-bone-dim hover:text-bone text-sm"
          >
            Fermer
          </button>
        </div>

        <div className="overflow-auto px-4 pb-6" style={{ maxHeight: "calc(80vh - 60px)" }}>
          {/* Ranking cards */}
          <div className="space-y-2 mb-6">
            {sorted.map((p, i) => {
              const isMe = p.player.id === gameState.myId;
              return (
                <div
                  key={p.player.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isMe
                      ? "bg-gold/10 border border-gold/30"
                      : "bg-navy-mid/50 border border-white/5"
                  }`}
                >
                  <span className="text-xl w-8 text-center">
                    {i < 3 ? medals[i] : <span className="text-bone-dim text-sm">{i + 1}</span>}
                  </span>
                  <span className={`font-medium flex-1 ${isMe ? "text-gold" : "text-bone"}`}>
                    {p.player.name}
                  </span>
                  <span className={`skull-title text-xl ${isMe ? "text-gold" : "text-bone"}`}>
                    {p.totalScore}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detail table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-bone-dim text-xs uppercase tracking-wider">
                  <th className="text-left py-2 pr-4 sticky left-0 bg-navy-light">
                    Joueur
                  </th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th
                      key={i}
                      className={`px-3 py-2 text-center min-w-[50px] ${
                        i + 1 === gameState.currentRound ? "text-gold" : ""
                      }`}
                    >
                      M{i + 1}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-gold">Total</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const isMe = p.player.id === gameState.myId;
                  return (
                    <tr
                      key={p.player.id}
                      className={isMe ? "text-gold" : "text-bone"}
                    >
                      <td className="py-2 pr-4 font-medium truncate max-w-[100px] sticky left-0 bg-navy-light">
                        {p.player.name}
                      </td>
                      {p.rounds.map((rd, i) => (
                        <td
                          key={i}
                          className={`px-3 py-2 text-center ${
                            i + 1 === gameState.currentRound
                              ? "bg-gold/5 rounded"
                              : ""
                          } ${
                            rd.score > 0
                              ? "text-success"
                              : rd.score < 0
                              ? "text-danger"
                              : "text-bone-dim/30"
                          }`}
                        >
                          {rd.bid !== null ? rd.score : "\u2014"}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-bold">
                        {p.totalScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
