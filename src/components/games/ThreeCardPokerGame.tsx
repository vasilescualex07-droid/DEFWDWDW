import { useState } from 'react';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';

interface ThreeCardPokerProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

type Card = { suit: string; value: string; rank: number };
type GameState = 'betting' | 'dealt' | 'showdown';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < VALUES.length; i++) {
      deck.push({ suit, value: VALUES[i], rank: i + 2 });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const evaluateHand = (cards: Card[]): { rank: number; name: string } => {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const isFlush = cards.every(c => c.suit === cards[0].suit);
  const isStraight = (
    sorted[0].rank - sorted[1].rank === 1 && 
    sorted[1].rank - sorted[2].rank === 1
  ) || (sorted[0].rank === 14 && sorted[1].rank === 3 && sorted[2].rank === 2);
  
  const counts: { [key: number]: number } = {};
  cards.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
  const maxCount = Math.max(...Object.values(counts));

  if (isStraight && isFlush) return { rank: 6, name: 'Straight Flush' };
  if (maxCount === 3) return { rank: 5, name: 'Three of a Kind' };
  if (isStraight) return { rank: 4, name: 'Straight' };
  if (isFlush) return { rank: 3, name: 'Flush' };
  if (maxCount === 2) return { rank: 2, name: 'Pair' };
  return { rank: 1, name: `High Card (${VALUES[sorted[0].rank - 2]})` };
};

const getHighCard = (cards: Card[]): number => {
  return Math.max(...cards.map(c => c.rank));
};

const ANTE_BONUS: { [key: number]: number } = {
  6: 5, // Straight Flush
  5: 4, // Three of a Kind
  4: 1, // Straight
};

const CardDisplay = ({ card, hidden = false, index = 0 }: { card: Card; hidden?: boolean; index?: number }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const delay = `${index * 110}ms`;

  if (hidden) {
    return (
      <div className="h-28 w-20 shrink-0" style={{ animationDelay: delay }}>
        <div className="animate-bj-deal-in h-full w-full" style={{ animationDelay: delay }}>
          <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-gold/50 bg-gradient-to-br from-gold/80 to-gold/40 shadow-lg">
            <span className="text-3xl text-gold-foreground">?</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-28 w-20 shrink-0" style={{ animationDelay: delay }}>
      <div
        className={`animate-bj-deal-in flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-border bg-gradient-to-br from-white to-gray-100 shadow-lg transition-all duration-300 hover:scale-105 ${isRed ? 'text-lose' : 'text-background'}`}
        style={{ animationDelay: delay }}
      >
        <span className="font-display text-xl font-bold">{card.value}</span>
        <span className="text-2xl">{card.suit}</span>
      </div>
    </div>
  );
};

export const ThreeCardPokerGame = ({ balance, onWin, onLose, onBetPlaced }: ThreeCardPokerProps) => {
  const [anteAmount, setAnteAmount] = useState(25);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [result, setResult] = useState<string>('');
  const [isWin, setIsWin] = useState(false);

  const deal = () => {
    if (anteAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (anteAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    const deck = createDeck();
    setPlayerHand([deck.pop()!, deck.pop()!, deck.pop()!]);
    setDealerHand([deck.pop()!, deck.pop()!, deck.pop()!]);
    setGameState('dealt');
    setResult('');
    setIsWin(false);
    (onBetPlaced ?? onLose)(anteAmount);
    playSound('deal');
  };

  const play = () => {
    if (anteAmount > balance) {
      toast.error('Insufficient balance to play!');
      return;
    }
    (onBetPlaced ?? onLose)(anteAmount);
    playSound('click');
    showdown(true);
  };

  const fold = () => {
    setGameState('betting');
    setResult('Folded - Ante lost');
    onLose(anteAmount);
    playSound('lose');
    toast.error('Folded');
  };

  const showdown = (played: boolean) => {
    setGameState('showdown');
    playSound('reveal');
    
    const playerEval = evaluateHand(playerHand);
    const dealerEval = evaluateHand(dealerHand);
    const dealerQualifies = dealerEval.rank >= 2 || getHighCard(dealerHand) >= 12;

    let totalWin = 0;
    let message = '';

    // Ante bonus (always paid for strong hands)
    if (ANTE_BONUS[playerEval.rank]) {
      totalWin += anteAmount * ANTE_BONUS[playerEval.rank];
    }

    if (!dealerQualifies) {
      totalWin += anteAmount; // Ante pushes
      totalWin += anteAmount; // Play bet push
      message = `Dealer doesn't qualify - ${playerEval.name}`;
      toast('Dealer doesn\'t qualify - Ante and Play returned');
    } else {
      // Compare hands
      if (playerEval.rank > dealerEval.rank || 
         (playerEval.rank === dealerEval.rank && getHighCard(playerHand) > getHighCard(dealerHand))) {
        totalWin += anteAmount * 2; // Win ante
        totalWin += anteAmount * 2; // Win play
        message = `You win with ${playerEval.name}!`;
        setIsWin(true);
        playSound('win');
        toast.success(`🎉 Won with ${playerEval.name}!`);
      } else if (playerEval.rank < dealerEval.rank ||
                (playerEval.rank === dealerEval.rank && getHighCard(playerHand) < getHighCard(dealerHand))) {
        onLose(anteAmount * 2);
        message = `Dealer wins with ${dealerEval.name}`;
        playSound('lose');
        toast.error(`Dealer wins with ${dealerEval.name}`);
      } else {
        totalWin += anteAmount * 2;
        message = 'Push - Tie game';
        toast('Push');
      }
    }

    if (totalWin > 0) onWin(totalWin);
    setResult(message);
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setResult('');
    setIsWin(false);
    playSound('click');
  };

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gold/20 rounded-lg glow-gold">
          <Crown className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Three Card Poker</h2>
          <p className="text-muted-foreground text-sm">Beat the dealer's hand</p>
        </div>
      </div>

      {/* Game Area */}
      <div className={`bg-gradient-to-b from-gold/10 to-gold/5 rounded-xl p-6 min-h-[320px] space-y-6 transition-all duration-500 ${isWin ? 'animate-win-flash' : ''}`}>
        {/* Dealer Hand */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Dealer</span>
            {gameState === 'showdown' && (
              <span className="font-display font-bold animate-fade-in">{evaluateHand(dealerHand).name}</span>
            )}
          </div>
          <div className="flex gap-2 justify-center min-h-[112px]">
            {gameState === 'showdown' ? (
              dealerHand.map((card, i) => <CardDisplay key={i} card={card} index={i} />)
            ) : dealerHand.length > 0 ? (
              [0, 1, 2].map(i => <CardDisplay key={i} card={{ suit: '?', value: '?', rank: 0 }} hidden index={i} />)
            ) : null}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="text-center animate-pop">
            <span className={`font-display text-xl font-bold ${
              result.includes('win') ? 'text-win glow-green' : 
              result.includes('Dealer') || result.includes('Folded') ? 'text-lose glow-red' : 'text-gold'
            }`}>
              {result}
            </span>
          </div>
        )}

        {/* Player Hand */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Your Hand</span>
            {playerHand.length > 0 && (
              <span className="font-display font-bold text-primary">{evaluateHand(playerHand).name}</span>
            )}
          </div>
          <div className="flex gap-2 justify-center min-h-[112px]">
            {playerHand.map((card, i) => <CardDisplay key={i} card={card} index={i} />)}
          </div>
        </div>
      </div>

      {/* Paytable */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-secondary rounded-lg p-2 game-tile">
          <div className="text-gold font-display">Straight Flush</div>
          <div className="font-display font-bold">5:1</div>
        </div>
        <div className="bg-secondary rounded-lg p-2 game-tile">
          <div className="text-gold font-display">Three of a Kind</div>
          <div className="font-display font-bold">4:1</div>
        </div>
        <div className="bg-secondary rounded-lg p-2 game-tile">
          <div className="text-gold font-display">Straight</div>
          <div className="font-display font-bold">1:1</div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {gameState === 'betting' && (
          <>
            <div className="flex gap-2">
              <Input
                type="number"
                value={anteAmount}
                onChange={(e) => setAnteAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="font-display text-lg bg-secondary border-border"
                placeholder="Ante"
              />
              <Button variant="secondary" onClick={() => setAnteAmount(Math.floor(balance / 4))} className="game-tile">1/4</Button>
              <Button variant="secondary" onClick={() => setAnteAmount(Math.floor(balance / 2))} className="game-tile">1/2</Button>
            </div>
            <Button
              className="w-full h-14 font-display text-lg bg-gold hover:bg-gold/80 text-accent-foreground glow-gold transition-all duration-300 hover:scale-[1.02]"
              disabled={balance === 0}
              onClick={deal}
            >
              Deal (Ante: ${anteAmount})
            </Button>
          </>
        )}

        {gameState === 'dealt' && (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={play} 
              className="h-14 font-display bg-win hover:bg-win/80 glow-green transition-all duration-300 hover:scale-[1.02]"
              disabled={anteAmount > balance}
            >
              Play (${anteAmount})
            </Button>
            <Button onClick={fold} variant="destructive" className="h-14 font-display transition-all duration-300 hover:scale-[1.02]">
              Fold
            </Button>
          </div>
        )}

        {gameState === 'showdown' && (
          <Button onClick={newGame} className="w-full h-14 font-display text-lg transition-all duration-300 hover:scale-[1.02]">
            New Hand
          </Button>
        )}
      </div>
    </div>
  );
};
