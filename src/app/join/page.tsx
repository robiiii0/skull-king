"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameState } from "@/hooks/use-game-state";

export default function JoinPage() {
  const router = useRouter();
  const { isConnected, joinRoom, gameState } = useGameState();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleJoin() {
    const name = localStorage.getItem("sk-player-name");
    if (!name || !code.trim()) return;

    setJoining(true);
    setError(null);

    const result = await joinRoom(code.trim(), name);
    if (result.success) {
      // We'll watch gameState to redirect
    } else {
      setError(result.error || "Impossible de rejoindre");
      setJoining(false);
    }
  }

  useEffect(() => {
    if (gameState) {
      if (gameState.phase === "lobby") {
        router.push(`/lobby/${gameState.code}`);
      } else {
        router.push(`/game/${gameState.code}`);
      }
    }
  }, [gameState, router]);

  function handleCodeChange(value: string) {
    setCode(value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4));
    setError(null);
  }

  return (
    <div className="flex flex-col items-center min-h-dvh px-6 py-8">
      <button
        onClick={() => router.push("/")}
        className="self-start text-bone-dim hover:text-bone text-sm mb-6"
      >
        ← Retour
      </button>

      <h1 className="skull-title text-3xl mb-8">Rejoindre</h1>

      <div className="w-full max-w-sm space-y-6">
        <div>
          <label className="block text-sm text-bone-dim mb-2 font-medium">
            Code du lobby
          </label>
          <input
            ref={inputRef}
            type="text"
            className="input text-center text-3xl tracking-[0.3em] font-bold"
            placeholder="ABCD"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            maxLength={4}
            autoCapitalize="characters"
          />
        </div>

        {error && (
          <div className="text-danger text-sm text-center bg-danger/10 rounded-lg py-2 px-4">
            {error}
          </div>
        )}

        <button
          className="btn-gold w-full text-lg py-4"
          onClick={handleJoin}
          disabled={code.length !== 4 || !isConnected || joining}
        >
          {joining ? "Connexion..." : "Rejoindre"}
        </button>
      </div>
    </div>
  );
}
