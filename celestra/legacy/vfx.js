// Canvas VFX Manager: Hitsparks, Afterimages, Dust Puffs, Screen Shake, Popups & Speech Bubbles

export class VFXManager {
  constructor() {
    this.sparks = [];
    this.dust = [];
    this.afterimages = [];
    this.popups = [];
    this.bubbles = [];
    this.rings = [];
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
  }

  reset() {
    this.sparks.length = 0;
    this.dust.length = 0;
    this.afterimages.length = 0;
    this.popups.length = 0;
    this.bubbles.length = 0;
    this.rings.length = 0;
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
  }

  triggerShake(magnitude = 6, frames = 10) {
    if (magnitude >= this.shakeMagnitude || this.shakeTime <= 0) {
      this.shakeMagnitude = magnitude;
      this.shakeTime = frames;
    }
  }

  spawnHitSparks(x, y, { blocked = false, heavy = false, color = "#ff9d2e" } = {}) {
    const count = blocked ? 10 : heavy ? 22 : 13;
    const baseColor = blocked ? "#52d1ff" : color;

    this.rings.push({
      x,
      y,
      r: 8,
      maxR: blocked ? 36 : heavy ? 68 : 44,
      alpha: 0.9,
      color: blocked ? "#88e6ff" : "#fff5cc",
      lineWidth: heavy ? 5 : 3
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (blocked ? 3 : heavy ? 8 : 5.5) + Math.random() * 6;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 10 + Math.floor(Math.random() * 10),
        maxLife: 20,
        size: (heavy ? 4 : 2.5) + Math.random() * 2.5,
        color: i % 3 === 0 ? "#ffffff" : baseColor
      });
    }
  }

  spawnSlashArc(x, y, facing, color = "#37f5ff") {
    this.rings.push({
      x: x + facing * 34,
      y: y - 70,
      r: 18,
      maxR: 86,
      alpha: 0.95,
      color,
      lineWidth: 6
    });
    for (let i = 0; i < 14; i++) {
      const angle = (facing > 0 ? -0.7 : Math.PI - 0.7) + Math.random() * 1.4;
      const spd = 5 + Math.random() * 7;
      this.sparks.push({
        x: x + facing * 28,
        y: y - 68,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 12 + Math.floor(Math.random() * 8),
        maxLife: 20,
        size: 3.5,
        color: i % 2 === 0 ? "#ffffff" : color
      });
    }
  }

  spawnDust(x, y, count = 6, spreadX = 3.2, color = "rgba(215, 222, 238, 0.65)") {
    for (let i = 0; i < count; i++) {
      this.dust.push({
        x: x + (Math.random() - 0.5) * 26,
        y: y - Math.random() * 10,
        vx: (Math.random() - 0.5) * spreadX * 2,
        vy: -0.6 - Math.random() * 1.8,
        r: 7 + Math.random() * 10,
        life: 16 + Math.floor(Math.random() * 12),
        maxLife: 28,
        color
      });
    }
  }

  spawnGroundShockwave(x, y, color = "#ffbe55") {
    this.spawnDust(x, y, 14, 5.5, "rgba(235, 220, 195, 0.78)");
    this.rings.push({
      x,
      y: y - 4,
      r: 14,
      maxR: 135,
      alpha: 0.95,
      color,
      lineWidth: 6
    });
  }

  spawnPoisonWisp(x, y) {
    this.dust.push({
      x: x + (Math.random() - 0.5) * 140,
      y: y - 20 - Math.random() * 95,
      vx: (Math.random() - 0.5) * 0.9,
      vy: -0.9 - Math.random() * 1.1,
      r: 10 + Math.random() * 12,
      life: 24 + Math.floor(Math.random() * 16),
      maxLife: 40,
      color: "rgba(95, 235, 95, 0.32)"
    });
  }

  spawnAfterimage(x, y, facing, color, radiusX = 26, height = 140) {
    this.afterimages.push({
      x,
      y,
      facing,
      color,
      radiusX,
      height,
      life: 14,
      maxLife: 14
    });
  }

  spawnPopup(x, y, text, color = "#ffdf5e", scale = 1) {
    this.popups.push({
      x,
      y,
      text,
      color,
      scale,
      vy: -1.15,
      life: 48,
      maxLife: 48
    });
  }

  spawnJokeBubble(fighterRef, text) {
    // Replace previous bubble from same fighter
    this.bubbles = this.bubbles.filter((b) => b.fighter !== fighterRef);
    this.bubbles.push({
      fighter: fighterRef,
      text,
      life: 165,
      maxLife: 165
    });
  }

  update() {
    if (this.shakeTime > 0) {
      this.shakeTime--;
      this.shakeMagnitude *= 0.86;
    } else {
      this.shakeMagnitude = 0;
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.91;
      s.vy *= 0.91;
      s.life--;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    for (let i = this.dust.length - 1; i >= 0; i--) {
      const d = this.dust[i];
      d.x += d.vx;
      d.y += d.vy;
      d.r += 0.35;
      d.life--;
      if (d.life <= 0) this.dust.splice(i, 1);
    }

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].life--;
      if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.r += (r.maxR - r.r) * 0.24;
      r.alpha *= 0.85;
      if (r.alpha < 0.04) this.rings.splice(i, 1);
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.y += p.vy;
      p.vy *= 0.96;
      p.life--;
      if (p.life <= 0) this.popups.splice(i, 1);
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      this.bubbles[i].life--;
      if (this.bubbles[i].life <= 0) this.bubbles.splice(i, 1);
    }
  }

  getShakeOffset() {
    if (this.shakeTime <= 0 || this.shakeMagnitude < 0.3) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.shakeMagnitude,
      y: (Math.random() - 0.5) * 2 * this.shakeMagnitude
    };
  }

  drawBack(ctx) {
    // Afterimages behind fighters
    for (const a of this.afterimages) {
      const alpha = (a.life / a.maxLife) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.ellipse(a.x, a.y - a.height * 0.52, a.radiusX, a.height * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Dust puffs
    for (const d of this.dust) {
      const alpha = d.life / d.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawFront(ctx) {
    // Shockwave rings
    for (const r of this.rings) {
      ctx.save();
      ctx.globalAlpha = r.alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lineWidth;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Sparks
    for (const s of this.sparks) {
      const alpha = s.life / s.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 1.9, s.y - s.vy * 1.9);
      ctx.stroke();
      ctx.restore();
    }

    // Joke Speech Bubbles
    for (const b of this.bubbles) {
      const f = b.fighter;
      const alpha = Math.min(1, b.life / 20);
      const bx = Math.max(130, Math.min(1150, f.x));
      const by = f.y - f.heightPx - 58;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "bold 13px 'Segoe UI', sans-serif";
      const textWidth = ctx.measureText(b.text).width;
      const padX = 14;
      const boxW = Math.max(140, textWidth + padX * 2);
      const boxH = 34;

      // Bubble body
      ctx.fillStyle = "#fffdf2";
      ctx.strokeStyle = "#1c2233";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(bx - boxW / 2, by - boxH, boxW, boxH, 10);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(bx - 8, by);
      ctx.lineTo(bx, by + 10);
      ctx.lineTo(bx + 8, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#161a24";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.text, bx, by - boxH / 2);
      ctx.restore();
    }

    // Floating status/damage popups
    for (const p of this.popups) {
      const alpha = Math.min(1, (p.life / p.maxLife) * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(18 * p.scale)}px Impact, "Arial Black", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#080a10";
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }
}
