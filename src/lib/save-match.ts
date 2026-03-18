import { supabase } from "./supabase";
import { computeEloChanges } from "./elo";
import type { ClientGameState } from "@/types/game";

export interface EloResult {
  player_id: string;
  username: string;
  elo_before: number;
  elo_after: number;
  elo_change: number;
  position: number;
  score: number;
}

function getPositions(gameState: ClientGameState) {
  const sorted = [...gameState.players].sort(
    (a, b) => b.totalScore - a.totalScore
  );
  const positions: { name: string; position: number; score: number }[] = [];
  let pos = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalScore < sorted[i - 1].totalScore) pos = i + 1;
    positions.push({
      name: sorted[i].player.name,
      position: pos,
      score: sorted[i].totalScore,
    });
  }
  return positions;
}

/**
 * Save match results to Supabase (match record + match_players with ELO).
 * Called once by the host when the game ends.
 * Does NOT update player profiles — each player calls updateMyStats() for that.
 */
export async function saveMatchResults(
  gameState: ClientGameState
): Promise<EloResult[] | undefined> {
  const usernames = gameState.players.map((p) => p.player.name);
  const { data: profiles } = await supabase
    .from("players")
    .select("id, username, elo, games_played, games_won")
    .in("username", usernames);

  if (!profiles || profiles.length === 0) return;

  const profileMap = new Map(profiles.map((p) => [p.username, p]));
  const positions = getPositions(gameState);

  const eloInput = positions
    .filter((p) => profileMap.has(p.name))
    .map((p) => ({
      playerId: profileMap.get(p.name)!.id,
      elo: profileMap.get(p.name)!.elo,
      position: p.position,
    }));

  if (eloInput.length < 2) return;

  const eloChanges = computeEloChanges(eloInput);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({ room_code: gameState.code })
    .select("id")
    .single();

  if (matchError || !match) return;

  const eloResults: EloResult[] = positions
    .filter((p) => profileMap.has(p.name))
    .map((p) => {
      const prof = profileMap.get(p.name)!;
      const change = eloChanges.get(prof.id) || 0;
      return {
        player_id: prof.id,
        username: prof.username,
        position: p.position,
        score: p.score,
        elo_before: prof.elo,
        elo_after: prof.elo + change,
        elo_change: change,
      };
    });

  await supabase.from("match_players").insert(
    eloResults.map((r) => ({
      match_id: match.id,
      player_id: r.player_id,
      position: r.position,
      score: r.score,
      elo_before: r.elo_before,
      elo_after: r.elo_after,
      elo_change: r.elo_change,
    }))
  );

  return eloResults;
}

/**
 * Update the current player's own profile stats (games_played, games_won, elo).
 * Each player calls this independently so that RLS is respected
 * (auth.uid() = id allows each user to update only their own row).
 */
export async function updateMyStats(
  gameState: ClientGameState,
  myPlayerName: string
): Promise<EloResult | undefined> {
  const usernames = gameState.players.map((p) => p.player.name);
  const { data: profiles } = await supabase
    .from("players")
    .select("id, username, elo, games_played, games_won")
    .in("username", usernames);

  if (!profiles || profiles.length === 0) return;

  const profileMap = new Map(profiles.map((p) => [p.username, p]));
  const myProfile = profileMap.get(myPlayerName);
  if (!myProfile) return; // Guest player, not registered

  const positions = getPositions(gameState);
  const myPosition = positions.find((p) => p.name === myPlayerName);
  if (!myPosition) return;

  const eloInput = positions
    .filter((p) => profileMap.has(p.name))
    .map((p) => ({
      playerId: profileMap.get(p.name)!.id,
      elo: profileMap.get(p.name)!.elo,
      position: p.position,
    }));

  if (eloInput.length < 2) return;

  const eloChanges = computeEloChanges(eloInput);
  const myEloChange = eloChanges.get(myProfile.id) || 0;

  const result: EloResult = {
    player_id: myProfile.id,
    username: myProfile.username,
    position: myPosition.position,
    score: myPosition.score,
    elo_before: myProfile.elo,
    elo_after: myProfile.elo + myEloChange,
    elo_change: myEloChange,
  };

  await supabase
    .from("players")
    .update({
      elo: result.elo_after,
      games_played: myProfile.games_played + 1,
      games_won:
        myPosition.position === 1
          ? myProfile.games_won + 1
          : myProfile.games_won,
    })
    .eq("id", myProfile.id);

  return result;
}
