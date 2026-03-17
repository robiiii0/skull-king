"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import type { ClientGameState } from "@/types/game";
import { useSocket } from "./use-socket";

// ── Global shared game state ──
// This ensures all components see the same gameState, even after navigation.
let globalGameState: ClientGameState | null = null;
let globalError: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribeState(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function getState() { return globalGameState; }
function getError() { return globalError; }

let socketListenerAttached = false;

export function useGameState() {
  const { socket, isConnected } = useSocket();

  // Attach the socket listener exactly once (globally)
  useEffect(() => {
    if (socketListenerAttached) return;
    socketListenerAttached = true;

    function onState(state: ClientGameState) {
      globalGameState = state;
      globalError = null;
      notify();
    }
    function onError(message: string) {
      globalError = message;
      notify();
    }

    socket.on("room:state", onState);
    socket.on("room:error", onError);

    // No cleanup — this listener lives for the lifetime of the app
  }, [socket]);

  const gameState = useSyncExternalStore(subscribeState, getState, getState);
  const error = useSyncExternalStore(subscribeState, getError, getError);

  const createRoom = useCallback(
    (playerName: string): Promise<string> => {
      return new Promise((resolve) => {
        socket.emit("room:create", playerName, (code) => {
          sessionStorage.setItem("sk-room", code);
          sessionStorage.setItem("sk-name", playerName);
          resolve(code);
        });
      });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (code: string, playerName: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        socket.emit("room:join", code, playerName, (success, error) => {
          if (success) {
            sessionStorage.setItem("sk-room", code.toUpperCase());
            sessionStorage.setItem("sk-name", playerName);
          }
          resolve({ success, error });
        });
      });
    },
    [socket]
  );

  const rejoinRoom = useCallback(
    (code: string, playerName: string): Promise<boolean> => {
      return new Promise((resolve) => {
        socket.emit("room:rejoin", code, playerName, (success) => {
          resolve(success);
        });
      });
    },
    [socket]
  );

  const startGame = useCallback(() => {
    socket.emit("game:start");
  }, [socket]);

  const submitRound = useCallback(
    (bid: number, actual: number, bonus: number) => {
      socket.emit("round:submit", bid, actual, bonus);
    },
    [socket]
  );

  const markReady = useCallback(() => {
    socket.emit("round:ready");
  }, [socket]);

  return {
    socket,
    isConnected,
    gameState,
    error,
    createRoom,
    joinRoom,
    rejoinRoom,
    startGame,
    submitRound,
    markReady,
  };
}
