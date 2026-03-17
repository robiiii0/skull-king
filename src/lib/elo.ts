/**
 * Compute ELO changes for a multiplayer game.
 * Each player is compared pairwise against all others.
 * K-factor is 32 (standard for casual play).
 */

const K = 32;

interface PlayerResult {
  playerId: string;
  elo: number;
  position: number; // 1 = winner
}

export function computeEloChanges(
  results: PlayerResult[]
): Map<string, number> {
  const changes = new Map<string, number>();

  for (const player of results) {
    changes.set(player.playerId, 0);
  }

  // Pairwise comparison
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const a = results[i];
      const b = results[j];

      const expectedA = 1 / (1 + Math.pow(10, (b.elo - a.elo) / 400));
      const expectedB = 1 - expectedA;

      // Determine actual scores
      let scoreA: number;
      let scoreB: number;
      if (a.position < b.position) {
        scoreA = 1;
        scoreB = 0;
      } else if (a.position > b.position) {
        scoreA = 0;
        scoreB = 1;
      } else {
        scoreA = 0.5;
        scoreB = 0.5;
      }

      // Scale K by number of opponents so total change is reasonable
      const k = K / (results.length - 1);

      const deltaA = Math.round(k * (scoreA - expectedA));
      const deltaB = Math.round(k * (scoreB - expectedB));

      changes.set(a.playerId, (changes.get(a.playerId) || 0) + deltaA);
      changes.set(b.playerId, (changes.get(b.playerId) || 0) + deltaB);
    }
  }

  return changes;
}
