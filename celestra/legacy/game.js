import { sound } from "./audio.js";
import { VFXManager } from "./vfx.js";
import { ROSTER, PAULITE_JOKES, getRosterFighter, drawFighter, drawPortrait } from "./fighters.js";

const CANVAS_W = 1280;
const CANVAS_H = 720;
const GROUND_Y = 595;
const STAGE_LEFT = 48;
const STAGE_RIGHT = 1232;
const GRAVITY = 0.68;
const FIXED_DT = 1000 / 60;

// -------------------- INPUT MANAGER --------------------
class InputManager {
  constructor() {
    this.down = new Set();
    this.justPressed = new Set();
    this.virtualDown = new Set();

    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.down.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.down.add(e.code);
      sound.unlock();
    });

    window.addEventListener("keyup", (e) => {
      this.down.delete(e.code);
    });

    window.addEventListener("blur", () => {
      this.down.clear();
      this.virtualDown.clear();
    });
  }

  pressVirtual(code) {
    sound.unlock();
    if (!this.virtualDown.has(code)) {
      this.justPressed.add(code);
    }
    this.virtualDown.add(code);
  }

  releaseVirtual(code) {
    this.virtualDown.delete(code);
  }

  isDown(code) {
    return this.down.has(code) || this.virtualDown.has(code);
  }

  wasPressed(code) {
    return this.justPressed.has(code);
  }

  endFrame() {
    this.justPressed.clear();
  }

  getPlayerInput(playerIndex) {
    if (playerIndex === 0) {
      return {
        left: this.isDown("KeyA"),
        right: this.isDown("KeyD"),
        up: this.isDown("KeyW"),
        down: this.isDown("KeyS"),
        leftJust: this.wasPressed("KeyA"),
        rightJust: this.wasPressed("KeyD"),
        upJust: this.wasPressed("KeyW"),
        downJust: this.wasPressed("KeyS"),
        light: this.wasPressed("KeyU"),
        heavy: this.wasPressed("KeyI"),
        launcher: this.wasPressed("KeyO"),
        signature: this.wasPressed("KeyP")
      };
    }
    return {
      left: this.isDown("ArrowLeft"),
      right: this.isDown("ArrowRight"),
      up: this.isDown("ArrowUp"),
      down: this.isDown("ArrowDown"),
      leftJust: this.wasPressed("ArrowLeft"),
      rightJust: this.wasPressed("ArrowRight"),
      upJust: this.wasPressed("ArrowUp"),
      downJust: this.wasPressed("ArrowDown"),
      light: this.wasPressed("KeyJ") || this.wasPressed("Numpad1"),
      heavy: this.wasPressed("KeyK") || this.wasPressed("Numpad2"),
      launcher: this.wasPressed("KeyL") || this.wasPressed("Numpad3"),
      signature: this.wasPressed("Semicolon") || this.wasPressed("Numpad4")
    };
  }
}

// -------------------- AI CONTROLLER --------------------
class AIController {
  constructor(difficulty = "normal") {
    this.difficulty = difficulty;
    this.cooldown = 0;
    this.holdMove = 0; // -1 left, 0 none, 1 right
    this.holdCrouch = false;
    this.holdTimer = 0;
    this.wantChain = null;
  }

  decide(ai, opp) {
    const out = {
      left: false, right: false, up: false, down: false,
      leftJust: false, rightJust: false, upJust: false, downJust: false,
      light: false, heavy: false, launcher: false, signature: false
    };

    const cfg = {
      easy:   { reaction: 18, blockChance: 0.25, lowBlockChance: 0.12, aggro: 0.35, sigChance: 0.2, comboChance: 0.2 },
      normal: { reaction: 9,  blockChance: 0.58, lowBlockChance: 0.36, aggro: 0.62, sigChance: 0.48, comboChance: 0.55 },
      hard:   { reaction: 3,  blockChance: 0.86, lowBlockChance: 0.72, aggro: 0.85, sigChance: 0.75, comboChance: 0.88 }
    }[this.difficulty] || { reaction: 9, blockChance: 0.58, lowBlockChance: 0.36, aggro: 0.62, sigChance: 0.48, comboChance: 0.55 };

    const dx = opp.x - ai.x;
    const dist = Math.abs(dx);
    const dirToOpp = dx >= 0 ? 1 : -1;

    // Chain JOG Hit 2 Silence automatically on Hit 1 confirm
    if (ai.def.id === "jog" && ai.canChainSig2 && Math.random() < cfg.comboChance + 0.15) {
      out.signature = true;
      return out;
    }

    // Chain jab string or air juggle follow-up
    if (this.wantChain && ai.state === "attack") {
      const m = ai.currentMove;
      if (m && ai.stateFrame >= m.startup + 2) {
        out[this.wantChain] = true;
        this.wantChain = null;
        return out;
      }
    }

    // Defensive blocking when opponent attacks nearby
    if (opp.state === "attack" && dist < 165 && Math.random() < cfg.blockChance) {
      const awayKey = ai.facing > 0 ? "left" : "right";
      out[awayKey] = true;
      const oppMove = opp.currentMove;
      if (oppMove && oppMove.hitLevel === "LOW" && Math.random() < cfg.lowBlockChance) {
        out.down = true;
      }
      return out;
    }

    // Juggle follow-up when opponent is airborne in juggle state
    if (opp.state === "juggle" && dist < 130 && ai.state !== "attack") {
      if (Math.random() < cfg.comboChance) {
        if (ai.sigCooldown <= 0 && ai.statuses.silence <= 0 && Math.random() < 0.45) {
          out.signature = true;
        } else {
          out.heavy = true;
        }
        return out;
      }
    }

    if (this.holdTimer > 0) {
      this.holdTimer--;
      if (this.holdMove < 0) out.left = true;
      if (this.holdMove > 0) out.right = true;
      if (this.holdCrouch) out.down = true;
    }

    if (this.cooldown > 0) {
      this.cooldown--;
      return out;
    }

    this.cooldown = cfg.reaction + Math.floor(Math.random() * 8);

    // Spacing & approach
    if (dist > 145) {
      // Long range signature options (Dap Kick, Johan Roll, Apsay Teleport)
      if (
        ai.sigCooldown <= 0 &&
        ai.statuses.silence <= 0 &&
        dist < 320 &&
        ["apsay", "dap", "johan"].includes(ai.def.id) &&
        Math.random() < cfg.sigChance * 0.65
      ) {
        out.signature = true;
        return out;
      }
      this.holdMove = dirToOpp;
      this.holdCrouch = false;
      this.holdTimer = 14 + Math.floor(Math.random() * 12);
      if (Math.random() < 0.14 && ai.grounded) out.up = true;
      return out;
    }

    // Close/mid combat decisions
    if (Math.random() < cfg.aggro) {
      const roll = Math.random();
      if (ai.sigCooldown <= 0 && ai.statuses.silence <= 0 && roll < cfg.sigChance * 0.45) {
        out.signature = true;
      } else if (roll < 0.35) {
        out.light = true;
        if (Math.random() < cfg.comboChance) this.wantChain = "heavy";
      } else if (roll < 0.58) {
        out.down = true;
        out.heavy = true; // Sweep mixup
      } else if (roll < 0.78) {
        out.heavy = true;
      } else if (roll < 0.92) {
        out.launcher = true; // Launcher
      } else {
        // Close throw
        if (ai.facing > 0) out.right = true;
        else out.left = true;
        out.launcher = true;
      }
    } else {
      // Back off or crouch block
      this.holdMove = -dirToOpp;
      this.holdCrouch = Math.random() < 0.35;
      this.holdTimer = 12;
    }

    return out;
  }
}

// -------------------- FIGHTER INSTANCE --------------------
function createFighter(def, playerIndex, x, facing) {
  return {
    def,
    heightPx: def.heightPx,
    playerIndex,
    x,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing,
    grounded: true,
    crouching: false,

    hp: def.maxHp,
    maxHp: def.maxHp,
    trailHp: def.maxHp,
    roundsWon: 0,

    state: "idle", // idle, walk_f, walk_b, crouch, jump, dash, backdash, attack, block, crouch_block, hitstun, juggle, knockdown, ko, victory
    stateFrame: 0,
    stunFrames: 0,
    juggleHits: 0,

    currentMoveId: null,
    currentMove: null,
    moveHitConnected: false,
    chainCount: 0,
    canChainSig2: false,
    armorHits: 0,

    sigCooldown: 0,
    sigMaxCooldown: def.moves.signature.cooldown || 100,

    // Double-tap dash & BDC tracking
    lastTapDir: 0,
    tapWindow: 0,

    // Status effects (in frames)
    statuses: {
      silence: 0,
      bleed: 0,
      sad: 0,
      poison: 0
    },
    bleedTickTimer: 0,
    poisonTickTimer: 0,
    jokeTimer: def.id === "paulite" ? 260 : 0,

    // Match stats
    damageDealt: 0,
    maxCombo: 0,
    comboCount: 0,
    comboDamage: 0,
    comboResetTimer: 0
  };
}

// -------------------- STAGE RENDERER --------------------
function drawStage(ctx, stageId, time) {
  if (stageId === "alley") {
    // Neon Cyber Alley
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, "#09061a");
    sky.addColorStop(0.65, "#191038");
    sky.addColorStop(1, "#2a1647");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Distant skyline + neon signs
    const buildings = [
      [40, 180, 140, 415, "#110d24"],
      [190, 130, 160, 465, "#151030"],
      [370, 210, 145, 385, "#100c22"],
      [540, 145, 200, 450, "#161133"],
      [770, 190, 150, 405, "#100c22"],
      [940, 120, 175, 475, "#151030"],
      [1130, 175, 130, 420, "#110d24"]
    ];
    for (const [bx, by, bw, bh, col] of buildings) {
      ctx.fillStyle = col;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "rgba(42, 232, 255, 0.22)";
      for (let wy = by + 22; wy < GROUND_Y - 60; wy += 32) {
        for (let wx = bx + 18; wx < bx + bw - 22; wx += 28) {
          if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 12, 16);
        }
      }
    }

    // Neon Billboard
    ctx.save();
    ctx.strokeStyle = "#ff2e88";
    ctx.shadowColor = "#ff2e88";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.strokeRect(545, 175, 190, 68);
    ctx.fillStyle = "rgba(255, 46, 136, 0.14)";
    ctx.fillRect(545, 175, 190, 68);
    ctx.font = "900 26px Impact, sans-serif";
    ctx.fillStyle = "#ff85bc";
    ctx.textAlign = "center";
    ctx.fillText("BATCH 30", 640, 214);
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "#48f2ff";
    ctx.fillText("CYBER ARENA", 640, 232);
    ctx.restore();

    // Wet neon floor
    const floor = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floor.addColorStop(0, "#1b1633");
    floor.addColorStop(1, "#090712");
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Perspective grid lines
    ctx.strokeStyle = "rgba(42, 232, 255, 0.26)";
    ctx.lineWidth = 1.5;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2 + i * 90, GROUND_Y);
      ctx.lineTo(CANVAS_W / 2 + i * 210, CANVAS_H);
      ctx.stroke();
    }
    ctx.strokeStyle = "#ff2e88";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
    return;
  }

  if (stageId === "classroom") {
    // Batch 30 Hall
    ctx.fillStyle = "#1c222e";
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Wall paneling
    ctx.fillStyle = "#252d3d";
    ctx.fillRect(0, 120, CANVAS_W, GROUND_Y - 120);

    // Chalkboard
    ctx.fillStyle = "#173d2c";
    ctx.strokeStyle = "#6e4b2a";
    ctx.lineWidth = 10;
    ctx.fillRect(340, 155, 600, 220);
    ctx.strokeRect(340, 155, 600, 220);

    ctx.fillStyle = "rgba(240, 248, 240, 0.72)";
    ctx.font = "bold 28px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BATCH 30 CHRONICLES", 640, 235);
    ctx.font = "16px monospace";
    ctx.fillStyle = "rgba(180, 240, 210, 0.65)";
    ctx.fillText("while (alive) { frameData(); backDashCancel(); }", 640, 275);
    ctx.fillText("NO MERCY ON FRIDAYS", 640, 315);

    // Windows
    for (const wx of [90, 1020]) {
      ctx.fillStyle = "#111b30";
      ctx.strokeStyle = "#3a455e";
      ctx.lineWidth = 5;
      ctx.fillRect(wx, 160, 170, 210);
      ctx.strokeRect(wx, 160, 170, 210);
    }

    // Tiled Floor
    const floor = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floor.addColorStop(0, "#3b3f4a");
    floor.addColorStop(1, "#1e2028");
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= CANVAS_W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x + (x - 640) * 0.4, CANVAS_H);
      ctx.stroke();
    }
    ctx.strokeStyle = "#5c6478";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
    return;
  }

  // Default: Rooftop Dojo
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, "#121329");
  sky.addColorStop(0.5, "#4b2342");
  sky.addColorStop(1, "#c75d38");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

  // Giant Sun
  const sunGrad = ctx.createRadialGradient(640, 390, 20, 640, 390, 175);
  sunGrad.addColorStop(0, "#ffe48f");
  sunGrad.addColorStop(0.65, "rgba(255, 118, 56, 0.85)");
  sunGrad.addColorStop(1, "rgba(255, 118, 56, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(640, 390, 175, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountain silhouette & Pagoda
  ctx.fillStyle = "#1c1326";
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(220, 410);
  ctx.lineTo(470, 500);
  ctx.lineTo(790, 385);
  ctx.lineTo(1060, 470);
  ctx.lineTo(1280, 390);
  ctx.lineTo(1280, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Dojo Railings & Lanterns
  ctx.fillStyle = "#26181a";
  ctx.fillRect(0, GROUND_Y - 56, CANVAS_W, 8);
  for (let x = 80; x < CANVAS_W; x += 220) {
    ctx.fillStyle = "#26181a";
    ctx.fillRect(x - 6, GROUND_Y - 62, 12, 62);
    // Warm paper lantern
    const glow = 0.75 + 0.25 * Math.sin(time * 0.08 + x);
    ctx.fillStyle = `rgba(255, 185, 70, ${glow})`;
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y - 82, 13, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wooden Dojo Floor
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
  floor.addColorStop(0, "#4e3022");
  floor.addColorStop(1, "#21120c");
  ctx.fillStyle = floor;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 2;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(640 + i * 80, GROUND_Y);
    ctx.lineTo(640 + i * 165, CANVAS_H);
    ctx.stroke();
  }

  ctx.strokeStyle = "#d99252";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_W, GROUND_Y);
  ctx.stroke();

  // Arena corner markers
  ctx.fillStyle = "rgba(255, 190, 90, 0.3)";
  ctx.fillRect(STAGE_LEFT - 4, GROUND_Y - 12, 4, 12);
  ctx.fillRect(STAGE_RIGHT, GROUND_Y - 12, 4, 12);
}

// -------------------- MAIN GAME ENGINE & UI CONTROLLER --------------------
class Batch30Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.input = new InputManager();
    this.vfx = new VFXManager();

    this.mode = "1p"; // '1p' | '2p'
    this.difficulty = "normal";
    this.stageId = "dojo";
    this.p1Id = "apsay";
    this.p2Id = "dap";
    this.selectingFor = "p1";

    this.screen = "title"; // 'title' | 'select' | 'fight'
    this.paused = false;
    this.time = 0;
    this.accumulator = 0;
    this.lastTime = performance.now();

    // Match state
    this.p1 = null;
    this.p2 = null;
    this.ai = null;
    this.round = 1;
    this.timerFrames = 99 * 60;
    this.hitstop = 0;
    this.phase = "intro"; // 'intro' | 'fight' | 'round_end' | 'match_end'
    this.phaseTimer = 0;
    this.bannerText = "";
    this.bannerSub = "";

    this._initDOM();
    this._buildRosterUI();
    this._buildModalRoster();
    this._updatePreviews();
    this._loop(performance.now());
  }

  _initDOM() {
    this.screens = {
      title: document.getElementById("screen-title"),
      select: document.getElementById("screen-select"),
      fight: document.getElementById("screen-fight")
    };

    // Audio controls
    const btnMute = document.getElementById("btn-mute");
    const muteIcon = document.getElementById("mute-icon");
    const volSlider = document.getElementById("volume-slider");

    const savedVol = localStorage.getItem("b30_vol");
    const savedMute = localStorage.getItem("b30_mute") === "1";
    if (savedVol !== null) {
      volSlider.value = savedVol;
      sound.setVolume(Number(savedVol) / 100);
    }
    sound.setMuted(savedMute);
    muteIcon.textContent = savedMute ? "🔇" : "🔊";

    btnMute.addEventListener("click", () => {
      sound.setMuted(!sound.muted);
      muteIcon.textContent = sound.muted ? "🔇" : "🔊";
      localStorage.setItem("b30_mute", sound.muted ? "1" : "0");
    });

    volSlider.addEventListener("input", () => {
      sound.setVolume(Number(volSlider.value) / 100);
      localStorage.setItem("b30_vol", volSlider.value);
      if (sound.muted && Number(volSlider.value) > 0) {
        sound.setMuted(false);
        muteIcon.textContent = "🔊";
        localStorage.setItem("b30_mute", "0");
      }
    });

    // Difficulty buttons
    document.querySelectorAll(".diff-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        sound.playUISelect();
        document.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.difficulty = btn.dataset.diff;
      });
    });

    // Stage sync
    const stageTitle = document.getElementById("stage-select-title");
    const stageChar = document.getElementById("stage-select-char");
    const syncStage = (val) => {
      this.stageId = val;
      stageTitle.value = val;
      stageChar.value = val;
      sound.playUISelect();
    };
    stageTitle.addEventListener("change", (e) => syncStage(e.target.value));
    stageChar.addEventListener("change", (e) => syncStage(e.target.value));

    // Mode select buttons
    document.getElementById("btn-mode-1p").addEventListener("click", () => {
      sound.playUIConfirm();
      this.mode = "1p";
      this.selectingFor = "p1";
      this._showScreen("select");
    });

    document.getElementById("btn-mode-2p").addEventListener("click", () => {
      sound.playUIConfirm();
      this.mode = "2p";
      this.selectingFor = "p1";
      this._showScreen("select");
    });

    document.getElementById("btn-select-back").addEventListener("click", () => {
      sound.playUISelect();
      this._showScreen("title");
    });

    // Click P1 or P2 preview panels to switch who you're selecting
    document.querySelector(".p1-panel").addEventListener("click", () => {
      this.selectingFor = "p1";
      sound.playUISelect();
      this._refreshSelectPrompt();
    });
    document.querySelector(".p2-panel").addEventListener("click", () => {
      this.selectingFor = "p2";
      sound.playUISelect();
      this._refreshSelectPrompt();
    });

    document.getElementById("btn-random-cpu").addEventListener("click", () => {
      const idx = Math.floor(Math.random() * ROSTER.length);
      this.p2Id = ROSTER[idx].id;
      sound.playUISelect();
      this._updatePreviews();
    });

    document.getElementById("btn-start-match").addEventListener("click", () => {
      sound.playUIConfirm();
      this.startMatch();
    });

    // Move List Modal
    const modal = document.getElementById("modal-movelist");
    const openModal = () => {
      modal.classList.remove("hidden");
      if (this.screen === "fight" && !this.paused && this.phase !== "match_end") {
        this._togglePause(true);
      }
      sound.playUISelect();
    };
    const closeModal = () => {
      modal.classList.add("hidden");
      sound.playUISelect();
    };
    document.getElementById("btn-movelist").addEventListener("click", openModal);
    document.getElementById("btn-fight-moves").addEventListener("click", openModal);
    document.getElementById("btn-close-modal").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Pause / Victory overlay buttons
    document.getElementById("btn-pause").addEventListener("click", () => this._togglePause());
    document.getElementById("btn-resume").addEventListener("click", () => this._togglePause(false));
    document.getElementById("btn-rematch").addEventListener("click", () => {
      sound.playUIConfirm();
      this.startMatch();
    });
    document.getElementById("btn-to-select").addEventListener("click", () => {
      sound.playUISelect();
      this._showScreen("select");
    });
    document.getElementById("btn-to-menu").addEventListener("click", () => {
      sound.playUISelect();
      this._showScreen("title");
    });

    // Global shortcuts (Esc pause, M mute, Tab modal)
    window.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        if (!modal.classList.contains("hidden")) {
          closeModal();
        } else if (this.screen === "fight" && this.phase !== "match_end") {
          this._togglePause();
        }
      } else if (e.code === "KeyM" && document.activeElement.tagName !== "INPUT") {
        btnMute.click();
      } else if (e.code === "Tab") {
        e.preventDefault();
        if (modal.classList.contains("hidden")) openModal();
        else closeModal();
      }
    });

    // Touch controls binding
    document.querySelectorAll(".t-btn").forEach((btn) => {
      const code = btn.dataset.key;
      const press = (e) => {
        e.preventDefault();
        this.input.pressVirtual(code);
      };
      const release = (e) => {
        e.preventDefault();
        this.input.releaseVirtual(code);
      };
      btn.addEventListener("pointerdown", press);
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointercancel", release);
      btn.addEventListener("pointerleave", release);
    });
  }

  _showScreen(name) {
    this.screen = name;
    this.paused = false;
    document.getElementById("fight-overlay").classList.add("hidden");
    Object.entries(this.screens).forEach(([k, el]) => {
      el.classList.toggle("active", k === name);
    });
    if (name === "select") {
      this._refreshSelectPrompt();
      this._updatePreviews();
    }
  }

  _refreshSelectPrompt() {
    const p2Tag = document.getElementById("p2-panel-tag");
    p2Tag.textContent = this.mode === "1p" ? `CPU (${this.difficulty.toUpperCase()})` : "P2";

    const prompt = document.getElementById("select-prompt");
    if (this.selectingFor === "p1") {
      prompt.textContent = "Selecting for PLAYER 1 (Click P2/CPU panel to change opponent)";
    } else {
      prompt.textContent = this.mode === "1p"
        ? "Selecting CPU OPPONENT (Click P1 panel to change P1)"
        : "Selecting for PLAYER 2";
    }
  }

  _buildRosterUI() {
    const grid = document.getElementById("roster-grid");
    grid.innerHTML = "";
    this.cardCanvases = [];

    for (const f of ROSTER) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "fighter-card";
      card.dataset.id = f.id;

      const badges = document.createElement("div");
      badges.className = "card-badges";
      badges.innerHTML = `<span class="card-badge badge-p1 hidden">P1</span><span class="card-badge badge-p2 hidden">P2</span>`;

      const c = document.createElement("canvas");
      c.width = 110;
      c.height = 110;
      this.cardCanvases.push({ id: f.id, canvas: c });

      const name = document.createElement("div");
      name.className = "fighter-card-name";
      name.textContent = f.name;

      const meta = document.createElement("div");
      meta.className = "fighter-card-meta";
      meta.textContent = `${f.heightLabel} • ${f.archetype.split("/")[0].trim()}`;

      card.append(badges, c, name, meta);
      card.addEventListener("click", () => {
        sound.playUISelect();
        if (this.selectingFor === "p1") {
          this.p1Id = f.id;
          if (this.mode === "2p") this.selectingFor = "p2";
        } else {
          this.p2Id = f.id;
          if (this.mode === "2p") this.selectingFor = "p1";
        }
        this._refreshSelectPrompt();
        this._updatePreviews();
      });

      grid.appendChild(card);
    }
  }

  _buildModalRoster() {
    const list = document.getElementById("modal-roster-list");
    list.innerHTML = ROSTER.map((f) => `
      <div class="modal-fighter-item">
        <h4>${f.name} <span>${f.heightLabel} • ${f.archetype}</span></h4>
        <p><strong>${f.abilityTitle}:</strong> ${f.abilityDesc}</p>
        ${f.passiveTitle ? `<p style="margin-top:5px;"><strong>${f.passiveTitle}:</strong> ${f.passiveDesc}</p>` : ""}
      </div>
    `).join("");
  }

  _updatePreviews() {
    const fillPanel = (prefix, fighterId) => {
      const f = getRosterFighter(fighterId);
      document.getElementById(`${prefix}-name`).textContent = f.name;
      document.getElementById(`${prefix}-height`).textContent = f.heightLabel;
      document.getElementById(`${prefix}-archetype`).textContent = f.archetype;

      const statsEl = document.getElementById(`${prefix}-stats`);
      statsEl.innerHTML = [
        ["PWR", f.stats.power],
        ["SPD", f.stats.speed],
        ["DEF", f.stats.defense],
        ["SPC", f.stats.special]
      ].map(([label, val]) => `
        <div class="stat-row">
          <span>${label}</span>
          <div class="stat-track"><div class="stat-fill" style="width:${val}%"></div></div>
        </div>
      `).join("");

      const abEl = document.getElementById(`${prefix}-abilities`);
      abEl.innerHTML = `
        <strong>${f.abilityTitle}</strong>
        <div>${f.abilityDesc}</div>
        ${f.passiveTitle ? `<div class="passive-note"><strong>${f.passiveTitle}</strong><div>${f.passiveDesc}</div></div>` : ""}
      `;
    };

    fillPanel("p1", this.p1Id);
    fillPanel("p2", this.p2Id);

    // Highlight cards
    document.querySelectorAll(".fighter-card").forEach((card) => {
      const id = card.dataset.id;
      const isP1 = id === this.p1Id;
      const isP2 = id === this.p2Id;
      card.classList.toggle("selected-p1", isP1);
      card.classList.toggle("selected-p2", isP2);
      card.querySelector(".badge-p1").classList.toggle("hidden", !isP1);
      const b2 = card.querySelector(".badge-p2");
      b2.classList.toggle("hidden", !isP2);
      b2.textContent = this.mode === "1p" ? "CPU" : "P2";
    });
  }

  // -------------------- MATCH LIFECYCLE --------------------
  startMatch() {
    this._showScreen("fight");
    this.vfx.reset();
    this.round = 1;
    this.p1 = createFighter(getRosterFighter(this.p1Id), 0, 360, 1);
    this.p2 = createFighter(getRosterFighter(this.p2Id), 1, 920, -1);
    this.ai = this.mode === "1p" ? new AIController(this.difficulty) : null;
    this._startRound();
  }

  _startRound() {
    const resetRoundFighter = (f, x, facing) => {
      f.x = x;
      f.y = GROUND_Y;
      f.vx = 0;
      f.vy = 0;
      f.facing = facing;
      f.grounded = true;
      f.crouching = false;
      f.hp = f.maxHp;
      f.trailHp = f.maxHp;
      f.state = "idle";
      f.stateFrame = 0;
      f.stunFrames = 0;
      f.juggleHits = 0;
      f.currentMoveId = null;
      f.currentMove = null;
      f.moveHitConnected = false;
      f.chainCount = 0;
      f.canChainSig2 = false;
      f.armorHits = 0;
      f.sigCooldown = 0;
      f.statuses = { silence: 0, bleed: 0, sad: 0, poison: 0 };
      f.bleedTickTimer = 0;
      f.poisonTickTimer = 0;
      f.jokeTimer = f.def.id === "paulite" ? 260 : 0;
      f.comboCount = 0;
      f.comboDamage = 0;
      f.comboResetTimer = 0;
    };

    resetRoundFighter(this.p1, 360, 1);
    resetRoundFighter(this.p2, 920, -1);
    this.vfx.reset();
    this.timerFrames = 99 * 60;
    this.hitstop = 0;
    this.phase = "intro";
    this.phaseTimer = 105;
    this.bannerText = `ROUND ${this.round}`;
    this.bannerSub = "GET READY";
    sound.playAnnouncer("round");
  }

  _togglePause(forceState = null) {
    if (this.screen !== "fight" || this.phase === "match_end") return;
    this.paused = forceState !== null ? forceState : !this.paused;
    const overlay = document.getElementById("fight-overlay");
    if (this.paused) {
      document.getElementById("overlay-eyebrow").textContent = "PAUSED";
      document.getElementById("overlay-title").textContent = "MATCH PAUSED";
      document.getElementById("overlay-stats").textContent = "Take a breather or check the Move List.";
      document.getElementById("btn-resume").classList.remove("hidden");
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
    }
  }

  _loop(now) {
    const elapsed = Math.min(80, now - this.lastTime);
    this.lastTime = now;
    this.time++;

    if (this.screen === "select") {
      // Animate portraits lightly
      if (this.time % 2 === 0) {
        drawPortrait(document.getElementById("preview-p1"), this.p1Id, this.time);
        drawPortrait(document.getElementById("preview-p2"), this.p2Id, this.time);
        for (const item of this.cardCanvases) {
          drawPortrait(item.canvas, item.id, this.time);
        }
      }
    } else if (this.screen === "fight" && !this.paused) {
      this.accumulator += elapsed;
      while (this.accumulator >= FIXED_DT) {
        this._fixedStep();
        this.accumulator -= FIXED_DT;
      }
      this._renderArena();
    }

    requestAnimationFrame((t) => this._loop(t));
  }

  // -------------------- FIXED 60 FPS COMBAT STEP --------------------
  _fixedStep() {
    this.vfx.update();

    // Trail HP drain smoothly
    for (const f of [this.p1, this.p2]) {
      if (f.trailHp > f.hp) {
        f.trailHp = Math.max(f.hp, f.trailHp - 3.5);
      } else {
        f.trailHp = f.hp;
      }
    }

    if (this.hitstop > 0) {
      this.hitstop--;
      this.input.endFrame();
      return;
    }

    if (this.phase === "intro") {
      this.phaseTimer--;
      if (this.phaseTimer === 42) {
        this.bannerText = "FIGHT!";
        this.bannerSub = "";
        sound.playAnnouncer("fight");
      }
      if (this.phaseTimer <= 0) {
        this.phase = "fight";
        this.bannerText = "";
        this.bannerSub = "";
      }
      this.input.endFrame();
      return;
    }

    if (this.phase === "round_end") {
      this.phaseTimer--;
      this._updateFighterPhysicsOnly(this.p1);
      this._updateFighterPhysicsOnly(this.p2);
      if (this.phaseTimer <= 0) {
        if (this.p1.roundsWon >= 2 || this.p2.roundsWon >= 2) {
          this._finishMatch();
        } else {
          this.round++;
          this._startRound();
        }
      }
      this.input.endFrame();
      return;
    }

    if (this.phase === "match_end") {
      this._updateFighterPhysicsOnly(this.p1);
      this._updateFighterPhysicsOnly(this.p2);
      this.input.endFrame();
      return;
    }

    // Active Fight Phase
    if (this.timerFrames > 0) {
      this.timerFrames--;
      if (this.timerFrames === 0) {
        this._endRoundByTimeout();
        this.input.endFrame();
        return;
      }
    }

    const in1 = this.input.getPlayerInput(0);
    const in2 = this.ai ? this.ai.decide(this.p2, this.p1) : this.input.getPlayerInput(1);

    this._updateFighter(this.p1, this.p2, in1);
    this._updateFighter(this.p2, this.p1, in2);

    this._resolvePushboxes();
    this._resolveAttackHit(this.p1, this.p2, in2);
    this._resolveAttackHit(this.p2, this.p1, in1);

    this._updatePassivesAndStatuses(this.p1, this.p2);
    this._updatePassivesAndStatuses(this.p2, this.p1);

    // Check KO
    if (this.p1.hp <= 0 || this.p2.hp <= 0) {
      this._endRoundByKO();
    }

    this.input.endFrame();
  }

  _updateFighterPhysicsOnly(f) {
    f.stateFrame++;
    f.x += f.vx;
    f.y += f.vy;
    if (!f.grounded) {
      f.vy += GRAVITY;
      if (f.y >= GROUND_Y) {
        f.y = GROUND_Y;
        f.vy = 0;
        f.grounded = true;
        if (f.state === "juggle") {
          f.state = f.hp <= 0 ? "ko" : "knockdown";
          f.stunFrames = 26;
          this.vfx.spawnDust(f.x, GROUND_Y, 8, 3);
        }
      }
    }
    f.vx *= 0.85;
    f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));
  }

  _updateFighter(f, opp, inp) {
    f.stateFrame++;
    if (f.sigCooldown > 0) f.sigCooldown--;
    if (f.tapWindow > 0) f.tapWindow--;
    if (f.comboResetTimer > 0) {
      f.comboResetTimer--;
      if (f.comboResetTimer === 0) {
        f.comboCount = 0;
        f.comboDamage = 0;
      }
    }

    // Auto-face when neutral
    if (f.grounded && ["idle", "walk_f", "walk_b", "crouch", "block", "crouch_block"].includes(f.state)) {
      if (Math.abs(opp.x - f.x) > 4) {
        f.facing = opp.x >= f.x ? 1 : -1;
      }
    }

    const speedMult = f.statuses.sad > 0 ? 0.75 : 1;

    // Stun states
    if (f.state === "hitstun" || f.state === "block" || f.state === "crouch_block") {
      f.stunFrames--;
      f.x += f.vx;
      f.vx *= 0.84;
      if (!f.grounded) {
        f.y += f.vy;
        f.vy += GRAVITY;
        if (f.y >= GROUND_Y) {
          f.y = GROUND_Y;
          f.vy = 0;
          f.grounded = true;
        }
      }
      f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));
      if (f.stunFrames <= 0) {
        f.state = "idle";
        f.crouching = false;
      }
      return;
    }

    if (f.state === "juggle") {
      f.x += f.vx;
      f.y += f.vy;
      f.vy += GRAVITY * 0.88;
      f.vx *= 0.985;

      // Wall bounce check (Dap Kick or heavy corner launch)
      if (f.wallBounceReady && (f.x <= STAGE_LEFT + 6 || f.x >= STAGE_RIGHT - 6)) {
        const wallDir = f.x <= STAGE_LEFT + 6 ? -1 : 1;
        f.x = wallDir < 0 ? STAGE_LEFT + 8 : STAGE_RIGHT - 8;
        f.vx = -wallDir * 7.2;
        f.vy = -10.5;
        f.wallBounceReady = false;
        sound.playWallBounce();
        this.vfx.triggerShake(9, 12);
        this.vfx.spawnHitSparks(f.x, f.y - 60, { heavy: true, color: "#ffae19" });
        this.vfx.spawnPopup(f.x, f.y - 125, "WALL BOUNCE!", "#ffae19", 1.15);
      }

      f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));
      if (f.y >= GROUND_Y) {
        f.y = GROUND_Y;
        f.vy = 0;
        f.vx *= 0.4;
        f.grounded = true;
        f.juggleHits = 0;
        f.wallBounceReady = false;
        f.state = "knockdown";
        f.stateFrame = 0;
        f.stunFrames = 26;
        this.vfx.spawnDust(f.x, GROUND_Y, 9, 3.8);
      }
      return;
    }

    if (f.state === "knockdown") {
      f.stunFrames--;
      f.x += f.vx;
      f.vx *= 0.82;
      f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));
      if (f.stunFrames <= 0) {
        f.state = "idle";
        f.crouching = false;
      }
      return;
    }

    // Back-dash & Forward Dash (with Tekken Back-Dash Cancel!)
    if (f.state === "backdash" || f.state === "dash") {
      // BDC: pressing Down after frame 3 cancels backdash recovery into crouch
      if (f.state === "backdash" && inp.down && f.stateFrame >= 4) {
        f.state = "crouch";
        f.crouching = true;
        f.vx = 0;
        f.stateFrame = 0;
        this.vfx.spawnDust(f.x, GROUND_Y, 4, 2);
        return;
      }
      f.x += f.vx;
      f.vx *= 0.91;
      f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));
      if (f.stateFrame >= 13) {
        f.state = "idle";
        f.vx = 0;
      }
      return;
    }

    // Attack state & Combo Chains
    if (f.state === "attack") {
      const m = f.currentMove;
      this._handleSpecialMovementDuringAttack(f, opp, m);

      // Jab / target combo chain window (Light -> Light -> Heavy)
      const pastActive = f.stateFrame >= m.startup + 1;
      if (pastActive && m.chainable && f.chainCount < 2 && inp.light) {
        f.chainCount++;
        this._startAttack(f, opp, f.crouching ? "crouchLight" : "light");
        return;
      }
      if (pastActive && m.chainable && inp.heavy) {
        this._startAttack(f, opp, f.crouching ? "sweep" : "heavy");
        return;
      }
      // JOG Hit 1 -> Hit 2 (Silence) follow-up window
      if (f.def.id === "jog" && f.canChainSig2 && inp.signature && f.statuses.silence <= 0) {
        f.canChainSig2 = false;
        this._startAttack(f, opp, "signature2");
        return;
      }

      f.x += f.vx;
      if (!f.grounded) {
        f.y += f.vy;
        f.vy += GRAVITY;
        if (f.y >= GROUND_Y) {
          f.y = GROUND_Y;
          f.vy = 0;
          f.grounded = true;
          if (m.specialType === "belly_flap") {
            sound.playBellySlam();
            this.vfx.triggerShake(11, 14);
            this.vfx.spawnGroundShockwave(f.x, GROUND_Y, "#ffd24c");
          }
        }
      }
      f.vx *= 0.88;
      f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));

      const totalFrames = m.startup + m.active + m.recovery;
      if (f.stateFrame >= totalFrames) {
        f.state = f.grounded ? "idle" : "jump";
        f.currentMoveId = null;
        f.currentMove = null;
        f.armorHits = 0;
        f.canChainSig2 = false;
      }
      return;
    }

    // Neutral / Movement / Attack Trigger
    // Check Attack Inputs first
    if (f.grounded) {
      if (inp.signature) {
        if (f.statuses.silence > 0) {
          this.vfx.spawnPopup(f.x, f.y - f.heightPx - 15, "SILENCED!", "#5ce1ff", 0.95);
          sound.playUISelect();
        } else if (f.sigCooldown > 0) {
          this.vfx.spawnPopup(f.x, f.y - f.heightPx - 15, "CHARGING", "#aaaaaa", 0.8);
        } else {
          this._startAttack(f, opp, "signature");
          return;
        }
      }
      if (inp.launcher) {
        const holdingFwd = (f.facing > 0 && inp.right) || (f.facing < 0 && inp.left);
        if (holdingFwd && Math.abs(opp.x - f.x) <= 88 && opp.grounded) {
          this._startAttack(f, opp, "throw");
        } else {
          this._startAttack(f, opp, "launcher");
        }
        return;
      }
      if (inp.heavy) {
        this._startAttack(f, opp, inp.down ? "sweep" : "heavy");
        return;
      }
      if (inp.light) {
        f.chainCount = 0;
        this._startAttack(f, opp, inp.down ? "crouchLight" : "light");
        return;
      }
    } else {
      // Simple air kick / punch
      if (inp.light || inp.heavy) {
        this._startAttack(f, opp, inp.heavy ? "heavy" : "light");
        return;
      }
    }

    // Double-tap Back-Dash & Forward-Dash
    if (f.grounded && !inp.down) {
      const tapDir = inp.leftJust ? -1 : inp.rightJust ? 1 : 0;
      if (tapDir !== 0) {
        if (f.lastTapDir === tapDir && f.tapWindow > 0) {
          const isBack = tapDir !== f.facing;
          f.state = isBack ? "backdash" : "dash";
          f.stateFrame = 0;
          f.vx = tapDir * (isBack ? 9.6 : 9.8) * speedMult;
          f.tapWindow = 0;
          sound.playDash();
          this.vfx.spawnDust(f.x, GROUND_Y, 6, 3);
          return;
        }
        f.lastTapDir = tapDir;
        f.tapWindow = 15;
      }
    }

    // Jump
    if (f.grounded && inp.up) {
      f.grounded = false;
      f.crouching = false;
      f.vy = f.def.jumpForce;
      f.vx = (inp.right ? 1 : inp.left ? -1 : 0) * f.def.walkSpeed * 1.08 * speedMult;
      f.state = "jump";
      f.stateFrame = 0;
      this.vfx.spawnDust(f.x, GROUND_Y, 5, 2.5);
      return;
    }

    // Crouch
    if (f.grounded && inp.down) {
      f.crouching = true;
      f.state = "crouch";
      f.vx = 0;
      return;
    }

    f.crouching = false;

    // Walk Left / Right
    if (f.grounded) {
      const moveDir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (moveDir !== 0) {
        const isFwd = moveDir === f.facing;
        f.vx = moveDir * (isFwd ? f.def.walkSpeed : f.def.backSpeed) * speedMult;
        f.x += f.vx;
        f.state = isFwd ? "walk_f" : "walk_b";
      } else {
        f.vx = 0;
        f.state = "idle";
      }
      f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));
    } else {
      // Airborne movement
      f.x += f.vx;
      f.y += f.vy;
      f.vy += GRAVITY;
      f.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, f.x));
      if (f.y >= GROUND_Y) {
        f.y = GROUND_Y;
        f.vy = 0;
        f.grounded = true;
        f.state = "idle";
        this.vfx.spawnDust(f.x, GROUND_Y, 5, 2.4);
      }
    }
  }

  _startAttack(f, opp, moveId) {
    const move = f.def.moves[moveId];
    if (!move) return;

    f.state = "attack";
    f.stateFrame = 0;
    f.currentMoveId = moveId;
    f.currentMove = move;
    f.moveHitConnected = false;
    f.crouching = moveId === "crouchLight" || moveId === "sweep";
    f.vx = 0;

    if (moveId === "signature") {
      f.sigCooldown = f.sigMaxCooldown;
    }

    if (move.hasArmor) {
      f.armorHits = 1;
    }

    // Initial SFX & movement cues
    if (move.specialType === "apsay_tp") {
      sound.playTeleport();
      this.vfx.spawnDust(f.x, f.y, 10, 4, "rgba(181, 107, 255, 0.55)");
    } else if (move.specialType === "dap_kick") {
      sound.playDapKick();
    } else if (move.specialType === "belly_flap") {
      f.grounded = false;
      f.vy = -10.8;
      f.vx = f.facing * 6.8;
      this.vfx.spawnDust(f.x, GROUND_Y, 8, 3.5);
    } else if (move.specialType === "boulder_roll") {
      sound.playBoulderRoll();
    } else if (move.specialType === "vein_cut") {
      sound.playVeinCut();
    } else {
      sound.playWhiff(move.damage >= 70 ? "heavy" : "light");
    }
  }

  _handleSpecialMovementDuringAttack(f, opp, m) {
    if (!m.specialType) return;

    // Apsay teleports behind opponent on frame 11
    if (m.specialType === "apsay_tp" && f.stateFrame === 11) {
      this.vfx.spawnAfterimage(f.x, f.y, f.facing, "#b56bff", 24, f.heightPx);
      const targetX = opp.x - opp.facing * 62;
      f.x = Math.max(STAGE_LEFT + 12, Math.min(STAGE_RIGHT - 12, targetX));
      f.y = opp.grounded ? GROUND_Y : opp.y;
      f.facing = opp.x >= f.x ? 1 : -1;
      this.vfx.spawnDust(f.x, f.y, 8, 3.5, "rgba(181, 107, 255, 0.6)");
    }

    // Dap Kick horizontal flying launch
    if (m.specialType === "dap_kick") {
      if (f.stateFrame >= 6 && f.stateFrame <= 28) {
        f.vx = f.facing * 12.2;
        if (f.stateFrame % 3 === 0) {
          this.vfx.spawnAfterimage(f.x, f.y, f.facing, "#ff7a33", 32, f.heightPx * 0.8);
        }
      }
    }

    // Jaguilar forward slash lunge
    if (m.specialType === "vein_cut") {
      if (f.stateFrame === 12) {
        f.vx = f.facing * 9.5;
        this.vfx.spawnSlashArc(f.x, f.y, f.facing, "#32f0ff");
      }
    }

    // Johan Boulder Roll momentum
    if (m.specialType === "boulder_roll") {
      if (f.stateFrame >= 10 && f.stateFrame <= 35) {
        f.vx = f.facing * 10.6;
        if (f.stateFrame % 3 === 0) {
          this.vfx.spawnAfterimage(f.x, f.y, f.facing, "#65ff6e", 42, 105);
          this.vfx.spawnDust(f.x, GROUND_Y, 2, 2);
        }
      }
    }
  }

  _resolvePushboxes() {
    if (!this.p1.grounded || !this.p2.grounded) return;
    // Allow Apsay mid-teleport to pass freely
    if (this.p1.state === "attack" && this.p1.currentMove?.specialType === "apsay_tp") return;
    if (this.p2.state === "attack" && this.p2.currentMove?.specialType === "apsay_tp") return;

    const minDist = (this.p1.def.widthPx + this.p2.def.widthPx) * 0.45;
    const dx = this.p2.x - this.p1.x;
    const absDx = Math.abs(dx);
    if (absDx < minDist) {
      const push = (minDist - absDx) * 0.5;
      const dir = dx >= 0 ? 1 : -1;
      this.p1.x = Math.max(STAGE_LEFT, this.p1.x - dir * push);
      this.p2.x = Math.min(STAGE_RIGHT, this.p2.x + dir * push);
    }
  }

  _resolveAttackHit(atk, def, defInp) {
    if (atk.state !== "attack" || !atk.currentMove || atk.moveHitConnected) return;
    const m = atk.currentMove;
    if (atk.stateFrame < m.startup || atk.stateFrame > m.startup + m.active) return;

    // Cannot hit opponent lying flat in knockdown
    if (def.state === "knockdown" || def.state === "ko") return;

    // Compute Hitbox
    const hbX1 = atk.facing > 0 ? atk.x + 6 : atk.x - m.range;
    const hbX2 = atk.facing > 0 ? atk.x + m.range : atk.x - 6;
    const hbY1 = atk.y + m.hitboxY;
    const hbY2 = hbY1 + m.hitboxH;

    // Compute Hurtbox
    const hurtH = def.crouching ? def.heightPx * 0.65 : def.heightPx * 0.92;
    const hurtW = def.def.widthPx * 0.72;
    const dfX1 = def.x - hurtW / 2;
    const dfX2 = def.x + hurtW / 2;
    const dfY1 = def.y - hurtH;
    const dfY2 = def.y;

    const overlaps = hbX1 <= dfX2 && hbX2 >= dfX1 && hbY1 <= dfY2 && hbY2 >= dfY1;
    if (!overlaps) return;

    atk.moveHitConnected = true;

    const hitX = (Math.max(hbX1, dfX1) + Math.min(hbX2, dfX2)) / 2;
    const hitY = (Math.max(hbY1, dfY1) + Math.min(hbY2, dfY2)) / 2;

    // Check Blocking (Tekken High/Mid/Low rules)
    const holdingBack =
      def.grounded &&
      !["attack", "hitstun", "juggle", "knockdown", "dash", "backdash"].includes(def.state) &&
      ((def.facing > 0 && defInp.left) || (def.facing < 0 && defInp.right));
    const holdingDown = def.grounded && defInp.down;

    let blocked = false;
    if (m.hitLevel !== "UNBLOCKABLE" && holdingBack) {
      if (m.hitLevel === "HIGH" && !holdingDown) blocked = true;
      else if (m.hitLevel === "MID" && !holdingDown) blocked = true;
      else if (m.hitLevel === "LOW" && holdingDown) blocked = true;
    }

    if (blocked) {
      const chip = Math.max(0, Math.min(def.hp - 1, m.guardDamage));
      def.hp -= chip;
      def.state = holdingDown ? "crouch_block" : "block";
      def.stunFrames = m.blockstun;
      def.vx = atk.facing * (m.knockbackX * 0.62);
      this.hitstop = Math.max(2, Math.floor(m.hitstop * 0.65));

      sound.playHit("block");
      this.vfx.spawnHitSparks(hitX, hitY, { blocked: true });
      this.vfx.triggerShake(3, 6);
      return;
    }

    // Super Armor check (Johan Boulder Roll)
    if (def.armorHits > 0) {
      def.armorHits--;
      const armorDmg = Math.round(m.damage * 0.5);
      def.hp = Math.max(0, def.hp - armorDmg);
      this.hitstop = 4;
      sound.playHit("heavy");
      this.vfx.spawnHitSparks(hitX, hitY, { heavy: true, color: "#ffdf5e" });
      this.vfx.spawnPopup(def.x, def.y - def.heightPx - 20, "ARMOR!", "#ffdf5e", 1.05);
      return;
    }

    // Clean Hit! Apply Sadness damage penalty if attacker is SAD
    const atkMult = atk.statuses.sad > 0 ? 0.8 : 1.0;
    // Juggle damage scaling
    const juggleMult = def.state === "juggle" ? Math.max(0.45, 1 - def.juggleHits * 0.14) : 1.0;
    const finalDmg = Math.max(1, Math.round(m.damage * atkMult * juggleMult));

    def.hp = Math.max(0, def.hp - finalDmg);
    atk.damageDealt += finalDmg;
    atk.comboCount++;
    atk.comboDamage += finalDmg;
    atk.comboResetTimer = 75;
    if (atk.comboCount > atk.maxCombo) atk.maxCombo = atk.comboCount;

    this.hitstop = m.hitstop;
    const isHeavy = m.damage >= 70 || m.launches || Boolean(m.specialType);
    this.vfx.triggerShake(isHeavy ? 9 : 4.5, isHeavy ? 11 : 6);
    this.vfx.spawnHitSparks(hitX, hitY, {
      blocked: false,
      heavy: isHeavy,
      color: m.specialType === "vein_cut" ? "#32f0ff" : m.specialType === "apsay_tp" ? "#c278ff" : "#ff9d2e"
    });

    // Sound cues per move
    if (m.specialType === "jog_chair_1") {
      sound.playChairHit(false);
    } else if (m.specialType === "jog_chair_2") {
      sound.playChairHit(true);
    } else if (m.specialType === "belly_flap") {
      sound.playBellySlam();
      this.vfx.spawnGroundShockwave(hitX, GROUND_Y, "#ffd24c");
    } else if (m.launches) {
      sound.playHit("launcher");
    } else {
      sound.playHit(isHeavy ? "heavy" : "light");
    }

    // Special Move Effects
    if (m.specialType === "apsay_tp") {
      this.vfx.spawnPopup(hitX, hitY - 40, "CROSS-UP!", "#d39bff", 1.1);
    }
    if (m.hitLevel === "UNBLOCKABLE") {
      this.vfx.spawnPopup(hitX, hitY - 45, "THROW!", "#ff5e78", 1.1);
    }

    // JOG Chair Hit 1 -> Re-stand & enable Hit 2 window
    if (m.restand) {
      def.y = GROUND_Y;
      def.vy = 0;
      def.grounded = true;
      def.crouching = false;
      def.state = "hitstun";
      def.stunFrames = m.hitstun;
      def.vx = atk.facing * m.knockbackX;
      atk.canChainSig2 = true;
      this.vfx.spawnPopup(def.x, def.y - def.heightPx - 20, "ENCORE! (PRESS P)", "#60d7ff", 1.0);
    } else if (m.launches || !def.grounded || m.knockdown || m.wallBounce) {
      def.state = "juggle";
      def.grounded = false;
      def.crouching = false;
      def.juggleHits++;
      def.vy = m.launchY || -8.5;
      def.vx = atk.facing * m.knockbackX;
      def.wallBounceReady = Boolean(m.wallBounce);
    } else {
      def.state = "hitstun";
      def.stunFrames = m.hitstun;
      def.vx = atk.facing * m.knockbackX;
    }

    // Status Inflictions
    if (m.inflictsSilence) {
      def.statuses.silence = m.inflictsSilence;
      this.vfx.spawnPopup(def.x, def.y - def.heightPx - 36, "SILENCED! 10s", "#5ce1ff", 1.15);
    }
    if (m.inflictsBleed) {
      def.statuses.bleed = m.inflictsBleed;
      def.bleedTickTimer = 60;
      this.vfx.spawnPopup(def.x, def.y - def.heightPx - 36, "BLEEDING!", "#ff3b5c", 1.15);
    }
  }

  _updatePassivesAndStatuses(f, opp) {
    // 1. Paulite Passive: Bad Jokes -> Sadness
    if (f.def.id === "paulite" && f.hp > 0) {
      f.jokeTimer--;
      if (f.jokeTimer <= 0) {
        f.jokeTimer = 440; // ~7.3s
        const joke = PAULITE_JOKES[Math.floor(Math.random() * PAULITE_JOKES.length)];
        this.vfx.spawnJokeBubble(f, joke);
        sound.playBadJoke();

        if (Math.abs(opp.x - f.x) <= 290 && opp.hp > 0) {
          opp.statuses.sad = 360; // 6s
          this.vfx.spawnPopup(opp.x, opp.y - opp.heightPx - 28, "SAD! -SPD/-ATK", "#76a9ff", 1.0);
        }
      }
    }

    // 2. Johan Passive: Stench Poison proximity aura
    if (f.def.id === "johan" && f.hp > 0) {
      if (this.time % 5 === 0) {
        this.vfx.spawnPoisonWisp(f.x, f.y);
      }
      if (Math.abs(opp.x - f.x) <= 155 && Math.abs(opp.y - f.y) <= 130 && opp.hp > 0) {
        opp.statuses.poison = Math.max(opp.statuses.poison, 90);
      }
    }

    // Tick down statuses on fighter f
    if (f.statuses.silence > 0) f.statuses.silence--;
    if (f.statuses.sad > 0) f.statuses.sad--;

    if (f.statuses.bleed > 0) {
      f.statuses.bleed--;
      f.bleedTickTimer--;
      if (f.bleedTickTimer <= 0 && f.hp > 0) {
        f.bleedTickTimer = 60;
        const dmg = 5;
        f.hp = Math.max(0, f.hp - dmg);
        sound.playBleedTick();
        this.vfx.spawnHitSparks(f.x, f.y - f.heightPx * 0.55, { color: "#ff2e54" });
        this.vfx.spawnPopup(f.x, f.y - f.heightPx - 10, `-${dmg} BLEED`, "#ff3b5c", 0.9);
      }
    }

    if (f.statuses.poison > 0) {
      f.statuses.poison--;
      f.poisonTickTimer--;
      if (f.poisonTickTimer <= 0 && f.hp > 0) {
        f.poisonTickTimer = 50;
        const dmg = 4;
        f.hp = Math.max(0, f.hp - dmg);
        sound.playPoisonTick();
        this.vfx.spawnPopup(f.x, f.y - f.heightPx - 10, `-${dmg} POISON`, "#65ff6e", 0.9);
      }
    }
  }

  _endRoundByKO() {
    this.phase = "round_end";
    this.phaseTimer = 140;
    this.hitstop = 14;
    this.vfx.triggerShake(14, 18);
    sound.playAnnouncer("ko");

    if (this.p1.hp <= 0 && this.p2.hp <= 0) {
      this.p1.state = "ko";
      this.p2.state = "ko";
      this.bannerText = "DOUBLE K.O.!";
      this.bannerSub = "BOTH FIGHTERS DOWN";
    } else if (this.p2.hp <= 0) {
      this.p2.state = "ko";
      this.p1.roundsWon++;
      this.bannerText = "K.O.!";
      this.bannerSub = `${this.p1.def.name} TAKES THE ROUND`;
    } else {
      this.p1.state = "ko";
      this.p2.roundsWon++;
      this.bannerText = "K.O.!";
      this.bannerSub = `${this.p2.def.name} TAKES THE ROUND`;
    }
  }

  _endRoundByTimeout() {
    this.phase = "round_end";
    this.phaseTimer = 140;
    sound.playAnnouncer("ko");
    const p1Pct = this.p1.hp / this.p1.maxHp;
    const p2Pct = this.p2.hp / this.p2.maxHp;
    this.bannerText = "TIME OVER";

    if (Math.abs(p1Pct - p2Pct) < 0.001) {
      this.bannerSub = "DRAW ROUND";
    } else if (p1Pct > p2Pct) {
      this.p1.roundsWon++;
      this.bannerSub = `${this.p1.def.name} WINS ON LIFE LEAD`;
    } else {
      this.p2.roundsWon++;
      this.bannerSub = `${this.p2.def.name} WINS ON LIFE LEAD`;
    }
  }

  _finishMatch() {
    this.phase = "match_end";
    sound.playAnnouncer("win");

    const winner = this.p1.roundsWon >= this.p2.roundsWon ? this.p1 : this.p2;
    const loser = winner === this.p1 ? this.p2 : this.p1;
    const winTag = winner === this.p1 ? "PLAYER 1" : this.mode === "1p" ? "CPU" : "PLAYER 2";

    document.getElementById("overlay-eyebrow").textContent = "MATCH COMPLETE";
    document.getElementById("overlay-title").textContent = `${winner.def.name} WINS!`;
    document.getElementById("overlay-stats").innerHTML = `
      <strong>${winTag}</strong> takes the set <strong>${winner.roundsWon} - ${loser.roundsWon}</strong><br/>
      P1 Max Combo: ${this.p1.maxCombo} Hits (${this.p1.damageDealt} Total DMG) &bull;
      P2 Max Combo: ${this.p2.maxCombo} Hits (${this.p2.damageDealt} Total DMG)
    `;
    document.getElementById("btn-resume").classList.add("hidden");
    document.getElementById("fight-overlay").classList.remove("hidden");
  }

  // -------------------- RENDERING --------------------
  _renderArena() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const shake = this.vfx.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawStage(ctx, this.stageId, this.time);
    this.vfx.drawBack(ctx);

    // Draw fighters (attacker on top)
    if (this.p1.state === "attack") {
      drawFighter(ctx, this.p2, this.time);
      drawFighter(ctx, this.p1, this.time);
    } else {
      drawFighter(ctx, this.p1, this.time);
      drawFighter(ctx, this.p2, this.time);
    }

    this.vfx.drawFront(ctx);
    ctx.restore();

    this._renderHUD(ctx);
  }

  _renderHUD(ctx) {
    const barW = 470;
    const barH = 26;
    const topY = 28;
    const center = CANVAS_W / 2;

    const drawHealthBar = (f, isLeft) => {
      const startX = isLeft ? center - 72 - barW : center + 72;
      const pct = Math.max(0, f.hp / f.maxHp);
      const trailPct = Math.max(0, f.trailHp / f.maxHp);

      // Frame
      ctx.fillStyle = "rgba(10, 13, 22, 0.88)";
      ctx.strokeStyle = "#3a4668";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(startX, topY, barW, barH, 6);
      ctx.fill();
      ctx.stroke();

      // Trailing White/Red Damage Bar
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(startX + 2, topY + 2, barW - 4, barH - 4, 4);
      ctx.clip();

      const trailW = (barW - 4) * trailPct;
      ctx.fillStyle = "#ff3b5c";
      ctx.fillRect(isLeft ? startX + 2 + (barW - 4 - trailW) : startX + 2, topY + 2, trailW, barH - 4);

      // White leading flash on trail edge
      if (trailPct > pct + 0.005) {
        ctx.fillStyle = "#ffffff";
        const wx = isLeft ? startX + 2 + (barW - 4 - trailW) : startX + 2 + trailW - 5;
        ctx.fillRect(wx, topY + 2, 5, barH - 4);
      }

      // Active HP Fill
      const hpW = (barW - 4) * pct;
      const grad = ctx.createLinearGradient(startX, topY, startX + barW, topY);
      if (pct > 0.3) {
        grad.addColorStop(0, isLeft ? "#ff9100" : "#ffd000");
        grad.addColorStop(1, isLeft ? "#ffd000" : "#ff9100");
      } else {
        grad.addColorStop(0, "#ff1e42");
        grad.addColorStop(1, "#ff6842");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(isLeft ? startX + 2 + (barW - 4 - hpW) : startX + 2, topY + 2, hpW, barH - 4);
      ctx.restore();

      // Name & Height + Round Orbs
      ctx.save();
      ctx.font = "900 17px Impact, 'Arial Black', sans-serif";
      ctx.fillStyle = "#f2f5fc";
      ctx.textAlign = isLeft ? "left" : "right";
      const labelX = isLeft ? startX : startX + barW;
      ctx.fillText(`${f.def.name} (${f.def.heightLabel})`, labelX, topY + barH + 22);

      // Round orbs
      for (let r = 0; r < 2; r++) {
        const ox = isLeft ? startX + barW - 12 - r * 22 : startX + 12 + r * 22;
        const oy = topY + barH + 16;
        ctx.beginPath();
        ctx.arc(ox, oy, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = r < f.roundsWon ? "#ffae19" : "#1b2236";
        ctx.fill();
        ctx.strokeStyle = "#6b79a3";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Signature Meter / Silence Lockout Bar
      const sigW = 190;
      const sigX = isLeft ? startX : startX + barW - sigW;
      const sigY = topY + barH + 30;
      ctx.fillStyle = "rgba(10, 13, 22, 0.85)";
      ctx.fillRect(sigX, sigY, sigW, 8);
      if (f.statuses.silence > 0) {
        ctx.fillStyle = "#5ce1ff";
        ctx.fillRect(sigX, sigY, sigW * (f.statuses.silence / 600), 8);
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#5ce1ff";
        ctx.fillText(`SILENCED (${Math.ceil(f.statuses.silence / 60)}s)`, isLeft ? sigX : sigX + sigW, sigY + 19);
      } else {
        const readyPct = 1 - f.sigCooldown / f.sigMaxCooldown;
        ctx.fillStyle = readyPct >= 1 ? "#2ae8ff" : "#5e6f96";
        ctx.fillRect(sigX, sigY, sigW * readyPct, 8);
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = readyPct >= 1 ? "#2ae8ff" : "#8894b8";
        ctx.fillText(readyPct >= 1 ? `${f.def.moves.signature.name.toUpperCase()} READY` : "RECHARGING...", isLeft ? sigX : sigX + sigW, sigY + 19);
      }

      // Combo Counter
      if (f.comboCount >= 2) {
        const cx = isLeft ? 108 : CANVAS_W - 108;
        ctx.textAlign = "center";
        ctx.font = "900 34px Impact, sans-serif";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#080a10";
        ctx.strokeText(`${f.comboCount} HITS!`, cx, 175);
        ctx.fillStyle = "#ffae19";
        ctx.fillText(`${f.comboCount} HITS!`, cx, 175);
        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${f.comboDamage} DMG`, cx, 198);
      }

      ctx.restore();
    };

    drawHealthBar(this.p1, true);
    drawHealthBar(this.p2, false);

    // Center 99s Timer
    const secs = Math.ceil(this.timerFrames / 60);
    ctx.save();
    ctx.fillStyle = "rgba(11, 14, 24, 0.92)";
    ctx.strokeStyle = "#ffae19";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(center - 48, 16, 96, 56, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "900 36px Impact, sans-serif";
    ctx.fillStyle = secs <= 15 ? "#ff3b5c" : "#ffffff";
    ctx.fillText(String(secs).padStart(2, "0"), center, 56);

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#9aa5c4";
    ctx.fillText(`ROUND ${this.round}`, center, 86);
    ctx.restore();

    // Center Round / KO Banner
    if (this.bannerText) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "900 76px Impact, 'Arial Black', sans-serif";
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#07090f";
      ctx.strokeText(this.bannerText, center, 325);

      const bGrad = ctx.createLinearGradient(0, 260, 0, 340);
      bGrad.addColorStop(0, "#ffe47a");
      bGrad.addColorStop(1, "#ff2e54");
      ctx.fillStyle = bGrad;
      ctx.fillText(this.bannerText, center, 325);

      if (this.bannerSub) {
        ctx.font = "800 22px 'Segoe UI', sans-serif";
        ctx.lineWidth = 5;
        ctx.strokeText(this.bannerSub, center, 366);
        ctx.fillStyle = "#f2f5fc";
        ctx.fillText(this.bannerSub, center, 366);
      }
      ctx.restore();
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new Batch30Game();
});
