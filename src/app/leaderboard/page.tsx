"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getRank } from "@/lib/ranks";
import { Avatar } from "@/components/avatar";

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  elo: number;
  games_played: number;
  games_won: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leaderboard")
      .select("*")
      .limit(50)
      .then(({ data }) => {
        setPlayers(data ?? []);
        setLoading(false);
      });
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col items-center min-h-dvh px-6 py-8">
      <button
        onClick={() => router.push("/")}
        className="self-start text-bone-dim hover:text-bone text-sm mb-6"
      >
        &larr; Retour
      </button>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="skull-title text-3xl">Classement</h1>
        <p className="text-bone-dim text-sm mt-2">
          Les meilleurs pirates
        </p>
      </div>

      {loading ? (
        <div className="text-bone-dim animate-pulse">Chargement...</div>
      ) : players.length === 0 ? (
        <div className="text-bone-dim text-center">
          <p>Aucun joueur pour l&apos;instant.</p>
          <p className="text-sm mt-1">Joue une partie pour apparaitre ici !</p>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-2">
          {players.map((p, i) => {
            const rank = getRank(p.elo);
            return (
              <div
                key={p.id}
                className={`card flex items-center gap-3 py-3 ${
                  i === 0 ? "border-gold/40 bg-gold/5" : ""
                }`}
              >
                <span className="text-xl w-8 text-center">
                  {i < 3 ? (
                    medals[i]
                  ) : (
                    <span className="text-bone-dim text-sm">{i + 1}</span>
                  )}
                </span>
                <Avatar url={p.avatar_url} username={p.username} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.username}</div>
                  <div className="flex items-center gap-1 text-xs">
                    <span>{rank.icon}</span>
                    <span style={{ color: rank.color }}>{rank.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="skull-title text-lg">{p.elo}</div>
                  <div className="text-bone-dim text-xs">
                    {p.games_played}P &middot; {p.games_won}W
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
