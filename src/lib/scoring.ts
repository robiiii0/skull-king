export function computeRoundScore(
  bid: number,
  actual: number,
  roundNumber: number,
  bonus: number
): number {
  let score = 0;
  if (bid === 0) {
    score = actual === 0 ? roundNumber * 10 : -(roundNumber * 10);
  } else {
    score =
      bid === actual ? 20 * bid : -(10 * Math.abs(bid - actual));
  }
  return score + bonus;
}
