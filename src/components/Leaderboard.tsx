import { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Gamepad2, X, Upload, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import type { Player } from '@/hooks/usePlayers';

const API = '/api';

interface LeaderboardEntry {
  name: string;
  balance: number;
  biggest_win: number;
  games_played: number;
  wins: number;
  losses: number;
  level: number;
}

interface Props {
  playerData: Player;
  currentPlayer: string;
  onClose: () => void;
}

const RANK_STYLES = [
  { bg: 'bg-gold/20', border: 'border-gold/60', text: 'text-gold', icon: <Crown className="w-4 h-4 text-gold" /> },
  { bg: 'bg-white/10', border: 'border-white/30', text: 'text-white', icon: <Medal className="w-4 h-4 text-white/60" /> },
  { bg: 'bg-amber-800/20', border: 'border-amber-700/40', text: 'text-amber-500', icon: <Medal className="w-4 h-4 text-amber-600" /> },
];

type Tab = 'balance' | 'wins' | 'active';

export function Leaderboard({ playerData, currentPlayer, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('balance');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/leaderboard`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEntries(data);
    } catch {
      setError('Could not load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  if (!playerData) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/leaderboard/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentPlayer,
          balance: playerData.balance,
          biggest_win: playerData.stats.biggestWin,
          games_played: playerData.stats.gamesPlayed,
          wins: playerData.stats.wins,
          losses: playerData.stats.losses,
          level: playerData.level,
        }),
      });
      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
      await fetchLeaderboard();
    } catch {
      setError('Could not submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...entries].sort((a, b) => {
    if (tab === 'balance') return b.balance - a.balance;
    if (tab === 'wins') return b.biggest_win - a.biggest_win;
    return b.games_played - a.games_played;
  });

  const tabBtn = (id: Tab, label: string, icon: React.ReactNode) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-xs tracking-wider transition-all
        ${tab === id
          ? 'bg-gold/20 border border-gold/50 text-gold shadow-[0_0_12px_hsl(45_100%_50%/0.2)]'
          : 'text-muted-foreground hover:text-white hover:bg-white/5'
        }`}
    >
      {icon}<span className="ml-1">{label}</span>
    </button>
  );

  const isOnBoard = entries.some(e => e.name.toLowerCase() === currentPlayer.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          <h2 className="font-display font-black text-xl tracking-widest text-gold">LEADERBOARD</h2>
          <span className="text-xs text-muted-foreground font-display">(global)</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLeaderboard} className="text-muted-foreground hover:text-white transition-colors p-1" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Submit your score */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all
        ${isOnBoard || submitted
          ? 'border-win/40 bg-win/10'
          : 'border-neon-blue/40 bg-neon-blue/10'
        }`}>
        <div className="flex-1 min-w-0">
          {isOnBoard || submitted ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-win flex-shrink-0" />
              <p className="font-display text-sm text-win font-bold">You're on the board as <span className="text-white">{currentPlayer}</span></p>
            </div>
          ) : (
            <div>
              <p className="font-display text-sm text-white font-bold">Submit your score as <span className="text-neon-blue">{currentPlayer}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">Balance: ${formatNumber(playerData.balance)} · Lv.{playerData.level}</p>
            </div>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className={`flex items-center gap-1.5 font-display text-xs tracking-wider px-4 py-2 rounded-lg transition-all active:scale-95
            ${isOnBoard || submitted
              ? 'bg-win/20 text-win border border-win/30 hover:bg-win/30'
              : 'bg-neon-blue/80 hover:bg-neon-blue text-white shadow-[0_0_16px_hsl(217_91%_60%/0.3)]'
            }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {submitting ? 'POSTING...' : isOnBoard || submitted ? 'UPDATE' : 'POST SCORE'}
        </Button>
      </div>

      {error && <p className="text-lose text-xs font-display text-center">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabBtn('balance', 'RICHEST', <Trophy className="w-3.5 h-3.5" />)}
        {tabBtn('wins', 'BIGGEST WIN', <TrendingUp className="w-3.5 h-3.5" />)}
        {tabBtn('active', 'MOST ACTIVE', <Gamepad2 className="w-3.5 h-3.5" />)}
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gold mx-auto mb-2" />
            <p className="text-muted-foreground font-display text-sm">Loading...</p>
          </div>
        )}
        {!loading && sorted.length === 0 && (
          <p className="text-center text-muted-foreground font-display py-8">No players yet — be the first!</p>
        )}
        {!loading && sorted.map((entry, i) => {
          const rank = i + 1;
          const style = RANK_STYLES[i] || {
            bg: 'bg-white/5',
            border: 'border-white/10',
            text: 'text-muted-foreground',
            icon: <span className="text-xs text-muted-foreground font-display w-4 text-center">#{rank}</span>,
          };
          const isMe = entry.name.toLowerCase() === currentPlayer.toLowerCase();

          let value = '';
          if (tab === 'balance') value = `$${formatNumber(entry.balance)}`;
          else if (tab === 'wins') value = `$${formatNumber(entry.biggest_win)}`;
          else value = `${entry.games_played} games`;

          return (
            <div
              key={entry.name}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${style.bg} ${style.border} transition-all
                ${isMe ? 'ring-2 ring-neon-blue/50 shadow-[0_0_16px_hsl(217_91%_60%/0.2)]' : ''}
              `}
            >
              <div className="w-6 flex items-center justify-center flex-shrink-0">{style.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-display font-black tracking-wider truncate ${isMe ? 'text-neon-blue' : style.text}`}>
                  {entry.name} {isMe && <span className="text-xs text-neon-blue/70">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">Lv.{entry.level} · {entry.wins}W / {entry.losses}L</p>
              </div>
              <div className={`font-display font-black text-sm flex-shrink-0 ${style.text}`}>{value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
