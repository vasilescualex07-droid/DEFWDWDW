/* ========== JAVASCRIPT ========== */
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const state = {
    balance: 1000,
    currentBet: 50,
    running: false,
  };

  const els = {
    balance: $("#balance"),
    message: $("#message"),
    rewardList: $("#reward-list"),
    flash: $("#screen-flash"),
    dim: $("#screen-dim"),
    canvas: $("#vfx-canvas"),
    btnPlay: $("#btn-play"),
    btnSafe: $("#btn-safe"),
  };

  const particles = [];
  let rafId = null;
  let countUpRaf = null;

  function formatMoney(n) {
    return Math.round(n).toLocaleString();
  }

  function setMessage(text, kind) {
    els.message.textContent = text;
    els.message.classList.remove("message--win", "message--lose");
    if (kind === "win") els.message.classList.add("message--win");
    if (kind === "lose") els.message.classList.add("message--lose");
  }

  function animateCountTo(from, to, durationMs, onUpdate, done) {
    if (countUpRaf) cancelAnimationFrame(countUpRaf);
    const t0 = performance.now();
    function frame(t) {
      const u = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - u, 3);
      const v = from + (to - from) * eased;
      onUpdate(v);
      if (u < 1) countUpRaf = requestAnimationFrame(frame);
      else {
        countUpRaf = null;
        onUpdate(to);
        if (done) done();
      }
    }
    countUpRaf = requestAnimationFrame(frame);
  }

  function updateBalanceDisplay(value, classTick) {
    els.balance.textContent = formatMoney(value);
    if (classTick) {
      els.balance.classList.add(classTick);
      setTimeout(() => els.balance.classList.remove(classTick), 400);
    }
  }

  function resizeCanvas() {
    const c = els.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.floor(innerWidth * dpr);
    c.height = Math.floor(innerHeight * dpr);
    c.style.width = innerWidth + "px";
    c.style.height = innerHeight + "px";
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnCoins(cx, cy, count, intensity) {
    const n = Math.min(80, Math.floor(count * intensity));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 6 * intensity;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        size: 3 + Math.random() * 4 * intensity,
        spin: Math.random() * 0.2,
        rot: Math.random() * Math.PI,
      });
    }
  }

  function spawnSparks(cx, cy, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 10;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.03 + Math.random() * 0.04,
        size: 2,
        spin: 0,
        rot: 0,
        spark: true,
      });
    }
  }

  function loopParticles() {
    const ctx = els.canvas.getContext("2d");
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const g = 0.18;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += g;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.rot += p.spin;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.spark) {
        ctx.fillStyle = "#ffeeaa";
        ctx.shadowColor = "#ffcc33";
        ctx.shadowBlur = 8;
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      } else {
        ctx.fillStyle = "#e8c547";
        ctx.strokeStyle = "#8b6914";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (particles.length) rafId = requestAnimationFrame(loopParticles);
    else rafId = null;
  }

  function burstVFX(intensity) {
    const cx = innerWidth * 0.5;
    const cy = innerHeight * 0.35;
    spawnCoins(cx, cy, 24, intensity);
    spawnSparks(cx, cy, Math.floor(12 * intensity));
    if (!rafId) rafId = requestAnimationFrame(loopParticles);
  }

  function flashWin(strong) {
    els.flash.classList.add("is-on");
    setTimeout(() => els.flash.classList.remove("is-on"), strong ? 120 : 70);
  }

  function dimLoss(on) {
    els.dim.classList.toggle("is-on", on);
    setTimeout(() => els.dim.classList.remove("is-on"), on ? 320 : 0);
  }

  function clearBodyStates() {
    document.body.classList.remove("state-win", "state-lose", "state-bigwin");
  }

  function runFlipFate() {
    if (state.running) return;
    state.running = true;
    els.btnPlay.disabled = true;
    els.btnSafe.disabled = true;
    clearBodyStates();

    const bet = state.currentBet;
    const roll = Math.random();
    const winChance = 0.42;
    const mult = roll < winChance ? 1.8 + Math.random() * 2.2 : 0;
    const intensity = Math.min(2.2, 0.6 + bet / 120);

    const from = state.balance;

    if (mult > 0) {
      const payout = Math.floor(bet * mult);
      const profit = payout - bet;
      const to = from - bet + payout;
      const big = profit >= bet * 2.5;

      setMessage(`Win! ${mult.toFixed(2)}× — +${formatMoney(profit)} gold`, "win");
      document.body.classList.add("state-win");
      if (big) document.body.classList.add("state-bigwin");

      flashWin(big);
      burstVFX(intensity);
      els.btnPlay.classList.add("win-glow");
      setTimeout(() => els.btnPlay.classList.remove("win-glow"), 600);

      animateCountTo(from, to, big ? 420 : 280, (v) => updateBalanceDisplay(v, "win-tick"), () => {
        state.balance = to;
        updateBalanceDisplay(to);
      });

      staggerRewards(["Soul shard", "Luck residue", "House tears"], intensity);
    } else {
      const to = from - bet;
      setMessage(`Bust — ${formatMoney(bet)} gold lost`, "lose");
      document.body.classList.add("state-lose");
      dimLoss(true);
      spawnSparks(innerWidth * 0.5, innerHeight * 0.4, Math.floor(8 * intensity));
      if (!rafId) rafId = requestAnimationFrame(loopParticles);

      animateCountTo(from, to, 260, (v) => updateBalanceDisplay(v, "lose-tick"), () => {
        state.balance = Math.max(0, to);
        updateBalanceDisplay(state.balance);
      });
      els.rewardList.innerHTML = "";
    }

    setTimeout(() => {
      state.running = false;
      els.btnPlay.disabled = false;
      els.btnSafe.disabled = false;
    }, 450);
  }

  function runSafeScavenge() {
    if (state.running) return;
    state.running = true;
    els.btnPlay.disabled = true;
    els.btnSafe.disabled = true;
    clearBodyStates();

    const bet = Math.max(5, Math.floor(state.currentBet * 0.35));
    const gain = Math.floor(bet * (0.4 + Math.random() * 0.5));
    const from = state.balance;
    const to = from - bet + gain;
    const won = gain > bet;

    if (won) {
      setMessage(`Scavenge paid off: +${formatMoney(gain - bet)} net`, "win");
      document.body.classList.add("state-win");
      flashWin(false);
      burstVFX(0.75);
      animateCountTo(from, to, 300, (v) => updateBalanceDisplay(v, "win-tick"), () => {
        state.balance = to;
        updateBalanceDisplay(to);
      });
      staggerRewards(["Rusty chip"], 0.5);
    } else {
      setMessage(`Quiet run — net ${formatMoney(gain - bet)}`, "lose");
      document.body.classList.add("state-lose");
      dimLoss(false);
      animateCountTo(from, to, 280, (v) => updateBalanceDisplay(v, "lose-tick"), () => {
        state.balance = to;
        updateBalanceDisplay(to);
      });
      els.rewardList.innerHTML = "";
    }

    setTimeout(() => {
      state.running = false;
      els.btnPlay.disabled = false;
      els.btnSafe.disabled = false;
    }, 400);
  }

  function staggerRewards(labels, intensity) {
    els.rewardList.innerHTML = "";
    labels.forEach((label, i) => {
      const li = document.createElement("li");
      li.textContent = label;
      li.style.animationDelay = `${80 + i * 90}ms`;
      els.rewardList.appendChild(li);
    });
    void intensity;
  }

  function init() {
    updateBalanceDisplay(state.balance);
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    $$("[data-bet]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.currentBet = parseInt(btn.getAttribute("data-bet"), 10);
        $$("[data-bet]").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
    });
    const mid = $('[data-bet="50"]');
    if (mid) mid.classList.add("is-selected");

    els.btnPlay.addEventListener("click", runFlipFate);
    els.btnSafe.addEventListener("click", runSafeScavenge);

    setMessage("Choose a bet. Flip Fate for risk; Safe Scavenge for softer variance.");
  }

  init();
})();
