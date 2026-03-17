"use client";

import { useState } from "react";
import type { ClientGameState } from "@/types/game";
import { NumberPicker } from "./number-picker";

interface BidPhaseProps {
  gameState: ClientGameState;
  onSubmitBid: (bid: number) => void;
}

export function BidPhase({ gameState, onSubmitBid }: BidPhaseProps) {
  const [bid, setBid] = useState(0);
  const roundIdx = gameState.currentRound - 1;
  const me = gameState.players.find((p) => p.player.id === gameState.myId);
  const hasBid = me?.rounds[roundIdx].bid !== null;

  const playersStatus = gameState.players.map((p) => ({
    name: p.player.name,
    done: p.rounds[roundIdx].bid !== null,
  }));

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="text-center">
        <h2 className="skull-title text-2xl mb-1">Annonce tes plis</h2>
        <p className="text-bone-dim text-sm">
          {gameState.currentRound} carte{gameState.currentRound > 1 ? "s" : ""} en jeu
        </p>
      </div>

      {!hasBid ? (
        <>
          <NumberPicker
            value={bid}
            onChange={setBid}
            min={0}
            max={gameState.currentRound}
            label="Plis annoncés"
          />
          <button
            className="btn-gold w-full max-w-xs py-4 text-lg"
            onClick={() => onSubmitBid(bid)}
          >
            Confirmer
          </button>
        </>
      ) : (
        <div className="card text-center">
          <p className="text-bone-dim text-sm">Tu as annoncé</p>
          <p className="skull-title text-4xl mt-1">{me?.rounds[roundIdx].bid}</p>
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
              <span>{p.done ? "✓" : "..."}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
