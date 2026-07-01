export type SlotSymbol =
  | 'SCRAP'
  | 'DAGGER'
  | 'SKULL'
  | 'GOLD'
  | 'STAR'
  | 'JACKPOT'
  | 'BLANK';

export type SlotTier = 'low' | 'mid' | 'high' | 'jackpot' | 'megaJackpot' | 'critFail';

export type JackpotEffect =
  | 'damageBurst'
  | 'slowMo'
  | 'bossInterrupt'
  | 'vulnerability'
  | 'megaJackpot';

export interface SlotOutcome {
  tier: SlotTier;
  symbol: SlotSymbol;
  /** Multiplier applied to base damage for this event. */
  mult: number;
  /** Optional extra effect. */
  effect?: JackpotEffect;
}

export interface SlotRollConfig {
  /** Base tier weights before progression. */
  weights: Record<SlotTier, number>;
  /** Possible jackpot effects and their weights. */
  jackpotEffects: Array<{ effect: JackpotEffect; weight: number }>;
}

export interface SlotMods {
  /** Additive bonus to high tier weight. */
  highBias?: number;
  /** Additive bonus to jackpot tier weight. */
  jackpotBias?: number;
  /** Additive bonus to critFail tier weight (negative reduces). */
  critFailBias?: number;
  /** Flat multiplier to final damage after tier multiplier. */
  damageScalar?: number;
}

export const DEFAULT_SLOT_CONFIG: SlotRollConfig = {
  weights: {
    low: 61,
    mid: 28,
    high: 9,
    jackpot: 0.8,
    megaJackpot: 0.08,
    critFail: 0.2,
  },
  jackpotEffects: [
    { effect: 'damageBurst', weight: 40 },
    { effect: 'slowMo', weight: 20 },
    { effect: 'bossInterrupt', weight: 20 },
    { effect: 'vulnerability', weight: 20 },
  ],
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickWeighted<T>(items: Array<{ item: T; weight: number }>, rng = Math.random): T {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return items[0].item;
  let r = rng() * total;
  for (const it of items) {
    r -= Math.max(0, it.weight);
    if (r <= 0) return it.item;
  }
  return items[items.length - 1].item;
}

export function modsFromLevel(level: number): SlotMods {
  const highBias = clamp(level * 0.08, 0, 12);
  const jackpotBias = clamp(level * 0.01, 0, 2.5);
  const critFailBias = clamp(-level * 0.002, -0.3, 0);
  const damageScalar = 1 + clamp(level * 0.003, 0, 0.35);
  return { highBias, jackpotBias, critFailBias, damageScalar };
}

export function rollSlotOutcome(
  config: SlotRollConfig,
  mods: SlotMods = {},
  rng = Math.random
): SlotOutcome {
  const w = config.weights;
  const weights: Record<SlotTier, number> = {
    low: w.low,
    mid: w.mid,
    high: w.high + (mods.highBias ?? 0),
    jackpot: w.jackpot + (mods.jackpotBias ?? 0),
    megaJackpot: w.megaJackpot ?? 0.08,
    critFail: Math.max(0, w.critFail + (mods.critFailBias ?? 0)),
  };

  const tier = pickWeighted<SlotTier>(
    (Object.keys(weights) as SlotTier[]).map((t) => ({ item: t, weight: weights[t] })),
    rng
  );

  if (tier === 'megaJackpot') {
    return { tier, symbol: 'JACKPOT', mult: 20, effect: 'megaJackpot' };
  }

  if (tier === 'jackpot') {
    const effect = pickWeighted(
      config.jackpotEffects.map((e) => ({ item: e.effect, weight: e.weight })),
      rng
    );
    return { tier, symbol: 'JACKPOT', mult: 6, effect };
  }

  if (tier === 'critFail') {
    return { tier, symbol: 'BLANK', mult: 0 };
  }

  if (tier === 'high') return { tier, symbol: 'STAR', mult: 2.5 };
  if (tier === 'mid') return { tier, symbol: 'GOLD', mult: 1.4 };
  return { tier, symbol: 'DAGGER', mult: 0.85 };
}

export function computeDamage(base: number, outcome: SlotOutcome, mods: SlotMods = {}) {
  const scalar = mods.damageScalar ?? 1;
  return Math.max(0, Math.round(base * outcome.mult * scalar));
}
