import { supabase } from "./supabase";
import { computeEloChanges } from "./elo";
import type { ClientGameState } from "@/types/game";

/**
 * Save match results to Supabase and update ELO.
 * Called once by the host when the game ends.
 */
export async function saveMatchResults(gameState: ClientGameState) {
  // 1. Fetch current ELO for all players by username
  const usernames = gameState.players.map((p) => p.player.name);
  const { data: profiles } = await supabase
    .from("players")
    .select("id, username, elo, games_played, games_won")
    .in("username", usernames);

  if (!profiles || profiles.length === 0) return;

  // Map username -> profile
  const profileMap = new Map(profiles.map((p) => [p.username, p]));

  // 2. Sort players by score to determine positions
  const sorted = [...gameState.players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  // Assign positions (handle ties)
  const positions: { name: string; position: number; score: number }[] = [];
  let pos = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalScore < sorted[i - 1].totalScore) {
      pos = i + 1;
    }
    positions.push({
      name: sorted[i].player.name,
      position: pos,
      score: sorted[i].totalScore,
    });
  }

  // 3. Compute ELO changes (only for registered players)
  const eloInput = positions
    .filter((p) => profileMap.has(p.name))
    .map((p) => ({
      playerId: profileMap.get(p.name)!.id,
      elo: profileMap.get(p.name)!.elo,
      position: p.position,
    }));

  if (eloInput.length < 2) return; // Need at least 2 registered players

  const eloChanges = computeEloChanges(eloInput);

  // 4. Create match record
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({ room_code: gameState.code })
    .select("id")
    .single();

  if (matchError || !match) return;

  // 5. Insert match_players
  const matchPlayers = positions
    .filter((p) => profileMap.has(p.name))
    .map((p) => {
      const prof = profileMap.get(p.name)!;
      const change = eloChanges.get(prof.id) || 0;
      return {
        match_id: match.id,
        player_id: prof.id,
        position: p.position,
        score: p.score,
        elo_before: prof.elo,
        elo_after: prof.elo + change,
        elo_change: change,
      };
    });

  await supabase.from("match_players").insert(matchPlayers);

  // 6. Update player profiles
  for (const mp of matchPlayers) {
    const prof = profiles.find((p) => p.id === mp.player_id)!;
    await supabase
      .from("players")
      .update({
        elo: mp.elo_after,
        games_played: prof.games_played + 1,
        games_won: mp.position === 1 ? prof.games_won + 1 : prof.games_won,
      })
      .eq("id", mp.player_id);
  }

  return matchPlayers;
}
