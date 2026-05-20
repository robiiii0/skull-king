"use client";

import { useState } from "react";
import type { ClientGameState } from "@/types/game";
import { NumberPicker } from "./number-picker";

interface RoundInputProps {
  gameState: ClientGameState;
  onSubmit: (bid: number, actual: number, bonus: number) => void;
}

export function RoundInput({ gameState, onSubmit }: RoundInputProps) {
  const [bid, setBid] = useState(0);
  const [actual, setActual] = useState(0);
  const [bonus, setBonus] = useState(0);
  const roundIdx = gameState.currentRound - 1;
  const me = gameState.players.find((p) => p.player.id === gameState.myId);
  const hasSubmitted = me?.rounds[roundIdx].bid !== null;

  const playersStatus = gameState.players.map((p) => ({
    name: p.player.name,
    done: p.rounds[roundIdx].bid !== null,
  }));

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="text-center">
        <h2 className="skull-title text-2xl mb-1">
          Manche {gameState.currentRound}
        </h2>
        <p className="text-bone-dim text-sm">
          {gameState.currentRound} carte{gameState.currentRound > 1 ? "s" : ""} en jeu
        </p>
        {gameState.firstPlayerId && (() => {
          const first = gameState.players.find(p => p.player.id === gameState.firstPlayerId);
          if (!first) return null;
          const isMe = first.player.id === gameState.myId;
          return (
            <p className="text-gold text-sm mt-1">
              {isMe ? "Tu commences cette manche !" : `${first.player.name} commence cette manche`}
            </p>
          );
        })()}
      </div>

      {!hasSubmitted ? (
        <>
          <NumberPicker
            value={bid}
            onChange={setBid}
            min={0}
            max={gameState.currentRound}
            label="Plis annonc&eacute;s"
          />

          <NumberPicker
            value={actual}
            onChange={setActual}
            min={0}
            max={gameState.currentRound}
            label="Plis r&eacute;alis&eacute;s"
          />

          <NumberPicker
            value={bonus}
            onChange={setBonus}
            min={-500}
            max={500}
            label="Points bonus"
            editable
            step={10}
          />

          <button
            className="btn-gold w-full max-w-xs py-4 text-lg"
            onClick={() => onSubmit(bid, actual, bonus)}
          >
            Confirmer
          </button>
        </>
      ) : (
        <div className="card text-center space-y-2">
          <div>
            <p className="text-bone-dim text-xs uppercase tracking-widest">Annonc&eacute;s</p>
            <p className="skull-title text-3xl">{me?.rounds[roundIdx].bid}</p>
          </div>
          <div>
            <p className="text-bone-dim text-xs uppercase tracking-widest">R&eacute;alis&eacute;s</p>
            <p className="skull-title text-3xl">{me?.rounds[roundIdx].actual}</p>
          </div>
          {(me?.rounds[roundIdx].bonus ?? 0) !== 0 && (
            <p className={`text-sm ${(me?.rounds[roundIdx].bonus ?? 0) > 0 ? "text-gold" : "text-danger"}`}>
              {(me?.rounds[roundIdx].bonus ?? 0) > 0 ? "+" : ""}{me?.rounds[roundIdx].bonus} bonus
            </p>
          )}
        </div>
      )}

      {/* Status of other players */}
      <div className="w-full max-w-xs">
        <p className="text-xs text-bone-dim uppercase tracking-widest mb-2">
          En attente...
        </p>
        <div className="space-y-1.5">
          {playersStatus.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between text-sm"
            >
              <span className={p.done ? "text-bone" : "text-bone-dim/50"}>
                {p.name}
              </span>
              <span>{p.done ? "\u2713" : "..."}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
