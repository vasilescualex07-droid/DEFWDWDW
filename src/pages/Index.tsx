import { useCallback, useRef, useState, useEffect } from 'react';
import { Dices, Rocket, Trophy, Zap, Gem, Spade, Crown, Cherry, Circle, Triangle, Grid3X3, Target, RotateCw, ArrowUp, Bird, Building2, ChevronDown, ChevronUp, Skull, Award, Flame, Sparkles, Package } from 'lucide-react';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { WatchAdButton } from '@/components/WatchAdButton';
import { WinCelebration } from '@/components/WinCelebration';
import { PlayerStats } from '@/components/PlayerStats';
import { VIPRoom } from '@/components/VIPRoom';
import { BossBattle } from '@/components/BossBattle';
import { Inventory } from '@/components/Inventory';
import { Tournament } from '@/components/Tournament';
import { Achievements } from '@/components/Achievements';
import DailyChallenges from '@/components/DailyChallenges';
import PrestigeSystem from '@/components/PrestigeSystem';
import { SoundToggle } from '@/components/SoundToggle';
import { DiceGame } from '@/components/games/DiceGame';
import { CrashGame } from '@/components/games/CrashGame';
import { MinesGame } from '@/components/games/MinesGame';
import { BlackjackGame } from '@/components/games/BlackjackGame';
import { ThreeCardPokerGame } from '@/components/games/ThreeCardPokerGame';
import { SlotsGame } from '@/components/games/SlotsGame';
import { RouletteGame } from '@/components/games/RouletteGame';
import { PlinkoGame } from '@/components/games/PlinkoGame';
import { KenoGame } from '@/components/games/KenoGame';
import { LimboGame } from '@/components/games/LimboGame';
import { WheelGame } from '@/components/games/WheelGame';
import { HiLoGame } from '@/components/games/HiLoGame';
import { ChickenGame } from '@/components/games/ChickenGame';
import { TowerGame } from '@/components/games/TowerGame';
import { StackRaidGame } from '@/components/games/StackRaidGame';
import { RelicDrawGame } from '@/components/games/RelicDrawGame';
import { usePlayers } from '@/hooks/usePlayers';
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer';
import { playSound } from '@/hooks/useSounds';
import { formatNumber } from '@/lib/utils';
import { getPrestigeBonuses } from '@/lib/prestige';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GameBurst, type GameBurstId } from '@/components/GameBurst';
import { WinExplosionCanvas, type WinExplosionHandle } from '@/components/WinExplosionCanvas';
import { GameEnhancements } from '@/components/GameEnhancements';
import { AchievementPopup } from '@/components/AchievementPopup';
import { SoundManager } from '@/components/SoundManager';
import { LevelUpAnimation } from '@/components/LevelUpAnimation';
import { DailyRewards } from '@/components/DailyRewards';
import { NameEntry } from '@/components/NameEntry';
import { Leaderboard } from '@/components/Leaderboard';
import { HouseVault } from '@/components/HouseVault';
import { GameEnding } from '@/components/GameEnding';

const games = [
  { id: 'dice', name: 'Dice', icon: Dices, color: 'text-neon-blue' },
  { id: 'crash', name: 'Crash', icon: Rocket, color: 'text-neon-purple' },
  { id: 'mines', name: 'Mines', icon: Gem, color: 'text-neon-cyan' },
  { id: 'tower', name: 'Tower', icon: Building2, color: 'text-neon-blue' },
  { id: 'stack', name: 'Citadel', icon: Building2, color: 'text-neon-cyan' },
  { id: 'chicken', name: 'Chicken', icon: Bird, color: 'text-gold' },
  { id: 'plinko', name: 'Plinko', icon: Triangle, color: 'text-neon-pink' },
  { id: 'limbo', name: 'Limbo', icon: Target, color: 'text-orange-400' },
  { id: 'hilo', name: 'Hi-Lo', icon: ArrowUp, color: 'text-neon-cyan' },
  { id: 'wheel', name: 'Wheel', icon: RotateCw, color: 'text-neon-purple' },
  { id: 'keno', name: 'Keno', icon: Grid3X3, color: 'text-gold' },
  { id: 'blackjack', name: 'Blackjack', icon: Spade, color: 'text-foreground' },
  { id: 'poker', name: 'Poker', icon: Crown, color: 'text-gold' },
  { id: 'slots', name: 'Slots', icon: Cherry, color: 'text-neon-pink' },
  { id: 'roulette', name: 'Roulette', icon: Circle, color: 'text-lose' },
  { id: 'relic', name: 'Relic', icon: Sparkles, color: 'text-neon-purple' },
];

type SpecialMode = 'vip' | 'boss' | 'tournament' | 'achievements' | 'challenges' | 'prestige' | 'leaderboard' | 'inventory' | null;

const Index = () => {
  const { 
    currentPlayer,
    login,
    players,
    updateBalance, 
    recordGameResult,
    correctLossToWin,
    getCurrentPlayerData,
    getWinRate,
    getXpProgress,
    updateLevel,
    updateXp,
  } = usePlayers();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playWinAnimation = () => {};
  const resetAnimation = () => {};
  const isAnimating = () => false;
  
  const { getCurrentFPS, isLowPerformanceMode } = usePerformanceOptimizer();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [balance, setBalance] = useState(100);
  const [activeGame, setActiveGame] = useState('dice');
  const [showStats, setShowStats] = useState(true);
  const [specialMode, setSpecialMode] = useState<SpecialMode>(null);
  const [pendingBet, setPendingBet] = useState<{ amount: number; game: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [flashScreen, setFlashScreen] = useState<'win' | 'lose' | null>(null);
  const [lastBigWinProfit, setLastBigWinProfit] = useState(0);
  const [burst, setBurst] = useState<{ id: GameBurstId; nonce: number } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showEnding, setShowEnding] = useState(false);

  const BASE_VAULT = 5000;
  const vaultKey  = currentPlayer ? `stakelite_vault_${currentPlayer}`  : null;
  const runKey    = currentPlayer ? `stakelite_run_${currentPlayer}`    : null;

  const [ngRun, setNgRunRaw] = useState<number>(0);
  const [houseVault, setHouseVaultRaw] = useState<number>(BASE_VAULT);

  // Derived: vault cap for the current run
  const vaultMax = BASE_VAULT * Math.pow(4, ngRun);

  // Re-load vault + run count from localStorage when player changes
  useEffect(() => {
    if (!vaultKey || !runKey) return;
    try {
      const run = parseInt(localStorage.getItem(runKey) ?? '0', 10);
      const safeRun = isNaN(run) || run < 0 ? 0 : run;
      const cap = BASE_VAULT * Math.pow(4, safeRun);
      const v = localStorage.getItem(vaultKey);
      const n = v ? parseFloat(v) : cap;
      setNgRunRaw(safeRun);
      setHouseVaultRaw(isNaN(n) ? cap : Math.max(0, n));
    } catch {
      setNgRunRaw(0);
      setHouseVaultRaw(BASE_VAULT);
    }
  }, [vaultKey, runKey]);

  const setHouseVault = (v: number) => {
    const clamped = Math.max(0, Math.round(v * 100) / 100);
    setHouseVaultRaw(clamped);
    try { if (vaultKey) localStorage.setItem(vaultKey, String(clamped)); } catch {}
  };
  const [burstLose, setBurstLose] = useState<{ id: GameBurstId; nonce: number } | null>(null);
  const winExplosionRef = useRef<WinExplosionHandle>(null);

  const playerData = getCurrentPlayerData();

  // Default FX level if user hasn't set one (high = best graphics)
  useEffect(() => {
    if (!document.body.dataset.fx) document.body.dataset.fx = 'high';
  }, []);

  const onTabChange = useCallback((v: string) => setActiveGame(v), []);
  const onTabClickSound = useCallback(() => playSound('click'), []);

  // Sync balance with player data
  useEffect(() => {
    if (playerData) {
      setBalance(playerData.balance);
    }
  }, [playerData?.balance]);

  // Show name entry if no player logged in
  if (!currentPlayer || !playerData) {
    return <NameEntry onConfirm={(name) => login(name)} />;
  }

  const winRate = getWinRate(playerData);
  const xpProgress = getXpProgress(playerData);

  const activeBurstId = (specialMode ? (specialMode as GameBurstId) : (activeGame as GameBurstId)) as GameBurstId;

  const handleNewGamePlus = () => {
    const nextRun = ngRun + 1;
    const nextCap = BASE_VAULT * Math.pow(4, nextRun);
    setNgRunRaw(nextRun);
    try { if (runKey) localStorage.setItem(runKey, String(nextRun)); } catch {}
    setHouseVault(nextCap);
    setShowEnding(false);
    const newBal = 1000;
    setBalance(newBal);
    updateBalance(currentPlayer, newBal);
    toast.success(`Run ${nextRun + 1} started — vault is now $${nextCap.toLocaleString()}. Bleed it dry.`);
  };

  const handleKeepPlaying = () => {
    const nextRun = ngRun + 1;
    const nextCap = BASE_VAULT * Math.pow(4, nextRun);
    setNgRunRaw(nextRun);
    try { if (runKey) localStorage.setItem(runKey, String(nextRun)); } catch {}
    setHouseVault(nextCap);
    setShowEnding(false);
    toast(`Run ${nextRun + 1} — new vault: $${nextCap.toLocaleString()}. Keep going.`);
  };

  const handleWin = (amount: number, betAmount?: number, multiplier?: number) => {
    const actualBet = betAmount || pendingBet?.amount || amount;
    const actualMultiplier = multiplier || (actualBet > 0 ? amount / actualBet : 1);
    const gameName = specialMode ? specialMode.toUpperCase() : (games.find(g => g.id === activeGame)?.name || activeGame);

    const knownBet = betAmount ?? pendingBet?.amount;
    const profitForPrestige =
      knownBet != null && knownBet > 0 ? amount - knownBet : amount;
    const prestige = getPrestigeBonuses();
    const prestigeWinBonus =
      prestige.multiplier > 0 && profitForPrestige > 0
        ? Math.round(profitForPrestige * (prestige.multiplier / 100) * 100) / 100
        : 0;
    const totalCredit = Math.round((amount + prestigeWinBonus) * 100) / 100;
    const newBalance = Math.round((balance + totalCredit) * 100) / 100;

    setBalance(newBalance);
    updateBalance(currentPlayer, newBalance);

    const profit = amount - actualBet + prestigeWinBonus;
    const celebrationProfit = Math.max(0, profitForPrestige) + prestigeWinBonus;

    if (pendingBet) {
      correctLossToWin(currentPlayer, actualBet, amount + prestigeWinBonus, actualMultiplier);
    } else {
      recordGameResult(currentPlayer, true, actualBet, actualBet + amount, actualMultiplier, gameName);
    }

    if (prestigeWinBonus >= 1) {
      toast.success(`Prestige: +$${formatNumber(prestigeWinBonus)} win bonus (+${prestige.multiplier}% on profit)`);
    }

    setPendingBet(null);
    if (celebrationProfit > 0) {
      setBurst({ id: activeBurstId, nonce: Date.now() });
      const intensity = Math.max(0.6, Math.min(6, celebrationProfit / 18));
      const winTier = celebrationProfit >= 120 ? 'jackpot' : celebrationProfit >= 35 ? 'big' : 'small';
      winExplosionRef.current?.triggerWinExplosion({
        intensity,
        winTier,
        x: window.innerWidth * (0.46 + Math.random() * 0.08),
        y: window.innerHeight * (0.36 + Math.random() * 0.12),
        randomOrigins: false,
      });
      setFlashScreen('win');
      setTimeout(() => setFlashScreen(null), 650);
      playSound('win');
      
      if (celebrationProfit >= 10) {
        setLastBigWinProfit(celebrationProfit);
        setShowCelebration(true);
      }

      // Drain the house vault by the net profit
      const drain = Math.max(0, profitForPrestige + prestigeWinBonus);
      if (drain > 0) {
        setHouseVaultRaw(prev => {
          const next = Math.max(0, Math.round((prev - drain) * 100) / 100);
          try { if (vaultKey) localStorage.setItem(vaultKey, String(next)); } catch {}
          if (next <= 0 && prev > 0) {
            setTimeout(() => setShowEnding(true), 800);
          }
          return next;
        });
      }
    } else {
      playSound('click');
    }
  };

  /** Only deducts balance and sets/accumulates pending bet – no lose VFX, no stats. Use when placing a bet that will resolve later (Plinko, Crash, Mines, Slots, etc.). Same game placing again (e.g. play bet) accumulates the amount. */
  const handleBetPlaced = (amount: number) => {
    const newBalance = Math.max(0, Math.round((balance - amount) * 100) / 100);
    setBalance(newBalance);
    updateBalance(currentPlayer, newBalance);
    const gameName = specialMode ? specialMode.toUpperCase() : (games.find(g => g.id === activeGame)?.name || activeGame);
    setPendingBet((prev) =>
      prev && prev.game === gameName
        ? { amount: prev.amount + amount, game: gameName }
        : { amount, game: gameName }
    );
  };

  /** Called when a round actually loses. If there was a pending bet (active bet), only records stats + VFX; else deducts balance and records (e.g. Dice). */
  const handleLose = (amount: number) => {
    const gameName = specialMode ? specialMode.toUpperCase() : (games.find(g => g.id === activeGame)?.name || activeGame);
    const isResolvedPendingBet = pendingBet != null && pendingBet.amount === amount;

    if (isResolvedPendingBet) {
      setPendingBet(null);
      recordGameResult(currentPlayer, false, amount, 0, 0, gameName);
      const prestige = getPrestigeBonuses();
      const cashback =
        prestige.cashback > 0
          ? Math.round(amount * (prestige.cashback / 100) * 100) / 100
          : 0;
      if (cashback > 0) {
        const cbBal = Math.round((balance + cashback) * 100) / 100;
        setBalance(cbBal);
        updateBalance(currentPlayer, cbBal);
        toast.message(`Prestige cashback: +$${formatNumber(cashback)}`);
      }
      setFlashScreen('lose');
      setTimeout(() => setFlashScreen(null), 650);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 720);
      setBurstLose({ id: activeBurstId, nonce: Date.now() });
    } else {
      setFlashScreen('lose');
      setTimeout(() => setFlashScreen(null), 650);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 720);
      const prestige = getPrestigeBonuses();
      const cashback =
        prestige.cashback > 0
          ? Math.round(amount * (prestige.cashback / 100) * 100) / 100
          : 0;
      const newBalance = Math.max(
        0,
        Math.round((balance - amount + cashback) * 100) / 100
      );
      setBalance(newBalance);
      updateBalance(currentPlayer, newBalance);
      setPendingBet(null);
      recordGameResult(currentPlayer, false, amount, 0, 0, gameName);
      if (cashback > 0) {
        toast.message(`Prestige cashback: +$${formatNumber(cashback)}`);
      }
      setBurstLose({ id: activeBurstId, nonce: Date.now() });
    }
  };

  const handleAdReward = (amount: number) => {
    const newBalance = Math.round((balance + amount) * 100) / 100;
    setBalance(newBalance);
    updateBalance(currentPlayer, newBalance);
    toast.success(`🎬 Ad complete! +$${formatNumber(amount)} added`);
    playSound('cashout');
  };

  const handleResetBalance = () => {
    setBalance(1000);
    updateBalance(currentPlayer, 1000);
  };

  const handleXpGain = (xpAmount: number) => {
    if (!currentPlayer || !playerData) return;
    const currentXp = playerData.xp || 0;
    const newXp = currentXp + Math.max(0, Math.round(xpAmount));
    updateXp(currentPlayer, newXp);
    // Calculate new level from accumulated XP (same formula as usePlayers)
    let calcLevel = 1;
    let xpNeeded = 0;
    while (true) {
      xpNeeded += Math.floor(100 * Math.pow(1.15, calcLevel - 1));
      if (newXp < xpNeeded) break;
      calcLevel++;
    }
    const newLevel = Math.max(playerData.level, calcLevel);
    if (newLevel > playerData.level) {
      updateLevel(currentPlayer, newLevel);
      setCurrentLevel(newLevel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  };

  return (
    <div className={`min-h-screen bg-background ${screenShake ? 'animate-screen-shake' : ''}`}>
      <WinExplosionCanvas ref={winExplosionRef} />
      {flashScreen && (
        <div className={`flash-screen ${flashScreen}`} key={flashScreen} aria-hidden />
      )}
      <WinCelebration
        show={showCelebration}
        profit={lastBigWinProfit}
        onComplete={() => setShowCelebration(false)}
      />
      <GameEnding
        show={showEnding}
        totalProfit={playerData.stats.totalProfit}
        playerName={currentPlayer}
        playerLevel={playerData.level}
        run={ngRun + 1}
        nextVaultMax={BASE_VAULT * Math.pow(4, ngRun + 1)}
        onNewGamePlus={handleNewGamePlus}
        onKeepPlaying={handleKeepPlaying}
      />
      <GameEnhancements />
      <AchievementPopup />
      <SoundManager />
      <LevelUpAnimation
        show={showLevelUp}
        level={currentLevel}
        rewards={{ coins: 100, xp: 500 }}
        onComplete={() => setShowLevelUp(false)}
      />
      
      {/* Enhanced ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 animate-pulse" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
      </div>
      
      {/* Roguelike vignette + ambient overlay */}
      <div className="vignette" aria-hidden />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/4 via-transparent to-neon-purple/6" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] animate-float-rogue" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neon-purple/8 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
      </div>
      
      {/* Header */}
      <header className="border-b border-gold/25 bg-card/95 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,215,0,0.06)]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setSpecialMode(null)}>
            <div className="p-2.5 bg-gradient-to-br from-gold/30 to-gold/10 rounded-xl glow-gold transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_hsl(45_100%_50%/0.4)]">
              <Zap className="w-5 h-5 text-gold animate-pulse" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-black tracking-[0.25em] drop-shadow-[0_0_20px_hsl(45_100%_50%/0.3)]">
              STAKE<span className="text-gradient-gold">LITE</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {playerData.stats.currentStreak >= 2 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-win/20 rounded-lg border-2 border-win/50 animate-text-glow-pulse">
                <span className="font-display font-black text-win text-sm">{playerData.stats.currentStreak} WINS</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-neon-blue/25 to-neon-purple/25 rounded-lg border-2 border-neon-blue/40">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center text-sm font-display font-black shadow-[0_0_15px_hsl(217_91%_60%/0.5)]">
                {playerData.level}
              </div>
              <span className="text-sm font-bold">Lv.{playerData.level}</span>
            </div>
            <div className="hidden md:block">
              <HouseVault vault={houseVault} maxVault={vaultMax} run={ngRun + 1} />
            </div>
            <WatchAdButton onReward={handleAdReward} />
            <BalanceDisplay balance={balance} onReset={handleResetBalance} />
            <SoundToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 relative">
        {/* Special Mode Buttons */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
          <Button
            onClick={() => setSpecialMode(specialMode === 'vip' ? null : 'vip')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'vip' ? 'bg-gold text-black scale-105' : 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 hover:scale-105'}`}
          >
            <Crown className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">VIP</span>
          </Button>
          <Button
            onClick={() => setSpecialMode(specialMode === 'boss' ? null : 'boss')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'boss' ? 'bg-lose text-white scale-105' : 'bg-lose/20 text-lose border border-lose/30 hover:bg-lose/30 hover:scale-105'}`}
          >
            <Skull className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">BOSS</span>
          </Button>
          <Button
            onClick={() => setSpecialMode(specialMode === 'tournament' ? null : 'tournament')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'tournament' ? 'bg-neon-cyan text-black scale-105' : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 hover:scale-105'}`}
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">TOURNEY</span>
          </Button>
          <Button
            onClick={() => setSpecialMode(specialMode === 'achievements' ? null : 'achievements')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'achievements' ? 'bg-neon-purple text-white scale-105' : 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30 hover:scale-105'}`}
          >
            <Award className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">BADGES</span>
          </Button>
          <Button
            onClick={() => setSpecialMode(specialMode === 'challenges' ? null : 'challenges')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'challenges' ? 'bg-orange-500 text-white scale-105' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 hover:scale-105'}`}
          >
            <Flame className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">DAILY</span>
          </Button>
          <Button
            onClick={() => setSpecialMode(specialMode === 'prestige' ? null : 'prestige')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'prestige' ? 'bg-pink-500 text-white scale-105' : 'bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/30 hover:scale-105'}`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">PRESTIGE</span>
          </Button>
          <Button
            onClick={() => setSpecialMode(specialMode === 'leaderboard' ? null : 'leaderboard')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'leaderboard' ? 'bg-gold text-black scale-105 shadow-[0_0_25px_rgba(255,215,0,0.5)]' : 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 hover:scale-105'}`}
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">RANKS</span>
          </Button>
          <Button
            onClick={() => setSpecialMode(specialMode === 'inventory' ? null : 'inventory')}
            className={`flex flex-col h-auto py-3 transition-all duration-200 ${specialMode === 'inventory' ? 'bg-purple-500 text-white scale-105' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 hover:scale-105'}`}
          >
            <Package className="w-5 h-5 mb-1" />
            <span className="text-xs font-display">BAG</span>
          </Button>
        </div>

        {/* Toggle Stats Button (Mobile) */}
        {!specialMode && (
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden w-full mb-3 text-muted-foreground"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide' : 'Show'} Stats
            {showStats ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
        )}

        {/* Special Modes */}
        {specialMode === 'vip' && (
          <div className="max-w-2xl mx-auto">
            <VIPRoom
              balance={balance}
              playerLevel={playerData.level}
              onWin={handleWin}
              onLose={handleLose}
              onClose={() => setSpecialMode(null)}
            />
          </div>
        )}

        {specialMode === 'boss' && (
          <div className="max-w-2xl mx-auto">
            <BossBattle
              balance={balance}
              playerLevel={playerData.level}
              playerName={currentPlayer}
              onWin={handleWin}
              onLose={handleLose}
              onBetPlaced={handleBetPlaced}
              onXpGain={handleXpGain}
              onClose={() => setSpecialMode(null)}
            />
          </div>
        )}

        {specialMode === 'tournament' && (
          <div className="max-w-2xl mx-auto">
            <Tournament
              currentPlayer={currentPlayer}
              balance={balance}
              playerLevel={playerData.level}
              allPlayers={players}
              onWin={handleWin}
              onClose={() => setSpecialMode(null)}
            />
          </div>
        )}

        {specialMode === 'achievements' && (
          <div className="max-w-2xl mx-auto">
            <Achievements
              player={playerData}
              onClose={() => setSpecialMode(null)}
              onClaimReward={(amount) => {
                const newBalance = balance + amount;
                setBalance(newBalance);
                updateBalance(currentPlayer, newBalance);
              }}
            />
          </div>
        )}

        {specialMode === 'challenges' && (
          <div className="max-w-2xl mx-auto">
            <DailyChallenges
              balance={balance}
              setBalance={(newBalance) => {
                setBalance(newBalance);
                updateBalance(currentPlayer, newBalance);
              }}
              stats={{
                totalWins: playerData.stats.wins,
                totalBets: playerData.stats.gamesPlayed,
                totalProfit: playerData.stats.totalProfit,
                currentStreak: playerData.stats.currentStreak,
                gamesPlayed: playerData.stats.gamesPlayed,
                biggestWin: playerData.stats.biggestWin,
              }}
              onClose={() => setSpecialMode(null)}
            />
          </div>
        )}

        {specialMode === 'prestige' && (
          <div className="max-w-2xl mx-auto">
            <PrestigeSystem
              level={playerData.level}
              balance={balance}
              setBalance={(newBalance) => {
                setBalance(newBalance);
                updateBalance(currentPlayer, newBalance);
              }}
              setLevel={(newLevel) => updateLevel(currentPlayer, newLevel)}
              setXp={(newXp) => updateXp(currentPlayer, newXp)}
              onPrestige={() => toast.success('🌟 Prestige successful! Enjoy your permanent bonuses!')}
              onClose={() => setSpecialMode(null)}
            />
          </div>
        )}

        {specialMode === 'leaderboard' && (
          <div className="max-w-2xl mx-auto game-card casino-card-glow p-6">
            <Leaderboard
              playerData={playerData}
              currentPlayer={currentPlayer}
              onClose={() => setSpecialMode(null)}
            />
          </div>
        )}

        {specialMode === 'inventory' && (
          <div className="max-w-2xl mx-auto">
            <Inventory
              playerName={currentPlayer}
              balance={balance}
              onBalanceChange={(delta) => {
                const newBal = Math.round((balance + delta) * 100) / 100;
                setBalance(newBal);
                updateBalance(currentPlayer, newBal);
              }}
              onClose={() => setSpecialMode(null)}
            />
          </div>
        )}

        {/* Regular Game Content */}
        {!specialMode && (
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-4">
            {/* Left Sidebar - Stats */}
            <div className={`lg:col-span-3 space-y-4 ${showStats ? 'block' : 'hidden lg:block'}`}>
              <PlayerStats player={playerData} winRate={winRate} xpProgress={xpProgress} />
            </div>

            {/* Center - Game Area */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 rounded-2xl scanlines pointer-events-none" aria-hidden />
              <Tabs value={activeGame} onValueChange={onTabChange} className="space-y-4 relative">
                <TabsList className="w-full h-auto bg-card/80 backdrop-blur-md border-2 border-gold/20 rounded-2xl p-2 grid grid-cols-8 gap-1.5 shadow-[inset_0_1px_0_rgba(255,215,0,0.12),0_4px_24px_rgba(0,0,0,0.4)]">
                  {games.map((game) => {
                    const Icon = game.icon;
                    return (
                      <TabsTrigger
                        key={game.id}
                        value={game.id}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl font-display text-[9px] transition-all duration-300 hover:bg-gold/15 hover:scale-105 active:scale-95 data-[state=active]:scale-105 data-[state=active]:bg-gradient-to-b data-[state=active]:from-gold/30 data-[state=active]:to-gold/10 data-[state=active]:text-gold data-[state=active]:shadow-[0_0_28px_hsl(var(--gold)/0.4)] data-[state=active]:border-2 data-[state=active]:border-gold/50"
                        onClick={onTabClickSound}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${game.color} transition-transform duration-200`} />
                        <span className="truncate w-full text-center hidden sm:block">{game.name}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                <div className="game-card casino-card-glow">
                  {burst && (
                    <GameBurst
                      id={burst.id}
                      show
                      key={`w-${burst.id}-${burst.nonce}`}
                      xPct={50}
                      yPct={40}
                    />
                  )}
                  {burstLose && (
                    <GameBurst
                      id="lose"
                      show
                      key={`l-${burstLose.id}-${burstLose.nonce}`}
                      xPct={50}
                      yPct={45}
                    />
                  )}
                  <TabsContent value="dice" className="animate-fade-in mt-0">
                    <DiceGame balance={balance} onWin={handleWin} onLose={handleLose} />
                  </TabsContent>
                  <TabsContent value="crash" className="animate-fade-in mt-0">
                    <CrashGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="mines" className="animate-fade-in mt-0">
                    <MinesGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="tower" className="animate-fade-in mt-0">
                    <TowerGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="stack" className="animate-fade-in mt-0">
                    <StackRaidGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="chicken" className="animate-fade-in mt-0">
                    <ChickenGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="plinko" className="animate-fade-in mt-0">
                    <PlinkoGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="limbo" className="animate-fade-in mt-0">
                    <LimboGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="hilo" className="animate-fade-in mt-0">
                    <HiLoGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="wheel" className="animate-fade-in mt-0">
                    <WheelGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="keno" className="animate-fade-in mt-0">
                    <KenoGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="blackjack" className="animate-fade-in mt-0">
                    <BlackjackGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="poker" className="animate-fade-in mt-0">
                    <ThreeCardPokerGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="slots" className="animate-fade-in mt-0">
                    <SlotsGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="roulette" className="animate-fade-in mt-0">
                    <RouletteGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                  <TabsContent value="relic" className="animate-fade-in mt-0">
                    <RelicDrawGame balance={balance} onWin={handleWin} onLose={handleLose} onBetPlaced={handleBetPlaced} />
                  </TabsContent>
                </div>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground/70 text-xs font-display font-bold tracking-[0.3em] border border-gold/10 rounded-lg py-2 px-4 inline-block bg-black/20">♠ ♥ PROVABLY FAIR • NO REAL MONEY ♦ ♣</p>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default Index;
