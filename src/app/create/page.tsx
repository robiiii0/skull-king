"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameState } from "@/hooks/use-game-state";

export default function CreatePage() {
  const router = useRouter();
  const { isConnected, createRoom } = useGameState();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isConnected || creating) return;

    const name = localStorage.getItem("sk-player-name");
    if (!name) {
      router.replace("/");
      return;
    }

    setCreating(true);
    createRoom(name).then((code) => {
      router.replace(`/lobby/${code}`);
    });
  }, [isConnected, createRoom, creating, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh">
      <div className="text-bone-dim animate-pulse">Création du lobby...</div>
    </div>
  );
}
