import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { playSound } from '@/hooks/useSounds';
import { formatNumber } from '@/lib/utils';

interface WinCelebrationProps {
  show: boolean;
  profit?: number;
  onComplete?: () => void;
}

type Tier = 'win' | 'big' | 'jackpot';

function getTier(profit: number): Tier {
  if (profit >= 120) return 'jackpot';
  if (profit >= 35) return 'big';
  return 'win';
}

const TIER_CONFIG = {
  win: {
    label: 'WIN',
    badge: '◆ W I N ◆',
    primary: '#22d3ee',
    secondary: '#0ea5e9',
    accent: '#9ff7ff',
    glows: ['#22d3ee', '#0ea5e9'],
    textGradient: 'linear-gradient(180deg, #9ff7ff 0%, #22d3ee 45%, #0ea5e9 100%)',
    flashColor: 'rgba(34,211,238,0.55)',
    particleColors: ['#22d3ee', '#9ff7ff', '#60a5fa', '#ffd700', '#ffffff'],
    rayColors: ['rgba(34,211,238,0.85)', 'rgba(96,165,250,0.7)', 'rgba(255,255,255,0.6)'],
    duration: 1600,
    rayCount: 14,
    ringCount: 3,
    rainbow: false,
  },
  big: {
    label: 'BIG WIN',
    badge: '★ B I G  W I N ★',
    primary: '#ffd700',
    secondary: '#ffb700',
    accent: '#fff7a0',
    glows: ['#ffd700', '#ff8c00'],
    textGradient: 'linear-gradient(180deg, #fff7a0 0%, #ffd700 30%, #ffb700 65%, #b8860b 100%)',
    flashColor: 'rgba(255,215,0,0.55)',
    particleColors: ['#ffd700', '#ffb700', '#fffbe0', '#f59e0b', '#ff8800'],
    rayColors: ['rgba(255,215,0,0.9)', 'rgba(255,180,0,0.7)', 'rgba(255,255,180,0.55)'],
    duration: 2100,
    rayCount: 18,
    ringCount: 5,
    rainbow: false,
  },
  jackpot: {
    label: 'JACKPOT',
    badge: '✦ S S R ✦',
    primary: '#ffd700',
    secondary: '#a855f7',
    accent: '#ff6eb4',
    glows: ['#ffd700', '#a855f7', '#ff6eb4'],
    textGradient: 'linear-gradient(135deg, #ff6eb4 0%, #ffd700 25%, #22d3ee 50%, #a855f7 75%, #ff6eb4 100%)',
    flashColor: 'rgba(255,215,0,0.7)',
    particleColors: ['#ffd700', '#ff6eb4', '#22d3ee', '#a855f7', '#ffffff', '#ff4d4d'],
    rayColors: ['rgba(255,215,0,0.9)', 'rgba(168,85,247,0.8)', 'rgba(255,110,180,0.75)', 'rgba(34,211,238,0.7)', 'rgba(255,255,255,0.6)'],
    duration: 2800,
    rayCount: 28,
    ringCount: 7,
    rainbow: true,
  },
};

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
  gravity: number;
  type: 'coin' | 'chip' | 'suit' | 'spark';
  symbol?: string;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS: Record<string, string> = { '♠': '#ddeeff', '♥': '#ff6666', '♦': '#ff6666', '♣': '#ddeeff' };
const CHIP_COLORS = ['#e53535', '#3575e5', '#35b87a', '#cc35cc', '#e5891e', '#a855f7'];

function spawnParticles(tier: Tier, w: number, h: number): Particle[] {
  const cx = w / 2;
  const cy = h * 0.52;
  const list: Particle[] = [];
  const cfg = TIER_CONFIG[tier];

  const coinCount = tier === 'jackpot' ? 50 : tier === 'big' ? 30 : 18;
  const chipCount = tier === 'jackpot' ? 24 : tier === 'big' ? 14 : 6;
  const suitCount = tier === 'jackpot' ? 30 : tier === 'big' ? 18 : 10;
  const sparkCount = tier === 'jackpot' ? 80 : tier === 'big' ? 46 : 28;

  for (let i = 0; i < coinCount; i++) {
    const angle = (Math.PI * 2 * i / coinCount) + (Math.random() - 0.5) * 0.6;
    const speed = 9 + Math.random() * 13;
    list.push({
      x: cx + (Math.random() - 0.5) * 50,
      y: cy + (Math.random() - 0.5) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 7 - Math.random() * 5,
      size: 11 + Math.random() * 9,
      color: Math.random() > 0.3 ? '#ffd700' : '#ffb700',
      alpha: 1,
      decay: 0.0045 + Math.random() * 0.004,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      gravity: 0.24 + Math.random() * 0.14,
      type: 'coin',
    });
  }

  for (let i = 0; i < chipCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 7 + Math.random() * 10;
    list.push({
      x: cx + (Math.random() - 0.5) * 35,
      y: cy + (Math.random() - 0.5) * 35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6 - Math.random() * 4,
      size: 12 + Math.random() * 7,
      color: CHIP_COLORS[Math.floor(Math.random() * CHIP_COLORS.length)],
      alpha: 1,
      decay: 0.004 + Math.random() * 0.003,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.28,
      gravity: 0.21 + Math.random() * 0.12,
      type: 'chip',
    });
  }

  for (let i = 0; i < suitCount; i++) {
    const suit = SUITS[i % 4];
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    list.push({
      x: cx + (Math.random() - 0.5) * 70,
      y: cy + (Math.random() - 0.5) * 70,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 8 - Math.random() * 6,
      size: 22 + Math.random() * 16,
      color: SUIT_COLORS[suit],
      alpha: 1,
      decay: 0.0028 + Math.random() * 0.0025,
      rotation: (Math.random() - 0.5) * 0.6,
      rotSpeed: (Math.random() - 0.5) * 0.09,
      gravity: 0.13 + Math.random() * 0.09,
      type: 'suit',
      symbol: suit,
    });
  }

  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 10;
    list.push({
      x: cx + (Math.random() - 0.5) * 110,
      y: cy + (Math.random() - 0.5) * 110,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 2 + Math.random() * 5,
      color: cfg.particleColors[Math.floor(Math.random() * cfg.particleColors.length)],
      alpha: 1,
      decay: 0.008 + Math.random() * 0.014,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.35,
      gravity: 0.04 + Math.random() * 0.07,
      type: 'spark',
    });
  }

  return list;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  if (p.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
  ctx.translate(p.x, p.y);

  if (p.type === 'coin') {
    const wobble = Math.max(0.06, Math.abs(Math.sin(p.rotation)));
    ctx.scale(wobble, 1);
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-p.size * 0.35, -p.size * 0.38, 1, 0, 0, p.size);
    grad.addColorStop(0, '#fffde0');
    grad.addColorStop(0.38, p.color);
    grad.addColorStop(1, '#7a5400');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.strokeStyle = '#ffe57a';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    if (p.size > 10 && wobble > 0.28) {
      ctx.scale(1 / wobble, 1);
      ctx.font = `bold ${Math.floor(p.size * 0.88)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(90,58,0,0.85)';
      ctx.shadowBlur = 0;
      ctx.fillText('$', 0, 1);
    }

  } else if (p.type === 'chip') {
    ctx.rotate(p.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.63, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(p.size * 0.76 - 3, -1.8, 6, 3.6);
      ctx.restore();
    }

  } else if (p.type === 'suit') {
    ctx.rotate(p.rotation);
    ctx.font = `bold ${Math.floor(p.size)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 16;
    ctx.fillText(p.symbol!, 0, 0);

  } else if (p.type === 'spark') {
    ctx.rotate(p.rotation);
    const r1 = p.size;
    const r2 = p.size * 0.36;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? r1 : r2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fill();
  }

  ctx.restore();
}

export const WinCelebration = ({ show, profit = 0, onComplete }: WinCelebrationProps) => {
  const [phase, setPhase] = useState<'hidden' | 'flash' | 'in' | 'hold' | 'out'>('hidden');
  const [glowT, setGlowT] = useState(0);
  const [dispAmount, setDispAmount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  const tier = getTier(profit);
  const cfg = TIER_CONFIG[tier];

  const rays = useMemo(() => {
    return Array.from({ length: cfg.rayCount }, (_, i) => ({
      angle: (360 / cfg.rayCount) * i,
      colorIdx: i % cfg.rayColors.length,
      thick: 1.5 + (i % 3) * 1.1,
      pulseMult: 0.8 + (i % 4) * 0.15,
    }));
  }, [tier]);

  const runCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.991;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;
      if (p.alpha > 0) { drawParticle(ctx, p); alive.push(p); }
    }
    particlesRef.current = alive;
    rafRef.current = requestAnimationFrame(runCanvas);
  }, []);

  useEffect(() => {
    if (!show) return;
    setDispAmount(0);
    setPhase('flash');
    playSound('levelup');

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = spawnParticles(tier, canvas.width, canvas.height);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(runCanvas);
    }

    frameRef.current = 0;
    const pulseInterval = setInterval(() => {
      frameRef.current++;
      setGlowT(frameRef.current * 0.055);
    }, 22);

    const rollDur = Math.min(profit * 9, 1400);
    const rollStart = Date.now();
    const rollInterval = setInterval(() => {
      const t = Math.min(1, (Date.now() - rollStart) / Math.max(1, rollDur));
      const ease = 1 - Math.pow(1 - t, 3);
      setDispAmount(Math.round(ease * profit));
      if (t >= 1) clearInterval(rollInterval);
    }, 14);

    const t1 = setTimeout(() => setPhase('in'), 110);
    const t2 = setTimeout(() => setPhase('hold'), 480);
    const t3 = setTimeout(() => { setPhase('out'); clearInterval(pulseInterval); }, cfg.duration - 380);
    const t4 = setTimeout(() => {
      setPhase('hidden');
      cancelAnimationFrame(rafRef.current);
      onComplete?.();
    }, cfg.duration);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(rollInterval);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      cancelAnimationFrame(rafRef.current);
    };
  }, [show]);

  if (phase === 'hidden') return null;

  const glow = 0.55 + Math.sin(glowT) * 0.45;
  const letters = cfg.label.split('');

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[60] overflow-hidden flex flex-col items-center justify-center ${phase === 'out' ? 'win-cel-out' : 'win-cel-in'}`}
      aria-hidden
    >
      {/* Canvas — physics particles */}
      <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 2 }} />

      {/* Screen flash */}
      {phase === 'flash' && (
        <div
          className="absolute inset-0 win-flash"
          style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${cfg.flashColor} 0%, ${cfg.flashColor.replace('0.', '0.2').replace('55', '20')} 50%, transparent 80%)`, zIndex: 5 }}
        />
      )}

      {/* Dark backdrop */}
      <div
        className="absolute inset-0 win-backdrop"
        style={{ background: 'radial-gradient(ellipse 120% 100% at 50% 50%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.88) 100%)', zIndex: 0 }}
      />

      {/* Starburst rays — individual divs, NOT a conic-gradient rectangle */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>
        {rays.map((ray, i) => (
          <div
            key={i}
            className="win-ray"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginTop: '-0.75px',
              width: '58vmax',
              height: `${ray.thick}px`,
              transformOrigin: 'left center',
              transform: `rotate(${ray.angle}deg)`,
              background: `linear-gradient(to right, ${cfg.rayColors[ray.colorIdx]} 0%, ${cfg.rayColors[ray.colorIdx].replace('0.9)', '0.35)').replace('0.8)', '0.3)').replace('0.7)', '0.25)')} 35%, transparent 75%)`,
              opacity: (0.45 + glow * 0.55) * ray.pulseMult,
              animationDelay: `${(i * 0.7 / cfg.rayCount).toFixed(2)}s`,
            }}
          />
        ))}
      </div>

      {/* Multi-layer orb glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 52% 42% at 50% 50%, ${cfg.glows[0]}60 0%, ${cfg.glows[0]}28 32%, transparent 62%)`,
          opacity: 0.65 + glow * 0.35,
        }} />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 30% 24% at 50% 50%, ${cfg.glows[cfg.glows.length > 1 ? 1 : 0]}50 0%, transparent 58%)`,
          opacity: 0.45 + glow * 0.55,
        }} />
        {tier === 'jackpot' && (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse 18% 14% at 50% 50%, rgba(255,255,255,0.35) 0%, transparent 60%)`,
            opacity: glow * 0.8,
          }} />
        )}
      </div>

      {/* Shockwave rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 2 }}>
        {Array.from({ length: cfg.ringCount }, (_, i) => (
          <div
            key={i}
            className="absolute win-ring"
            style={{
              width: `${140 + i * 60}px`,
              height: `${140 + i * 60}px`,
              marginLeft: `-${(140 + i * 60) / 2}px`,
              marginTop: `-${(140 + i * 60) / 2}px`,
              borderRadius: '50%',
              border: `${i < 2 ? 2.5 : 1.8}px solid ${cfg.primary}`,
              boxShadow: `0 0 ${10 + i * 3}px ${cfg.primary}70, inset 0 0 ${5 + i * 2}px ${cfg.primary}40`,
              animationDelay: `${i * 0.17}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-5" style={{ zIndex: 10 }}>

        {/* Badge */}
        <div
          className="win-badge font-display font-black text-xs tracking-[0.42em] uppercase px-5 py-1.5 rounded-full border-2"
          style={{
            borderColor: cfg.primary,
            color: cfg.accent,
            background: `linear-gradient(90deg, ${cfg.primary}28 0%, ${cfg.primary}55 50%, ${cfg.primary}28 100%)`,
            textShadow: `0 0 16px ${cfg.primary}, 0 0 32px ${cfg.primary}aa`,
            boxShadow: `0 0 22px ${cfg.primary}55, 0 0 50px ${cfg.primary}22, inset 0 0 12px ${cfg.primary}28`,
          }}
        >
          {cfg.badge}
        </div>

        {/* Title */}
        <div className="relative win-title">
          {/* Shine sweep */}
          <div className="absolute inset-0 gacha-shine overflow-hidden rounded-xl pointer-events-none" />

          {tier === 'jackpot' ? (
            <div className="flex items-center" style={{ gap: '0.05em' }}>
              {letters.map((letter, i) => (
                <span
                  key={i}
                  className="win-letter font-display font-black uppercase"
                  style={{
                    display: 'inline-block',
                    fontSize: 'clamp(2.8rem, 8.5vw, 6rem)',
                    background: cfg.textGradient,
                    backgroundSize: '300% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: `drop-shadow(0 0 ${20 * glow}px ${cfg.glows[0]}) drop-shadow(0 0 ${40 * glow}px ${cfg.glows[1]}) drop-shadow(0 4px 12px rgba(0,0,0,0.95))`,
                    animationDelay: `${i * 0.055}s`,
                    animation: `win-letter-drop 0.44s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.055}s both, gacha-rainbow-shift 1.8s linear infinite`,
                  }}
                >
                  {letter === ' ' ? '\u00a0' : letter}
                </span>
              ))}
            </div>
          ) : (
            <div
              className="win-title-pop font-display font-black uppercase"
              style={{
                fontSize: 'clamp(3.2rem, 10.5vw, 7rem)',
                letterSpacing: '0.1em',
                background: cfg.textGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `drop-shadow(0 0 ${32 * glow}px ${cfg.glows[0]}) drop-shadow(0 0 ${64 * glow}px ${cfg.glows[0]}99) drop-shadow(0 4px 12px rgba(0,0,0,0.95))`,
              }}
            >
              {cfg.label}
            </div>
          )}
        </div>

        {/* Amount counter */}
        {profit > 0 && (
          <div
            className="win-amount font-display font-black"
            style={{
              fontSize: 'clamp(2rem, 5.5vw, 4rem)',
              color: cfg.accent,
              textShadow: `0 0 28px ${cfg.glows[0]}, 0 0 55px ${cfg.glows[0]}99, 0 3px 10px rgba(0,0,0,0.9)`,
            }}
          >
            +${formatNumber(dispAmount)}
          </div>
        )}

        {/* Decorative divider */}
        <div
          className="win-divider"
          style={{
            width: '220px',
            height: '2px',
            background: `linear-gradient(to right, transparent 0%, ${cfg.primary} 30%, ${cfg.secondary} 70%, transparent 100%)`,
            boxShadow: `0 0 14px ${cfg.primary}aa, 0 0 30px ${cfg.primary}44`,
          }}
        />
      </div>
    </div>
  );
};
