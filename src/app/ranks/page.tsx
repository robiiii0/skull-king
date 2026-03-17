"use client";

import { useRouter } from "next/navigation";
import { RANKS } from "@/lib/ranks";

export default function RanksPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center min-h-dvh px-6 py-8">
      <button
        onClick={() => router.push("/")}
        className="self-start text-bone-dim hover:text-bone text-sm mb-6"
      >
        &larr; Retour
      </button>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏴‍☠️</div>
        <h1 className="skull-title text-3xl">Les Rangs</h1>
        <p className="text-bone-dim text-sm mt-2">
          Gagne des parties pour monter en rang
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {[...RANKS].reverse().map((rank) => (
          <div
            key={rank.name}
            className="card flex items-center gap-4 py-4"
            style={{ borderColor: `${rank.color}30` }}
          >
            <span className="text-4xl w-14 text-center">{rank.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg" style={{ color: rank.color }}>
                {rank.name}
              </div>
              <div className="text-bone-dim text-xs mb-1">
                {rank.minElo} &mdash; {rank.maxElo === 9999 ? "∞" : rank.maxElo} ELO
              </div>
              <div className="text-bone-dim/70 text-sm">
                {rank.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card w-full max-w-sm text-center">
        <p className="text-bone-dim text-sm mb-2">Comment fonctionne l&apos;ELO ?</p>
        <p className="text-bone-dim/70 text-xs leading-relaxed">
          Chaque joueur commence a 1000 ELO. En fin de partie, ton ELO change
          en fonction de ta position et du niveau de tes adversaires. Battre un
          joueur mieux classe que toi rapporte plus de points.
        </p>
      </div>
    </div>
  );
}
