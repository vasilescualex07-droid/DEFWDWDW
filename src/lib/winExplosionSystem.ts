export type ExplosionType = 'radial' | 'spiral' | 'streak' | 'confetti';

export interface TriggerWinExplosionOptions {
  x?: number;
  y?: number;
  intensity?: number; // 0.5 - 6 (recommended)
  winTier?: 'small' | 'big' | 'jackpot';
  types?: ExplosionType[];
  randomOrigins?: boolean;
}

interface QueuedWave {
  at: number;
  x: number;
  y: number;
  intensity: number;
  type: ExplosionType;
}

interface ParticleInit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
  type: ExplosionType;
  gravity: number;
  drag: number;
  spin: number;
}

const PALETTE = ['#EAF2FF', '#9FE7FF', '#5FD4FF', '#A983FF', '#6F00FF', '#FFD700', '#FFB7FF'];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

class Particle {
  active = false;
  x = 0;
  y = 0;
  px = 0;
  py = 0;
  vx = 0;
  vy = 0;
  size = 2;
  life = 0;
  maxLife = 0;
  color = '#fff';
  gravity = 0;
  drag = 1;
  spin = 0;
  rot = 0;
  type: ExplosionType = 'radial';

  reset(init: ParticleInit) {
    this.active = true;
    this.x = init.x;
    this.y = init.y;
    this.px = init.x;
    this.py = init.y;
    this.vx = init.vx;
    this.vy = init.vy;
    this.size = init.size;
    this.life = init.life;
    this.maxLife = init.life;
    this.color = init.color;
    this.gravity = init.gravity;
    this.drag = init.drag;
    this.spin = init.spin;
    this.rot = 0;
    this.type = init.type;
  }

  update(dt: number) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }
    this.px = this.x;
    this.py = this.y;
    this.vx *= this.drag;
    this.vy = this.vy * this.drag + this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.spin * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    const t = this.life / this.maxLife;
    const alpha = t * t;
    // Trail
    ctx.globalAlpha = alpha * 0.35;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(1, this.size * 0.5);
    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // Body
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    if (this.type === 'confetti') {
      // Draw as slim shard (gacha-style crystal) instead of confetti card
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size * 0.45, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size * 0.45, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export class WinExplosionSystem {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private particles: Particle[];
  private waves: QueuedWave[] = [];
  private running = false;
  private rafId = 0;
  private last = 0;
  private flash = 0;
  private shake = 0;
  private flashEl?: HTMLDivElement;

  constructor(canvas: HTMLCanvasElement, flashEl?: HTMLDivElement, poolSize = 2200) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.canvas = canvas;
    this.flashEl = flashEl;
    this.particles = Array.from({ length: poolSize }, () => new Particle());
  }

  setFlashElement(el?: HTMLDivElement) {
    this.flashEl = el;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  triggerWinExplosion(options: TriggerWinExplosionOptions = {}) {
    const now = performance.now();
    const intensity = Math.max(0.5, Math.min(6, options.intensity ?? 1));
    const tier = options.winTier ?? (intensity >= 3.5 ? 'jackpot' : intensity >= 2 ? 'big' : 'small');
    const centerX = options.x ?? window.innerWidth * 0.5;
    const centerY = options.y ?? window.innerHeight * 0.42;
    const types = options.types?.length ? options.types : (['radial', 'spiral', 'streak'] as ExplosionType[]);

    const simultaneous = tier === 'jackpot' ? 3 : tier === 'big' ? 2 : 1;
    const chains = tier === 'jackpot' ? 5 : tier === 'big' ? 3 : 2;
    this.shake = Math.max(this.shake, tier === 'jackpot' ? 6 : tier === 'big' ? 4 : 2.2);
    this.flash = Math.max(this.flash, tier === 'jackpot' ? 0.24 : tier === 'big' ? 0.16 : 0.1);

    for (let c = 0; c < chains; c++) {
      const jitterDelay = c * rand(90, 170) + rand(0, 75); // 0.5-1.5s chains
      for (let s = 0; s < simultaneous; s++) {
        const ox =
          options.randomOrigins || tier === 'jackpot'
            ? centerX + rand(-220, 220)
            : centerX + rand(-90, 90);
        const oy =
          options.randomOrigins || tier === 'jackpot'
            ? centerY + rand(-130, 160)
            : centerY + rand(-60, 60);
        this.waves.push({
          at: now + jitterDelay + rand(-20, 40),
          x: ox,
          y: oy,
          intensity: intensity * rand(0.9, 1.2),
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
    }

    if (!this.running) this.start();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private start() {
    this.running = true;
    this.last = performance.now();
    this.loop();
  }

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;

    this.update(dt, now);
    this.draw();

    const hasActive = this.particles.some((p) => p.active) || this.waves.length > 0 || this.flash > 0.01 || this.shake > 0.1;
    if (!hasActive) {
      this.running = false;
      this.clear();
      return;
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, now: number) {
    // Spawn due waves
    if (this.waves.length) {
      const due = this.waves.filter((w) => w.at <= now);
      this.waves = this.waves.filter((w) => w.at > now);
      for (const w of due) this.spawnWave(w);
    }

    for (const p of this.particles) p.update(dt);

    // damp flash/shake
    this.flash *= 0.86;
    this.shake *= 0.88;
    if (this.flashEl) {
      this.flashEl.style.opacity = `${Math.max(0, Math.min(1, this.flash))}`;
    }
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.flashEl) this.flashEl.style.opacity = '0';
  }

  private draw() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // soft clear for trails
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(5,8,20,0.09)';
    ctx.fillRect(0, 0, w, h);

    if (this.shake > 0.2) {
      ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) p.draw(ctx);
    ctx.restore();
  }

  private getParticle(): Particle | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    return null;
  }

  private spawnWave(w: QueuedWave) {
    const countBase = Math.floor(24 * w.intensity);
    if (w.type === 'radial') this.spawnRadial(w.x, w.y, countBase);
    else if (w.type === 'spiral') this.spawnSpiral(w.x, w.y, countBase);
    else if (w.type === 'streak') this.spawnStreaks(w.x, w.y, countBase);
    else this.spawnConfetti(w.x, w.y, countBase);
  }

  private spawnRadial(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;
      const a = (i / count) * Math.PI * 2 + rand(-0.18, 0.18);
      const spd = rand(90, 300);
      p.reset({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: rand(1.6, 4.8),
        life: rand(0.4, 0.9),
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        type: 'radial',
        gravity: rand(12, 70),
        drag: rand(0.95, 0.989),
        spin: rand(-12, 12),
      });
    }
  }

  private spawnSpiral(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;
      const t = i / Math.max(1, count);
      const a = t * Math.PI * 8 + rand(-0.1, 0.1);
      const spd = rand(80, 240);
      p.reset({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 46,
        size: rand(1.4, 3.7),
        life: rand(0.55, 1.1),
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        type: 'spiral',
        gravity: rand(8, 44),
        drag: rand(0.955, 0.99),
        spin: rand(-20, 20),
      });
    }
  }

  private spawnStreaks(x: number, y: number, count: number) {
    const dir = rand(-0.15, 0.15); // near vertical rays
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;
      const a = dir + rand(-0.22, 0.22) - Math.PI / 2;
      const spd = rand(280, 460);
      p.reset({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd + rand(-40, 40),
        size: rand(1.5, 3.8),
        life: rand(0.25, 0.7),
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        type: 'streak',
        gravity: rand(0, 20),
        drag: rand(0.963, 0.994),
        spin: rand(-8, 8),
      });
    }
  }

  private spawnConfetti(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;
      const a = rand(-Math.PI, Math.PI);
      const spd = rand(100, 360);
      p.reset({
        x: x + rand(-20, 20),
        y: y + rand(-14, 14),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - rand(50, 150),
        size: rand(2.8, 6.2),
        life: rand(0.8, 1.8),
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        type: 'confetti',
        gravity: rand(180, 320),
        drag: rand(0.965, 0.992),
        spin: rand(-24, 24),
      });
    }
  }
}

