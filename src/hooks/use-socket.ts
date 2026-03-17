"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/game";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (!globalSocket) {
    globalSocket = io({ autoConnect: false });
  }
  return globalSocket;
}

export function useSocket() {
  const socketRef = useRef<TypedSocket>(getSocket());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;

    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
