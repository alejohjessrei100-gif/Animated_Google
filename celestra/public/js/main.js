// Celestra Chronicles — app shell: screens, select, HUD, game loop, online flow.
import { newMatch, step, B, VIEW_W } from "./sim.js";
import { CHARS, ROSTER, STAGES, getMove, PARRY } from "./chars.js";
import { Renderer } from "./render.js";
import { drawPortrait, drawFull } from "./sprites.js";
import { readInputs, keyPressed, clearPressed, setupTouch } from "./input.js";
import { AI } from "./ai.js";
import { NetClient, RollbackSession } from "./net.js";
import { initAudio, sfx, voice, music, setVolume, setMuted, audioSettings, preloadVoices } from "./audio.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem("celestra:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("celestra:" + k, JSON.stringify(v)); } catch {} },
};

const canvas = $("#game");
const R = new Renderer(canvas);
const app = {
  screen: "title", mode: "cpu", diff: store.get("diff", "normal"), S: null, ai: null, dummy: null, session: null,
  net: null, slot: 0, room: null, code: null, quick: false, picks: [null, null], cursor: [0, 4], locked: [false, false],
  stage: 0, paused: false, attract: null, attractAI: null, voiceOn: store.get("voice", true), lastVoice: {}, stall: 0,
  names: ["P1", "P2"], resultsT: null,
};

// ================= screens =================
function show(id) {
  app.screen = id;
  $$(".scr").forEach((s) => s.classList.toggle("active", s.id === id));
  $("#hud").classList.toggle("hidden", !(id === "fight" || id === "pause" || id === "results"));
  focusIdx = 0; refreshFocus();
  if (id === "title" || id === "menu" || id === "online" || id === "howto" || id === "settings") music("title");
}
let focusIdx = 0;
function focusables() {
  const s = $(".scr.active"); if (!s) return [];
  return $$("button:not(.hidden):not([disabled]), input", s).filter((b) => b.offsetParent !== null && !b.closest(".cell") && !b.closest(".stagepick"));
}
function refreshFocus() { const f = focusables(); f.forEach((b, i) => b.classList.toggle("focus", i === focusIdx)); }

// ================= title / attract =================
function startAttract() {
  const a = ROSTER[Math.floor(Math.random() * ROSTER.length)], b = ROSTER[Math.floor(Math.random() * ROSTER.length)];
  app.attract = newMatch({ chars: [a, b], seed: (Math.random() * 1e9) | 0, mode: "vs", stage: Math.floor(Math.random() * 3) });
  app.attractAI = [new AI("hard", 0), new AI("hard", 1)];
  R.setStage(STAGES[app.attract.stage].id); R.resetFx();
}
function anyStart() {
  initAudio(); applySettings();
  if (app.voiceOn) voice("title");
  sfx("confirm"); show("menu");
  const q = new URLSearchParams(location.search).get("room");
  if (q) { show("online"); joinRoom(q.toUpperCase()); history.replaceState(null, "", location.pathname); }
}
$("#title").addEventListener("click", anyStart);

// ================= menu =================
$$("#menu .mi").forEach((b) => b.addEventListener("click", () => menuPick(b.dataset.mode)));
$$(".cpu-diff button").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); app.diff = b.dataset.diff; store.set("diff", app.diff); $$(".cpu-diff button").forEach((x) => x.classList.toggle("on", x === b)); sfx("select"); }));
function menuPick(m) {
  sfx("confirm");
  if (m === "howto") { buildMovelist(); show("howto"); return; }
  if (m === "settings") { show("settings"); return; }
  if (m === "online") { show("online"); $("#pname").value = store.get("name", "PLAYER" + Math.floor(Math.random() * 90 + 10)); return; }
  app.mode = m; openSelect();
}
$("#menu").addEventListener("mouseover", (e) => { const b = e.target.closest(".mi"); if (b) $(".cpu-diff").classList.toggle("invis", b.dataset.mode !== "cpu"); });
$$(".back").forEach((b) => b.addEventListener("click", goBack));
function goBack() {
  sfx("select");
  if (app.screen === "select") {
    if (app.mode === "online") { if (app.locked[app.slot]) { app.locked[app.slot] = false; app.net.send({ t: "ready", v: false }); renderSelect(); return; } leaveRoom(); show("online"); return; }
    if (app.locked[1] && app.mode !== "local") { app.locked[1] = false; renderSelect(); return; }
    if (app.locked[0] && app.mode !== "local") { app.locked[0] = false; renderSelect(); return; }
    show("menu"); return;
  }
  if (app.screen === "online") { leaveRoom(); show("menu"); return; }
  if (app.screen === "howto" && app.fromPause) { app.fromPause = false; show("pause"); return; }
  show("menu");
}

// ================= character select =================
const grid = $(".grid");
ROSTER.forEach((id, i) => {
  const c = CHARS[id];
  const b = document.createElement("button");
  b.className = "cell"; b.dataset.i = i;
  b.innerHTML = `<canvas width="32" height="32"></canvas><span class="lbl">${c.name.split(" ")[0]}</span>`;
  drawPortrait(b.querySelector("canvas"), id);
  b.addEventListener("click", () => { const p = activePicker(); if (p < 0) return; app.cursor[p] = i; confirmPick(p); });
  b.addEventListener("mouseenter", () => { const p = activePicker(); if (p < 0) return; app.cursor[p] = i; sfx("move"); renderSelect(); });
  grid.appendChild(b);
});
const NCELL = ROSTER.length + 1, RANDOM = ROSTER.length, COLS = 5;
{
  const b = document.createElement("button");
  b.className = "cell rnd"; b.dataset.i = RANDOM;
  b.innerHTML = `<span class="q">?</span><span class="lbl">RANDOM</span>`;
  b.addEventListener("click", () => { const p = activePicker(); if (p < 0) return; app.cursor[p] = RANDOM; confirmPick(p); });
  b.addEventListener("mouseenter", () => { const p = activePicker(); if (p < 0) return; app.cursor[p] = RANDOM; sfx("move"); renderSelect(); });
  grid.appendChild(b);
}
const cellId = (i) => (i < ROSTER.length ? ROSTER[i] : null);
function activePicker() {
  if (app.mode === "online") return app.locked[app.slot] ? -1 : app.slot;
  if (app.mode === "local") return !app.locked[0] ? 0 : !app.locked[1] ? 1 : -1;
  return !app.locked[0] ? 0 : !app.locked[1] ? 1 : -1;
}
function openSelect() {
  app.locked = [false, false];
  if (app.mode !== "online") { app.picks = [null, null]; }
  app.cursor = [app.cursor[0] || 0, app.cursor[1] ?? 4];
  $("#select .s1 .who").textContent = app.mode === "online" ? (app.slot === 0 ? "YOU" : "RIVAL") : "P1";
  $("#select .s2 .who").textContent = app.mode === "online" ? (app.slot === 1 ? "YOU" : "RIVAL") : app.mode === "local" ? "P2" : app.mode === "training" ? "DUMMY" : "CPU";
  const hints = {
    cpu: "P1: A/D W/S move, F pick (then pick CPU) &bull; G / ESC back", training: "Pick your fighter, then the dummy", local: "P1: WASD + F &bull; P2: ARROWS + NUM1 / K",
    online: "Pick your fighter &bull; F / ENTER to lock in &bull; host picks the stage",
  };
  $(".sel-hint").innerHTML = hints[app.mode];
  $("#btnReady").textContent = app.mode === "online" ? "READY" : "FIGHT!";
  $("#selRoom").classList.toggle("hidden", app.mode !== "online");
  if (app.mode === "online") $("#selCode").textContent = app.code || "-----";
  show("select");
  if (app.voiceOn) voice("choose");
  renderSelect();
}
function kitHTML(id) {
  const c = CHARS[id], mv = c.moves;
  const basics = (c.basicByStance ? c.basicByStance.dap : c.basic).map((k) => mv[k].name).join(" › ");
  const li = (k, n, d, cls = "") => `<li class="${cls}"><b>${k}</b><span>${n}</span>${d ? `<em>${d}</em>` : ""}</li>`;
  return li("ATK", basics, c.basicByStance ? "APSAY stance: " + c.basicByStance.apsay.map((k) => mv[k].name).join(" › ") : "3-hit chain • cancel into skills on hit")
    + li("S1", mv.s1.name, mv.s1.desc) + li("S2", mv.s2.name, mv.s2.desc) + li("ULT", mv.s3.name, mv.s3.desc)
    + li("PSV", c.passive.name, c.passive.desc, "pas");
}
let selAnim = 0;
function renderSelect() {
  $$(".cell").forEach((cell, i) => {
    const hov = [0, 1].filter((p) => app.cursor[p] === i && (app.mode !== "online" || p === app.slot || app.picks[p] === cellId(i)));
    cell.classList.toggle("c1", hov.includes(0) || !!cellId(i) && app.picks[0] === cellId(i) && app.locked[0]);
    cell.classList.toggle("c2", hov.includes(1) || !!cellId(i) && app.picks[1] === cellId(i) && app.locked[1]);
  });
  for (const p of [0, 1]) {
    const side = $(p === 0 ? "#select .s1" : "#select .s2");
    let id = app.picks[p];
    if (!app.locked[p] && (app.mode !== "online" || p === app.slot)) {
      id = cellId(app.cursor[p]);
      if (!id) { side.querySelector(".cname").textContent = "RANDOM"; side.querySelector(".cname").style.color = "#fff"; side.querySelector(".ctitle").textContent = "Leave it to fate"; side.querySelector(".kitlist").innerHTML = ""; side.dataset.ch = ""; side.querySelector(".big-spr").getContext("2d").clearRect(0, 0, 160, 192); continue; }
    }
    if (app.mode === "online" && p !== app.slot && !app.room?.players?.[p]) { side.querySelector(".cname").textContent = "WAITING…"; side.querySelector(".ctitle").textContent = "Share the room code"; side.querySelector(".kitlist").innerHTML = ""; side.querySelector(".big-spr").getContext("2d").clearRect(0, 0, 160, 192); side.querySelector(".rdy").classList.add("hidden"); continue; }
    if (!id) { side.querySelector(".cname").textContent = "—"; continue; }
    const c = CHARS[id];
    side.querySelector(".cname").textContent = c.name;
    side.querySelector(".cname").style.color = c.color;
    side.querySelector(".ctitle").textContent = c.title + (app.mode === "online" && app.room?.players?.[p] ? " — " + app.room.players[p].name : "");
    side.querySelector(".kitlist").innerHTML = kitHTML(id);
    side.dataset.ch = id;
    side.querySelector(".rdy").classList.toggle("hidden", !app.locked[p]);
  }
  $("#stageName").textContent = STAGES[app.stage].name.toUpperCase();
  const canStage = app.mode !== "online" || app.slot === 0;
  $$(".stagepick button").forEach((b) => (b.disabled = !canStage));
  const ready = app.mode === "online" ? !!app.picks[app.slot] || true : app.locked[0] && app.locked[1];
  $("#btnReady").disabled = app.mode !== "online" && !ready;
}
function animSelect() {
  selAnim++;
  for (const p of [0, 1]) {
    const side = $(p === 0 ? "#select .s1" : "#select .s2");
    const id = side.dataset.ch; if (!id) continue;
    if (app.mode === "online" && p !== app.slot && !app.room?.players?.[p]) continue;
    drawFull(side.querySelector(".big-spr"), id, selAnim, p === 1);
  }
}
function confirmPick(p) {
  if (app.cursor[p] === RANDOM) app.cursor[p] = Math.floor(Math.random() * ROSTER.length);
  const id = ROSTER[app.cursor[p]];
  app.picks[p] = id; sfx("confirm");
  if (app.voiceOn) voice("n_" + id);
  if (app.mode === "online") {
    app.locked[p] = true;
    app.net.send({ t: "pick", char: id }); app.net.send({ t: "ready", v: true });
  } else {
    app.locked[p] = true;
    if (app.mode !== "local" && p === 0) app.cursor[1] = app.cursor[1] ?? 4;
    if (app.locked[0] && app.locked[1]) setTimeout(() => { if (app.screen === "select" && app.locked[0] && app.locked[1]) beginOffline(); }, 650);
  }
  renderSelect();
}
$("#btnReady").addEventListener("click", () => {
  if (app.mode === "online") { if (!app.locked[app.slot]) confirmPick(app.slot); return; }
  if (!app.locked[0]) { confirmPick(0); return; }
  if (!app.locked[1]) { confirmPick(1); return; }
  beginOffline();
});
$(".sp-prev").addEventListener("click", () => changeStage(-1));
$(".sp-next").addEventListener("click", () => changeStage(1));
function changeStage(d) {
  if (app.mode === "online" && app.slot !== 0) return;
  app.stage = (app.stage + 3 + d) % 3; sfx("move");
  if (app.mode === "online") app.net.send({ t: "stage", stage: app.stage });
  renderSelect();
}
function selectInput() {
  const pk = (codes) => codes.some((c) => keyPressed(c));
  const players = app.mode === "local" ? [0, 1] : [activePicker()];
  for (const p of players) {
    if (p < 0 || app.locked[p]) continue;
    const local = app.mode === "local";
    const K = p === 0 || !local
      ? { l: local ? ["KeyA"] : ["KeyA", "ArrowLeft"], r: local ? ["KeyD"] : ["KeyD", "ArrowRight"], u: local ? ["KeyW"] : ["KeyW", "ArrowUp"], d: local ? ["KeyS"] : ["KeyS", "ArrowDown"], ok: local ? ["KeyF"] : ["KeyF", "KeyJ", "Enter", "Space"] }
      : { l: ["ArrowLeft"], r: ["ArrowRight"], u: ["ArrowUp"], d: ["ArrowDown"], ok: ["Numpad1", "KeyK", "Enter"] };
    let c = app.cursor[p];
    if (pk(K.l)) c = (c + NCELL - 1) % NCELL; if (pk(K.r)) c = (c + 1) % NCELL;
    if (pk(K.u)) c = c - COLS < 0 ? c + COLS * Math.floor((NCELL - 1 - c) / COLS) : c - COLS;
    if (pk(K.d)) c = c + COLS >= NCELL ? c % COLS : c + COLS;
    if (c !== app.cursor[p]) { app.cursor[p] = c; sfx("move"); renderSelect(); }
    if (pk(K.ok)) confirmPick(p);
  }
  if (keyPressed("KeyQ")) changeStage(-1);
  if (keyPressed("KeyE")) changeStage(1);
  if (keyPressed("Escape") || keyPressed("KeyG")) goBack();
}

// ================= match =================
function beginOffline() {
  const seed = (Math.random() * 2 ** 31) | 0;
  app.names = app.mode === "local" ? ["P1", "P2"] : app.mode === "training" ? ["YOU", "DUMMY"] : ["YOU", "CPU"];
  startMatch(app.picks, app.stage, seed);
  app.ai = app.mode === "cpu" ? new AI(app.diff, 1) : null;
  app.dummy = app.mode === "training" ? new AI("normal", 1, app.dummyMode || "stand") : null;
  $("#btnTrainDummy").classList.toggle("hidden", app.mode !== "training");
}
function startMatch(chars, stage, seed) {
  app.S = newMatch({ chars, seed, mode: app.mode === "training" ? "training" : "vs", stage });
  R.setStage(STAGES[stage].id); R.resetFx();
  app.paused = false; app.stall = 0; app.hudCache = {}; app.trail = [app.S.p[0].hp, app.S.p[1].hp]; app.trailHold = [0, 0];
  buildHud();
  show("fight");
  music("fight");
  preloadVoices(["round1", "round2", "final", "fight", "ko", "perfect", "parry", "counter", "timeup", "youwin", "youlose", "p1wins", "p2wins", "draw", "doubleko", ...chars.flatMap((c) => [c + "_ult", c + "_win"]), "william_wait", "dapsay_s1", "jiross_t0", "jiross_t1", "jiross_t2", "jiross_t3", "jiross_t4", "dap_s1", "apsay_s1", "jog_s1b", ...(chars.includes("paulite") ? [0, 1, 2, 3, 4, 5].map((n) => "paulite_j" + n) : [])]);
  clearPressed();
}

// ================= HUD =================
const KEYS = { solo: ["F", "G", "R", "T", "Y"], p2: ["1/K", "2/L", "4/I", "5/O", "6/P"], none: ["", "", "", "", ""] };
function buildHud() {
  const S = app.S;
  for (const i of [0, 1]) {
    const f = S.p[i], c = CHARS[f.ch], side = i === 0 ? ".p1" : ".p2";
    $(`.pl${side} .nm`).textContent = c.name + (app.names[i] && app.mode === "online" ? " · " + app.names[i] : "");
    $(`.pl${side} .nm`).style.color = c.color;
    drawPortrait($(`.pl${side} .por`), f.ch, i === 1);
    const keys = app.mode === "local" ? (i === 0 ? KEYS.solo : KEYS.p2) : (i === (app.mode === "online" ? app.slot : 0) ? KEYS.solo : KEYS.none);
    const mv = c.moves;
    $(`.kit${side}`).innerHTML = [
      `<div class="slot atk" title="Basic attack"><div class="dots"><i></i><i></i><i></i></div><div class="ic">ATK</div><span class="key">${keys[0]}</span></div>`,
      `<div class="slot par" title="Parry"><div class="ic">PRY</div><span class="key">${keys[1]}</span></div>`,
      ...[1, 2, 3].map((n) => `<div class="slot sk s${n} ${n === 3 ? "ult" : ""}" style="--c:${c.color}" title="${mv["s" + n].name}"><div class="cd"></div><div class="ic">${abbr(mv["s" + n].name)}</div><span class="sec"></span><span class="key">${keys[n + 1]}</span></div>`),
    ].join("");
  }
  $("#net").classList.toggle("hidden", app.mode !== "online");
}
function abbr(n) { const w = n.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean); return (w.length > 1 ? w.map((x) => x[0]).join("") : w[0].slice(0, 3)).slice(0, 3).toUpperCase(); }
function setText(el, key, v) { if (app.hudCache[key] !== v) { app.hudCache[key] = v; el.textContent = v; } }
function setCls(el, key, cls, on) { const k = key + cls; if (app.hudCache[k] !== on) { app.hudCache[k] = on; el.classList.toggle(cls, on); } }
function updateHud() {
  const S = app.S; if (!S) return;
  for (const i of [0, 1]) {
    const f = S.p[i], side = i === 0 ? ".p1" : ".p2";
    const pct = Math.max(0, f.hp / f.maxHp);
    if (f.hp < app.trail[i]) { app.trailHold[i]++; if (app.trailHold[i] > 34) app.trail[i] = Math.max(f.hp, app.trail[i] - Math.max(2, (app.trail[i] - f.hp) * 0.08)); }
    else { app.trail[i] = f.hp; app.trailHold[i] = 0; }
    if (f.sinceHit === 0) app.trailHold[i] = 0;
    $(`.pl${side} .fill`).style.width = (pct * 100).toFixed(2) + "%";
    $(`.pl${side} .trail`).style.width = ((app.trail[i] / f.maxHp) * 100).toFixed(2) + "%";
    setCls($(`.pl${side} .bar`), "bar" + i, "low", pct < 0.25);
    const pips = `${"<i class='w'></i>".repeat(S.wins[i])}${"<i></i>".repeat(Math.max(0, S.roundsToWin - S.wins[i]))}`;
    if (app.hudCache["pip" + i] !== pips) { app.hudCache["pip" + i] = pips; $(`.pl${side} .pips`).innerHTML = pips; }
    // status chips
    const st = [];
    const s = f.sx;
    if (f.st === "dizzy") st.push(["STUN", "#ffe14d"]);
    if (s.bleed) st.push(["BLEED x" + s.bleed, "#ff3355"]);
    if (s.burn) st.push(["BURN " + s.burn, "#ff7a29"]);
    if (s.blind) st.push(["BLIND", "#a0a0b0"]);
    if (s.confuse) st.push(["CONFUSED", "#9b8cff"]);
    if (s.slow) st.push(["SLOW", "#7c7cff"]);
    if (s.floaty) st.push(["FLOAT", "#7c7cff"]);
    if (s.rattled) st.push(["RATTLED", "#ff9a3c"]);
    if (s.momentum) st.push(["MOMENTUM x" + s.momentum, "#ffcf5a"]);
    if (s.counter) st.push(["COUNTER!", "#7fd3ff"]);
    if (s.smoke) st.push(["HIDDEN", "#8a8a96"]);
    if (s.silence) st.push(["SILENCED " + Math.ceil(s.silence / 60), "#60d7ff"]);
    if (s.sad) st.push(["SAD", "#76a9ff"]);
    if (s.poison) st.push(["POISON", "#65ff6e"]);
    if (f.ch === "dapsay") st.push([f.stance === "dap" ? "DAP STANCE" : "APSAY STANCE", f.stance === "dap" ? "#ff5a6a" : "#b56bff"]);
    const html = st.map(([t, c]) => `<span class="st" style="color:${c}">${t}</span>`).join("");
    if (app.hudCache["st" + i] !== html) { app.hudCache["st" + i] = html; $(`.pl${side} .status`).innerHTML = html; }
    // kit
    const kit = $(`.kit${side}`);
    const ref = f.act ? f.act.ref : "";
    const chainIdx = f.st === "act" && /:(b|d|a)\d$/.test(ref) ? +ref.slice(-1) : 0;
    $$(".atk .dots i", kit).forEach((d, k) => setCls(d, `d${i}${k}`, "on", k < chainIdx));
    setCls($(".atk", kit), "atk" + i, "active", chainIdx > 0);
    setCls($(".par", kit), "par" + i, "live", f.st === "parry" && !f.act?.parried);
    setCls($(".par", kit), "parc" + i, "ctr", s.counter > 0);
    for (let n = 1; n <= 3; n++) {
      const el = $(".s" + n, kit), cd = f.cd[n - 1], max = CHARS[f.ch].moves["s" + n].cd;
      const frac = cd > 0 ? (cd / max).toFixed(3) : "0";
      if (app.hudCache[`cd${i}${n}`] !== frac) { app.hudCache[`cd${i}${n}`] = frac; el.style.setProperty("--cd", frac); }
      setText($(".sec", el), `sec${i}${n}`, cd > 0 ? String(Math.ceil(cd / 60)) : "");
      setCls(el, `rdy${i}${n}`, "ready", cd <= 0);
      setCls(el, `cool${i}${n}`, "cool", cd > 0);
      setCls(el, `bl${i}${n}`, "blind", s.blind > 0);
      setCls(el, `si${i}${n}`, "sil", s.silence > 0);
    }
  }
  const secs = Math.ceil(S.timer / 60);
  setText($(".timer span"), "timer", S.mode === "training" ? "∞" : String(secs));
  setCls($(".timer"), "timer", "hurry", secs <= 10 && S.phase === "fight" && S.mode !== "training");
  setText($(".timer .rnd"), "rnd", S.mode === "training" ? "TRAIN" : "ROUND " + S.round);
}

// ================= banner & events =================
let bannerT = null;
function banner(main, sub = "", cls = "", ms = 1100) {
  const b = $("#banner");
  b.className = ""; void b.offsetWidth;
  $(".b-main", b).textContent = main; $(".b-sub", b).textContent = sub;
  b.className = "show " + cls;
  clearTimeout(bannerT); bannerT = setTimeout(() => (b.className = ""), ms);
}
function say(key, gap = 0) {
  if (!app.voiceOn) return;
  const now = performance.now();
  if (gap && app.lastVoice[key] && now - app.lastVoice[key] < gap) return;
  app.lastVoice[key] = now;
  voice(key);
}
function handleEvents(evs, S) {
  for (const e of evs) {
    R.onEvent(e, S);
    switch (e.type) {
      case "hit": sfx(e.sfx === "heavyslash" || e.sfx === "homerun" ? e.sfx : e.heavy ? (e.sfx === "bat" ? "heavybat" : "heavy") : e.sfx || "punch"); if (e.heavy && e.sfx !== "heavy") sfx("heavy"); break;
      case "block": sfx("block"); break;
      case "parry": sfx("parry"); say("parry", 900); banner("PARRY!", "", "parry", 600); break;
      case "counter": sfx("counter"); say("counter", 1500); break;
      case "swing": sfx(e.heavy ? "swingHeavy" : "swing"); break;
      case "cast": {
        const ch = S.p[e.who].ch;
        sfx(e.ult ? "ult" : "cast");
        if (e.ult && !e.stolen && ch !== "jiross") say(ch + "_ult");
        if (ch === "dapsay" && e.ref === "dapsay:s1") say("dapsay_s1", 800);
        if (e.ref === "dap:s1") say("dap_s1", 800);
        if (e.ref === "apsay:s1") say("apsay_s1", 800);
        if (e.ref === "jog:s1b") say("jog_s1b", 800);
        break;
      }
      case "javatar": say("jiross_ult"); break;
      case "proj": sfx(e.kind === "disc" || e.kind === "boomer" ? "disc" : "fire"); break;
      case "dash": sfx("dash"); break;
      case "jump": sfx("jump"); break;
      case "land": sfx("land"); break;
      case "wall": sfx("wall"); break;
      case "stun": sfx("stun"); break;
      case "teleport": sfx("teleport"); break;
      case "catch": sfx("catch"); break;
      case "implode": sfx("implode"); break;
      case "stomp": sfx("slam"); break;
      case "zone": sfx(e.kind === "smoke" ? "smoke" : "gravity"); break;
      case "armor": sfx("block"); break;
      case "taunt": say("jiross_t" + e.line); break;
      case "waitclass": say("william_wait"); break;
      case "joke": say("paulite_j" + e.line); break;
      case "silence": sfx("stun"); break;
      case "sad": sfx("dot"); break;
      case "detonate": sfx("heavyslash"); break;
      case "round": banner(e.final ? "FINAL ROUND" : "ROUND " + e.n, "", "", 1150); say(e.final ? "final" : "round" + Math.min(3, e.n)); break;
      case "fight": banner("FIGHT!", "", "fight", 750); say("fight"); break;
      case "timeup": banner("TIME!", "", "", 1500); say("timeup"); sfx("beep"); break;
      case "ko": {
        sfx("ko");
        const dbl = S.p[0].hp <= 0 && S.p[1].hp <= 0;
        setTimeout(() => { banner(dbl ? "DOUBLE K.O." : "K.O.!", e.perfect ? "PERFECT!" : "", "ko", 2200); say(dbl ? "doubleko" : "ko"); if (e.perfect) setTimeout(() => say("perfect"), 900); }, 350);
        break;
      }
      case "matchEnd": {
        clearTimeout(app.resultsT);
        app.resultsT = setTimeout(() => showResults(e.winner), 1900);
        const w = e.winner;
        setTimeout(() => {
          if (w < 0) say("draw");
          else if (app.mode === "local") say(w === 0 ? "p1wins" : "p2wins");
          else { const me = app.mode === "online" ? app.slot : 0; say(w === me ? "youwin" : "youlose"); }
          setTimeout(() => w >= 0 && say(S.p[w].ch + "_win"), 1300);
        }, 600);
        break;
      }
    }
  }
}
function showResults(w) {
  const S = app.S;
  const me = app.mode === "online" ? app.slot : 0;
  let title = "DRAW GAME";
  if (w >= 0) title = app.mode === "local" ? `P${w + 1} WINS!` : w === me ? "YOU WIN!" : "YOU LOSE";
  $(".res-win").textContent = title;
  $(".res-sub").textContent = w >= 0 ? `${CHARS[S.p[w].ch].name} — ${S.wins[0]} : ${S.wins[1]}` : `${S.wins[0]} : ${S.wins[1]}`;
  if (w >= 0) drawFull($(".res-spr"), S.p[w].ch, 0, false); else $(".res-spr").getContext("2d").clearRect(0, 0, 160, 192);
  $(".res-msg").textContent = "";
  $("#btnRematch").disabled = false;
  show("results");
}
$("#btnRematch").addEventListener("click", () => {
  sfx("confirm");
  if (app.mode === "online") { app.net.send({ t: "rematch" }); $(".res-msg").textContent = "WAITING FOR OPPONENT…"; $("#btnRematch").disabled = true; return; }
  beginOffline();
});
$("#btnChange").addEventListener("click", () => { sfx("select"); if (app.mode === "online") { app.net.send({ t: "select" }); return; } openSelect(); });
$("#btnMenu").addEventListener("click", () => { sfx("select"); if (app.mode === "online") leaveRoom(); app.S = null; show("menu"); });

// ================= pause =================
function togglePause() {
  if (app.screen === "fight") { app.paused = app.mode !== "online"; show("pause"); sfx("select"); }
  else if (app.screen === "pause") { app.paused = false; show("fight"); sfx("select"); }
}
$("#btnResume").addEventListener("click", togglePause);
$("#btnQuit").addEventListener("click", () => { if (app.mode === "online") leaveRoom(); app.S = null; app.paused = false; show("menu"); });
$("#btnPauseHow").addEventListener("click", () => { app.fromPause = true; buildMovelist(); show("howto"); });
$("#btnTrainDummy").addEventListener("click", () => {
  const modes = ["stand", "block", "parry", "cpu"];
  app.dummyMode = modes[(modes.indexOf(app.dummyMode || "stand") + 1) % modes.length];
  app.dummy = new AI("normal", 1, app.dummyMode === "cpu" ? null : app.dummyMode);
  $("#btnTrainDummy").textContent = "DUMMY: " + app.dummyMode.toUpperCase();
});

// ================= online =================
const lobbyMsg = (t, err = false) => { const m = $("#lobbyMsg"); m.textContent = t; m.classList.toggle("err", err); };
$("#btnQuick").addEventListener("click", () => quickMatch());
$("#btnCreate").addEventListener("click", async () => { initAudio(); lobbyMsg("CREATING ROOM…"); try { const { code } = await (await fetch("/api/new")).json(); joinRoom(code); } catch { lobbyMsg("COULD NOT REACH SERVER", true); } });
$("#btnJoin").addEventListener("click", () => { const c = $("#jcode").value.trim().toUpperCase(); if (c.length >= 4) joinRoom(c); else lobbyMsg("ENTER A ROOM CODE", true); });
$("#jcode").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#btnJoin").click(); });
$("#selCopy").addEventListener("click", () => $("#btnCopy").click());
$("#btnCopy").addEventListener("click", async () => {
  const link = `${location.origin}/?room=${app.code}`;
  let ok = false;
  try { await navigator.clipboard.writeText(link); ok = true; } catch {}
  lobbyMsg(ok ? "INVITE LINK COPIED!" : link);
  if (app.screen === "select") { const b = $("#selCopy"); b.textContent = ok ? "LINK COPIED!" : link; setTimeout(() => (b.textContent = "COPY INVITE LINK"), 2500); }
});
async function quickMatch(skip = "") {
  initAudio(); lobbyMsg("SEARCHING FOR A CHALLENGER…");
  try { const r = await (await fetch("/api/quick" + (skip ? "?skip=" + skip : ""))).json(); app.quick = true; joinRoom(r.code, true); }
  catch { lobbyMsg("COULD NOT REACH SERVER", true); }
}
function leaveRoom() { app.reconnectCode = null; clearTimeout(app.reconnT); if (app.net) { const n = app.net; app.net = null; n.close(); } app.session = null; app.room = null; app.code = null; $("#roomInfo").classList.add("hidden"); }
function playerId() {
  let id = store.get("pid", "");
  if (!id) { id = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(16).padStart(2, "0")).join(""); store.set("pid", id); }
  if (!app._pid) app._pid = id + "-" + Math.random().toString(36).slice(2, 6); // per-tab, so 2 tabs = 2 players
  return app._pid;
}
function scheduleReconnect(delay = 900) {
  if (!app.reconnectCode || app.net) return;
  clearTimeout(app.reconnT);
  app.reconnT = setTimeout(async () => {
    if (!app.reconnectCode || app.net) return;
    app.reconnTries = (app.reconnTries || 0) + 1;
    if (app.reconnTries > 25) { app.reconnectCode = null; show("online"); lobbyMsg("CONNECTION LOST — REJOIN WITH THE ROOM CODE", true); return; }
    await joinRoom(app.reconnectCode, app.quick, true);
    if (!app.net || !app.net.open) scheduleReconnect(Math.min(4000, 900 + app.reconnTries * 300));
  }, delay);
}
async function joinRoom(code, quick = false, reconnect = false) {
  if (app.joining) return;                      // ignore double taps / Enter+click
  if (!reconnect && app.net && app.net.open && app.code === code) return;
  app.joining = true;
  if (!reconnect) leaveRoom(); else if (app.net) { const n = app.net; app.net = null; n.close(); }
  const name = ($("#pname").value || store.get("name", "") || "PLAYER" + Math.floor(Math.random() * 90 + 10)).toUpperCase().slice(0, 14);
  store.set("name", name);
  const net = new NetClient(); app.net = net; app.code = code; app.quick = quick;
  net.on("welcome", (m) => {
    const wasPlaying = app.screen === "fight" || app.screen === "results" || app.screen === "pause";
    const sameSeat = reconnect && m.slot === app.slot;
    app.slot = m.slot; app.code = m.code; app.mode = "online";
    app.reconnectCode = m.code; app.reconnTries = 0;
    $("#rcode").textContent = m.code; $("#roomInfo").classList.remove("hidden");
    const myPick = sameSeat ? app.picks[m.slot] : null;
    app.picks = [null, null]; app.locked = [false, false]; app.session = null;
    if (myPick) app.picks[m.slot] = myPick;
    if (reconnect) { app.S = null; if (app.screen !== "select" || wasPlaying) openSelect(); else renderSelect(); banner("RECONNECTED", wasPlaying ? "MATCH RESET — PICK & READY AGAIN" : "", "", 1800); }
    else openSelect();
  });
  net.on("full", () => {
    if (reconnect) return;
    if (quick) quickMatch(code); else { app.reconnectCode = null; show("online"); lobbyMsg("ROOM IS FULL", true); }
  });
  net.on("room", (m) => {
    const had = app.room?.players?.[1 - app.slot];
    app.room = m; app.stage = m.stage;
    for (const p of [0, 1]) {
      const pl = m.players[p];
      if (p !== app.slot) { app.picks[p] = pl?.char || null; app.locked[p] = !!pl?.ready; }
      else if (pl) { app.locked[p] = !!pl.ready; if (pl.char) app.picks[p] = pl.char; }
    }
    if (!had && m.players[1 - app.slot] && app.screen === "select") { sfx("confirm"); if (app.voiceOn) voice("rematch"); }
    if (app.screen === "select") renderSelect();
  });
  net.on("start", (m) => {
    app.names = m.names;
    app.picks = m.chars.slice();
    startMatch(m.chars, m.stage, m.seed);
    // adaptive input delay: hide part of the one-way latency, roll back the rest (max 12f)
    const oneWay = (net.peerRtt || 60) / 2 / 16.67;
    const delay = Math.max(m.delay || 2, Math.min(5, Math.ceil(oneWay) - 7));
    app.session = new RollbackSession(app.S, app.slot, net, { delay });
  });
  net.on("in", (m) => app.session && app.session.onInput(m));
  net.on("chk", (m) => app.session && app.session.onCheck(m));
  net.on("emote", (m) => { if ("away" in m && (app.screen === "fight" || app.screen === "select")) banner(m.away ? "RIVAL TABBED OUT" : "RIVAL IS BACK", m.away ? "THE MATCH KEEPS RUNNING" : "", "", 1800); });
  net.on("rematchReq", (m) => { if (m.slot !== app.slot && app.screen === "results") $(".res-msg").textContent = "OPPONENT WANTS A REMATCH!"; });
  net.on("toSelect", () => { app.session = null; app.locked = [false, false]; openSelect(); });
  net.on("left", () => {
    app.session = null;
    if (app.screen === "fight" || app.screen === "results" || app.screen === "pause") { app.S = null; openSelect(); }
    banner("RIVAL DISCONNECTED", "THEY CAN REJOIN WITH CODE " + app.code, "", 2600);
  });
  net.on("peerRtt", (r) => {
    const el = $("#net"); $("span", el).textContent = Math.round(r) + " ms";
    el.classList.toggle("mid", r > 90 && r <= 160); el.classList.toggle("bad", r > 160);
  });
  net.on("close", (e) => {
    if (app.net !== net || net.byUs) return;
    app.net = null; app.session = null;
    if (e && e.code === 4000) return; // room full (handled above)
    if (app.reconnectCode) { banner("CONNECTION LOST", "RECONNECTING…", "", 1500); scheduleReconnect(document.hidden ? 300 : 900); }
    else if (app.screen !== "menu" && app.screen !== "title") { show("online"); lobbyMsg("DISCONNECTED FROM ROOM", true); }
  });
  try {
    await net.connect(code, name, playerId());
    if (!reconnect) lobbyMsg(quick ? "CONNECTED — WAITING FOR A CHALLENGER…" : "ROOM " + code + " — SHARE THE CODE OR LINK");
  } catch {
    if (app.net === net) app.net = null;
    if (!reconnect) lobbyMsg("CONNECTION FAILED", true);
  } finally { app.joining = false; }
}

// ================= settings =================
function applySettings() {
  const crt = store.get("crt", true);
  $("#crt").classList.toggle("on", crt); $("#optCrt").checked = crt;
  app.voiceOn = store.get("voice", true); $("#optVoice").checked = app.voiceOn;
  for (const [id, k] of [["optSfx", "sfx"], ["optMusic", "music"], ["optVoiceVol", "voice"]]) { const v = store.get("vol_" + k, audioSettings()[k]); $("#" + id).value = v; setVolume(k, +v); }
  const touchOn = store.get("touch", matchMedia("(pointer: coarse)").matches);
  $("#optTouch").checked = touchOn; $("#touch").classList.toggle("hidden", !touchOn);
  const m = store.get("muted", false); setMuted(m); $("#muteBtn").classList.toggle("off", m);
}
$("#optCrt").addEventListener("change", (e) => { store.set("crt", e.target.checked); applySettings(); });
$("#optVoice").addEventListener("change", (e) => { store.set("voice", e.target.checked); applySettings(); });
$("#optTouch").addEventListener("change", (e) => { store.set("touch", e.target.checked); applySettings(); });
for (const [id, k] of [["optSfx", "sfx"], ["optMusic", "music"], ["optVoiceVol", "voice"]]) $("#" + id).addEventListener("input", (e) => { store.set("vol_" + k, +e.target.value); setVolume(k, +e.target.value); if (k === "sfx") sfx("punch"); });
$("#muteBtn").addEventListener("click", () => { initAudio(); store.set("muted", !store.get("muted", false)); applySettings(); });
setupTouch($("#touch"));

function buildMovelist() {
  $("#movelist").innerHTML = ROSTER.map((id) => { const c = CHARS[id]; return `<div class="mv"><h4 style="color:${c.color}">${c.name} <small style="color:var(--dim)">${c.title}</small></h4><ul class="kitlist">${kitHTML(id)}</ul></div>`; }).join("");
}

// ================= main loop =================
let last = performance.now(), acc = 0;
const DT = 1000 / 60;
function tick() {
  if (app.screen === "title") {
    const S = app.attract; if (!S) startAttract();
    const A = app.attract;
    const ev = [];
    step(A, [app.attractAI[0].think(A), app.attractAI[1].think(A)], ev);
    for (const e of ev) R.onEvent(e, A);
    if (A.phase === "end" && A.phaseT > 120) startAttract();
    return;
  }
  if (app.screen === "select") { selectInput(); return; }
  if ((app.screen !== "fight" && app.screen !== "pause" && app.screen !== "results") || !app.S || app.paused) {
    menuKeys(); return;
  }
  if (app.screen === "fight" && keyPressed("Escape")) { togglePause(); return; }
  if (app.screen !== "fight") menuKeys();
  if (app.mode === "online") {
    if (!app.session) return;
    const bits = app.screen === "fight" ? readInputs("solo")[0] : 0;
    const ev = [];
    const r = app.session.tick(bits, ev);
    app.S = app.session.S;
    if (r === null) app.stall++; else app.stall = 0;
    $("#netwait").classList.toggle("hidden", app.stall < 20);
    if (app.stall === 20) $("#netwait").textContent = "WAITING FOR RIVAL'S CONNECTION…";
    if (app.stall === 600) $("#netwait").textContent = "RIVAL NOT RESPONDING — CHECK THEIR CONNECTION";
    handleEvents(ev, app.S);
  } else {
    const inputs = readInputs(app.mode === "local" ? "local" : "solo");
    if (app.screen !== "fight") { inputs[0] = 0; inputs[1] = 0; }
    if (app.ai) inputs[1] = app.ai.think(app.S);
    if (app.dummy) inputs[1] = app.dummy.think(app.S);
    const ev = [];
    step(app.S, inputs, ev);
    handleEvents(ev, app.S);
  }
}
function menuKeys() {
  const f = focusables();
  if (!f.length) { if (keyPressed("Escape")) goBack(); return; }
  if (document.activeElement && document.activeElement.tagName === "INPUT") { if (keyPressed("Escape")) { document.activeElement.blur(); } return; }
  const dn = keyPressed("ArrowDown") || keyPressed("KeyS"), up = keyPressed("ArrowUp") || keyPressed("KeyW");
  if (dn || up) {
    focusIdx = (focusIdx + (dn ? 1 : -1) + f.length) % f.length; sfx("move"); refreshFocus();
    const fb = f[focusIdx]; if (app.screen === "menu") $(".cpu-diff").classList.toggle("invis", !(fb.dataset && fb.dataset.mode === "cpu"));
  }
  if (app.screen === "menu" && f[focusIdx]?.dataset.mode === "cpu" && (keyPressed("ArrowLeft") || keyPressed("ArrowRight") || keyPressed("KeyA") || keyPressed("KeyD"))) {
    const L = ["easy", "normal", "hard"]; app.diff = L[(L.indexOf(app.diff) + 1) % 3]; store.set("diff", app.diff);
    $$(".cpu-diff button").forEach((x) => x.classList.toggle("on", x.dataset.diff === app.diff)); sfx("select");
  }
  if (keyPressed("Enter") || keyPressed("KeyF") || keyPressed("Space") || keyPressed("KeyJ")) {
    const b = f[focusIdx]; if (b) { if (b.tagName === "INPUT") b.focus(); else b.click(); }
  }
  if (keyPressed("Escape")) { if (app.screen === "pause") togglePause(); else if (app.screen !== "results") goBack(); }
}
// Fixed 60 Hz simulation clock. Driven by a Web Worker timer because browsers
// pause requestAnimationFrame in background tabs, which would freeze an online
// match for BOTH players. rAF below is only used for drawing.
function pump() {
  const now = performance.now();
  let dt = now - last; last = now;
  if (dt > 250) dt = DT;
  acc += dt;
  let n = 0;
  while (acc >= DT && n < 8) { tick(); acc -= DT; n++; }
  if (n === 8) acc = 0;
}
let clockOk = false;
try {
  const clock = new Worker(URL.createObjectURL(new Blob(["setInterval(() => postMessage(0), 4);"], { type: "text/javascript" })));
  clock.onmessage = pump; clockOk = true;
} catch { clockOk = false; }
function frame(now) {
  if (!clockOk) pump();
  if (document.hidden) { requestAnimationFrame(frame); return; }
  if (app.screen === "title" && app.attract) R.draw(app.attract);
  else if (app.S && (app.screen === "fight" || app.screen === "pause" || app.screen === "results")) { R.draw(app.S); updateHud(); }
  else if (app.screen === "select") { if ((selAnim & 1) === 0 || true) animSelect(); drawIdleBg(); }
  else drawIdleBg();
  requestAnimationFrame(frame);
}
function drawIdleBg() {
  if (!app.attract) startAttract();
  // keep the attract match animating behind menus
  const A = app.attract;
  if (A.phase === "end" && A.phaseT > 120) startAttract();
  step(A, [app.attractAI[0].think(A), app.attractAI[1].think(A)], null);
  R.draw(A);
}

// global keys
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (app.screen === "title" && !e.repeat) { e.preventDefault(); anyStart(); clearPressed(); }
  if (e.code === "KeyM" && !e.repeat) { initAudio(); store.set("muted", !store.get("muted", false)); applySettings(); }
});
addEventListener("pointerdown", () => initAudio(), { once: true });
addEventListener("online", () => { if (app.reconnectCode && !app.net) { app.reconnTries = 0; scheduleReconnect(50); } });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && app.reconnectCode && (!app.net || !app.net.open)) { app.reconnTries = 0; scheduleReconnect(50); }
  if (document.hidden && app.mode !== "online" && app.screen === "fight") togglePause();
  if (app.mode === "online" && app.net) app.net.send({ t: "emote", away: document.hidden });
});

applySettings();
startAttract();
requestAnimationFrame(frame);
if (new URLSearchParams(location.search).get("room")) $(".press").textContent = "PRESS START TO JOIN ROOM";
window.__celestra = app; // for debugging / automated tests
