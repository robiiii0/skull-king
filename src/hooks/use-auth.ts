"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface PlayerProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  elo: number;
  games_played: number;
  games_won: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(
    async (username: string, password: string) => {
      // Pre-check username availability before creating auth user
      const { data: existing } = await supabase
        .from("players")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) return { error: "Ce pseudo est deja pris" };

      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@skullking.app`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          return { error: "Ce pseudo est deja pris" };
        }
        return { error: error.message };
      }
      if (!data.user) return { error: "Erreur inconnue" };

      // Create player profile
      const { error: profileError } = await supabase.from("players").insert({
        id: data.user.id,
        username,
      });
      if (profileError) {
        // Username already taken
        if (profileError.code === "23505") {
          return { error: "Ce pseudo est deja pris" };
        }
        return { error: profileError.message };
      }

      await fetchProfile(data.user.id);
      return {};
    },
    [fetchProfile]
  );

  const signIn = useCallback(
    async (username: string, password: string) => {
      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@skullking.app`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: "Pseudo ou mot de passe incorrect" };
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) return { error: "Non connecte" };

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) return { error: uploadError.message };

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Add cache-buster to force refresh
      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("players")
        .update({ avatar_url: url })
        .eq("id", user.id);

      await fetchProfile(user.id);
      return {};
    },
    [user, fetchProfile]
  );

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    uploadAvatar,
    refreshProfile: user ? () => fetchProfile(user.id) : undefined,
  };
}
