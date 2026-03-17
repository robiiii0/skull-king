export interface Rank {
  name: string;
  minElo: number;
  maxElo: number;
  icon: string;
  color: string;
  description: string;
}

export const RANKS: Rank[] = [
  {
    name: "Mousse",
    minElo: 0,
    maxElo: 799,
    icon: "🪣",
    color: "#8b8b8b",
    description: "Tu viens de monter a bord. Fais tes preuves !",
  },
  {
    name: "Matelot",
    minElo: 800,
    maxElo: 999,
    icon: "⚓",
    color: "#6b9bd2",
    description: "Tu connais les bases. Continue comme ca.",
  },
  {
    name: "Quartier-maitre",
    minElo: 1000,
    maxElo: 1199,
    icon: "🧭",
    color: "#4ecdc4",
    description: "Tu sais naviguer. L'equipage te respecte.",
  },
  {
    name: "Second",
    minElo: 1200,
    maxElo: 1399,
    icon: "🗡️",
    color: "#c0c0c0",
    description: "Bras droit du capitaine. Redoutable.",
  },
  {
    name: "Capitaine",
    minElo: 1400,
    maxElo: 1599,
    icon: "🎖️",
    color: "#d4a843",
    description: "Tu commandes ton propre navire.",
  },
  {
    name: "Amiral",
    minElo: 1600,
    maxElo: 1799,
    icon: "👑",
    color: "#ff6b35",
    description: "Une flotte entiere sous tes ordres.",
  },
  {
    name: "Skull King",
    minElo: 1800,
    maxElo: 9999,
    icon: "☠️",
    color: "#c23030",
    description: "Le pirate legendaire. Tous te craignent.",
  },
];

export function getRank(elo: number): Rank {
  return RANKS.find((r) => elo >= r.minElo && elo <= r.maxElo) || RANKS[0];
}
