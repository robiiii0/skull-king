"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getRank } from "@/lib/ranks";
import { Avatar } from "@/components/avatar";

export default function Home() {
  const router = useRouter();
  const { user, profile, loading, signUp, signIn, signOut, uploadAvatar } =
    useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAuth() {
    if (!username.trim() || !password.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = isSignUp
      ? await signUp(username.trim(), password)
      : await signIn(username.trim(), password);

    if (result.error) setError(result.error);
    setSubmitting(false);
  }

  function handlePlay(path: string) {
    if (!profile) return;
    // Store the username for the socket game
    localStorage.setItem("sk-player-name", profile.username);
    router.push(path);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadAvatar(file);
    if (result.error) setError(result.error);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-bone-dim animate-pulse">Chargement...</div>
      </div>
    );
  }

  // Not logged in — show auth form
  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-10">
        <div className="mb-10 text-center">
          <div className="text-7xl mb-3">☠️</div>
          <h1 className="skull-title text-5xl tracking-wide">Skull King</h1>
          <p className="text-bone-dim text-sm mt-2 tracking-widest uppercase">
            Score Tracker
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-sm text-bone-dim mb-1 font-medium">
              Pseudo
            </label>
            <input
              type="text"
              className="input text-center text-lg"
              placeholder="Capitaine..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm text-bone-dim mb-1 font-medium">
              Mot de passe
            </label>
            <input
              type="password"
              className="input text-center text-lg"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
          </div>

          {error && (
            <div className="text-danger text-sm text-center bg-danger/10 rounded-lg py-2 px-4">
              {error}
            </div>
          )}

          <button
            className="btn-gold w-full text-lg py-4"
            onClick={handleAuth}
            disabled={!username.trim() || !password.trim() || submitting}
          >
            {submitting
              ? "..."
              : isSignUp
              ? "Creer mon compte"
              : "Se connecter"}
          </button>

          <button
            className="text-bone-dim text-sm w-full text-center hover:text-bone"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp
              ? "Deja un compte ? Se connecter"
              : "Pas de compte ? En creer un"}
          </button>
        </div>

        <button
          onClick={() => router.push("/ranks")}
          className="mt-6 text-bone-dim hover:text-gold text-sm flex items-center gap-1"
        >
          🏴‍☠️ Voir les rangs
        </button>

        <div className="mt-auto pt-10 text-bone-dim/30 text-xs tracking-widest">
          ⚓ AHOY ⚓
        </div>
      </div>
    );
  }

  // Logged in — show main menu
  const rank = getRank(profile.elo);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-10">
      <div className="mb-8 text-center">
        <div className="text-7xl mb-3">☠️</div>
        <h1 className="skull-title text-5xl tracking-wide">Skull King</h1>
      </div>

      {/* Profile card */}
      <div className="card w-full max-w-sm mb-8">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer relative group">
            <Avatar
              url={profile.avatar_url}
              username={profile.username}
              size={64}
            />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs text-white">Modifier</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg truncate">{profile.username}</div>
            <div className="flex items-center gap-2 text-sm">
              <span>{rank.icon}</span>
              <span style={{ color: rank.color }}>{rank.name}</span>
              <span className="text-bone-dim">({profile.elo} ELO)</span>
            </div>
            <div className="text-xs text-bone-dim mt-1">
              {profile.games_played} partie{profile.games_played !== 1 ? "s" : ""} &middot;{" "}
              {profile.games_won} victoire{profile.games_won !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-danger text-sm text-center bg-danger/10 rounded-lg py-2 px-4 mb-4 w-full max-w-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          className="btn-gold w-full text-lg py-4"
          onClick={() => handlePlay("/create")}
        >
          Creer un lobby
        </button>
        <button
          className="btn-outline w-full text-lg py-4"
          onClick={() => handlePlay("/join")}
        >
          Rejoindre un lobby
        </button>
        <div className="flex gap-3">
          <button
            className="btn-outline flex-1 py-3"
            onClick={() => router.push("/ranks")}
          >
            🏴‍☠️ Rangs
          </button>
          <button
            className="btn-outline flex-1 py-3"
            onClick={() => router.push("/leaderboard")}
          >
            🏆 Classement
          </button>
        </div>
      </div>

      <button
        className="mt-6 text-bone-dim hover:text-danger text-xs"
        onClick={signOut}
      >
        Se deconnecter
      </button>

      <div className="mt-auto pt-10 text-bone-dim/30 text-xs tracking-widest">
        ⚓ AHOY ⚓
      </div>
    </div>
  );
}
