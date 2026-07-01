import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Skull, Swords, Shield, Heart, Zap, Trophy, X, Flame, Star, Crown, Gift, Target, Sparkles, Package, BookOpen, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { playSound } from '@/hooks/useSounds';
import { toast } from 'sonner';
import { UndertaleArena, type AttackPattern } from '@/components/boss/UndertaleArena';
import { DEFAULT_SLOT_CONFIG, computeDamage, modsFromLevel, rollSlotOutcome, type SlotOutcome } from '@/lib/slotCombat';
import { GameBurst } from '@/components/GameBurst';
import {
  type InventoryItem, type ItemBuffs,
  RARITY_META, SLOT_META,
  rollItemDrop, aggregateBuffs, loadEquipment,
  getStoryProgress, setStoryProgress, getBossDropInfo,
} from '@/lib/inventory';

const BASE_JACKPOT = 10000;
const JACKPOT_POT_KEY = 'stakelite_boss_jackpot';

interface BossBattleProps {
  balance: number;
  playerLevel: number;
  playerName: string;
  onWin: (amount: number, bet?: number, multiplier?: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
  onXpGain: (xp: number) => void;
  onClose: () => void;
}

interface Boss {
  id: string;
  name: string;
  title: string;
  health: number;
  damage: number;
  reward: number;
  color: string;
  minLevel: number;
  specialAbility: string;
  dropChance: number;
  rareDropReward: number;
  icon: string;
  chapter: number;
  chapterName: string;
  xpReward: number;
  lore: string;
  storyOrder: number;
}

const BOSSES: Boss[] = [
  // Chapter 1: The Casino Floor
  {
    id: 'dealer', name: 'The Dealer', title: 'Card Master', health: 100, damage: 15, reward: 500, color: 'from-green-500 to-emerald-700',
    minLevel: 1, specialAbility: 'Card Trick', dropChance: 0.55, rareDropReward: 1000, icon: '🃏',
    chapter: 1, chapterName: 'The Casino Floor', xpReward: 500, storyOrder: 0,
    lore: 'The first face you see. Friendly, until he isn\'t. He\'s dealt a million hands and lost none. Until today.',
  },
  {
    id: 'lucky-lou', name: 'Lucky Lou', title: 'The Dice Hustler', health: 160, damage: 23, reward: 1200, color: 'from-teal-500 to-cyan-700',
    minLevel: 8, specialAbility: 'Lucky Roll', dropChance: 0.50, rareDropReward: 2500, icon: '🎲',
    chapter: 1, chapterName: 'The Casino Floor', xpReward: 1125, storyOrder: 1,
    lore: 'Old Lou has haunted these halls for 40 years. His dice have never landed wrong. He can\'t explain why. Neither can you.',
  },
  // Chapter 2: Back of House
  {
    id: 'pit-boss', name: 'Pit Boss Pete', title: 'Floor Guardian', health: 220, damage: 28, reward: 2000, color: 'from-blue-500 to-blue-700',
    minLevel: 14, specialAbility: 'Floor Slam', dropChance: 0.45, rareDropReward: 4000, icon: '🦾',
    chapter: 2, chapterName: 'Back of House', xpReward: 2250, storyOrder: 2,
    lore: 'Pete has ejected ten thousand people from this floor. He considers it community service. You are number ten thousand and one.',
  },
  {
    id: 'fortune', name: 'Madame Fortune', title: 'The Oracle', health: 300, damage: 35, reward: 4000, color: 'from-violet-500 to-purple-700',
    minLevel: 20, specialAbility: 'Foresight', dropChance: 0.40, rareDropReward: 8000, icon: '🔮',
    chapter: 2, chapterName: 'Back of House', xpReward: 3750, storyOrder: 3,
    lore: 'She read the future in her crystal ball and saw you coming. She prepared for three months. It wasn\'t enough.',
  },
  // Chapter 3: The High Rollers
  {
    id: 'whale', name: 'The Whale', title: 'High Roller', health: 380, damage: 41, reward: 7000, color: 'from-purple-500 to-purple-700',
    minLevel: 25, specialAbility: 'Money Rain', dropChance: 0.35, rareDropReward: 15000, icon: '🐋',
    chapter: 3, chapterName: 'The High Rollers', xpReward: 6250, storyOrder: 4,
    lore: 'He lost more in tips last Tuesday than you\'ve ever held. Money means nothing to him. Losing does.',
  },
  {
    id: 'baron', name: 'Baron Von Chips', title: 'The Aristocrat', health: 480, damage: 50, reward: 12000, color: 'from-amber-500 to-yellow-700',
    minLevel: 32, specialAbility: 'Noble Strike', dropChance: 0.30, rareDropReward: 25000, icon: '🎩',
    chapter: 3, chapterName: 'The High Rollers', xpReward: 10000, storyOrder: 5,
    lore: 'He inherited his fortune, his title, and his insufferable arrogance. None of those will save him at this table.',
  },
  // Chapter 4: The System
  {
    id: 'house', name: 'The House', title: 'Casino Boss', health: 550, damage: 60, reward: 20000, color: 'from-red-500 to-red-700',
    minLevel: 40, specialAbility: 'House Edge', dropChance: 0.25, rareDropReward: 40000, icon: '🏛️',
    chapter: 4, chapterName: 'The System', xpReward: 17500, storyOrder: 6,
    lore: 'Not a person. A concept. The abstraction of every rule, every probability, every edge that has ever worked against you.',
  },
  {
    id: 'auditor', name: 'The Auditor', title: 'The Algorithm', health: 680, damage: 70, reward: 38000, color: 'from-sky-500 to-cyan-700',
    minLevel: 48, specialAbility: 'System Override', dropChance: 0.22, rareDropReward: 80000, icon: '🤖',
    chapter: 4, chapterName: 'The System', xpReward: 27500, storyOrder: 7,
    lore: 'A coldly rational AI designed to optimize house profits. It has never encountered a variable like you. It is beginning to worry.',
  },
  // Chapter 5: The Shadow World
  {
    id: 'shadow', name: 'Shadow Dealer', title: 'Hidden Master', health: 800, damage: 75, reward: 60000, color: 'from-gray-700 to-black',
    minLevel: 55, specialAbility: 'Shadow Strike', dropChance: 0.18, rareDropReward: 120000, icon: '👤',
    chapter: 5, chapterName: 'The Shadow World', xpReward: 45000, storyOrder: 8,
    lore: 'Nobody knows who the Shadow Dealer is. Nobody who\'s found out has been able to tell anyone. You\'re about to find out why.',
  },
  {
    id: 'void', name: 'The Void', title: 'The Abyss', health: 950, damage: 90, reward: 110000, color: 'from-zinc-800 to-neutral-950',
    minLevel: 62, specialAbility: 'Void Pulse', dropChance: 0.15, rareDropReward: 220000, icon: '🌑',
    chapter: 5, chapterName: 'The Shadow World', xpReward: 75000, storyOrder: 9,
    lore: 'It has no name. It has no form. It consumes probability itself. Some say it IS bad luck, given flesh. Or something like flesh.',
  },
  // Chapter 6: The Final Gambit
  {
    id: 'king', name: 'The Casino King', title: 'Ultimate Boss', health: 1100, damage: 100, reward: 180000, color: 'from-yellow-500 to-amber-700',
    minLevel: 75, specialAbility: 'Royal Decree', dropChance: 0.12, rareDropReward: 400000, icon: '👑',
    chapter: 6, chapterName: 'The Final Gambit', xpReward: 125000, storyOrder: 10,
    lore: 'He built this kingdom card by card. Every game, every boss, every rule — he designed it all. He has never truly lost.',
  },
  {
    id: 'architect', name: 'The Architect', title: 'Creator of the Game', health: 1400, damage: 119, reward: 500000, color: 'from-rose-500 to-pink-700',
    minLevel: 90, specialAbility: 'Reality Fold', dropChance: 0.10, rareDropReward: 1000000, icon: '🌌',
    chapter: 6, chapterName: 'The Final Gambit', xpReward: 250000, storyOrder: 11,
    lore: 'The true final boss. They didn\'t just run the casino. They created the concept of the casino. Of luck. Of loss. Of everything you\'ve been fighting.',
  },
];

const BOSS_DIALOGUE: Record<string, {
  intro: string[]; phase2: string[]; phase3: string[];
  taunts: string[]; onHit: string[]; defeat: string[]; mercy: string[];
}> = {
  dealer: {
    intro: ["You really think you can beat me?", "The cards are stacked. Always.", "Place your bets, sucker."],
    phase2: ["Fine. No more games.", "You got lucky. Once.", "Time to show my real hand..."],
    phase3: ["IMPOSSIBLE!", "This wasn't in the odds!", "I... I NEVER LOSE!"],
    taunts: ["The house always wins.", "Still standing? Surprising.", "You're bluffing."],
    onHit: ["A lucky draw.", "That barely scratched me.", "Is that all you've got?"],
    defeat: ["You... cheated. Somehow.", "This can't be real...", "...I'll be back. Always."],
    mercy: ["You spare me? Fool.", "Don't think this changes anything.", "Next time I won't hold back."],
  },
  'lucky-lou': {
    intro: ["Ha! Another one! Pull up a chair, kid.", "My dice have never failed me. Not once in 40 years.", "You picked the wrong table, stranger."],
    phase2: ["My dice... they're cold. They've never gone cold.", "Alright. Lucky Lou's going serious now.", "You've got a horseshoe somewhere I can't see."],
    phase3: ["THIS CAN'T BE HAPPENING!", "FORTY YEARS! FORTY YEARS OF LUCK!", "My dice are LYING TO ME!"],
    taunts: ["Even your wins look accidental.", "I once rolled a 12 seventeen times in a row.", "Lady Luck and I are on a first-name basis."],
    onHit: ["Lucky shot. Won't happen again.", "Heh. Not bad.", "The dice gave you that one for free."],
    defeat: ["...the dice never lied before.", "My streak... it's over.", "Take my lucky coin. You've earned it."],
    mercy: ["Mercy from someone who beat Lucky Lou? Unprecedented.", "I'll... remember this.", "Come back. I'll be here. Always here."],
  },
  'pit-boss': {
    intro: ["This is MY floor.", "Nobody cheats here.", "You're about to be escorted out. Permanently."],
    phase2: ["Alright. Gloves off.", "You want the REAL security?", "Nobody has ever made it this far."],
    phase3: ["FULL LOCKDOWN!", "EVERY GUARD ON ME NOW!", "You'll NEVER leave this casino!"],
    taunts: ["I've seen thousands like you.", "The cameras are watching.", "Nice try. Not really."],
    onHit: ["Ow. Write-up filed.", "Security incident logged.", "That's assault on staff."],
    defeat: ["...I'm going to need a union rep.", "You're banned. All versions of you.", "This never happened."],
    mercy: ["You spare me? ...Weird.", "Don't think I owe you anything.", "Get out of my casino."],
  },
  fortune: {
    intro: ["I saw you coming... three weeks ago.", "Your future is written. I've already read it.", "The cards never lie. Unfortunately for you."],
    phase2: ["This... wasn't in the vision.", "My crystal ball is clouding over. Strange.", "The future is becoming... unclear."],
    phase3: ["THE CARDS ARE WRONG!", "IMPOSSIBLE — I SAW YOUR DEFEAT!", "THE CRYSTAL BALL SHOWS NOTHING! NOTHING!"],
    taunts: ["I know your next move already.", "You can't surprise what can see tomorrow.", "Statistically speaking, you shouldn't be alive."],
    onHit: ["A misread omen. Rare.", "The spirits lied to me.", "Hmm. Interesting future you're making."],
    defeat: ["...I never could see my own ending.", "The crystal ball is dark now.", "You've changed the timeline. Well done."],
    mercy: ["Mercy? I see... great kindness ahead for you.", "The stars speak highly of your compassion.", "I'll read your fortune for free. Someday."],
  },
  whale: {
    intro: ["Money means nothing to me.", "I've lost more in tips.", "Amusing. A challenger."],
    phase2: ["Oh. You're actually serious.", "Fine. I'll stop toying with you.", "Let's see your real portfolio."],
    phase3: ["LIQUIDATE EVERYTHING!", "I WILL NOT BE EMBARRASSED!", "Do you know who I AM?!"],
    taunts: ["My hourly wage dwarfs your balance.", "I could buy this game.", "Charming little attack."],
    onHit: ["I felt nothing.", "Rounding error.", "Tax deductible."],
    defeat: ["...I'll need to rebalance my portfolio.", "This is... humbling.", "Tell no one."],
    mercy: ["Mercy? I don't need your pity.", "I'll donate to your recovery fund.", "Unexpected. I respect that."],
  },
  baron: {
    intro: ["I say! A commoner dares challenge me?", "My family has gambled since 1642. We have never lost.", "How delightfully beneath me. Let's begin."],
    phase2: ["By my ancestors... you're actually competent.", "Very well. The Baron removes his gloves.", "Prepare to face the full force of inherited privilege!"],
    phase3: ["THIS IS OUTRAGEOUS! ABSOLUTELY OUTRAGEOUS!", "DO YOU KNOW HOW MANY GENERATIONS OF WINNERS YOU'RE DEFEATING?!", "MY ENTIRE LINEAGE WEEPS!"],
    taunts: ["My monocle costs more than your net worth.", "I once bet an entire island. And won.", "You fight like someone who earned their money."],
    onHit: ["How frightfully rude.", "I shall have my solicitors look into this.", "A lucky thrust from the proletariat."],
    defeat: ["...the Von Chips name has fallen.", "Extraordinary. Simply extraordinary.", "I concede. With dignity. Obviously."],
    mercy: ["Sparing me? How... chivalrous.", "You have the manners of a noble. Surprising.", "I owe you a debt of honor. I will pay it."],
  },
  house: {
    intro: ["The edge is infinite.", "Statistically, you lose.", "I am the probability."],
    phase2: ["Recalculating...", "Anomaly detected. Correcting.", "The edge adapts."],
    phase3: ["ERROR. ERROR. ERROR.", "OVERRIDE. MAXIMUM HOUSE EDGE.", "THIS CANNOT HAPPEN."],
    taunts: ["95.3% of challengers fail here.", "Expected value: negative.", "You are an outlier. For now."],
    onHit: ["Variance acknowledged.", "Within acceptable parameters.", "Logged."],
    defeat: ["...Impossible probability.", "The model was wrong.", "You broke the math."],
    mercy: ["Mercy is not in my algorithm.", "Logged as: anomalous behavior.", "The house will remember this."],
  },
  auditor: {
    intro: ["SCAN COMPLETE. THREAT LEVEL: NEGLIGIBLE.", "Processing challenger... error: undefined behavior detected.", "Your win rate is below optimal thresholds. Engaging correction protocol."],
    phase2: ["WARNING: PROBABILITY ANOMALY DETECTED.", "INITIATING SECONDARY OPTIMIZATION SUBROUTINE.", "Subject is performing... above predicted parameters. Unusual."],
    phase3: ["CRITICAL ERROR. CRITICAL ERROR.", "EMERGENCY PROTOCOL: MAXIMUM HOUSE EDGE.", "HOW ARE YOU DOING THIS? HOW IS THIS ALLOWED?"],
    taunts: ["Your decisions are suboptimal.", "The algorithm predicts your defeat with 99.7% confidence.", "I have never lost. The data confirms this."],
    onHit: ["Damage registered. Response: irrelevant.", "Error tolerance exceeded.", "Recalibrating pain response..."],
    defeat: ["...SYSTEM FAILURE.", "The model was fundamentally incorrect.", "You are an impossible variable. I am adding you to the dataset."],
    mercy: ["UNEXPECTED INPUT: MERCY.", "Processing... processing... this is not in the training data.", "Logging as: outlier. Possible bug in opponent."],
  },
  shadow: {
    intro: ["...", "You see me now.", "Shadows never lose."],
    phase2: ["You see more than most.", "Interesting.", "Let me show you the dark."],
    phase3: ["NO LIGHT REACHES ME.", "I AM THE VOID.", "...end this."],
    taunts: ["...", "Can you see me?", "Look behind you."],
    onHit: ["...", "You struck shadow.", "Pain is an illusion."],
    defeat: ["...you are worthy.", "Fade with me.", "I return to the dark."],
    mercy: ["...", "Unexpected.", "The shadow remembers kindness."],
  },
  void: {
    intro: ["...........", "YOU HAVE FOUND THE ABYSS.", "GOOD. WE HAVE BEEN WAITING."],
    phase2: ["THE VOID HUNGERS.", "YOU PERSIST. INTERESTING.", "WE WILL CONSUME YOUR LUCK ITSELF."],
    phase3: ["EVERYTHING ENDS.", "THE ABYSS IS INFINITE.", "YOU CANNOT WIN AGAINST NOTHING."],
    taunts: ["YOUR WINS MEAN NOTHING HERE.", "LUCK DOES NOT EXIST IN THE VOID.", "CAN YOU FEEL THE EMPTINESS?"],
    onHit: ["PAIN IS IRRELEVANT.", "THE VOID DOES NOT FEEL.", "...THAT WAS SOMETHING. WHAT IS THAT."],
    defeat: ["...........", "...you filled the void.", "WE WILL NOT FORGET THIS."],
    mercy: ["MERCY? THE VOID DOES NOT... understand. But it will try.", "...we feel something. What is this.", "THE ABYSS THANKS YOU. SOMEHOW."],
  },
  king: {
    intro: ["A worthy challenger appears!", "My kingdom bows to none.", "ROYAL FLUSH — begin!"],
    phase2: ["Impressive! TRULY impressive!", "You force my royal hand!", "The court falls silent..."],
    phase3: ["MY CROWN! YOU DARE?!", "ROYAL DECREE: YOUR DEFEAT!", "I WILL NOT BE DETHRONED!"],
    taunts: ["My kingdom stretches infinite.", "Gold cannot buy what I have.", "A royal jest!"],
    onHit: ["The king bleeds gold!", "A worthy blow!", "The court gasps!"],
    defeat: ["...You have dethroned me.", "The kingdom is yours.", "Long live the new king..."],
    mercy: ["You spare a king?", "Such honor is rare.", "I owe you a royal debt."],
  },
  architect: {
    intro: ["So. You've made it.", "I designed every game. Every rule. Every loss you've ever had.", "I wondered who would reach this room. Now I know."],
    phase2: ["Remarkable. You've broken through my designs.", "The casino was meant to be unbeatable. You are disproving that.", "Fine. I'll stop holding back. This is the real game."],
    phase3: ["YOU WEREN'T SUPPOSED TO EXIST.", "I BUILT THIS WORLD AND YOU ARE BREAKING IT.", "IF YOU WIN... EVERYTHING CHANGES."],
    taunts: ["I invented the house edge.", "Every game you've ever played, I balanced it against you.", "Do you know what it took to build all this?"],
    onHit: ["...Good.", "Even I can be hit.", "The architect bleeds. Interesting."],
    defeat: ["...It's over. The casino falls.", "You've done the impossible.", "Build something better. Please."],
    mercy: ["Mercy for me? After everything I put you through?", "...I don't deserve it. But I'll take it.", "The casino will remember your mercy. I promise."],
  },
};

const BOSS_SIGNATURE: Record<string, 'none' | 'dealerFan' | 'pitSweep' | 'whaleWave' | 'houseGrid' | 'shadowX' | 'kingCross'> = {
  dealer: 'dealerFan',
  'lucky-lou': 'dealerFan',
  'pit-boss': 'pitSweep',
  fortune: 'whaleWave',
  whale: 'whaleWave',
  baron: 'kingCross',
  house: 'houseGrid',
  auditor: 'houseGrid',
  shadow: 'shadowX',
  void: 'shadowX',
  king: 'kingCross',
  architect: 'kingCross',
};

const CHAPTER_STARS: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐', 6: '💀' };

function getJackpotPot(): number {
  try {
    const stored = localStorage.getItem(JACKPOT_POT_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return isNaN(parsed) ? BASE_JACKPOT : Math.max(BASE_JACKPOT, parsed);
  } catch { return BASE_JACKPOT; }
}
function growJackpotPot(by: number) {
  const current = getJackpotPot();
  localStorage.setItem(JACKPOT_POT_KEY, String(Math.round(current + by)));
}
function resetJackpotPot() {
  localStorage.setItem(JACKPOT_POT_KEY, String(BASE_JACKPOT));
}

const ACTIONS = [
  { id: 'attack',  name: 'Strike',  icon: Swords, color: 'bg-orange-600 hover:bg-orange-500', desc: 'Standard attack' },
  { id: 'heavy',   name: 'Heavy',   icon: Zap,    color: 'bg-red-700 hover:bg-red-600',        desc: '×2.2 dmg · cd 3' },
  { id: 'focus',   name: 'Focus',   icon: Target, color: 'bg-amber-600 hover:bg-amber-500',    desc: '+Jackpot bias · cd 2' },
  { id: 'heal',    name: 'Heal',    icon: Heart,  color: 'bg-pink-600 hover:bg-pink-500',      desc: 'Recover HP · cd 4' },
  { id: 'counter', name: 'Counter', icon: Shield, color: 'bg-sky-700 hover:bg-sky-600',        desc: 'Reflect next hit · cd 4' },
  { id: 'allin',   name: 'All-In',  icon: Flame,  color: 'bg-purple-700 hover:bg-purple-600',  desc: '×3 dmg, −HP · cd 5' },
] as const;

type CombatAction = (typeof ACTIONS)[number]['id'];
type CombatPhase = 'playerTurn' | 'dodge' | 'ended';
type BossPhase = 1 | 2 | 3;
type VictoryChoice = 'fight' | 'mercy' | null;

export const BossBattle = ({ balance, playerLevel, playerName, onWin, onLose, onBetPlaced, onXpGain, onClose }: BossBattleProps) => {
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [storyMode, setStoryMode] = useState(true);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [maxPlayerHealth, setMaxPlayerHealth] = useState(100);
  const [bossHealth, setBossHealth] = useState(100);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleEnded, setBattleEnded] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);
  const [victoryChoice, setVictoryChoice] = useState<VictoryChoice>(null);
  const [pendingReward, setPendingReward] = useState(0);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<CombatPhase>('playerTurn');
  const [bossPhase, setBossPhase] = useState<BossPhase>(1);
  const [focusActive, setFocusActive] = useState(false);
  const [counterActive, setCounterActive] = useState(false);
  const [bossVulnerableUntil, setBossVulnerableUntil] = useState<number>(0);
  const [timeScale, setTimeScale] = useState(1);
  const [attackPattern, setAttackPattern] = useState<AttackPattern>('rain');
  const [slotUI, setSlotUI] = useState<{ for: 'toBoss' | 'toPlayer'; outcome: SlotOutcome; base: number; damage: number } | null>(null);
  const [burst, setBurst] = useState<{ kind: 'boss' | 'player'; nonce: number } | null>(null);
  const [dialogueLine, setDialogueLine] = useState<string>('');
  const [showDialogue, setShowDialogue] = useState(false);
  const [showMegaJackpot, setShowMegaJackpot] = useState(false);
  const [jackpotPotDisplay, setJackpotPotDisplay] = useState(BASE_JACKPOT);
  const [jackpotFlash, setJackpotFlash] = useState(false);
  const [mercyBonus, setMercyBonus] = useState(0);
  const [droppedItem, setDroppedItem] = useState<InventoryItem | null>(null);
  const [storyProgress, setStoryProgressState] = useState(() => getStoryProgress(playerName));
  const [expandedChapter, setExpandedChapter] = useState<number | null>(1);
  const [equipment] = useState(() => loadEquipment(playerName));
  const equipBuffs: ItemBuffs = aggregateBuffs(equipment);
  const dialogueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bossStats, setBossStats] = useState(() => {
    const defaults = { totalKills: 0, totalDeaths: 0, bossesDefeated: {} as Record<string, number>, rareDrops: 0, totalEarned: 0, merciesGiven: {} as Record<string, number>, totalXpEarned: 0 };
    try {
      const saved = localStorage.getItem('boss_stats');
      if (!saved) return defaults;
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed, merciesGiven: parsed.merciesGiven ?? {}, totalXpEarned: parsed.totalXpEarned ?? 0 };
    } catch { return defaults; }
  });
  const [betAmount] = useState(50);
  const entryChargedRef = useRef(false);

  useEffect(() => { localStorage.setItem('boss_stats', JSON.stringify(bossStats)); }, [bossStats]);
  useEffect(() => { setJackpotPotDisplay(getJackpotPot()); }, [selectedBoss]);

  const showBossDialogue = useCallback((line: string) => {
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    setDialogueLine(line);
    setShowDialogue(true);
    dialogueTimerRef.current = setTimeout(() => setShowDialogue(false), 3200);
  }, []);

  const pickDialogue = useCallback((boss: Boss, type: keyof typeof BOSS_DIALOGUE[string]) => {
    const lines = BOSS_DIALOGUE[boss.id]?.[type] ?? [];
    if (!lines.length) return;
    showBossDialogue(lines[Math.floor(Math.random() * lines.length)]);
  }, [showBossDialogue]);

  const startBattle = (boss: Boss) => {
    if (balance < betAmount) { toast.error('Need at least $50 to challenge a boss!'); return; }
    setSelectedBoss(boss);
    const hpBonus = equipBuffs.bossMaxHpBonus ?? 0;
    const playerMaxHp = 100 + playerLevel * 3 + hpBonus;
    setPlayerHealth(playerMaxHp);
    setMaxPlayerHealth(playerMaxHp);
    setBossHealth(boss.health);
    setBattleLog([
      `⚔️ ${boss.icon} Battle started vs ${boss.name}!`,
      `📖 "${boss.lore.slice(0, 80)}..."`,
      `🎰 Slots decide damage — roll JACKPOT for bonus effects!`,
      hpBonus > 0 ? `💜 Equipment bonus: +${hpBonus} HP!` : `❤️ Dodge attacks in the arena below.`,
    ]);
    setBattleEnded(false); setPlayerWon(false); setVictoryChoice(null); setPendingReward(0);
    setCooldowns({}); setPhase('playerTurn'); setBossPhase(1); setFocusActive(false); setCounterActive(false);
    setBossVulnerableUntil(0); setTimeScale(1); setAttackPattern('rain');
    setSlotUI(null); setBurst(null); setShowDialogue(false);
    setShowMegaJackpot(false); setJackpotFlash(false); setMercyBonus(0); setDroppedItem(null);
    entryChargedRef.current = true;
    (onBetPlaced ?? onLose)(betAmount);
    growJackpotPot(betAmount * 0.5);
    setJackpotPotDisplay(getJackpotPot());
    playSound('click');
    setTimeout(() => pickDialogue(boss, 'intro'), 800);
  };

  const slotMods = useMemo(() => {
    const base = modsFromLevel(playerLevel);
    return {
      ...base,
      jackpotBias: (base.jackpotBias ?? 0) + (equipBuffs.jackpotBias ?? 0),
    };
  }, [playerLevel, equipBuffs.jackpotBias]);

  const bossDifficulty = useMemo(() => {
    if (!selectedBoss) return { cadenceMs: 900, telegraphMs: 600, strikeMs: 180, maxSlashes: 2, moveSpeed: 200 };
    const t = Math.min(1, selectedBoss.minLevel / 90);
    const phaseBoost = bossPhase === 2 ? 0.2 : bossPhase === 3 ? 0.38 : 0;
    const dodgeBonus = (equipBuffs.dodgeSpeedBonus ?? 0) / 100;
    return {
      cadenceMs: Math.round((950 - t * 420) * (1 - phaseBoost)),
      telegraphMs: Math.round((700 - t * 290) * (1 - phaseBoost * 0.5)),
      strikeMs: Math.round(175 + t * 80),
      maxSlashes: 2 + (t > 0.5 ? 1 : 0) + (t > 0.75 ? 1 : 0) + (bossPhase === 3 ? 1 : 0),
      moveSpeed: Math.round(200 * (1 + dodgeBonus)),
    };
  }, [selectedBoss, bossPhase, equipBuffs.dodgeSpeedBonus]);

  const arenaDurationMs = bossPhase === 3 ? 1500 : bossPhase === 2 ? 2000 : 2400;
  const bossSignature = selectedBoss ? BOSS_SIGNATURE[selectedBoss.id] ?? 'none' : 'none';

  const choosePattern = (bossHp: number, maxHp: number, phase: BossPhase): AttackPattern => {
    const pct = maxHp > 0 ? bossHp / maxHp : 1;
    if (phase === 3) { const opts: AttackPattern[] = ['burst', 'cross', 'walls']; return opts[Math.floor(Math.random() * opts.length)]; }
    if (phase === 2) { if (pct > 0.5) return Math.random() > 0.5 ? 'spiral' : 'cross'; return Math.random() > 0.5 ? 'burst' : 'walls'; }
    if (pct > 0.66) return 'rain';
    if (pct > 0.33) return 'cross';
    return 'walls';
  };

  const checkPhaseTransition = useCallback((newBossHp: number, boss: Boss, currentPhase: BossPhase) => {
    const pct = newBossHp / boss.health;
    if (currentPhase === 1 && pct <= 0.5) {
      setBossPhase(2); setBattleLog(prev => [...prev, `⚡ ${boss.name} enters PHASE 2!`]);
      pickDialogue(boss, 'phase2'); playSound('lose'); return 2 as BossPhase;
    }
    if (currentPhase <= 2 && pct <= 0.25) {
      setBossPhase(3); setBattleLog(prev => [...prev, `🔥 ${boss.name} ENRAGES!`]);
      pickDialogue(boss, 'phase3'); playSound('lose'); return 3 as BossPhase;
    }
    return currentPhase;
  }, [pickDialogue]);

  const reduceCooldowns = () => setCooldowns(prev => {
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(prev)) { if (v > 1) next[k] = v - 1; }
    return next;
  });

  const applyJackpotEffect = (outcome: SlotOutcome, forWho: 'toBoss' | 'toPlayer') => {
    if (!selectedBoss || !outcome.effect) return;
    if (outcome.effect === 'megaJackpot' && forWho === 'toBoss') {
      const pot = getJackpotPot();
      setMercyBonus(prev => prev + pot); setPendingReward(prev => prev + pot);
      setBattleLog(prev => [...prev, `🎰🎰🎰 MEGA JACKPOT! +$${pot.toLocaleString()} JACKPOT POT CLAIMED!`]);
      resetJackpotPot(); setJackpotPotDisplay(BASE_JACKPOT); setShowMegaJackpot(true); setJackpotFlash(true);
      setTimeout(() => { setShowMegaJackpot(false); setJackpotFlash(false); }, 3500); playSound('cashout'); return;
    }
    if (outcome.effect === 'slowMo') { setBattleLog(prev => [...prev, `⏳ JACKPOT: Slow-motion!`]); setTimeScale(0.55); setTimeout(() => setTimeScale(1), 1600); return; }
    if (outcome.effect === 'bossInterrupt') { setBattleLog(prev => [...prev, `🧨 JACKPOT: Phase interrupt!`]); setPhase('playerTurn'); return; }
    if (outcome.effect === 'vulnerability') { setBossVulnerableUntil(Date.now() + 2500); setBattleLog(prev => [...prev, `🩸 JACKPOT: Boss vulnerable!`]); return; }
    if (outcome.effect === 'damageBurst') { setBattleLog(prev => [...prev, `💥 JACKPOT: Damage burst!`]); }
  };

  const doSlotRoll = (forWho: 'toBoss' | 'toPlayer', baseDamage: number) => {
    const outcome = rollSlotOutcome(DEFAULT_SLOT_CONFIG, slotMods);
    applyJackpotEffect(outcome, forWho);
    const vuln = forWho === 'toBoss' && Date.now() < bossVulnerableUntil ? 1.6 : 1;
    const burst = (outcome.tier === 'jackpot' || outcome.tier === 'megaJackpot') && outcome.effect === 'damageBurst' ? 1.35 : 1;
    const dr = forWho === 'toPlayer' ? Math.max(0, 1 - (equipBuffs.bossDamageReduction ?? 0) / 100) : 1;
    const damage = computeDamage(baseDamage, outcome, { ...slotMods, damageScalar: (slotMods.damageScalar ?? 1) * vuln * burst * dr });
    setSlotUI({ for: forWho, outcome, base: baseDamage, damage });
    return { outcome, damage };
  };

  const onPlayerAction = (action: CombatAction) => {
    if (battleEnded || !selectedBoss) return;
    if (phase !== 'playerTurn') return;
    if (cooldowns[action] && cooldowns[action] > 0) return;

    if (action === 'heal') {
      setCooldowns(prev => ({ ...prev, heal: 4 }));
      const healBonus = 1 + (equipBuffs.healBonus ?? 0) / 100;
      const healAmount = Math.round((22 + Math.floor(playerLevel * 0.6)) * healBonus);
      setPlayerHealth(h => Math.min(maxPlayerHealth, h + healAmount));
      setBattleLog(prev => [...prev, `💚 You heal for ${healAmount} HP.`]);
      playSound('cashout'); reduceCooldowns(); setPhase('dodge');
      setAttackPattern(choosePattern(bossHealth, selectedBoss.health, bossPhase)); return;
    }
    if (action === 'focus') {
      setCooldowns(prev => ({ ...prev, focus: 2 })); setFocusActive(true);
      setBattleLog(prev => [...prev, `🎯 Focus: higher jackpot odds next strike!`]);
      playSound('click'); reduceCooldowns(); setPhase('dodge');
      setAttackPattern(choosePattern(bossHealth, selectedBoss.health, bossPhase)); return;
    }
    if (action === 'counter') {
      setCooldowns(prev => ({ ...prev, counter: 4 })); setCounterActive(true);
      setBattleLog(prev => [...prev, `🛡️ Counter stance! Next boss hit reflects 50% damage back!`]);
      playSound('click'); reduceCooldowns(); setPhase('dodge');
      setAttackPattern(choosePattern(bossHealth, selectedBoss.health, bossPhase)); return;
    }

    const dmgBonus = 1 + (equipBuffs.bossDamageBonus ?? 0) / 100;
    const mercyMult = (bossStats.merciesGiven?.[selectedBoss.id] ?? 0) > 0 ? 1.1 : 1;
    const vuln = Date.now() < bossVulnerableUntil ? 1.6 : 1;

    if (action === 'heavy') {
      setCooldowns(prev => ({ ...prev, heavy: 3 }));
      const base = Math.round((14 + Math.floor(playerLevel * 1.8)) * dmgBonus * 2.2);
      const boostedMods = focusActive
        ? { ...slotMods, highBias: (slotMods.highBias ?? 0) + 6, jackpotBias: (slotMods.jackpotBias ?? 0) + 0.6 }
        : slotMods;
      const outcome = rollSlotOutcome(DEFAULT_SLOT_CONFIG, boostedMods);
      setFocusActive(false);
      applyJackpotEffect(outcome, 'toBoss');
      const burstBonus = (outcome.tier === 'jackpot' || outcome.tier === 'megaJackpot') && outcome.effect === 'damageBurst' ? 1.35 : 1;
      const damage = computeDamage(base, outcome, { ...boostedMods, damageScalar: (boostedMods.damageScalar ?? 1) * vuln * burstBonus * mercyMult });
      setSlotUI({ for: 'toBoss', outcome, base, damage });
      const tierLabel = outcome.tier === 'megaJackpot' ? '🎰 MEGA JACKPOT' : outcome.tier.toUpperCase();
      setBattleLog(prev => [...prev, `⚡ HEAVY STRIKE! ${tierLabel} → ${damage} dmg to ${selectedBoss.name}!`]);
      setBurst({ kind: 'boss', nonce: Date.now() });
      playSound(damage > 0 ? 'win' : 'click');
      if (Math.random() < 0.4) pickDialogue(selectedBoss, 'onHit');
      const nextBossHpH = Math.max(0, bossHealth - damage);
      setBossHealth(nextBossHpH);
      if (nextBossHpH === 0) { handleVictory(); return; }
      const nextPhaseH = checkPhaseTransition(nextBossHpH, selectedBoss, bossPhase);
      reduceCooldowns(); setPhase('dodge');
      setAttackPattern(choosePattern(nextBossHpH, selectedBoss.health, nextPhaseH)); return;
    }
    if (action === 'allin') {
      setCooldowns(prev => ({ ...prev, allin: 5 }));
      const selfDmg = Math.max(1, 30 + Math.round(playerLevel * 0.4));
      setPlayerHealth(h => Math.max(1, h - selfDmg));
      const base = Math.round((14 + Math.floor(playerLevel * 1.8)) * dmgBonus * 3.0);
      const outcome = rollSlotOutcome(DEFAULT_SLOT_CONFIG, slotMods);
      setFocusActive(false);
      applyJackpotEffect(outcome, 'toBoss');
      const burstBonus = (outcome.tier === 'jackpot' || outcome.tier === 'megaJackpot') && outcome.effect === 'damageBurst' ? 1.35 : 1;
      const damage = computeDamage(base, outcome, { ...slotMods, damageScalar: (slotMods.damageScalar ?? 1) * vuln * burstBonus });
      setSlotUI({ for: 'toBoss', outcome, base, damage });
      const tierLabel = outcome.tier === 'megaJackpot' ? '🎰 MEGA JACKPOT' : outcome.tier.toUpperCase();
      setBattleLog(prev => [...prev, `🎲 ALL-IN! −${selfDmg} HP self · ${tierLabel} → ${damage} dmg!`]);
      setBurst({ kind: 'boss', nonce: Date.now() });
      playSound('win');
      if (Math.random() < 0.5) pickDialogue(selectedBoss, 'onHit');
      const nextBossHpA = Math.max(0, bossHealth - damage);
      setBossHealth(nextBossHpA);
      if (nextBossHpA === 0) { handleVictory(); return; }
      const nextPhaseA = checkPhaseTransition(nextBossHpA, selectedBoss, bossPhase);
      reduceCooldowns(); setPhase('dodge');
      setAttackPattern(choosePattern(nextBossHpA, selectedBoss.health, nextPhaseA)); return;
    }

    const boostedMods = focusActive
      ? { ...slotMods, highBias: (slotMods.highBias ?? 0) + 6, jackpotBias: (slotMods.jackpotBias ?? 0) + 0.6 }
      : slotMods;
    const base = Math.round((14 + Math.floor(playerLevel * 1.8)) * dmgBonus);
    const outcome = rollSlotOutcome(DEFAULT_SLOT_CONFIG, boostedMods);
    setFocusActive(false);
    applyJackpotEffect(outcome, 'toBoss');
    const burstBonus = (outcome.tier === 'jackpot' || outcome.tier === 'megaJackpot') && outcome.effect === 'damageBurst' ? 1.35 : 1;
    const damage = computeDamage(base, outcome, { ...boostedMods, damageScalar: (boostedMods.damageScalar ?? 1) * vuln * burstBonus * mercyMult });
    setSlotUI({ for: 'toBoss', outcome, base, damage });
    const tierLabel = outcome.tier === 'megaJackpot' ? '🎰 MEGA JACKPOT' : outcome.tier.toUpperCase();
    setBattleLog(prev => [...prev, `🗡️ ${tierLabel} → ${damage} dmg to ${selectedBoss.name}!`]);
    setBurst({ kind: 'boss', nonce: Date.now() });
    playSound(damage > 0 ? 'win' : 'click');
    if (Math.random() < 0.3) pickDialogue(selectedBoss, 'onHit');
    const nextBossHp = Math.max(0, bossHealth - damage);
    setBossHealth(nextBossHp);
    if (nextBossHp === 0) { handleVictory(); return; }
    const nextPhase = checkPhaseTransition(nextBossHp, selectedBoss, bossPhase);
    reduceCooldowns(); setPhase('dodge');
    setAttackPattern(choosePattern(nextBossHp, selectedBoss.health, nextPhase));
  };

  const onArenaHit = () => {
    if (!selectedBoss || battleEnded) return;
    const base = selectedBoss.damage + Math.floor(Math.random() * 8) + (bossPhase === 3 ? 10 : bossPhase === 2 ? 5 : 0);
    const { outcome, damage } = doSlotRoll('toPlayer', base);
    if (counterActive) {
      setCounterActive(false);
      const reflected = Math.round(damage * 0.5);
      const nextBossHp = Math.max(0, bossHealth - reflected);
      setBossHealth(nextBossHp);
      setPlayerHealth(h => Math.max(0, h - damage));
      setBurst({ kind: 'boss', nonce: Date.now() });
      setBattleLog(prev => [...prev, `🛡️ COUNTER! Reflected ${reflected} dmg to boss! (took ${damage} dmg)`]);
      if (nextBossHp === 0) { handleVictory(); return; }
      checkPhaseTransition(nextBossHp, selectedBoss, bossPhase);
      return;
    }
    setBattleLog(prev => [...prev, `💔 Hit! ${outcome.tier.toUpperCase()} → ${damage} dmg to you.`]);
    setPlayerHealth(h => Math.max(0, h - damage));
    setBurst({ kind: 'player', nonce: Date.now() });
    if (Math.random() < 0.25) pickDialogue(selectedBoss, 'taunts');
  };

  const onDodgeDone = () => {
    if (battleEnded) return;
    if (playerHealth <= 0) { handleDefeat(); return; }
    reduceCooldowns(); setPhase('playerTurn');
  };

  const handleVictory = () => {
    if (!selectedBoss) return;
    setBattleEnded(true); setPlayerWon(true);
    let reward = selectedBoss.reward + pendingReward;
    const logMessages: string[] = [`🏆 VICTORY! You defeated ${selectedBoss.name}!`];
    if (Math.random() < selectedBoss.dropChance) {
      reward += selectedBoss.rareDropReward;
      logMessages.push(`✨ BONUS DROP! +$${selectedBoss.rareDropReward.toLocaleString()}!`);
      setBossStats((prev: typeof bossStats) => ({ ...prev, rareDrops: prev.rareDrops + 1 }));
    }
    // Roll item drop
    const item = rollItemDrop(selectedBoss.id, playerName, selectedBoss.dropChance);
    if (item) {
      setDroppedItem(item);
      const rm = RARITY_META[item.rarity];
      logMessages.push(`${rm.label === 'Transcendent' ? '🌌' : rm.label === 'Cosmic' ? '🌠' : rm.label === 'Mythic' ? '💎' : rm.label === 'Legendary' ? '🏆' : '📦'} ITEM DROP: [${rm.label}] ${item.name}!`);
    }
    // Grant XP
    const xpGained = selectedBoss.xpReward;
    const xpBonus = 1 + (equipBuffs.xpMultiplier ?? 0) / 100;
    const totalXp = Math.round(xpGained * xpBonus);
    logMessages.push(`✨ +${totalXp.toLocaleString()} XP earned!`);
    onXpGain(totalXp);
    setBossStats((prev: typeof bossStats) => ({ ...prev, totalXpEarned: (prev.totalXpEarned ?? 0) + totalXp }));
    // Update story progress
    if (selectedBoss.storyOrder > storyProgress) {
      setStoryProgress(playerName, selectedBoss.storyOrder);
      setStoryProgressState(selectedBoss.storyOrder);
    }
    setBattleLog(prev => [...prev, ...logMessages]);
    setPendingReward(reward);
    pickDialogue(selectedBoss, 'defeat');
    playSound('cashout');
  };

  const confirmFight = () => {
    if (!selectedBoss || victoryChoice) return;
    setVictoryChoice('fight');
    onWin(pendingReward, betAmount, pendingReward / betAmount);
    setBossStats((prev: typeof bossStats) => ({
      ...prev, totalKills: prev.totalKills + 1, totalEarned: prev.totalEarned + pendingReward,
      bossesDefeated: { ...prev.bossesDefeated, [selectedBoss.id]: (prev.bossesDefeated[selectedBoss.id] || 0) + 1 },
    }));
    toast.success(`🏆 Boss defeated! +$${pendingReward.toLocaleString()}`);
  };

  const confirmMercy = () => {
    if (!selectedBoss || victoryChoice) return;
    setVictoryChoice('mercy');
    const mercyReward = Math.round(pendingReward * 0.5);
    pickDialogue(selectedBoss, 'mercy');
    onWin(mercyReward, betAmount, mercyReward / betAmount);
    setBossStats((prev: typeof bossStats) => ({
      ...prev, totalKills: prev.totalKills + 1, totalEarned: prev.totalEarned + mercyReward,
      merciesGiven: { ...prev.merciesGiven, [selectedBoss.id]: (prev.merciesGiven[selectedBoss.id] || 0) + 1 },
      bossesDefeated: { ...prev.bossesDefeated, [selectedBoss.id]: (prev.bossesDefeated[selectedBoss.id] || 0) + 1 },
    }));
    toast.success(`🕊️ Mercy! +$${mercyReward.toLocaleString()} — boss spared!`);
    setBattleLog(prev => [...prev, `🕊️ You showed mercy. +$${mercyReward.toLocaleString()}`, `💡 Future vs ${selectedBoss.name}: +10% dmg!`]);
  };

  const handleDefeat = () => {
    if (!selectedBoss) return;
    setBattleEnded(true); setPlayerWon(false);
    // Consolation XP on defeat
    const consolationXp = Math.round(selectedBoss.xpReward * 0.25);
    const xpBonus = 1 + (equipBuffs.xpMultiplier ?? 0) / 100;
    const totalXp = Math.round(consolationXp * xpBonus);
    setBattleLog(prev => [...prev, `💀 DEFEATED by ${selectedBoss.name}...`, `📚 +${totalXp.toLocaleString()} XP for the experience.`]);
    onXpGain(totalXp);
    setBossStats((prev: typeof bossStats) => ({ ...prev, totalDeaths: prev.totalDeaths + 1, totalXpEarned: (prev.totalXpEarned ?? 0) + totalXp }));
    toast.error(`You were defeated! +${totalXp.toLocaleString()} XP`);
    setPhase('ended');
  };

  const tierColor = (tier: string) => {
    if (tier === 'megaJackpot') return 'text-yellow-300';
    if (tier === 'jackpot') return 'text-gold';
    if (tier === 'high') return 'text-neon-cyan';
    if (tier === 'mid') return 'text-green-400';
    if (tier === 'critFail') return 'text-gray-500';
    return 'text-muted-foreground';
  };

  // ─── Boss Selection Screen ───────────────────────────────────────────────

  if (!selectedBoss) {
    const chapters = [1, 2, 3, 4, 5, 6];
    const bossesByChapter = (ch: number) => BOSSES.filter(b => b.chapter === ch);

    const isBossUnlocked = (boss: Boss) => {
      if (!storyMode) return playerLevel >= boss.minLevel;
      if (boss.storyOrder === 0) return true;
      return storyProgress >= boss.storyOrder - 1;
    };

    return (
      <Card className="bg-gradient-to-br from-card via-red-950/20 to-card border-lose/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-lose/30 to-red-600/20 rounded-xl glow-red">
                <Skull className="w-6 h-6 text-lose" />
              </div>
              <div>
                <CardTitle className="font-display text-xl text-lose">BOSS BATTLES</CardTitle>
                <p className="text-xs text-lose/60">12 Bosses · 6 Chapters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStoryMode(!storyMode)}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${storyMode ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/20 text-muted-foreground'}`}
              >
                <BookOpen className="w-3 h-3" />
                {storyMode ? 'Story' : 'Free'}
              </button>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Kills', value: bossStats.totalKills, color: 'win' },
              { label: 'Deaths', value: bossStats.totalDeaths, color: 'lose' },
              { label: 'Items', value: bossStats.rareDrops, color: 'gold' },
              { label: 'XP', value: `${((bossStats.totalXpEarned ?? 0) / 1000).toFixed(0)}k`, color: 'neon-cyan' },
            ].map(s => (
              <div key={s.label} className={`p-2 bg-${s.color}/10 rounded-lg border border-${s.color}/20 text-center`}>
                <p className={`text-sm font-display text-${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Jackpot Pot */}
          <div className="relative p-3 rounded-xl bg-gradient-to-r from-yellow-950/60 to-amber-950/40 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎰</span>
                <div>
                  <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest">Boss Jackpot Pot</p>
                  <p className="font-display text-lg text-yellow-300">${jackpotPotDisplay.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-yellow-500/60">
                <p>~1 in 1250 rolls</p>
                <p>grows each battle</p>
              </div>
            </div>
          </div>

          {/* Story progress bar */}
          {storyMode && (
            <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-purple-400">Story Progress</span>
                <span className="text-purple-300">{Math.min(storyProgress + 1, 12)}/12 bosses</span>
              </div>
              <Progress value={((storyProgress + 1) / 12) * 100} className="h-1.5 bg-purple-950 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" />
            </div>
          )}

          <p className="text-xs text-muted-foreground">Entry: $50/battle. {storyMode ? 'Complete bosses in order to unlock the story.' : 'Reach level requirement to fight any boss.'}</p>

          {/* Chapters */}
          <div className="space-y-3">
            {chapters.map(ch => {
              const chBosses = bossesByChapter(ch);
              const chName = chBosses[0]?.chapterName ?? '';
              const isExpanded = expandedChapter === ch;
              const anyUnlocked = chBosses.some(b => isBossUnlocked(b));
              return (
                <div key={ch} className={`rounded-xl border ${anyUnlocked ? 'border-white/15' : 'border-white/5'} overflow-hidden`}>
                  <button
                    onClick={() => setExpandedChapter(isExpanded ? null : ch)}
                    className={`w-full flex items-center justify-between p-3 text-left transition-all ${anyUnlocked ? 'hover:bg-white/5' : 'opacity-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{CHAPTER_STARS[ch]}</span>
                      <div>
                        <p className="text-xs font-bold text-white">Chapter {ch}: {chName}</p>
                        <p className="text-[10px] text-muted-foreground">{chBosses.map(b => b.name).join(' · ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {chBosses.map(b => (
                        <span key={b.id} className="text-base">{b.icon}</span>
                      ))}
                      <span className="text-[10px] text-muted-foreground">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-2 gap-2 p-2 pt-0">
                      {chBosses.map(boss => {
                        const locked = !isBossUnlocked(boss);
                        const timesDefeated = bossStats.bossesDefeated[boss.id] || 0;
                        const shownMercy = (bossStats.merciesGiven?.[boss.id] ?? 0) > 0;
                        const xpBonus = 1 + (equipBuffs.xpMultiplier ?? 0) / 100;
                        return (
                          <button
                            key={boss.id}
                            onClick={() => !locked && startBattle(boss)}
                            disabled={locked}
                            className={`relative p-3 rounded-xl bg-gradient-to-br ${boss.color} bg-opacity-20 border border-white/10 transition-all duration-300 ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-lg hover:border-white/25'} group`}
                          >
                            <div className="absolute inset-0 bg-black/65 rounded-xl" />
                            {locked && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                                <Lock className="w-6 h-6 text-gray-400/60" />
                              </div>
                            )}
                            <div className="relative z-10 text-left">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-2xl">{boss.icon}</span>
                                <div className="text-right">
                                  {timesDefeated > 0 && <span className="text-[10px] text-win block">✓ ×{timesDefeated}</span>}
                                  {shownMercy && <span className="text-[10px] text-yellow-400 block">🕊️</span>}
                                  {locked && storyMode && boss.storyOrder > 0 && (
                                    <span className="text-[9px] text-gray-400">Beat #{boss.storyOrder}</span>
                                  )}
                                  {locked && !storyMode && (
                                    <span className="text-[9px] text-gray-400">Lv.{boss.minLevel}</span>
                                  )}
                                </div>
                              </div>
                              <h3 className="font-display text-xs text-white">{boss.name}</h3>
                              <p className="text-[9px] text-white/50 mb-1.5">{boss.title}</p>
                              <p className="text-[9px] text-white/60 italic leading-tight mb-2">{boss.lore.slice(0, 60)}…</p>
                              <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                                <div className="flex items-center gap-0.5">
                                  <Heart className="w-2.5 h-2.5 text-red-400" />
                                  <span className="text-red-400">{boss.health}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Trophy className="w-2.5 h-2.5 text-gold" />
                                  <span className="text-gold">${(boss.reward / 1000).toFixed(0)}k</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 text-purple-400" />
                                  <span className="text-purple-400">{Math.round(boss.xpReward * xpBonus).toLocaleString()} XP</span>
                                </div>
                              </div>
                              <div className="mt-1.5 flex items-center gap-1 text-[9px] text-purple-300 mb-1.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{boss.specialAbility}</span>
                              </div>
                              <div className="flex items-center gap-0.5 flex-wrap">
                                {getBossDropInfo(boss.id).map(d => (
                                  <span key={d.rarity} className={`text-[8px] px-1 py-0.5 rounded font-bold ${RARITY_META[d.rarity].bg} ${RARITY_META[d.rarity].color} border ${RARITY_META[d.rarity].border}`}>
                                    {RARITY_META[d.rarity].label.slice(0, 4)} {d.pct}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Battle Screen ───────────────────────────────────────────────────────

  const bossHpPct = (bossHealth / selectedBoss.health) * 100;
  const playerHpPct = (playerHealth / maxPlayerHealth) * 100;

  return (
    <div className="relative">
      {showMegaJackpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center gap-4 animate-bounce-in">
            <div className="absolute inset-0 bg-yellow-400/10 blur-3xl rounded-full scale-150" />
            <p className="font-display text-5xl text-yellow-300 drop-shadow-[0_0_30px_rgba(253,224,71,0.9)] z-10">🎰 MEGA JACKPOT 🎰</p>
            <p className="font-display text-2xl text-yellow-200 z-10">+${jackpotPotDisplay.toLocaleString()}</p>
          </div>
        </div>
      )}

      <Card className={`bg-gradient-to-br from-card via-red-950/20 to-card overflow-hidden transition-all duration-500 ${bossPhase === 3 ? 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : bossPhase === 2 ? 'border-orange-500/40' : 'border-lose/30'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedBoss.icon}</span>
              <div>
                <CardTitle className={`font-display text-lg ${bossPhase === 3 ? 'text-red-400 animate-pulse' : 'text-lose'}`}>
                  VS {selectedBoss.name}
                  {bossPhase === 2 && <span className="text-xs text-orange-400 ml-2">PHASE 2</span>}
                  {bossPhase === 3 && <span className="text-xs text-red-400 ml-2 animate-pulse">ENRAGED</span>}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">{CHAPTER_STARS[selectedBoss.chapter]} Ch.{selectedBoss.chapter} · {selectedBoss.title} · {selectedBoss.specialAbility}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedBoss(null)} disabled={phase === 'dodge' && !battleEnded}>
              {battleEnded ? 'Back' : 'Flee'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Health Bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neon-cyan flex items-center gap-1">You {focusActive && <Target className="w-3 h-3 text-red-400" />}</span>
                <span className="text-neon-cyan">{playerHealth} / {maxPlayerHealth} HP</span>
              </div>
              <Progress value={playerHpPct} className={`h-3 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-neon-cyan [&>div]:to-neon-blue ${playerHpPct < 25 ? '[&>div]:from-red-500 [&>div]:to-red-600' : ''}`} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className={`${bossPhase === 3 ? 'text-red-400' : 'text-lose'} flex items-center gap-1`}>
                  {selectedBoss.name}
                  {Date.now() < bossVulnerableUntil && <Flame className="w-3 h-3 text-gold animate-text-glow-pulse" />}
                </span>
                <span className={bossPhase === 3 ? 'text-red-400' : 'text-lose'}>{bossHealth} / {selectedBoss.health}</span>
              </div>
              <Progress value={bossHpPct} className={`h-3 bg-secondary [&>div]:bg-gradient-to-r ${bossPhase === 3 ? '[&>div]:from-red-600 [&>div]:to-red-400' : bossPhase === 2 ? '[&>div]:from-orange-500 [&>div]:to-red-500' : '[&>div]:from-lose [&>div]:to-orange-500'}`} />
            </div>
          </div>

          {/* Jackpot Pot strip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-950/30 border border-yellow-500/20 text-[11px]">
            <span>🎰</span>
            <span className="text-yellow-400/70">Jackpot Pot:</span>
            <span className="font-display text-yellow-300">${jackpotPotDisplay.toLocaleString()}</span>
            <span className="text-yellow-500/50 ml-auto">Roll MEGA JACKPOT to claim!</span>
          </div>

          {/* Equip buff hint */}
          {((equipBuffs.bossDamageBonus ?? 0) > 0 || (equipBuffs.bossDamageReduction ?? 0) > 0) && (
            <div className="flex gap-2 text-[10px] text-purple-300/80">
              {(equipBuffs.bossDamageBonus ?? 0) > 0 && <span>⚔️ +{equipBuffs.bossDamageBonus}% dmg</span>}
              {(equipBuffs.bossDamageReduction ?? 0) > 0 && <span>🛡️ -{equipBuffs.bossDamageReduction}% taken</span>}
              {(equipBuffs.healBonus ?? 0) > 0 && <span>💚 +{equipBuffs.healBonus}% heal</span>}
            </div>
          )}

          {/* Boss Dialogue */}
          {showDialogue && (
            <div className={`relative p-3 rounded-lg border transition-all duration-300 ${bossPhase === 3 ? 'bg-red-950/40 border-red-500/40' : 'bg-black/50 border-white/10'}`}>
              <div className="absolute -top-2 left-4 text-[10px] text-muted-foreground bg-card px-1">{selectedBoss.name}</div>
              <p className="text-sm text-white font-mono">❝ {dialogueLine} ❞</p>
            </div>
          )}

          {/* Arena + Actions */}
          {!battleEnded && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="relative">
                {burst?.kind === 'boss' && <GameBurst id="slots" show key={`b-${burst.nonce}`} xPct={50} yPct={35} />}
                {burst?.kind === 'player' && <GameBurst id="roulette" show key={`p-${burst.nonce}`} xPct={50} yPct={55} />}
                <UndertaleArena
                  disabled={battleEnded} attackEnabled={phase === 'dodge'} pattern={attackPattern}
                  signature={bossSignature} difficulty={bossDifficulty} durationMs={arenaDurationMs}
                  timeScale={timeScale} enraged={bossPhase === 3} jackpotFlash={jackpotFlash}
                  onHit={() => onArenaHit()} onDone={onDodgeDone}
                />
              </div>
              <div className="space-y-3">
                <div className="bg-black/30 rounded-lg p-3 border border-gold/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-display tracking-wider text-gold/90">SLOT ROLL</div>
                    <div className="text-[10px] text-muted-foreground">{phase === 'dodge' ? 'Dodge!' : 'Choose action'}</div>
                  </div>
                  {slotUI ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{slotUI.for === 'toBoss' ? '→ Boss' : '→ You'} · Base {slotUI.base}</span>
                        <span className={`font-display font-black text-sm ${tierColor(slotUI.outcome.tier)}`}>
                          {slotUI.outcome.symbol} {slotUI.outcome.tier === 'megaJackpot' ? '🎰 MEGA!' : slotUI.outcome.tier.toUpperCase()} · {slotUI.damage} dmg
                        </span>
                      </div>
                      {slotUI.outcome.effect && <p className="text-[10px] text-gold/70">Effect: {slotUI.outcome.effect}</p>}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Hit or get hit to roll.</p>}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ACTIONS.map((a) => {
                    const Icon = a.icon;
                    const cd = cooldowns[a.id] ?? 0;
                    const disabled = phase !== 'playerTurn' || cd > 0;
                    const isActive = (a.id === 'counter' && counterActive) || (a.id === 'focus' && focusActive);
                    return (
                      <Button key={a.id} onClick={() => onPlayerAction(a.id)} disabled={disabled}
                        className={`${a.color} flex items-center gap-1.5 h-auto py-1.5 px-2.5 relative text-left justify-start ${disabled ? 'opacity-60' : ''} ${isActive ? 'ring-2 ring-white/50' : ''}`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold leading-tight">{a.name}</div>
                          <div className="text-[8px] opacity-70 leading-tight truncate">{a.desc}</div>
                        </div>
                        {cd > 0 && <span className="text-[10px] bg-black/60 px-1 rounded font-mono shrink-0">{cd}</span>}
                        {isActive && cd === 0 && <span className="text-[9px] bg-white/20 px-1 rounded shrink-0">●</span>}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Date.now() < bossVulnerableUntil && <div className="text-[10px] text-gold/90 bg-gold/10 border border-gold/20 rounded px-2 py-1">⚡ Vulnerable ×1.6</div>}
                  {timeScale < 1 && <div className="text-[10px] text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 rounded px-2 py-1">⏳ Slow-mo</div>}
                  {focusActive && <div className="text-[10px] text-amber-400 bg-amber-950/30 border border-amber-500/20 rounded px-2 py-1">🎯 Focus ready</div>}
                  {counterActive && <div className="text-[10px] text-sky-400 bg-sky-950/30 border border-sky-500/20 rounded px-2 py-1">🛡️ Counter active</div>}
                </div>
              </div>
            </div>
          )}

          {/* Battle Log */}
          <div className="bg-black/30 rounded-lg p-3 h-28 overflow-y-auto">
            {battleLog.map((log, i) => (
              <p key={i} className={`text-xs animate-slide-up ${log.includes('MEGA JACKPOT') ? 'text-yellow-300 font-bold' : log.includes('JACKPOT') ? 'text-gold' : log.includes('XP') ? 'text-purple-300' : log.includes('ITEM DROP') ? 'text-cyan-300 font-semibold' : 'text-muted-foreground'}`}>{log}</p>
            ))}
          </div>

          {/* Item Drop Display */}
          {droppedItem && battleEnded && (
            <div className={`p-3 rounded-xl border ${RARITY_META[droppedItem.rarity].bg} ${RARITY_META[droppedItem.rarity].border}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{SLOT_META[droppedItem.slot].icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${RARITY_META[droppedItem.rarity].color}`}>{droppedItem.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${RARITY_META[droppedItem.rarity].bg} ${RARITY_META[droppedItem.rarity].color} border ${RARITY_META[droppedItem.rarity].border}`}>
                      {RARITY_META[droppedItem.rarity].label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">{droppedItem.lore.slice(0, 70)}…</p>
                  <p className="text-[10px] text-win mt-0.5">Saved to Inventory · Sell value: ${droppedItem.sellValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Victory: FIGHT or MERCY */}
          {battleEnded && playerWon && !victoryChoice && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="font-display text-lg text-win">🏆 VICTORY!</p>
                <p className="text-sm text-muted-foreground">Reward: <span className="text-gold font-bold">${pendingReward.toLocaleString()}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={confirmFight} className="relative p-4 rounded-xl bg-gradient-to-br from-orange-900/60 to-red-900/40 border border-orange-500/40 hover:border-orange-400/70 hover:scale-105 transition-all duration-200">
                  <div className="text-center space-y-1">
                    <div className="text-2xl">⚔️</div>
                    <div className="font-display text-orange-300">FIGHT</div>
                    <div className="text-xs text-orange-400/70">Take ${pendingReward.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">Full reward</div>
                  </div>
                </button>
                <button onClick={confirmMercy} className="relative p-4 rounded-xl bg-gradient-to-br from-yellow-900/60 to-amber-900/40 border border-yellow-500/40 hover:border-yellow-400/70 hover:scale-105 transition-all duration-200">
                  <div className="text-center space-y-1">
                    <div className="text-2xl">🕊️</div>
                    <div className="font-display text-yellow-300">MERCY</div>
                    <div className="text-xs text-yellow-400/70">Take ${Math.round(pendingReward * 0.5).toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">+10% dmg vs this boss forever</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {battleEnded && (playerWon ? !!victoryChoice : true) && (
            <Button onClick={() => setSelectedBoss(null)} className="w-full bg-gradient-to-r from-neon-blue to-neon-purple">Continue</Button>
          )}

          {!battleEnded && (
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-gold"><Trophy className="w-4 h-4" /><span>${selectedBoss.reward.toLocaleString()}</span></div>
              <div className="flex items-center gap-1 text-purple-400"><Star className="w-4 h-4" /><span>{selectedBoss.xpReward.toLocaleString()} XP</span></div>
              <div className="flex items-center gap-1 text-purple-300"><Gift className="w-4 h-4" /><span>{(selectedBoss.dropChance * 100).toFixed(0)}% item drop</span></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
