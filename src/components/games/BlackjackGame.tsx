import { useState } from 'react';
import { Spade, Lightbulb, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { playSound } from '@/hooks/useSounds';

interface BlackjackGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

type Card = { suit: string; value: string; numValue: number };
type GameState = 'betting' | 'playing' | 'dealerTurn' | 'finished';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Basic strategy recommendations
const getBasicStrategy = (playerTotal: number, dealerCard: number, isSoft: boolean, canDouble: boolean): string => {
  // Simplified basic strategy
  if (playerTotal >= 17) return 'Stand';
  if (playerTotal <= 8) return 'Hit';
  
  if (isSoft) {
    if (playerTotal >= 19) return 'Stand';
    if (playerTotal === 18) {
      if (dealerCard >= 9) return 'Hit';
      if (dealerCard >= 3 && dealerCard <= 6 && canDouble) return 'Double';
      return 'Stand';
    }
    return 'Hit';
  }
  
  if (playerTotal === 11 && canDouble) return 'Double';
  if (playerTotal === 10 && dealerCard < 10 && canDouble) return 'Double';
  if (playerTotal === 9 && dealerCard >= 3 && dealerCard <= 6 && canDouble) return 'Double';
  
  if (playerTotal >= 13 && playerTotal <= 16) {
    if (dealerCard >= 2 && dealerCard <= 6) return 'Stand';
    return 'Hit';
  }
  if (playerTotal === 12) {
    if (dealerCard >= 4 && dealerCard <= 6) return 'Stand';
    return 'Hit';
  }
  
  return 'Hit';
};

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      let numValue = parseInt(value);
      if (value === 'A') numValue = 11;
      else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
      deck.push({ suit, value, numValue });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateHand = (cards: Card[]): { total: number; isSoft: boolean } => {
  let total = cards.reduce((sum, card) => sum + card.numValue, 0);
  let aces = cards.filter(c => c.value === 'A').length;
  let isSoft = aces > 0 && total <= 21;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
    isSoft = aces > 0 && total <= 21;
  }
  return { total, isSoft };
};

const CardBackFace = () => (
  <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-border bg-gradient-to-br from-primary to-primary/60 shadow-lg">
    <span className="text-2xl">?</span>
  </div>
);

const CardFaceContent = ({ card }: { card: Card }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-border bg-gradient-to-br from-white to-gray-100 shadow-lg transition-transform duration-300 hover:scale-[1.03] ${isRed ? 'text-lose' : 'text-background'}`}
    >
      <span className="font-display text-lg font-bold">{card.value}</span>
      <span className="text-xl">{card.suit}</span>
    </div>
  );
};

/** Face-up card — slides in from the dealer (main table moment). */
const CardFaceDeal = ({ card, index }: { card: Card; index: number }) => {
  const delay = `${index * 110}ms`;
  return (
    <div
      className="animate-bj-deal-in h-24 w-16 shrink-0"
      style={{ animationDelay: delay }}
    >
      <CardFaceContent card={card} />
    </div>
  );
};

/** Hole card — 3D flip from back to face when revealed. */
const CardHoleFlip = ({ card, hidden, index }: { card: Card; hidden: boolean; index: number }) => {
  const delay = `${index * 110}ms`;
  return (
    <div
      className="h-24 w-16 shrink-0 [perspective:1000px]"
      style={{ animationDelay: delay }}
    >
      <div className="animate-bj-deal-in h-full w-full" style={{ animationDelay: delay }}>
        <div
          className={`relative h-full w-full [transform-style:preserve-3d] transition-transform duration-700 ease-out ${hidden ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'}`}
        >
          <div className="absolute inset-0 h-full w-full overflow-hidden rounded-lg [backface-visibility:hidden] [transform:rotateY(0deg)]">
            <CardBackFace />
          </div>
          <div className="absolute inset-0 h-full w-full overflow-hidden rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <CardFaceContent card={card} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const BlackjackGame = ({ balance, onWin, onLose, onBetPlaced }: BlackjackGameProps) => {
  const [betAmount, setBetAmount] = useState(25);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [result, setResult] = useState<string>('');
  const [isWin, setIsWin] = useState(false);
  const [showStrategy, setShowStrategy] = useState(true);
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);

  const deal = () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (betAmount <= 0) {
      toast.error('Bet must be greater than 0!');
      return;
    }

    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setResult('');
    setIsWin(false);
    (onBetPlaced ?? onLose)(betAmount);
    playSound('deal');

    // Check for blackjack
    if (calculateHand(pHand).total === 21) {
      setTimeout(() => finishGame(pHand, dHand, newDeck), 500);
    }
  };

  const hit = () => {
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(newHand);
    playSound('deal');

    if (calculateHand(newHand).total > 21) {
      setGameState('finished');
      setResult('Bust! You lose.');
      onLose(betAmount);
      playSound('lose');
      toast.error('💥 Bust!');
    }
  };

  const stand = () => {
    setGameState('dealerTurn');
    playSound('click');
    finishGame(playerHand, dealerHand, deck);
  };

  const doubleDown = () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance to double!');
      return;
    }
    (onBetPlaced ?? onLose)(betAmount);
    playSound('deal');
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(newHand);

    if (calculateHand(newHand).total > 21) {
      setGameState('finished');
      setResult('Bust! You lose.');
      onLose(betAmount * 2);
      playSound('lose');
      toast.error('💥 Bust!');
    } else {
      finishGame(newHand, dealerHand, newDeck, true);
    }
  };

  const finishGame = (pHand: Card[], dHand: Card[], currentDeck: Card[], doubled = false) => {
    setGameState('dealerTurn');
    let newDealerHand = [...dHand];
    let newDeck = [...currentDeck];

    // Dealer draws until 17
    const drawDealer = () => {
      if (calculateHand(newDealerHand).total < 17) {
        newDealerHand.push(newDeck.pop()!);
        setDealerHand([...newDealerHand]);
        playSound('deal');
        setTimeout(drawDealer, 600);
      } else {
        resolveGame(pHand, newDealerHand, doubled);
      }
    };

    setTimeout(drawDealer, 500);
    setDeck(newDeck);
  };

  const resolveGame = (pHand: Card[], dHand: Card[], doubled: boolean) => {
    const playerTotal = calculateHand(pHand).total;
    const dealerTotal = calculateHand(dHand).total;
    const actualBet = doubled ? betAmount * 2 : betAmount;

    setGameState('finished');
    
    if (playerTotal > 21) {
      onLose(actualBet);
      setResult('Bust! You lose.');
    } else if (dealerTotal > 21) {
      onWin(actualBet * 2);
      setIsWin(true);
      setResult('Dealer busts! You win!');
      playSound('win');
      toast.success(`🎉 Dealer busts! Won $${actualBet.toFixed(2)}`);
    } else if (playerTotal === 21 && pHand.length === 2 && !(dealerTotal === 21 && dHand.length === 2)) {
      onWin(actualBet * 2.5);
      setIsWin(true);
      setResult('Blackjack! You win 3:2!');
      playSound('win');
      toast.success(`🃏 Blackjack! Won $${(actualBet * 1.5).toFixed(2)}`);
    } else if (playerTotal > dealerTotal) {
      onWin(actualBet * 2);
      setIsWin(true);
      setResult('You win!');
      playSound('win');
      toast.success(`🎉 You win! Won $${actualBet.toFixed(2)}`);
    } else if (playerTotal < dealerTotal) {
      onLose(actualBet);
      setResult('Dealer wins.');
      playSound('lose');
      toast.error('Dealer wins');
    } else {
      onWin(actualBet);
      setResult('Push - tie game.');
      playSound('click');
      toast('Push - bet returned');
    }
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setResult('');
    setIsWin(false);
    playSound('click');
  };

  // Get strategy recommendation
  const getRecommendation = (): string | null => {
    if (gameState !== 'playing' || !showStrategy) return null;
    
    const { total, isSoft } = calculateHand(playerHand);
    const dealerCardValue = dealerHand[0]?.numValue || 10;
    const canDouble = playerHand.length === 2 && betAmount <= balance;
    
    return getBasicStrategy(total, dealerCardValue, isSoft, canDouble);
  };

  const recommendation = getRecommendation();

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-win/20 rounded-lg glow-green">
            <Spade className="w-6 h-6 text-win" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Blackjack</h2>
            <p className="text-muted-foreground text-sm">Beat the dealer to 21</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStrategy(!showStrategy)}
            className={showStrategy ? 'text-neon-cyan' : 'text-muted-foreground'}
          >
            <Lightbulb className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStrategyGuide(!showStrategyGuide)}
            className="text-muted-foreground"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Strategy Guide */}
      {showStrategyGuide && (
        <div className="p-3 bg-card/50 rounded-lg border border-border text-xs space-y-2 animate-fade-in">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neon-cyan" />
            Basic Strategy Guide
          </h4>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div><strong className="text-foreground">17+:</strong> Always stand</div>
            <div><strong className="text-foreground">11:</strong> Double if possible</div>
            <div><strong className="text-foreground">12-16:</strong> Stand vs 2-6, Hit vs 7+</div>
            <div><strong className="text-foreground">≤8:</strong> Always hit</div>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className={`bg-gradient-to-b from-win/10 to-win/5 rounded-xl p-6 min-h-[300px] space-y-6 transition-all duration-500 ${isWin ? 'animate-win-flash' : ''}`}>
        {/* Dealer Hand */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Dealer</span>
            {gameState !== 'betting' && (
              <span className="font-display font-bold">
                {gameState === 'playing' ? '?' : calculateHand(dealerHand).total}
              </span>
            )}
          </div>
          <div className="flex gap-2 min-h-[96px]">
            {dealerHand.map((card, i) => {
              const isHole = i === 1;
              if (isHole) {
                return (
                  <CardHoleFlip
                    key={`d-${i}-${card.suit}-${card.value}`}
                    card={card}
                    hidden={gameState === 'playing'}
                    index={i}
                  />
                );
              }
              return <CardFaceDeal key={`d-${i}-${card.suit}-${card.value}`} card={card} index={i} />;
            })}
          </div>
        </div>

        {/* Strategy Recommendation */}
        {recommendation && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30 animate-fade-in">
            <Lightbulb className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm text-neon-cyan">Recommended:</span>
            <span className="font-bold text-neon-cyan flex items-center gap-1">
              {recommendation}
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="text-center animate-pop">
            <span className={`font-display text-2xl font-bold ${
              result.includes('win') || result.includes('Blackjack') ? 'text-win glow-green' : 
              result.includes('lose') || result.includes('Bust') ? 'text-lose glow-red' : 'text-gold'
            }`}>
              {result}
            </span>
          </div>
        )}

        {/* Player Hand */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Your Hand</span>
            {gameState !== 'betting' && (
              <span className="font-display font-bold text-primary">
                {calculateHand(playerHand).total}
                {calculateHand(playerHand).isSoft && <span className="text-xs ml-1 text-muted-foreground">(soft)</span>}
              </span>
            )}
          </div>
          <div className="flex gap-2 min-h-[96px]">
            {playerHand.map((card, i) => (
              <CardFaceDeal key={`p-${i}-${card.suit}-${card.value}`} card={card} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {gameState === 'betting' && (
          <>
            <div className="flex gap-2">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="font-display text-lg bg-secondary border-border"
              />
              <Button variant="secondary" onClick={() => setBetAmount(Math.floor(balance / 2))} className="game-tile">1/2</Button>
              <Button variant="secondary" onClick={() => setBetAmount(Math.floor(balance))} className="game-tile">Max</Button>
            </div>
            <Button
              className="w-full h-14 font-display text-lg bg-win hover:bg-win/80 glow-green transition-all duration-300 hover:scale-[1.02]"
              disabled={balance === 0}
              onClick={deal}
            >
              Deal
            </Button>
          </>
        )}

        {gameState === 'playing' && (
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={hit} 
              className={`h-12 font-display bg-primary hover:bg-primary/80 transition-all duration-300 hover:scale-[1.02] ${recommendation === 'Hit' ? 'ring-2 ring-neon-cyan' : ''}`}
            >
              Hit
            </Button>
            <Button 
              onClick={stand} 
              variant="secondary" 
              className={`h-12 font-display game-tile transition-all duration-300 hover:scale-[1.02] ${recommendation === 'Stand' ? 'ring-2 ring-neon-cyan' : ''}`}
            >
              Stand
            </Button>
            <Button 
              onClick={doubleDown} 
              variant="outline" 
              className={`h-12 font-display border-gold text-gold hover:bg-gold/20 transition-all duration-300 hover:scale-[1.02] ${recommendation === 'Double' ? 'ring-2 ring-neon-cyan' : ''}`}
              disabled={betAmount > balance}
            >
              Double
            </Button>
          </div>
        )}

        {gameState === 'finished' && (
          <Button onClick={newGame} className="w-full h-14 font-display text-lg transition-all duration-300 hover:scale-[1.02]">
            New Hand
          </Button>
        )}
      </div>
    </div>
  );
};
