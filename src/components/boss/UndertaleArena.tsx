import { useEffect, useMemo, useRef, useState } from 'react';
import { playSound } from '@/hooks/useSounds';

export type ArenaShape = 'square';

export type AttackPattern = 'rain' | 'walls' | 'cross' | 'spiral' | 'burst';
export type SignatureSlash = 'none' | 'dealerFan' | 'pitSweep' | 'whaleWave' | 'houseGrid' | 'shadowX' | 'kingCross';

export interface ArenaConfig {
  width: number;
  height: number;
  heartSize: number;
}

export interface ArenaDifficulty {
  cadenceMs: number;
  telegraphMs: number;
  strikeMs: number;
  maxSlashes: number;
  moveSpeed: number;
}

export interface ArenaHit {
  damageEvent: 'playerHit';
}

type SlashPhase = 'telegraph' | 'strike';

interface Slash {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  phase: SlashPhase;
  timer: number;
  telegraphMs: number;
  strikeMs: number;
  color: string;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
}

interface UndertaleArenaProps {
  disabled?: boolean;
  attackEnabled?: boolean;
  pattern: AttackPattern;
  signature?: SignatureSlash;
  difficulty?: ArenaDifficulty;
  durationMs: number;
  timeScale?: number;
  enraged?: boolean;
  jackpotFlash?: boolean;
  onHit: (hit: ArenaHit) => void;
  onDone: () => void;
  className?: string;
}

const DEFAULT_CONFIG: ArenaConfig = {
  width: 320,
  height: 240,
  heartSize: 14,
};

const DEFAULT_DIFFICULTY: ArenaDifficulty = {
  cadenceMs: 1000,
  telegraphMs: 700,
  strikeMs: 180,
  maxSlashes: 2,
  moveSpeed: 180,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function distPointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1);
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export const UndertaleArena = ({
  disabled,
  attackEnabled = false,
  pattern,
  signature = 'none',
  difficulty,
  durationMs,
  timeScale = 1,
  enraged = false,
  jackpotFlash = false,
  onHit,
  onDone,
  className = '',
}: UndertaleArenaProps) => {
  const cfg = DEFAULT_CONFIG;
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const lastCommitRef = useRef<number>(0);
  const slashIdRef = useRef(1);
  const bulletIdRef = useRef(1000);
  const hitCooldownRef = useRef(0);
  const attackStartRef = useRef<number | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [heart, setHeart] = useState(() => ({
    x: cfg.width / 2 - cfg.heartSize / 2,
    y: cfg.height / 2 - cfg.heartSize / 2,
  }));
  const heartRef = useRef(heart);
  useEffect(() => { heartRef.current = heart; }, [heart]);
  const commitHeartRef = useRef(heartRef.current);

  const [slashes, setSlashes] = useState<Slash[]>([]);
  const slashRef = useRef<Slash[]>([]);
  useEffect(() => { slashRef.current = slashes; }, [slashes]);

  const [bullets, setBullets] = useState<Bullet[]>([]);
  const bulletRef = useRef<Bullet[]>([]);
  useEffect(() => { bulletRef.current = bullets; }, [bullets]);

  const theme = useMemo(() => {
    if (enraged) return { bg: 'from-red-950/80 to-black/60', slash: 'rgba(255,60,60,0.98)', warn: 'rgba(255,100,60,0.5)', bullet: 'rgba(255,80,80,0.95)' };
    if (pattern === 'rain') return { bg: 'from-black/60 to-black/30', slash: 'rgba(34,197,94,0.95)', warn: 'rgba(34,197,94,0.35)', bullet: 'rgba(100,255,140,0.95)' };
    if (pattern === 'walls') return { bg: 'from-black/60 to-black/30', slash: 'rgba(236,72,153,0.95)', warn: 'rgba(236,72,153,0.35)', bullet: 'rgba(255,100,200,0.95)' };
    if (pattern === 'spiral') return { bg: 'from-black/60 to-black/30', slash: 'rgba(251,191,36,0.95)', warn: 'rgba(251,191,36,0.35)', bullet: 'rgba(255,220,60,0.95)' };
    if (pattern === 'burst') return { bg: 'from-black/60 to-black/30', slash: 'rgba(168,85,247,0.95)', warn: 'rgba(168,85,247,0.35)', bullet: 'rgba(200,120,255,0.95)' };
    return { bg: 'from-black/60 to-black/30', slash: 'rgba(34,211,238,0.95)', warn: 'rgba(34,211,238,0.35)', bullet: 'rgba(100,220,255,0.95)' };
  }, [pattern, enraged]);

  const diff = useMemo(
    () => ({ ...DEFAULT_DIFFICULTY, ...(difficulty ?? {}) }),
    [difficulty]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    setSlashes([]);
    slashRef.current = [];
    setBullets([]);
    bulletRef.current = [];
    hitCooldownRef.current = 0;
  }, [pattern, signature]);

  useEffect(() => {
    if (attackEnabled) {
      attackStartRef.current = performance.now();
    } else {
      attackStartRef.current = null;
      setSlashes([]);
      slashRef.current = [];
      setBullets([]);
      bulletRef.current = [];
    }
  }, [attackEnabled]);

  useEffect(() => {
    if (disabled) return;
    startRef.current = performance.now();
    lastTickRef.current = startRef.current;
    lastCommitRef.current = startRef.current;
    commitHeartRef.current = heartRef.current;

    const makeSlash = (x1: number, y1: number, x2: number, y2: number, thickness = 18): Slash => ({
      id: slashIdRef.current++,
      x1, y1, x2, y2, thickness,
      phase: 'telegraph',
      timer: 0,
      telegraphMs: diff.telegraphMs,
      strikeMs: diff.strikeMs,
      color: theme.slash,
    });

    const makeBullet = (x: number, y: number, vx: number, vy: number, radius = 6): Bullet => ({
      id: bulletIdRef.current++,
      x, y, vx, vy, radius,
      color: theme.bullet,
      life: 3.5,
    });

    const spawnPattern = () => {
      const newSlashes: Slash[] = [];
      const newBullets: Bullet[] = [];

      if (pattern === 'rain') {
        const lanes = 1 + Math.floor(Math.random() * Math.max(1, diff.maxSlashes));
        for (let i = 0; i < lanes; i++) {
          const x = 40 + Math.random() * (cfg.width - 80);
          newSlashes.push(makeSlash(x, 0, x, cfg.height, 16));
        }
      } else if (pattern === 'walls') {
        const y = 28 + Math.random() * (cfg.height - 56);
        newSlashes.push(makeSlash(0, y, cfg.width, y, 20));
      } else if (pattern === 'cross') {
        const diag = Math.random() > 0.5;
        if (diag) {
          newSlashes.push(makeSlash(0, 0, cfg.width, cfg.height, 18));
        } else {
          newSlashes.push(makeSlash(cfg.width, 0, 0, cfg.height, 18));
        }
      } else if (pattern === 'spiral') {
        const count = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI / (count - 1)) * i;
          const speed = 110 + Math.random() * 60;
          newBullets.push(makeBullet(
            cfg.width * 0.5,
            -8,
            Math.cos(angle - Math.PI / 2) * speed,
            Math.sin(angle - Math.PI / 2) * speed + 80,
            5 + Math.random() * 3
          ));
        }
      } else if (pattern === 'burst') {
        const hx = heartRef.current.x + cfg.heartSize / 2;
        const hy = heartRef.current.y + cfg.heartSize / 2;
        const count = 6 + (enraged ? 2 : 0);
        const origins = [
          [cfg.width / 2, -8],
          [cfg.width + 8, cfg.height / 2],
          [cfg.width / 2, cfg.height + 8],
          [-8, cfg.height / 2],
          [0, 0],
          [cfg.width, 0],
          [0, cfg.height],
          [cfg.width, cfg.height],
        ].slice(0, count);
        for (const [ox, oy] of origins) {
          const dx = hx - ox;
          const dy = hy - oy;
          const dist = Math.hypot(dx, dy) || 1;
          const speed = 130 + Math.random() * 40;
          newBullets.push(makeBullet(ox, oy, (dx / dist) * speed, (dy / dist) * speed, 7));
        }
      }

      // Boss signature slashes
      if (signature === 'dealerFan') {
        const cx = cfg.width * 0.5;
        const cy = cfg.height * 0.15;
        newSlashes.push(makeSlash(cx - 90, cy + 10, cx + 90, cfg.height - 10, 14));
        newSlashes.push(makeSlash(cx, cy, cx, cfg.height, 14));
      } else if (signature === 'pitSweep') {
        const y1 = 45 + Math.random() * (cfg.height - 90);
        const y2 = y1 + 28;
        newSlashes.push(makeSlash(0, y1, cfg.width, y1, 16));
        newSlashes.push(makeSlash(0, y2, cfg.width, y2, 16));
      } else if (signature === 'whaleWave') {
        newSlashes.push(makeSlash(20, cfg.height * 0.25, cfg.width - 20, cfg.height * 0.65, 18));
        newSlashes.push(makeSlash(20, cfg.height * 0.75, cfg.width - 20, cfg.height * 0.35, 18));
      } else if (signature === 'houseGrid') {
        newSlashes.push(makeSlash(cfg.width * 0.33, 0, cfg.width * 0.33, cfg.height, 14));
        newSlashes.push(makeSlash(cfg.width * 0.66, 0, cfg.width * 0.66, cfg.height, 14));
        newSlashes.push(makeSlash(0, cfg.height * 0.5, cfg.width, cfg.height * 0.5, 14));
      } else if (signature === 'shadowX') {
        newSlashes.push(makeSlash(0, 0, cfg.width, cfg.height, 20));
        newSlashes.push(makeSlash(cfg.width, 0, 0, cfg.height, 20));
      } else if (signature === 'kingCross') {
        newSlashes.push(makeSlash(cfg.width * 0.5, 0, cfg.width * 0.5, cfg.height, 20));
        newSlashes.push(makeSlash(0, cfg.height * 0.5, cfg.width, cfg.height * 0.5, 20));
      }

      if (newSlashes.length) {
        slashRef.current = [...slashRef.current, ...newSlashes];
        setSlashes(slashRef.current);
      }
      if (newBullets.length) {
        bulletRef.current = [...bulletRef.current, ...newBullets];
        setBullets(bulletRef.current);
      }
    };

    let spawnAcc = 0;

    const tick = (now: number) => {
      const dt = ((now - lastTickRef.current) / 1000) * timeScale;
      lastTickRef.current = now;

      // Heart movement via keyboard
      const speed = diff.moveSpeed * timeScale;
      const k = keysRef.current;
      const dx = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0);
      const dy = (k['arrowdown'] || k['s'] ? 1 : 0) - (k['arrowup'] || k['w'] ? 1 : 0);

      let nx = heartRef.current.x;
      let ny = heartRef.current.y;

      if (!disabled) {
        if (dx !== 0 || dy !== 0) {
          nx = clamp(heartRef.current.x + dx * speed * dt, 0, cfg.width - cfg.heartSize);
          ny = clamp(heartRef.current.y + dy * speed * dt, 0, cfg.height - cfg.heartSize);
        }
        // Pointer (touch/mouse drag) overrides keyboard: pull heart toward pointer
        if (pointerRef.current) {
          const px = clamp(pointerRef.current.x - cfg.heartSize / 2, 0, cfg.width - cfg.heartSize);
          const py = clamp(pointerRef.current.y - cfg.heartSize / 2, 0, cfg.height - cfg.heartSize);
          const ddx = px - heartRef.current.x;
          const ddy = py - heartRef.current.y;
          const mag = Math.hypot(ddx, ddy);
          if (mag > 1) {
            const pullSpeed = Math.min(mag / dt, speed * 4) * dt;
            nx = heartRef.current.x + (ddx / mag) * pullSpeed;
            ny = heartRef.current.y + (ddy / mag) * pullSpeed;
            nx = clamp(nx, 0, cfg.width - cfg.heartSize);
            ny = clamp(ny, 0, cfg.height - cfg.heartSize);
          }
        }
        if (nx !== heartRef.current.x || ny !== heartRef.current.y) {
          heartRef.current = { x: nx, y: ny };
        }
      }

      if (attackEnabled) {
        spawnAcc += dt * 1000;
        if (spawnAcc >= diff.cadenceMs) {
          spawnAcc = 0;
          spawnPattern();
        }
      } else {
        if (slashRef.current.length > 0) { slashRef.current = []; setSlashes([]); }
        if (bulletRef.current.length > 0) { bulletRef.current = []; setBullets([]); }
      }

      // Advance slashes
      const hx = heartRef.current.x;
      const hy = heartRef.current.y;
      const hc = cfg.heartSize * 0.65;
      const hcx = hx + cfg.heartSize / 2;
      const hcy = hy + cfg.heartSize / 2;

      let didHit = false;

      const nextSlashes = slashRef.current
        .map((s) => {
          const timer = s.timer + dt * 1000;
          if (s.phase === 'telegraph' && timer >= s.telegraphMs) {
            return { ...s, phase: 'strike' as SlashPhase, timer: 0 };
          }
          return { ...s, timer };
        })
        .filter((s) => !(s.phase === 'strike' && s.timer > s.strikeMs));

      // Advance bullets
      const nextBullets = bulletRef.current
        .map(b => ({ ...b, x: b.x + b.vx * dt, y: b.y + b.vy * dt, life: b.life - dt }))
        .filter(b => b.life > 0 && b.x > -20 && b.x < cfg.width + 20 && b.y > -20 && b.y < cfg.height + 20);

      if (hitCooldownRef.current > 0) hitCooldownRef.current -= dt;

      if (attackEnabled && hitCooldownRef.current <= 0) {
        // Slash collision
        for (const s of nextSlashes) {
          if (s.phase !== 'strike') continue;
          const d = distPointToSegment(hcx, hcy, s.x1, s.y1, s.x2, s.y2);
          if (d <= s.thickness / 2 + hc) { didHit = true; break; }
        }
        // Bullet collision
        if (!didHit) {
          for (const b of nextBullets) {
            const dx2 = hcx - b.x;
            const dy2 = hcy - b.y;
            if (Math.hypot(dx2, dy2) < b.radius + hc) { didHit = true; break; }
          }
        }
      }

      slashRef.current = nextSlashes;
      bulletRef.current = nextBullets;

      const commitEveryMs = 50;
      if (now - lastCommitRef.current >= commitEveryMs) {
        lastCommitRef.current = now;
        if (
          commitHeartRef.current.x !== heartRef.current.x ||
          commitHeartRef.current.y !== heartRef.current.y
        ) {
          commitHeartRef.current = heartRef.current;
          setHeart(heartRef.current);
        }
        setSlashes([...nextSlashes]);
        setBullets([...nextBullets]);
      }

      if (didHit) {
        hitCooldownRef.current = 0.35;
        playSound('lose');
        onHit({ damageEvent: 'playerHit' });
      }

      if (attackEnabled && attackStartRef.current != null && now - attackStartRef.current >= durationMs) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    attackEnabled,
    cfg.height,
    cfg.width,
    cfg.heartSize,
    diff.cadenceMs,
    diff.maxSlashes,
    diff.moveSpeed,
    diff.strikeMs,
    diff.telegraphMs,
    disabled,
    durationMs,
    enraged,
    onDone,
    onHit,
    pattern,
    signature,
    theme.bullet,
    theme.slash,
    timeScale,
  ]);

  // Touch / pointer events
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getRelPos = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const scaleX = cfg.width / rect.width;
      const scaleY = cfg.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons === 0 && e.pointerType === 'mouse') return;
      pointerRef.current = getRelPos(e.clientX, e.clientY);
    };
    const onPointerUp = () => { pointerRef.current = null; };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      pointerRef.current = getRelPos(t.clientX, t.clientY);
    };
    const onTouchEnd = () => { pointerRef.current = null; };

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [cfg.width, cfg.height]);

  const borderColor = jackpotFlash
    ? 'border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.8)]'
    : enraged
    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
    : 'border-gold/20';

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl border-2 ${borderColor} bg-gradient-to-b ${theme.bg} overflow-hidden transition-all duration-300 touch-none select-none ${className}`}
      style={{ cursor: 'crosshair' }}
    >
      <div className="absolute inset-0 scanlines pointer-events-none" aria-hidden />
      <div className="absolute inset-0 vignette opacity-70 pointer-events-none" aria-hidden />

      {jackpotFlash && (
        <div className="absolute inset-0 bg-yellow-400/20 animate-pulse pointer-events-none z-10 rounded-xl" />
      )}

      <div className="relative mx-auto" style={{ width: cfg.width, height: cfg.height }}>
        {/* Heart */}
        <div
          className="absolute transition-none"
          style={{
            left: heart.x,
            top: heart.y,
            width: cfg.heartSize,
            height: cfg.heartSize,
            transform: 'rotate(45deg)',
            background: enraged ? 'hsl(0 100% 70%)' : 'hsl(0 84% 60%)',
            boxShadow: enraged
              ? '0 0 24px rgba(255,100,100,0.9)'
              : '0 0 18px rgba(239,68,68,0.6)',
          }}
        />
        <div
          className="absolute"
          style={{
            left: heart.x - 3,
            top: heart.y - 3,
            width: cfg.heartSize + 6,
            height: cfg.heartSize + 6,
            border: '1px solid rgba(255,215,0,0.22)',
            borderRadius: 10,
            opacity: 0.7,
          }}
        />

        {/* SVG for slashes + bullets */}
        <svg width={cfg.width} height={cfg.height} className="absolute inset-0 pointer-events-none">
          {slashes.map((s) => (
            <line
              key={s.id}
              x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={s.phase === 'telegraph' ? theme.warn : s.color}
              strokeWidth={s.phase === 'telegraph' ? Math.max(6, s.thickness - 6) : s.thickness}
              strokeLinecap="round"
              opacity={s.phase === 'telegraph' ? 0.92 : 1}
            />
          ))}
          {bullets.map((b) => (
            <g key={b.id}>
              <circle cx={b.x} cy={b.y} r={b.radius + 4} fill={b.color} opacity={0.18} />
              <circle cx={b.x} cy={b.y} r={b.radius} fill={b.color} opacity={0.95} />
            </g>
          ))}
        </svg>
      </div>

      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground/80 font-display tracking-wider">
        {enraged ? '⚠ ENRAGED — ' : ''}WASD / arrows · drag to move
      </div>
    </div>
  );
};
