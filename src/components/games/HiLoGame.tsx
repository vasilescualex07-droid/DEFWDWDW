import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';
import { BetChips } from '@/components/BetChips';

interface HiLoGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const CARDS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

const getCardValue = (card: string): number => {
  if (card === 'A') return 1;
  if (card === 'J') return 11;
  if (card === 'Q') return 12;
  if (card === 'K') return 13;
  return parseInt(card);
};

const getRandomCard = () => {
  const card = CARDS[Math.floor(Math.random() * CARDS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { card, suit };
};

export const HiLoGame = ({ balance, onWin, onLose, onBetPlaced }: HiLoGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [currentCard, setCurrentCard] = useState(getRandomCard);
  const [nextCard, setNextCard] = useState<{ card: string; suit: string } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [lastGuess, setLastGuess] = useState<'higher' | 'lower' | null>(null);
  const [streak, setStreak] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);

  const currentValue = getCardValue(currentCard.card);
  
  // Calculate fair odds
  const higherCards = CARDS.filter(c => getCardValue(c) > currentValue).length;
  const lowerCards = CARDS.filter(c => getCardValue(c) < currentValue).length;
  const higherOdds = higherCards > 0 ? (13 / higherCards).toFixed(2) : '0.00';
  const lowerOdds = lowerCards > 0 ? (13 / lowerCards).toFixed(2) : '0.00';

  const guess = (direction: 'higher' | 'lower') => {
    if (betAmount > balance && streak === 0) {
      toast.error('Insufficient balance!');
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    if (streak === 0) {
      (onBetPlaced ?? onLose)(betAmount);
    }

    setIsRevealing(true);
    setLastGuess(direction);
    playSound('deal');

    const next = getRandomCard();
    
    setTimeout(() => {
      setNextCard(next);
      playSound('reveal');
      
      setTimeout(() => {
        const nextValue = getCardValue(next.card);
        const won = direction === 'higher' 
          ? nextValue > currentValue 
          : nextValue < currentValue;
        const tie = nextValue === currentValue;

        if (tie) {
          // Push - continue with same bet
          toast.info('Tie! Card pushed.');
          setCurrentCard(next);
          setNextCard(null);
          setIsRevealing(false);
        } else if (won) {
          const odds = direction === 'higher' ? parseFloat(higherOdds) : parseFloat(lowerOdds);
          const newMultiplier = currentMultiplier * odds;
          setCurrentMultiplier(newMultiplier);
          setStreak(prev => prev + 1);
          setCurrentCard(next);
          setNextCard(null);
          setIsRevealing(false);
          playSound('cashout');
          toast.success(`Correct! Streak: ${streak + 1}`);
        } else {
          onLose(betAmount);
          toast.error('Wrong! Streak ended.');
          playSound('lose');
          setStreak(0);
          setCurrentMultiplier(1);
          setCurrentCard(getRandomCard());
          setNextCard(null);
          setIsRevealing(false);
        }
      }, 800);
    }, 600);
  };

  const cashOut = () => {
    if (streak === 0) return;
    
    const winnings = betAmount * currentMultiplier;
    onWin(winnings);
    toast.success(`💰 Cashed out ${currentMultiplier.toFixed(2)}x! Won $${(winnings - betAmount).toFixed(2)}!`);
    setStreak(0);
    setCurrentMultiplier(1);
    setCurrentCard(getRandomCard());
  };

  const isRed = currentCard.suit === '♥' || currentCard.suit === '♦';
  const nextIsRed = nextCard && (nextCard.suit === '♥' || nextCard.suit === '♦');

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-500/20 rounded-lg" style={{ boxShadow: '0 0 20px hsl(210 100% 50% / 0.3)' }}>
          <ArrowUp className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Hi-Lo</h2>
          <p className="text-muted-foreground text-sm">Guess if next card is higher or lower</p>
        </div>
      </div>

      {/* Cards Display — main action: mystery shuffle + reveal */}
      <div className="flex items-center justify-center gap-4 py-4">
        {/* Current Card */}
        <div className={`w-24 h-36 rounded-xl flex flex-col items-center justify-center text-3xl font-bold transition-all duration-300 ${
          isRed ? 'text-red-500' : 'text-foreground'
        } bg-gradient-to-br from-white to-gray-100 border-2 border-border shadow-xl`}>
          <span className="text-lg">{currentCard.suit}</span>
          <span>{currentCard.card}</span>
        </div>

        {/* Arrow */}
        <div className="text-2xl text-muted-foreground">→</div>

        {/* Next Card (or placeholder) */}
        {nextCard ? (
          <div
            className={`animate-bj-deal-in w-24 h-36 rounded-xl flex flex-col items-center justify-center text-3xl font-bold ${
              nextIsRed ? 'text-red-500' : 'text-foreground'
            } bg-gradient-to-br from-white to-gray-100 border-2 border-border shadow-xl`}
          >
            <span className="text-lg">{nextCard.suit}</span>
            <span>{nextCard.card}</span>
          </div>
        ) : (
          <div
            className={`flex h-36 w-24 items-center justify-center rounded-xl border-2 border-border bg-gradient-to-br from-primary/80 to-primary shadow-xl [perspective:800px] ${
              isRevealing ? 'animate-hilo-mystery-shuffle' : ''
            }`}
          >
            <span className="text-4xl text-white/90">?</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {streak > 0 && (
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <div className="bg-secondary rounded-lg p-3 text-center game-tile">
            <div className="text-xs text-muted-foreground">Streak</div>
            <div className="font-display text-xl font-bold text-win">{streak}</div>
          </div>
          <div className="bg-secondary rounded-lg p-3 text-center game-tile">
            <div className="text-xs text-muted-foreground">Multiplier</div>
            <div className="font-display text-xl font-bold text-gold">{currentMultiplier.toFixed(2)}x</div>
          </div>
        </div>
      )}

      {/* Guess Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-16 font-display text-lg bg-win hover:bg-win/80 glow-green transition-all duration-300 hover:scale-[1.02]"
          disabled={isRevealing || (balance === 0 && streak === 0)}
          onClick={() => guess('higher')}
        >
          <ArrowUp className="w-5 h-5 mr-2" />
          Higher ({higherOdds}x)
        </Button>
        <Button
          className="h-16 font-display text-lg bg-lose hover:bg-lose/80 glow-red transition-all duration-300 hover:scale-[1.02]"
          disabled={isRevealing || (balance === 0 && streak === 0)}
          onClick={() => guess('lower')}
        >
          <ArrowDown className="w-5 h-5 mr-2" />
          Lower ({lowerOdds}x)
        </Button>
      </div>

      {/* Cash Out */}
      {streak > 0 && (
        <Button
          className="w-full h-12 font-display text-lg bg-gold hover:bg-gold/80 text-accent-foreground glow-gold animate-pulse-glow"
          onClick={cashOut}
          disabled={isRevealing}
        >
          Cash Out ${(betAmount * currentMultiplier).toFixed(2)}
        </Button>
      )}

      {/* Bet Controls */}
      {streak === 0 && (
        <div className="space-y-2">
          <BetChips value={betAmount} onChange={setBetAmount} balance={balance} disabled={isRevealing} />
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="font-display bg-secondary border-border"
            disabled={isRevealing}
          />
        </div>
      )}
    </div>
  );
};
