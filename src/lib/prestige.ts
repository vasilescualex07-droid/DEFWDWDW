/** Prestige bonus row as stored in localStorage */
export interface PrestigeBonusRow {
  id: string;
  name?: string;
  currentLevel: number;
  type?: string;
}

/** Cost to buy the next level when current upgrade level is `currentLevel` */
export function getPrestigeUpgradeCost(currentLevel: number): number {
  if (currentLevel < 10) return 1;
  if (currentLevel < 25) return 2;
  if (currentLevel < 50) return 3;
  return Math.floor(currentLevel / 25) + 2;
}

/** Total prestige points spent to reach `level` (sum of costs for levels 0 .. level-1) */
export function totalPointsSpentForUpgradeLevel(level: number): number {
  let sum = 0;
  for (let i = 0; i < level; i++) {
    sum += getPrestigeUpgradeCost(i);
  }
  return sum;
}

function safeParseBonuses(): PrestigeBonusRow[] {
  try {
    const raw = localStorage.getItem('prestigeBonuses');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getTotalSpentPrestigePoints(): number {
  return safeParseBonuses().reduce((sum, b) => sum + totalPointsSpentForUpgradeLevel(b.currentLevel || 0), 0);
}

/**
 * Active prestige effects (from permanent upgrades).
 * multiplier / cashback / xp = total percentage points (e.g. 15 means +15%).
 * starting = extra dollars on prestige reset (handled in PrestigeSystem).
 */
export function getPrestigeBonuses(): {
  multiplier: number;
  cashback: number;
  xp: number;
  starting: number;
} {
  const bonuses = safeParseBonuses();
  return {
    multiplier: (bonuses.find((b) => b.id === 'multiplier')?.currentLevel || 0) * 5,
    cashback: (bonuses.find((b) => b.id === 'cashback')?.currentLevel || 0) * 2,
    xp: (bonuses.find((b) => b.id === 'xp')?.currentLevel || 0) * 10,
    starting: (bonuses.find((b) => b.id === 'starting')?.currentLevel || 0) * 500,
  };
}

export function getPrestigeLevel(): number {
  const saved = localStorage.getItem('prestigeLevel');
  return saved ? parseInt(saved, 10) || 0 : 0;
}
