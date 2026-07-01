import { useState, useEffect } from 'react';
import { getPrestigeBonuses } from '@/lib/prestige';

const PLAYERS_KEY = 'casino_players';
const CURRENT_PLAYER_KEY = 'casino_current_player';
const STARTING_BALANCE = 1000;

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  biggestWin: number;
  biggestMultiplier: number;
  totalWagered: number;
  totalProfit: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedGame: string;
  favoriteGame: string;
  gameCounts: Record<string, number>;
}

export interface Player {
  name: string;
  balance: number;
  stats: PlayerStats;
  level: number;
  xp: number;
  joinedAt: string;
}

const createDefaultStats = (): PlayerStats => ({
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  biggestWin: 0,
  biggestMultiplier: 0,
  totalWagered: 0,
  totalProfit: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedGame: '',
  favoriteGame: '',
  gameCounts: {},
});

// Exponential XP scaling - gets harder as you level up
const getXpRequiredForLevel = (level: number): number => {
  const baseXp = 100;
  const scalingFactor = 1.15; // 15% more XP needed each level
  return Math.floor(baseXp * Math.pow(scalingFactor, level - 1));
};

const calculateLevelFromXp = (totalXp: number): number => {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    xpNeeded += getXpRequiredForLevel(level);
    if (totalXp < xpNeeded) break;
    level++;
  }
  return level;
};

const xpForNextLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXpRequiredForLevel(i);
  }
  return total;
};

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>(() => {
    const stored = localStorage.getItem(PLAYERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const migrated = parsed.map((p: any) => ({
        ...p,
        stats: p.stats || createDefaultStats(),
        level: p.level || 1,
        xp: p.xp || 0,
        joinedAt: p.joinedAt || new Date().toISOString(),
      }));
      // Ensure default player exists
      if (!migrated.find((p: Player) => p.name.toLowerCase() === 'player')) {
        migrated.push({
          name: 'Player',
          balance: STARTING_BALANCE,
          stats: createDefaultStats(),
          level: 1,
          xp: 0,
          joinedAt: new Date().toISOString(),
        });
      }
      return migrated;
    }
    // First time: create default player
    return [{
      name: 'Player',
      balance: STARTING_BALANCE,
      stats: createDefaultStats(),
      level: 1,
      xp: 0,
      joinedAt: new Date().toISOString(),
    }];
  });

  const [currentPlayer, setCurrentPlayer] = useState<string | null>(() => {
    const stored = localStorage.getItem(CURRENT_PLAYER_KEY);
    if (stored) return stored;
    return null;
  });

  useEffect(() => {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    if (currentPlayer) {
      localStorage.setItem(CURRENT_PLAYER_KEY, currentPlayer);
    } else {
      localStorage.removeItem(CURRENT_PLAYER_KEY);
    }
  }, [currentPlayer]);

  const login = (name: string): Player => {
    const trimmedName = name.trim().toLowerCase();
    const existingPlayer = players.find(p => p.name.toLowerCase() === trimmedName);
    
    if (existingPlayer) {
      setCurrentPlayer(existingPlayer.name);
      return existingPlayer;
    } else {
      const newPlayer: Player = { 
        name: name.trim(), 
        balance: STARTING_BALANCE,
        stats: createDefaultStats(),
        level: 1,
        xp: 0,
        joinedAt: new Date().toISOString(),
      };
      setPlayers(prev => [...prev, newPlayer]);
      setCurrentPlayer(newPlayer.name);
      return newPlayer;
    }
  };

  const logout = () => {
    setCurrentPlayer(null);
  };

  const updateBalance = (name: string, newBalance: number) => {
    setPlayers(prev => prev.map(p => 
      p.name.toLowerCase() === name.toLowerCase() 
        ? { ...p, balance: Math.round(newBalance * 100) / 100 }
        : p
    ));
  };

  const updateLevel = (name: string, newLevel: number) => {
    setPlayers(prev => prev.map(p => 
      p.name.toLowerCase() === name.toLowerCase() 
        ? { ...p, level: newLevel }
        : p
    ));
  };

  const updateXp = (name: string, newXp: number) => {
    setPlayers(prev => prev.map(p => 
      p.name.toLowerCase() === name.toLowerCase() 
        ? { ...p, xp: newXp }
        : p
    ));
  };

  const recordGameResult = (
    name: string, 
    won: boolean, 
    betAmount: number, 
    winAmount: number, 
    multiplier: number,
    gameName: string
  ) => {
    setPlayers(prev => prev.map(p => {
      if (p.name.toLowerCase() !== name.toLowerCase()) return p;
      
      // Profit calculation:
      // - On win: player gets back winAmount, but paid betAmount, so net = winAmount - betAmount
      // - On loss: player gets nothing back, paid betAmount, so net = -betAmount
      const profit = won ? (winAmount - betAmount) : -betAmount;
      const xpPct = getPrestigeBonuses().xp;
      const xpMult = 1 + xpPct / 100;
      const baseXpGain = won ? Math.floor(winAmount * 2) : Math.floor(betAmount * 0.5);
      const newXp = p.xp + Math.max(0, Math.floor(baseXpGain * xpMult));
      const newLevel = calculateLevelFromXp(newXp);
      
      const gameCounts = { ...p.stats.gameCounts };
      gameCounts[gameName] = (gameCounts[gameName] || 0) + 1;
      
      // Find favorite game
      const favoriteGame = Object.entries(gameCounts).reduce((a, b) => 
        b[1] > (gameCounts[a] || 0) ? b[0] : a
      , gameName);
      
      const newStreak = won ? p.stats.currentStreak + 1 : 0;
      
      return {
        ...p,
        xp: newXp,
        level: newLevel,
        stats: {
          ...p.stats,
          gamesPlayed: p.stats.gamesPlayed + 1,
          wins: won ? p.stats.wins + 1 : p.stats.wins,
          losses: won ? p.stats.losses : p.stats.losses + 1,
          biggestWin: won && profit > p.stats.biggestWin ? profit : p.stats.biggestWin,
          biggestMultiplier: won && multiplier > p.stats.biggestMultiplier ? multiplier : p.stats.biggestMultiplier,
          totalWagered: p.stats.totalWagered + betAmount,
          totalProfit: Math.round((p.stats.totalProfit + profit) * 100) / 100,
          currentStreak: newStreak,
          bestStreak: Math.max(p.stats.bestStreak, newStreak),
          lastPlayedGame: gameName,
          favoriteGame,
          gameCounts,
        }
      };
    }));
  };

  // Correct a previously recorded loss to a win (for Type 2 games)
  const correctLossToWin = (
    name: string,
    betAmount: number,
    winAmount: number,
    multiplier: number
  ) => {
    setPlayers(prev => prev.map(p => {
      if (p.name.toLowerCase() !== name.toLowerCase()) return p;
      
      const profit = winAmount - betAmount;
      const xpPct = getPrestigeBonuses().xp;
      const xpMult = 1 + xpPct / 100;
      const baseXpGain = Math.floor(winAmount * 2);
      const newXp = p.xp + Math.max(0, Math.floor(baseXpGain * xpMult));
      const newLevel = calculateLevelFromXp(newXp);
      const newStreak = p.stats.currentStreak + 1;
      
      return {
        ...p,
        xp: newXp,
        level: newLevel,
        stats: {
          ...p.stats,
          gamesPlayed: p.stats.gamesPlayed + 1,
          losses: Math.max(0, p.stats.losses - 1),
          wins: p.stats.wins + 1,
          totalWagered: p.stats.totalWagered + betAmount,
          totalProfit: Math.round((p.stats.totalProfit + profit) * 100) / 100,
          biggestWin: profit > p.stats.biggestWin ? profit : p.stats.biggestWin,
          biggestMultiplier: multiplier > p.stats.biggestMultiplier ? multiplier : p.stats.biggestMultiplier,
          currentStreak: newStreak,
          bestStreak: Math.max(p.stats.bestStreak, newStreak),
        }
      };
    }));
  };

  const getLeaderboard = (): Player[] => {
    return [...players].sort((a, b) => b.balance - a.balance).slice(0, 10);
  };

  const getBiggestWinners = (): Player[] => {
    return [...players].sort((a, b) => b.stats.biggestWin - a.stats.biggestWin).slice(0, 10);
  };

  const getMostActive = (): Player[] => {
    return [...players].sort((a, b) => b.stats.gamesPlayed - a.stats.gamesPlayed).slice(0, 10);
  };

  const getCurrentPlayerData = (): Player | null => {
    if (!currentPlayer) return null;
    return players.find(p => p.name.toLowerCase() === currentPlayer.toLowerCase()) || null;
  };

  const getWinRate = (player: Player): number => {
    if (player.stats.gamesPlayed === 0) return 0;
    return Math.round((player.stats.wins / player.stats.gamesPlayed) * 100);
  };

  const getXpProgress = (player: Player): number => {
    const currentLevelXp = xpForNextLevel(player.level - 1);
    const nextLevelXp = xpForNextLevel(player.level);
    const progress = ((player.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return {
    players,
    currentPlayer,
    login,
    logout,
    updateBalance,
    updateLevel,
    updateXp,
    recordGameResult,
    correctLossToWin,
    getLeaderboard,
    getBiggestWinners,
    getMostActive,
    getCurrentPlayerData,
    getWinRate,
    getXpProgress,
  };
};
