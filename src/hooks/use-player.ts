"use client";

import { useState, useEffect } from "react";

export function usePlayer() {
  const [playerName, setPlayerNameState] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("sk-player-name");
    if (saved) setPlayerNameState(saved);
  }, []);

  function setPlayerName(name: string) {
    localStorage.setItem("sk-player-name", name);
    setPlayerNameState(name);
  }

  return { playerName, setPlayerName };
}
