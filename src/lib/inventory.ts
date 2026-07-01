export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'cosmic' | 'transcendent';
export type ItemSlot = 'weapon' | 'helmet' | 'chest' | 'legs' | 'boots' | 'deck';

export interface ItemBuffs {
  bossDamageBonus?: number;      // % bonus to attack damage in boss fights
  bossMaxHpBonus?: number;       // flat bonus to player max HP
  bossDamageReduction?: number;  // % damage reduction from boss hits
  dodgeSpeedBonus?: number;      // % bonus movement speed in arena
  healBonus?: number;            // % bonus to heal action
  jackpotBias?: number;          // bonus weight added to jackpot slot rolls
  xpMultiplier?: number;         // % bonus XP gained
  winRateBonus?: number;         // % bonus to displayed win rate / prestige multiplier
  cashbackBonus?: number;        // % cashback on losses
  betProfitBonus?: number;       // % bonus on win profit
}

export interface ItemTemplate {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  buffs: ItemBuffs;
  lore: string;
  sellValue: number;
}

export interface InventoryItem extends ItemTemplate {
  uid: string;
  acquiredAt: number;
}

export interface Equipment {
  weapon?: InventoryItem;
  helmet?: InventoryItem;
  chest?: InventoryItem;
  legs?: InventoryItem;
  boots?: InventoryItem;
  deck?: InventoryItem;
}

export const RARITY_META: Record<Rarity, { label: string; color: string; bg: string; border: string; order: number; sellBase: number }> = {
  common:       { label: 'Common',       color: 'text-gray-300',    bg: 'bg-gray-500/20',     border: 'border-gray-500/40',   order: 0, sellBase: 25 },
  uncommon:     { label: 'Uncommon',     color: 'text-green-400',   bg: 'bg-green-500/20',    border: 'border-green-500/40',  order: 1, sellBase: 100 },
  rare:         { label: 'Rare',         color: 'text-blue-400',    bg: 'bg-blue-500/20',     border: 'border-blue-500/40',   order: 2, sellBase: 400 },
  epic:         { label: 'Epic',         color: 'text-purple-400',  bg: 'bg-purple-500/20',   border: 'border-purple-500/40', order: 3, sellBase: 1500 },
  legendary:    { label: 'Legendary',    color: 'text-orange-400',  bg: 'bg-orange-500/20',   border: 'border-orange-400/40', order: 4, sellBase: 6000 },
  mythic:       { label: 'Mythic',       color: 'text-pink-400',    bg: 'bg-pink-500/20',     border: 'border-pink-400/40',   order: 5, sellBase: 20000 },
  cosmic:       { label: 'Cosmic',       color: 'text-cyan-300',    bg: 'bg-cyan-500/20',     border: 'border-cyan-400/40',   order: 6, sellBase: 75000 },
  transcendent: { label: 'Transcendent', color: 'text-yellow-300',  bg: 'bg-yellow-400/15',   border: 'border-yellow-400/50', order: 7, sellBase: 300000 },
};

export const SLOT_META: Record<ItemSlot, { label: string; icon: string }> = {
  weapon:  { label: 'Weapon',    icon: '⚔️' },
  helmet:  { label: 'Helmet',    icon: '🪖' },
  chest:   { label: 'Chest',     icon: '🛡️' },
  legs:    { label: 'Legs',      icon: '👖' },
  boots:   { label: 'Boots',     icon: '👢' },
  deck:    { label: 'Card Deck', icon: '🃏' },
};

export const ITEM_DATABASE: ItemTemplate[] = [
  // ─── WEAPONS ───────────────────────────────────────────────────────
  { id: 'w_rusty_opener', name: 'Rusty Letter Opener', slot: 'weapon', rarity: 'common', buffs: { bossDamageBonus: 5 }, lore: 'Stolen off a dealer\'s desk. It cuts paperwork and enemies equally poorly.', sellValue: 20 },
  { id: 'w_bent_fork', name: 'Bent Spork of Ruin', slot: 'weapon', rarity: 'common', buffs: { bossDamageBonus: 4 }, lore: 'Half spoon, half fork, entirely terrifying to behold.', sellValue: 18 },
  { id: 'w_dealers_shiv', name: "Dealer's Shiv", slot: 'weapon', rarity: 'uncommon', buffs: { bossDamageBonus: 12 }, lore: 'The dealer didn\'t need it anymore. You do.', sellValue: 80 },
  { id: 'w_chip_bludgeon', name: 'Chip Stack Bludgeon', slot: 'weapon', rarity: 'uncommon', buffs: { bossDamageBonus: 14, bossMaxHpBonus: 10 }, lore: '$500 worth of chips compressed into a makeshift weapon. Worth more as a club.', sellValue: 95 },
  { id: 'w_jackpot_javelin', name: 'Jackpot Javelin', slot: 'weapon', rarity: 'rare', buffs: { bossDamageBonus: 22, jackpotBias: 0.3 }, lore: 'Forged from a broken slot machine lever. It hums with residual luck.', sellValue: 380 },
  { id: 'w_royal_flush_blade', name: 'Royal Flush Blade', slot: 'weapon', rarity: 'rare', buffs: { bossDamageBonus: 20, winRateBonus: 1 }, lore: 'Five cards, fused at high temperature, sharpened into something spectacular.', sellValue: 350 },
  { id: 'w_fates_edge', name: "Fate's Edge", slot: 'weapon', rarity: 'epic', buffs: { bossDamageBonus: 38, jackpotBias: 0.6, bossMaxHpBonus: 20 }, lore: 'The blade doesn\'t just cut flesh — it cuts probability itself.', sellValue: 1400 },
  { id: 'w_doom_dice_cleaver', name: 'Doom Dice Cleaver', slot: 'weapon', rarity: 'epic', buffs: { bossDamageBonus: 35, bossDamageReduction: 5 }, lore: 'Six faces. Each one says you win. That\'s not how dice work, but here we are.', sellValue: 1300 },
  { id: 'w_unbeatable_hand', name: 'The Unbeatable Hand', slot: 'weapon', rarity: 'legendary', buffs: { bossDamageBonus: 58, jackpotBias: 1.0, winRateBonus: 3 }, lore: 'Legend says it has never missed. Legend is correct.', sellValue: 5500 },
  { id: 'w_fortunes_fang', name: "Fortune's Last Fang", slot: 'weapon', rarity: 'legendary', buffs: { bossDamageBonus: 62, healBonus: 15, bossMaxHpBonus: 30 }, lore: 'The last tooth of the goddess of luck, still warm.', sellValue: 6000 },
  { id: 'w_worldender_wager', name: "World-Ender's Wager", slot: 'weapon', rarity: 'mythic', buffs: { bossDamageBonus: 85, jackpotBias: 1.8, winRateBonus: 5, bossDamageReduction: 8 }, lore: 'A blade that represents a bet so catastrophic it reshaped reality.', sellValue: 19000 },
  { id: 'w_nebula_cut', name: "Nebula's Final Cut", slot: 'weapon', rarity: 'cosmic', buffs: { bossDamageBonus: 115, jackpotBias: 3.0, winRateBonus: 8, bossMaxHpBonus: 50 }, lore: 'Forged in the death throes of a probability star. The odds are inside it.', sellValue: 72000 },
  { id: 'w_entropy_blade', name: "Entropy's Absolute Blade", slot: 'weapon', rarity: 'transcendent', buffs: { bossDamageBonus: 175, jackpotBias: 5.0, winRateBonus: 12, healBonus: 40, bossDamageReduction: 15 }, lore: 'The final weapon. It does not cut — it makes the universe decide.', sellValue: 290000 },

  // ─── HELMETS ───────────────────────────────────────────────────────
  { id: 'h_dealers_visor', name: "Dealer's Green Visor", slot: 'helmet', rarity: 'common', buffs: { bossMaxHpBonus: 15 }, lore: 'It smells like cigarette smoke and broken dreams. +15 HP though.', sellValue: 22 },
  { id: 'h_lucky_fedora', name: 'Lucky Fedora of Dubious Luck', slot: 'helmet', rarity: 'common', buffs: { bossMaxHpBonus: 12, dodgeSpeedBonus: 3 }, lore: 'It has never actually brought anyone luck. But it looks great.', sellValue: 20 },
  { id: 'h_pitboss_cap', name: 'Pit Boss Command Cap', slot: 'helmet', rarity: 'uncommon', buffs: { bossMaxHpBonus: 35, dodgeSpeedBonus: 6 }, lore: 'Grants the wearer an air of authority and a slight headache.', sellValue: 90 },
  { id: 'h_security_helmet', name: 'Security Grade Helmet', slot: 'helmet', rarity: 'uncommon', buffs: { bossMaxHpBonus: 40, bossDamageReduction: 5 }, lore: 'Built for people who get hit repeatedly. Perfect for you.', sellValue: 105 },
  { id: 'h_probability_crown', name: 'Crown of Probability', slot: 'helmet', rarity: 'rare', buffs: { bossMaxHpBonus: 60, dodgeSpeedBonus: 12, jackpotBias: 0.2 }, lore: 'Wearing it makes you slightly more likely to be somewhere else when danger arrives.', sellValue: 370 },
  { id: 'h_fortunes_helm', name: "Fortune's Helm", slot: 'helmet', rarity: 'rare', buffs: { bossMaxHpBonus: 55, winRateBonus: 2 }, lore: 'Each gem is a frozen moment of good luck.', sellValue: 340 },
  { id: 'h_oracles_circlet', name: "The Oracle's Third-Eye Circlet", slot: 'helmet', rarity: 'epic', buffs: { bossMaxHpBonus: 105, dodgeSpeedBonus: 18, jackpotBias: 0.5 }, lore: 'It shows you where the bullets are going. Half a second in advance.', sellValue: 1450 },
  { id: 'h_envys_crown', name: "Envy's Burning Crown", slot: 'helmet', rarity: 'epic', buffs: { bossMaxHpBonus: 115, bossDamageBonus: 10 }, lore: 'Everyone who sees it envies you. Including the bosses you\'re fighting.', sellValue: 1550 },
  { id: 'h_celestial_helm', name: 'Celestial Gambler\'s Helm', slot: 'helmet', rarity: 'legendary', buffs: { bossMaxHpBonus: 165, dodgeSpeedBonus: 22, bossDamageReduction: 10 }, lore: 'Worn by the first gambler who ever bet against the cosmos. They won.', sellValue: 5800 },
  { id: 'h_infinite_ante', name: 'Crown of Infinite Ante', slot: 'helmet', rarity: 'mythic', buffs: { bossMaxHpBonus: 240, dodgeSpeedBonus: 30, jackpotBias: 1.5, winRateBonus: 4 }, lore: 'The ante is always going up. This crown was forged at the table where it never stops.', sellValue: 20000 },
  { id: 'h_stellar_crown', name: 'Stellar Crown of the Abyss', slot: 'helmet', rarity: 'cosmic', buffs: { bossMaxHpBonus: 320, dodgeSpeedBonus: 38, jackpotBias: 2.5, winRateBonus: 7 }, lore: 'The void looks at you through it. You look back.', sellValue: 74000 },
  { id: 'h_skull_probability', name: 'The Skull of Probability', slot: 'helmet', rarity: 'transcendent', buffs: { bossMaxHpBonus: 450, dodgeSpeedBonus: 55, jackpotBias: 4.0, winRateBonus: 10, bossDamageReduction: 20 }, lore: 'It belonged to the god of chance. They don\'t need it anymore.', sellValue: 295000 },

  // ─── CHESTS ────────────────────────────────────────────────────────
  { id: 'c_casino_vest', name: 'Casino Staff Vest', slot: 'chest', rarity: 'common', buffs: { bossMaxHpBonus: 20, bossDamageReduction: 4 }, lore: '"STAFF" is printed on the back. This gives bosses pause.', sellValue: 24 },
  { id: 'c_security_jacket', name: 'Security Windbreaker', slot: 'chest', rarity: 'common', buffs: { bossMaxHpBonus: 25 }, lore: 'Slightly padded. Slightly better than nothing.', sellValue: 22 },
  { id: 'c_gamblers_coat', name: "Gambler's Lucky Coat", slot: 'chest', rarity: 'uncommon', buffs: { bossMaxHpBonus: 45, bossDamageReduction: 8, cashbackBonus: 1 }, lore: 'The inner pockets are empty. The luck is in the lining.', sellValue: 98 },
  { id: 'c_high_roller_suit', name: 'High Roller Power Suit', slot: 'chest', rarity: 'uncommon', buffs: { bossMaxHpBonus: 52, bossDamageBonus: 5 }, lore: 'Tailored for someone who matters. Now that\'s you.', sellValue: 110 },
  { id: 'c_jackpot_breastplate', name: 'Jackpot Breastplate', slot: 'chest', rarity: 'rare', buffs: { bossMaxHpBonus: 82, bossDamageReduction: 15, jackpotBias: 0.2 }, lore: 'Engraved with winning combinations. At least three of them are accurate.', sellValue: 375 },
  { id: 'c_fortune_armor', name: "Fortune's Chestguard", slot: 'chest', rarity: 'rare', buffs: { bossMaxHpBonus: 78, bossDamageReduction: 14, winRateBonus: 1 }, lore: 'Crafted from the losers\' tokens of a legendary run.', sellValue: 360 },
  { id: 'c_iron_house', name: 'Iron House Platemail', slot: 'chest', rarity: 'epic', buffs: { bossMaxHpBonus: 135, bossDamageReduction: 22, healBonus: 10 }, lore: 'The house edge forged into steel. Now it protects you instead of them.', sellValue: 1500 },
  { id: 'c_void_gambeson', name: 'Void-Threaded Gambeson', slot: 'chest', rarity: 'epic', buffs: { bossMaxHpBonus: 142, bossDamageReduction: 20, dodgeSpeedBonus: 8 }, lore: 'Threaded with strands of pure nothing. Bullets think twice.', sellValue: 1600 },
  { id: 'c_celestial_regalia', name: 'Celestial Regalia', slot: 'chest', rarity: 'legendary', buffs: { bossMaxHpBonus: 205, bossDamageReduction: 30, bossDamageBonus: 12, winRateBonus: 2 }, lore: 'Worn by the winners of the oldest game ever played.', sellValue: 6200 },
  { id: 'c_doomsday_plate', name: 'Doomsday Platemail', slot: 'chest', rarity: 'mythic', buffs: { bossMaxHpBonus: 285, bossDamageReduction: 40, bossDamageBonus: 18, jackpotBias: 1.2 }, lore: 'Crafted at the end of the last run, when everything was on the line.', sellValue: 21000 },
  { id: 'c_star_carapace', name: 'Star-Forged Carapace', slot: 'chest', rarity: 'cosmic', buffs: { bossMaxHpBonus: 370, bossDamageReduction: 47, bossDamageBonus: 28, winRateBonus: 6, jackpotBias: 2.2 }, lore: 'Cooled from the heart of a dying star. Warm to the touch.', sellValue: 76000 },
  { id: 'c_absolute_aegis', name: 'Absolute Aegis', slot: 'chest', rarity: 'transcendent', buffs: { bossMaxHpBonus: 550, bossDamageReduction: 57, bossDamageBonus: 45, winRateBonus: 10, jackpotBias: 4.0, cashbackBonus: 4 }, lore: 'The concept of protection, made manifest. Nothing can fully penetrate this.', sellValue: 310000 },

  // ─── LEGS ──────────────────────────────────────────────────────────
  { id: 'l_dealers_trousers', name: "Dealer's Pressed Slacks", slot: 'legs', rarity: 'common', buffs: { dodgeSpeedBonus: 7 }, lore: 'Starched so hard they crinkle. But they move surprisingly fast.', sellValue: 21 },
  { id: 'l_casino_slacks', name: 'Casino Floor Slacks', slot: 'legs', rarity: 'common', buffs: { dodgeSpeedBonus: 6, bossMaxHpBonus: 8 }, lore: 'Worn to blend in. Worn out.', sellValue: 20 },
  { id: 'l_speed_jeans', name: "Speed Runner's Lucky Jeans", slot: 'legs', rarity: 'uncommon', buffs: { dodgeSpeedBonus: 16, bossMaxHpBonus: 22 }, lore: 'Distressed at the knees from running away from bad bets.', sellValue: 92 },
  { id: 'l_hustlers_pants', name: "Hustler's Probability Pants", slot: 'legs', rarity: 'uncommon', buffs: { dodgeSpeedBonus: 18, cashbackBonus: 1 }, lore: 'Each pocket holds a backup plan. Seventeen pockets total.', sellValue: 100 },
  { id: 'l_prob_greaves', name: 'Probability Greaves', slot: 'legs', rarity: 'rare', buffs: { dodgeSpeedBonus: 26, bossMaxHpBonus: 42, bossDamageReduction: 5 }, lore: 'Designed by a mathematician. She won every time she wore them.', sellValue: 365 },
  { id: 'l_fortune_leggings', name: "Fortune's Leggings", slot: 'legs', rarity: 'rare', buffs: { dodgeSpeedBonus: 24, winRateBonus: 1, bossMaxHpBonus: 38 }, lore: 'The left leg has slightly better odds than the right.', sellValue: 345 },
  { id: 'l_void_legwear', name: 'Void-Threaded Legwear', slot: 'legs', rarity: 'epic', buffs: { dodgeSpeedBonus: 36, bossMaxHpBonus: 62, bossDamageBonus: 6 }, lore: 'The threads are made of dark probability. They make you harder to predict.', sellValue: 1420 },
  { id: 'l_phase_pants', name: 'Phase-Shift Pants', slot: 'legs', rarity: 'epic', buffs: { dodgeSpeedBonus: 40, bossMaxHpBonus: 58 }, lore: 'They exist in two places simultaneously. Perfect for dodging.', sellValue: 1480 },
  { id: 'l_celestial_strides', name: 'Celestial Strides', slot: 'legs', rarity: 'legendary', buffs: { dodgeSpeedBonus: 52, bossMaxHpBonus: 85, bossDamageReduction: 8, winRateBonus: 2 }, lore: 'The first gambler to ascend wore these. They kept them on.', sellValue: 5900 },
  { id: 'l_quantum_greaves', name: 'Quantum Dodge Greaves', slot: 'legs', rarity: 'mythic', buffs: { dodgeSpeedBonus: 68, bossMaxHpBonus: 105, bossDamageReduction: 14, jackpotBias: 1.0 }, lore: 'Observe them and they move. Don\'t observe them and they move faster.', sellValue: 20500 },
  { id: 'l_voidwalker_greaves', name: "Void-Walker's Greaves", slot: 'legs', rarity: 'cosmic', buffs: { dodgeSpeedBonus: 83, bossMaxHpBonus: 125, bossDamageReduction: 20, winRateBonus: 5 }, lore: 'They don\'t touch the floor. They never have.', sellValue: 73000 },
  { id: 'l_concept_motion', name: 'The Concept of Motion', slot: 'legs', rarity: 'transcendent', buffs: { dodgeSpeedBonus: 105, bossMaxHpBonus: 155, bossDamageReduction: 28, winRateBonus: 8, jackpotBias: 2.5 }, lore: 'You are not wearing these. You are motion itself.', sellValue: 295000 },

  // ─── BOOTS ─────────────────────────────────────────────────────────
  { id: 'b_casino_loafers', name: 'Casino Floor Loafers', slot: 'boots', rarity: 'common', buffs: { dodgeSpeedBonus: 6 }, lore: 'Slip-resistant. Suitable for casino floors and combat arenas.', sellValue: 20 },
  { id: 'b_lucky_sneakers', name: 'Lucky Sneakers (Unlucky Color)', slot: 'boots', rarity: 'common', buffs: { dodgeSpeedBonus: 8, bossMaxHpBonus: 5 }, lore: 'The color is described as "unfortunate chartreuse." The stats are real though.', sellValue: 22 },
  { id: 'b_speed_dealer_boots', name: "Speed Dealer's Boots", slot: 'boots', rarity: 'uncommon', buffs: { dodgeSpeedBonus: 15, bossMaxHpBonus: 12 }, lore: 'He dealt fast. You move faster.', sellValue: 88 },
  { id: 'b_running_man_kicks', name: "Running Man's Signature Kicks", slot: 'boots', rarity: 'uncommon', buffs: { dodgeSpeedBonus: 17, cashbackBonus: 1 }, lore: 'He ran from every bad bet. Wisdom, encoded in footwear.', sellValue: 96 },
  { id: 'b_lightning_treads', name: 'Lightning Treads', slot: 'boots', rarity: 'rare', buffs: { dodgeSpeedBonus: 25, bossMaxHpBonus: 28, bossDamageBonus: 3 }, lore: 'Static charge builds with every step. You\'re basically a walking taser.', sellValue: 360 },
  { id: 'b_fortune_steps', name: "Fortune's Steps", slot: 'boots', rarity: 'rare', buffs: { dodgeSpeedBonus: 22, winRateBonus: 1, bossMaxHpBonus: 25 }, lore: 'Every step lands on the right tile. Always.', sellValue: 340 },
  { id: 'b_phase_boots', name: 'Phase-Shift Boots', slot: 'boots', rarity: 'epic', buffs: { dodgeSpeedBonus: 35, bossMaxHpBonus: 42, bossDamageReduction: 6 }, lore: 'Between steps, you briefly don\'t exist. Bullets can\'t hit what isn\'t there.', sellValue: 1380 },
  { id: 'b_void_step', name: 'Void-Step Kicks', slot: 'boots', rarity: 'epic', buffs: { dodgeSpeedBonus: 38, bossMaxHpBonus: 38 }, lore: 'The void follows where you walk. Enemies find the floor slightly less solid.', sellValue: 1450 },
  { id: 'b_infinite_hustle', name: 'Infinite Hustle Boots', slot: 'boots', rarity: 'legendary', buffs: { dodgeSpeedBonus: 50, bossMaxHpBonus: 62, bossDamageReduction: 7, winRateBonus: 2 }, lore: 'The hustle never stops. Neither do you.', sellValue: 5700 },
  { id: 'b_reality_treads', name: 'Reality-Bending Treads', slot: 'boots', rarity: 'mythic', buffs: { dodgeSpeedBonus: 65, bossMaxHpBonus: 82, bossDamageReduction: 12, jackpotBias: 0.8 }, lore: 'The floor bends around your steps. Physics files a complaint.', sellValue: 20200 },
  { id: 'b_nebula_drift', name: 'Nebula-Drift Boots', slot: 'boots', rarity: 'cosmic', buffs: { dodgeSpeedBonus: 80, bossMaxHpBonus: 105, bossDamageReduction: 18, winRateBonus: 5 }, lore: 'Drifting on cosmic winds. You are barely touching the earth.', sellValue: 72000 },
  { id: 'b_absolute_sprint', name: 'Absolute Sprint Boots', slot: 'boots', rarity: 'transcendent', buffs: { dodgeSpeedBonus: 100, bossMaxHpBonus: 130, bossDamageReduction: 25, winRateBonus: 8, jackpotBias: 2.0, betProfitBonus: 3 }, lore: 'You don\'t move with these. You arrive before you left.', sellValue: 285000 },

  // ─── DECKS ─────────────────────────────────────────────────────────
  { id: 'd_tourist_deck', name: "Tourist's Casino Souvenir Deck", slot: 'deck', rarity: 'common', buffs: { jackpotBias: 0.2, xpMultiplier: 5 }, lore: 'Bought at the gift shop. Still counts as a weapon of mass fortune.', sellValue: 25 },
  { id: 'd_gift_shop_deck', name: 'Gift Shop Commemorative Deck', slot: 'deck', rarity: 'common', buffs: { jackpotBias: 0.15, xpMultiplier: 5, cashbackBonus: 0.5 }, lore: 'Commemorates nothing in particular. Mildly lucky.', sellValue: 22 },
  { id: 'd_marked_cards', name: 'Suspiciously Marked Cards', slot: 'deck', rarity: 'uncommon', buffs: { jackpotBias: 0.6, xpMultiplier: 10, winRateBonus: 1 }, lore: 'The marks are visible to you. The marks are only visible to you.', sellValue: 95 },
  { id: 'd_cold_deck', name: 'The Cold Deck', slot: 'deck', rarity: 'uncommon', buffs: { jackpotBias: 0.5, xpMultiplier: 12, cashbackBonus: 2 }, lore: 'Pre-arranged for victory. It remembers the correct order.', sellValue: 105 },
  { id: 'd_royal_deck', name: 'The Royal Deck', slot: 'deck', rarity: 'rare', buffs: { jackpotBias: 1.0, xpMultiplier: 18, winRateBonus: 3, bossDamageBonus: 5 }, lore: 'Used in the final hand of the casino\'s founding night. Every face card is slightly smug.', sellValue: 380 },
  { id: 'd_prob_engine', name: 'Probability Engine Deck', slot: 'deck', rarity: 'rare', buffs: { jackpotBias: 0.9, xpMultiplier: 15, cashbackBonus: 3 }, lore: 'Each card has been calculated to appear at the optimal moment.', sellValue: 355 },
  { id: 'd_cheaters_bible', name: "The Cheater's Bible, 7th Edition", slot: 'deck', rarity: 'epic', buffs: { jackpotBias: 1.5, xpMultiplier: 28, winRateBonus: 5, cashbackBonus: 4, bossDamageBonus: 8 }, lore: '342 pages of documented techniques. You\'ve read it cover to cover.', sellValue: 1550 },
  { id: 'd_fortune_blueprint', name: "Fortune's Blueprint", slot: 'deck', rarity: 'epic', buffs: { jackpotBias: 1.4, xpMultiplier: 25, cashbackBonus: 6, betProfitBonus: 2 }, lore: 'The architectural plan for a lucky outcome. Reading it changes the odds.', sellValue: 1480 },
  { id: 'd_infinite_draws', name: 'Deck of Infinite Draws', slot: 'deck', rarity: 'legendary', buffs: { jackpotBias: 2.2, xpMultiplier: 45, winRateBonus: 7, cashbackBonus: 6, bossDamageBonus: 12 }, lore: 'No one has ever reached the bottom of this deck. There may not be one.', sellValue: 6100 },
  { id: 'd_paradox_deck', name: 'Paradox Deck', slot: 'deck', rarity: 'mythic', buffs: { jackpotBias: 3.2, xpMultiplier: 68, winRateBonus: 10, cashbackBonus: 8, bossDamageBonus: 20, betProfitBonus: 4 }, lore: 'It contains every possible hand simultaneously, until you look.', sellValue: 21000 },
  { id: 'd_stellar_shuffle', name: 'Stellar Shuffle', slot: 'deck', rarity: 'cosmic', buffs: { jackpotBias: 4.5, xpMultiplier: 92, winRateBonus: 12, cashbackBonus: 10, bossDamageBonus: 30, betProfitBonus: 6 }, lore: 'The cards are stars. The shuffle is the big bang.', sellValue: 76000 },
  { id: 'd_omni_deck', name: 'The Omni-Deck', slot: 'deck', rarity: 'transcendent', buffs: { jackpotBias: 7.0, xpMultiplier: 155, winRateBonus: 15, cashbackBonus: 12, bossDamageBonus: 50, betProfitBonus: 10, healBonus: 30 }, lore: 'The deck contains all decks. Every shuffle is the correct shuffle. This is unfair.', sellValue: 320000 },
];

// ─── Boss Drop Tables ───────────────────────────────────────────────────────

const DROP_TABLES: Record<string, { rarities: Rarity[]; weights: number[] }> = {
  dealer:       { rarities: ['common', 'uncommon'],            weights: [70, 30] },
  'lucky-lou':  { rarities: ['common', 'uncommon', 'rare'],   weights: [45, 40, 15] },
  'pit-boss':   { rarities: ['uncommon', 'rare'],              weights: [60, 40] },
  fortune:      { rarities: ['uncommon', 'rare', 'epic'],      weights: [30, 50, 20] },
  whale:        { rarities: ['rare', 'epic'],                  weights: [65, 35] },
  baron:        { rarities: ['rare', 'epic', 'legendary'],     weights: [35, 45, 20] },
  house:        { rarities: ['epic', 'legendary'],             weights: [65, 35] },
  auditor:      { rarities: ['epic', 'legendary', 'mythic'],   weights: [30, 50, 20] },
  shadow:       { rarities: ['legendary', 'mythic'],           weights: [60, 40] },
  void:         { rarities: ['mythic', 'cosmic'],              weights: [65, 35] },
  king:         { rarities: ['cosmic', 'transcendent'],        weights: [75, 25] },
  architect:    { rarities: ['transcendent'],                  weights: [100] },
};

export function getBossDropInfo(bossId: string): { rarity: Rarity; pct: string }[] {
  const table = DROP_TABLES[bossId] ?? DROP_TABLES['dealer'];
  const total = table.weights.reduce((s, w) => s + w, 0);
  return table.rarities.map((r, i) => ({
    rarity: r,
    pct: Math.round((table.weights[i] / total) * 100) + '%',
  }));
}

function pickRarity(bossId: string): Rarity {
  const table = DROP_TABLES[bossId] ?? DROP_TABLES['dealer'];
  const total = table.weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < table.rarities.length; i++) {
    r -= table.weights[i];
    if (r <= 0) return table.rarities[i];
  }
  return table.rarities[table.rarities.length - 1];
}

// ─── Persistence ────────────────────────────────────────────────────────────

function invKey(playerName: string) { return `stakelite_inventory_${playerName}`; }
function eqKey(playerName: string) { return `stakelite_equipment_${playerName}`; }
export function storyKey(playerName: string) { return `stakelite_story_${playerName}`; }

export function loadInventory(playerName: string): InventoryItem[] {
  try {
    const raw = localStorage.getItem(invKey(playerName));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveInventory(playerName: string, items: InventoryItem[]) {
  try { localStorage.setItem(invKey(playerName), JSON.stringify(items)); } catch {}
}

export function loadEquipment(playerName: string): Equipment {
  try {
    const raw = localStorage.getItem(eqKey(playerName));
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
  } catch { return {}; }
}

export function saveEquipment(playerName: string, equipment: Equipment) {
  try { localStorage.setItem(eqKey(playerName), JSON.stringify(equipment)); } catch {}
}

export function getStoryProgress(playerName: string): number {
  try { return parseInt(localStorage.getItem(storyKey(playerName)) ?? '-1', 10); } catch { return -1; }
}

export function setStoryProgress(playerName: string, bossIndex: number) {
  try { localStorage.setItem(storyKey(playerName), String(bossIndex)); } catch {}
}

// ─── Buff Aggregation ───────────────────────────────────────────────────────

export function aggregateBuffs(equipment: Equipment): ItemBuffs {
  const items = Object.values(equipment).filter(Boolean) as InventoryItem[];
  const result: ItemBuffs = {};
  for (const item of items) {
    for (const [key, val] of Object.entries(item.buffs) as [keyof ItemBuffs, number][]) {
      if (val !== undefined) {
        result[key] = (result[key] ?? 0) + val;
      }
    }
  }
  return result;
}

export function getActiveBuffs(playerName: string): ItemBuffs {
  return aggregateBuffs(loadEquipment(playerName));
}

// ─── Item Drop ──────────────────────────────────────────────────────────────

let _uidCounter = 0;
function generateUid(): string {
  return `item_${Date.now()}_${++_uidCounter}_${Math.floor(Math.random() * 10000)}`;
}

export function rollItemDrop(bossId: string, playerName: string, dropChance: number): InventoryItem | null {
  if (Math.random() > dropChance) return null;
  const rarity = pickRarity(bossId);
  const pool = ITEM_DATABASE.filter(t => t.rarity === rarity);
  if (!pool.length) return null;
  const template = pool[Math.floor(Math.random() * pool.length)];
  const item: InventoryItem = { ...template, uid: generateUid(), acquiredAt: Date.now() };
  const inv = loadInventory(playerName);
  inv.push(item);
  saveInventory(playerName, inv);
  return item;
}

export function sellItem(playerName: string, uid: string): number {
  const inv = loadInventory(playerName);
  const idx = inv.findIndex(i => i.uid === uid);
  if (idx === -1) return 0;
  const item = inv[idx];
  inv.splice(idx, 1);
  saveInventory(playerName, inv);
  // Also unequip if equipped
  const eq = loadEquipment(playerName);
  if (eq[item.slot]?.uid === uid) {
    delete eq[item.slot];
    saveEquipment(playerName, eq);
  }
  return item.sellValue;
}

export function equipItem(playerName: string, uid: string): Equipment {
  const inv = loadInventory(playerName);
  const item = inv.find(i => i.uid === uid);
  if (!item) return loadEquipment(playerName);
  const eq = loadEquipment(playerName);
  eq[item.slot] = item;
  saveEquipment(playerName, eq);
  return eq;
}

export function unequipSlot(playerName: string, slot: ItemSlot): Equipment {
  const eq = loadEquipment(playerName);
  delete eq[slot];
  saveEquipment(playerName, eq);
  return eq;
}
