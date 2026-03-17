"use client";

import { useState } from "react";
import type { ClientGameState } from "@/types/game";
import { NumberPicker } from "./number-picker";

interface PlayPhaseProps {
  gameState: ClientGameState;
  onSubmitActual: (actual: number) => void;
  onSubmitBonus: (bonus: number) => void;
}

export function PlayPhase({
  gameState,
  onSubmitActual,
  onSubmitBonus,
}: PlayPhaseProps) {
  const [actual, setActual] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [showBonus, setShowBonus] = useState(false);
  const roundIdx = gameState.currentRound - 1;
  const me = gameState.players.find((p) => p.player.id === gameState.myId);
  const hasSubmitted = me?.rounds[roundIdx].actual !== null;

  const playersStatus = gameState.players.map((p) => ({
    name: p.player.name,
    done: p.rounds[roundIdx].actual !== null,
  }));

  function handleSubmit() {
    if (bonus > 0) {
      onSubmitBonus(bonus);
    }
    onSubmitActual(actual);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="text-center">
        <h2 className="skull-title text-2xl mb-1">Résultat du pli</h2>
        <p className="text-bone-dim text-sm">
          Tu avais annoncé{" "}
          <span className="text-gold font-bold">
            {me?.rounds[roundIdx].bid}
          </span>{" "}
          pli{(me?.rounds[roundIdx].bid ?? 0) > 1 ? "s" : ""}
        </p>
      </div>

      {!hasSubmitted ? (
        <>
          <NumberPicker
            value={actual}
            onChange={setActual}
            min={0}
            max={gameState.currentRound}
            label="Plis réalisés"
          />

          {/* Bonus section */}
          {!showBonus ? (
            <button
              className="btn-outline text-sm px-4 py-2"
              onClick={() => setShowBonus(true)}
            >
              + Ajouter bonus
            </button>
          ) : (
            <div className="card w-full max-w-xs">
              <NumberPicker
                value={bonus}
                onChange={setBonus}
                min={0}
                max={100}
                label="Points bonus"
              />
            </div>
          )}

          <button
            className="btn-gold w-full max-w-xs py-4 text-lg"
            onClick={handleSubmit}
          >
            Confirmer
          </button>
        </>
      ) : (
        <div className="card text-center">
          <p className="text-bone-dim text-sm">Tu as réalisé</p>
          <p className="skull-title text-4xl mt-1">
            {me?.rounds[roundIdx].actual}
          </p>
          {(me?.rounds[roundIdx].bonus ?? 0) > 0 && (
            <p className="text-gold text-sm mt-1">
              +{me?.rounds[roundIdx].bonus} bonus
            </p>
          )}
        </div>
      )}

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
              <span>{p.done ? "✓" : "..."}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
