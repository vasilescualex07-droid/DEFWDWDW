import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Triangle } from 'lucide-react';
import { playSound } from '@/hooks/useSounds';

interface PlinkoGameProps {
  balance: number;
  onWin: (amount: number) => void;
  onLose: (amount: number) => void;
  onBetPlaced?: (amount: number) => void;
}

const ROWS = 12;
const MULTIPLIERS = [10, 3, 1.5, 1.2, 1, 0.5, 0.3, 0.5, 1, 1.2, 1.5, 3, 10];
const PEG_RADIUS = 5;
const BALL_RADIUS = 10;
const HORIZONTAL_SPACING = 36;
const VERTICAL_SPACING = 32;

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  bet: number;
  lastBounce: number;
}

export const PlinkoGame = ({ balance, onWin, onLose, onBetPlaced }: PlinkoGameProps) => {
  const [betAmount, setBetAmount] = useState('5');
  const [lastResult, setLastResult] = useState<{ multiplier: number; win: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const ballIdRef = useRef(0);
  const ballsRef = useRef<Ball[]>([]);
  const lastDropFxRef = useRef(0);
  const landingFlashRef = useRef<{ slot: number; at: number } | null>(null);
  const [dropChuteKey, setDropChuteKey] = useState(0);
  const [autoDropEnabled, setAutoDropEnabled] = useState(false);
  const [autoDropMode, setAutoDropMode] = useState<'untilBroke' | 'infinite'>('untilBroke');
  const [dropRateUnit, setDropRateUnit] = useState<'sec' | 'min'>('sec');
  const [dropRate, setDropRate] = useState(2); // balls per sec/min

  const boardWidth = (ROWS + 2) * HORIZONTAL_SPACING;
  const boardHeight = (ROWS + 1) * VERTICAL_SPACING + 80;

  const getPegPositions = useCallback(() => {
    const pegs: { x: number; y: number }[] = [];
    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * HORIZONTAL_SPACING;
      const startX = (boardWidth - rowWidth) / 2;
      for (let col = 0; col < pegsInRow; col++) {
        pegs.push({
          x: startX + col * HORIZONTAL_SPACING,
          y: (row + 1) * VERTICAL_SPACING + 30,
        });
      }
    }
    return pegs;
  }, [boardWidth]);

  const dropBall = useCallback(() => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0 || bet > balance) return;

    (onBetPlaced ?? onLose)(bet);
    playSound('click');
    lastDropFxRef.current = performance.now();
    setDropChuteKey((k) => k + 1);

    const newBall: Ball = {
      id: ballIdRef.current++,
      x: boardWidth / 2 + (Math.random() - 0.5) * 8,
      y: 15,
      vx: 0,
      vy: 0,
      active: true,
      bet,
      lastBounce: 0,
    };

    ballsRef.current = [...ballsRef.current, newBall];
  }, [balance, betAmount, boardWidth, onBetPlaced, onLose]);

  // Auto drop runner (balls / sec or / min)
  useEffect(() => {
    if (!autoDropEnabled) return;
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) return;

    if (autoDropMode === 'untilBroke' && bet > balance) {
      setAutoDropEnabled(false);
      return;
    }

    const perSecond = dropRateUnit === 'sec' ? dropRate : dropRate / 60;
    const safeRate = Math.max(0.1, perSecond);
    const intervalMs = Math.max(60, 1000 / safeRate);

    const t = setInterval(() => {
      const currentBet = parseFloat(betAmount);
      if (isNaN(currentBet) || currentBet <= 0) return;

      if (autoDropMode === 'untilBroke' && currentBet > balance) {
        setAutoDropEnabled(false);
        return;
      }
      if (currentBet > balance) return; // infinite mode pauses while broke
      dropBall();
    }, intervalMs);

    return () => clearInterval(t);
  }, [autoDropEnabled, autoDropMode, balance, betAmount, dropBall, dropRate, dropRateUnit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pegs = getPegPositions();
    
    // Balanced physics - visible but not too slow
    const gravity = 0.18; // Faster gravity for better pace
    const friction = 0.992;
    const bounciness = 0.55;

    let projectedSlot: number | null = null;

    const animate = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, boardWidth, boardHeight);

      // Draw dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, boardHeight);
      gradient.addColorStop(0, 'hsl(0, 0%, 4%)');
      gradient.addColorStop(1, 'hsl(0, 0%, 7%)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, boardWidth, boardHeight);

      // Draw pegs with glow
      ctx.shadowColor = 'hsl(142, 70%, 50%)';
      ctx.shadowBlur = 8;
      pegs.forEach(peg => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(142, 70%, 45%)';
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw multiplier slots
      const slotWidth = boardWidth / MULTIPLIERS.length;
      MULTIPLIERS.forEach((mult, i) => {
        const x = i * slotWidth;
        const y = boardHeight - 45;
        
        let color = 'hsl(0, 70%, 50%)';
        if (mult >= 3) color = 'hsl(45, 80%, 50%)';
        else if (mult >= 1) color = 'hsl(142, 70%, 45%)';
        else if (mult >= 0.5) color = 'hsl(200, 70%, 50%)';
        
        const isProjected = projectedSlot === i;
        ctx.fillStyle = color;
        ctx.globalAlpha = isProjected ? 0.55 : 0.25;
        ctx.fillRect(x + 2, y, slotWidth - 4, 40);
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${mult}x`, x + slotWidth / 2, y + 25);
      });

      // Drop burst at spawn (on top of board — ball enters the board)
      const dropAge = now - lastDropFxRef.current;
      if (dropAge >= 0 && dropAge < 420) {
        const cx = boardWidth / 2;
        const cy = 18;
        const t = dropAge / 420;
        const ringR = 14 + t * 36;
        const alpha = 0.55 * (1 - t);
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(45, 100%, 58%, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, ringR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(45, 95%, 55%, ${alpha * 0.35})`;
        ctx.fill();
      }

      // Landing pulse on the bucket the ball hit
      const lf = landingFlashRef.current;
      if (lf) {
        const lfAge = now - lf.at;
        if (lfAge >= 0 && lfAge < 520) {
          const slotWidth = boardWidth / MULTIPLIERS.length;
          const x = lf.slot * slotWidth;
          const y = boardHeight - 45;
          const pulse = 1 - lfAge / 520;
          ctx.strokeStyle = `hsla(45, 100%, 62%, ${0.45 + pulse * 0.45})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 2 - pulse * 4, y - pulse * 3, slotWidth - 4 + pulse * 8, 40 + pulse * 6);
        }
      }

      // Update balls
      const nowMs = Date.now();
      projectedSlot = null;
      ballsRef.current = ballsRef.current.map(ball => {
        if (!ball.active) return ball;

        let { x, y, vx, vy, lastBounce } = ball;

        vy += gravity;
        vx *= friction;
        vy *= friction;
        x += vx;
        y += vy;

        // Collision with pegs
        pegs.forEach(peg => {
          const dx = x - peg.x;
          const dy = y - peg.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDist = PEG_RADIUS + BALL_RADIUS;

          if (distance < minDist) {
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(vx * vx + vy * vy);
            
            x = peg.x + Math.cos(angle) * minDist;
            y = peg.y + Math.sin(angle) * minDist;
            
            // Gentle random bounce
            const randomBounce = (Math.random() - 0.5) * 1.5;
            vx = Math.cos(angle) * speed * bounciness + randomBounce;
            vy = Math.sin(angle) * speed * bounciness;
            
            // Play bounce sound (with throttle)
            if (nowMs - lastBounce > 80) {
              playSound('bounce');
              lastBounce = nowMs;
            }
          }
        });

        // Wall collisions
        if (x < BALL_RADIUS) {
          x = BALL_RADIUS;
          vx = Math.abs(vx) * bounciness;
        }
        if (x > boardWidth - BALL_RADIUS) {
          x = boardWidth - BALL_RADIUS;
          vx = -Math.abs(vx) * bounciness;
        }

        // Anticipation: when near bottom, compute projected slot for highlight
        if (y > boardHeight - 90 && y <= boardHeight - 55) {
          const idx = Math.min(
            MULTIPLIERS.length - 1,
            Math.max(0, Math.floor(x / (boardWidth / MULTIPLIERS.length)))
          );
          projectedSlot = idx;
        }

        // Check if ball reached bottom
        if (y > boardHeight - 55) {
          const slotIndex = Math.min(
            MULTIPLIERS.length - 1,
            Math.max(0, Math.floor(x / (boardWidth / MULTIPLIERS.length)))
          );
          const multiplier = MULTIPLIERS[slotIndex];
          const winAmount = ball.bet * multiplier;

          landingFlashRef.current = { slot: slotIndex, at: performance.now() };
          
          if (winAmount > 0) {
            onWin(winAmount);
            if (multiplier >= 1) {
              playSound('cashout');
            }
          }
          
          setLastResult({ multiplier, win: winAmount });
          
          return { ...ball, active: false };
        }

        return { ...ball, x, y, vx, vy, lastBounce };
      }).filter(ball => ball.active);

      // Draw balls with glow trail
      ballsRef.current.forEach(ball => {
        if (!ball.active) return;
        
        // Glow effect
        ctx.shadowColor = 'hsl(45, 100%, 60%)';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        const ballGradient = ctx.createRadialGradient(
          ball.x - 3, ball.y - 3, 0,
          ball.x, ball.y, BALL_RADIUS
        );
        ballGradient.addColorStop(0, 'hsl(45, 100%, 80%)');
        ballGradient.addColorStop(0.5, 'hsl(45, 90%, 60%)');
        ballGradient.addColorStop(1, 'hsl(45, 80%, 45%)');
        ctx.fillStyle = ballGradient;
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'hsl(45, 70%, 35%)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [boardWidth, boardHeight, getPegPositions, onWin]);

  const bet = parseFloat(betAmount);
  const canBet = !isNaN(bet) && bet > 0 && bet <= balance;

  return (
    <div className="game-card space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gold/20 rounded-lg glow-gold">
          <Triangle className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Plinko</h2>
          <p className="text-muted-foreground text-sm">Drop the ball and watch it bounce!</p>
        </div>
      </div>

      {/* Plinko Board — chute pulse on each drop (synced with canvas spawn burst) */}
      <div className="flex justify-center">
        <div className="relative inline-block">
          <div
            key={dropChuteKey}
            className="pointer-events-none absolute left-1/2 top-0 z-10 h-28 w-20 -translate-x-1/2 animate-plinko-chute bg-gradient-to-b from-gold/50 via-gold/15 to-transparent [mask-image:linear-gradient(to_bottom,black_0%,transparent_85%)]"
            aria-hidden
          />
          <canvas
            ref={canvasRef}
            width={boardWidth}
            height={boardHeight}
            className="rounded-xl border border-border"
            style={{ maxWidth: '100%' }}
          />
        </div>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className="text-center animate-pop">
          <Badge 
            variant="outline" 
            className={`text-lg px-4 py-2 font-display ${lastResult.multiplier >= 1 ? 'border-win text-win glow-green' : 'border-lose text-lose'}`}
          >
            {lastResult.multiplier}x → ${lastResult.win.toFixed(2)}
          </Badge>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-4">
        <div className="p-3 rounded-lg border border-gold/20 bg-black/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gold">Auto Drop</p>
              <p className="text-[11px] text-muted-foreground">Drop balls automatically at a selected rate.</p>
            </div>
            <Button
              size="sm"
              variant={autoDropEnabled ? 'default' : 'outline'}
              onClick={() => setAutoDropEnabled(v => !v)}
              className={autoDropEnabled ? 'bg-gold text-black hover:bg-gold/90' : ''}
            >
              {autoDropEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={autoDropMode === 'untilBroke' ? 'default' : 'outline'}
              onClick={() => setAutoDropMode('untilBroke')}
              className="text-xs"
            >
              Until Broke
            </Button>
            <Button
              size="sm"
              variant={autoDropMode === 'infinite' ? 'default' : 'outline'}
              onClick={() => setAutoDropMode('infinite')}
              className="text-xs"
            >
              Infinite
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={dropRateUnit === 'sec' ? 'default' : 'outline'}
              onClick={() => setDropRateUnit('sec')}
              className="text-xs"
            >
              Balls / Sec
            </Button>
            <Button
              size="sm"
              variant={dropRateUnit === 'min' ? 'default' : 'outline'}
              onClick={() => setDropRateUnit('min')}
              className="text-xs"
            >
              Balls / Min
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rate</span>
              <span>
                {dropRate.toFixed(dropRateUnit === 'sec' ? 1 : 0)} / {dropRateUnit === 'sec' ? 'sec' : 'min'}
              </span>
            </div>
            <Input
              type="number"
              min={dropRateUnit === 'sec' ? 0.2 : 1}
              max={dropRateUnit === 'sec' ? 20 : 600}
              step={dropRateUnit === 'sec' ? 0.2 : 1}
              value={dropRate}
              onChange={(e) => setDropRate(Math.max(dropRateUnit === 'sec' ? 0.2 : 1, parseFloat(e.target.value) || 0))}
              className="bg-secondary border-border text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Bet Amount</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="bg-secondary border-border font-display"
              min="0.01"
              step="0.01"
            />
            <Button
              variant="outline"
              onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
              className="px-3 game-tile"
            >
              ½
            </Button>
            <Button
              variant="outline"
              onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
              className="px-3 game-tile"
            >
              2×
            </Button>
          </div>
        </div>

        <Button
          onClick={dropBall}
          disabled={!canBet}
          className="w-full h-14 text-lg font-display bg-gold hover:bg-gold/90 text-accent-foreground glow-gold transition-all duration-300 hover:scale-[1.02]"
        >
          Drop Ball (${bet > 0 ? bet.toFixed(2) : '0.00'})
        </Button>
      </div>

      {/* Multiplier Legend */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Multipliers: 0.3x - 10x • Edge slots pay more!</p>
      </div>
    </div>
  );
};
