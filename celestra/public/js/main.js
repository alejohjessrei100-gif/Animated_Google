// Celestra Chronicles — app shell: screens, select, HUD, game loop, online flow.
import { newMatch, step, B, VIEW_W, currentSkillRef, METER_MAX, EX_COST } from "./sim.js";
import { CHARS, ROSTER, STAGES, getMove, PARRY, STANCES, THROWS } from "./chars.js";
import { Renderer } from "./render.js";
import { drawPortrait, drawFull } from "./sprites.js";
import { readInputs, keyPressed, clearPressed, setupTouch, touch, BINDS, setBind, resetBinds, keyLabel, captureKey } from "./input.js";
import { AI } from "./ai.js";
import { NetClient, RollbackSession } from "./net.js";
import { initAudio, sfx, voice, music, setVolume, setMuted, audioSettings, preloadVoices } from "./audio.js";

const $ = (s, r = document) => r.querySelector(s);
function twoP() { return app.mode === "local" || (app.mode === "tag" && app.tagRival === "local"); }
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
  clearPressed(); // presses from the previous screen (e.g. attacks mid-fight) must not click buttons here
  $("#touch").classList.toggle("hidden", !(app.touchOn && (id === "fight")));
  const inMatch = id === "fight";
  $("#fsBtn").classList.toggle("hidden", inMatch); $("#muteBtn").classList.toggle("hidden", inMatch);
  document.body.classList.toggle("touchmode", !!app.touchOn);
  checkRotate();
  if (id === "ranks") loadRanks();
  if (id === "online") pollRooms();
  if (id === "controls") buildBinds();
  if (id === "challenges") renderChallenges();
  if (id === "tourney") loadTourneys();
  if (id === "menu") greet();
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
  sfx("confirm");
  askName(afterName);
}
function afterName() {
  const qs = new URLSearchParams(location.search);
  const q = qs.get("room"), rp = qs.get("replay"), tq = qs.get("tourney");
  show("menu");
  if (q) { show("online"); joinRoom(q.toUpperCase()); history.replaceState(null, "", location.pathname); }
  else if (rp) { history.replaceState(null, "", location.pathname); playReplayId(rp); }
  else if (tq) { history.replaceState(null, "", location.pathname); app.tView = tq; show("tourney"); }
}
$("#title").addEventListener("click", anyStart);

// ================= menu =================
$$("#menu .mi").forEach((b) => b.addEventListener("click", () => menuPick(b.dataset.mode)));
$$(".cpu-diff button").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); app.diff = b.dataset.diff; store.set("diff", app.diff); $$(".cpu-diff button").forEach((x) => x.classList.toggle("on", x === b)); sfx("select"); }));
function menuPick(m) {
  sfx("confirm");
  if (m === "howto") { buildMovelist(); show("howto"); return; }
  if (m === "settings") { show("settings"); return; }
  if (m === "ranks" || m === "feedback" || m === "controls" || m === "challenges" || m === "tourney") { show(m); return; }
  if (m === "online") { show("online"); $("#pname").value = store.get("name", "PLAYER" + Math.floor(Math.random() * 90 + 10)); return; }
  app.mode = m; openSelect();
}
$("#menu").addEventListener("mouseover", (e) => { const b = e.target.closest(".mi"); if (b) $(".cpu-diff").classList.toggle("invis", b.dataset.mode !== "cpu"); });
$$(".back").forEach((b) => b.addEventListener("click", goBack));
function goBack() {
  sfx("select");
  if (app.screen === "select") {
    if (app.mode === "online") { if (app.locked[app.slot]) { app.locked[app.slot] = false; app.net.send({ t: "ready", v: false }); renderSelect(); return; } leaveRoom(); show("online"); return; }
    if (app.locked[1] && !twoP()) { app.locked[1] = false; renderSelect(); return; }
    if (app.locked[0] && !twoP()) { app.locked[0] = false; renderSelect(); return; }
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
  b.innerHTML = `<canvas width="32" height="32"></canvas><span class="lbl">${c.name}</span>`;
  drawPortrait(b.querySelector("canvas"), id);
  b.addEventListener("click", () => { const p = activePicker(); if (p < 0) return; app.cursor[p] = i; confirmPick(p); });
  b.addEventListener("mouseenter", () => { const p = activePicker(); if (p < 0) return; app.cursor[p] = i; sfx("move"); renderSelect(); });
  grid.appendChild(b);
});
const NCELL = ROSTER.length + 1, RANDOM = ROSTER.length, COLS = 6;
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
  if (twoP()) return !app.locked[0] ? 0 : !app.locked[1] ? 1 : -1;
  return !app.locked[0] ? 0 : !app.locked[1] ? 1 : -1;
}
function openSelect() {
  app.locked = [false, false]; app.team = [[], []];
  if (app.mode !== "online") { app.picks = [null, null]; }
  if (app.mode === "tag" && !app.tagRival) app.tagRival = "cpu";
  $("#tagRival").classList.toggle("hidden", app.mode !== "tag");
  $("#tagRival").textContent = "RIVAL: " + (app.tagRival === "local" ? "PLAYER 2" : "CPU");
  $("#hzBtn").classList.toggle("hidden", app.mode === "online");
  $("#hzBtn").textContent = "HAZARDS: " + (store.get("hazards", true) ? "ON" : "OFF");
  app.cursor = [app.cursor[0] || 0, app.cursor[1] ?? 4];
  $("#select .s1 .who").textContent = app.mode === "online" ? (app.slot === 0 ? "YOU" : "RIVAL") : "P1";
  $("#select .s2 .who").textContent = app.mode === "online" ? (app.slot === 1 ? "YOU" : "RIVAL") : twoP() ? "P2" : app.mode === "training" ? "DUMMY" : "CPU";
  const hints = {
    cpu: "P1: A/D W/S move, F pick (then pick CPU) &bull; G / ESC back", training: "Pick your fighter, then the dummy", tutorial: "Pick the fighter you want to learn, then a dummy", local: "P1: WASD + F &bull; P2: ARROWS + NUM1 / K",
    online: "Pick your fighter &bull; F / ENTER to lock in &bull; host picks the stage",
    tag: "Pick TWO fighters for each team &bull; in battle, STANCE (V) tags your partner in",
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
    renderEvo(side, p, id);
    if (app.mode === "tag" && app.team && app.team[p].length) side.querySelector(".ctitle").textContent = "TEAM: " + app.team[p].map((c) => CHARS[c].name).join(" + ") + (app.team[p].length < 2 ? " + ?" : "");
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
    const evoOn = app.mode === "online" && p !== app.slot ? !!app.room?.players?.[p]?.evo : app.evo[p] && canEvolve(id);
    const altOn = app.mode === "online" && p !== app.slot ? !!app.room?.players?.[p]?.alt : app.alt[p] && hasAlt(id);
    drawFull(side.querySelector(".big-spr"), id, selAnim, p === 1, evoOn, altOn);
  }
}
function confirmPick(p) {
  if (app.cursor[p] === RANDOM) app.cursor[p] = Math.floor(Math.random() * ROSTER.length);
  const id = ROSTER[app.cursor[p]];
  if (app.mode === "tag") { // pick two fighters per side
    app.team[p].push(id); sfx("confirm"); if (app.voiceOn) voice("n_" + id);
    app.picks[p] = app.team[p][0];
    if (app.team[p].length < 2) { renderSelect(); return; }
  }
  app.picks[p] = app.mode === "tag" ? app.team[p][0] : id; sfx("confirm");
  if (app.voiceOn && app.mode !== "tag") voice("n_" + id);
  if (app.mode === "online") {
    app.locked[p] = true;
    app.net.send({ t: "pick", char: id, evo: canEvolve(id) && app.evo[p], alt: hasAlt(id) && app.alt[p] }); app.net.send({ t: "ready", v: true });
  } else {
    app.locked[p] = true;
    if (!twoP() && p === 0) app.cursor[1] = app.cursor[1] ?? 4;
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
  const players = twoP() ? [0, 1] : [activePicker()];
  for (const p of players) {
    if (p < 0 || app.locked[p]) continue;
    const local = twoP();
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
  if (keyPressed("KeyX")) toggleEvo(app.mode === "online" ? app.slot : 0);
  if (keyPressed("KeyQ")) changeStage(-1);
  if (keyPressed("KeyE")) changeStage(1);
  if (keyPressed("Escape") || keyPressed("KeyG")) goBack();
}

// ================= match =================
function beginOffline() {
  const seed = (Math.random() * 2 ** 31) | 0;
  app.names = twoP() ? ["P1", "P2"] : app.mode === "training" || app.mode === "tutorial" ? [myName(), "DUMMY"] : [myName(), "CPU"];
  const evo = app.mode === "tag" ? [false, false] : [canEvolve(app.picks[0]) && app.evo[0], twoP() && canEvolve(app.picks[1]) && app.evo[1]];
  const alt = [hasAlt(app.picks[0]) && app.alt[0], twoP() && hasAlt(app.picks[1]) && app.alt[1]];
  startMatch(app.picks, app.stage, seed, evo, { hazards: store.get("hazards", true), tag: app.mode === "tag" ? app.team.map((t) => t.slice()) : null, alt });
  app.ai = app.mode === "cpu" || (app.mode === "tag" && app.tagRival === "cpu") ? new AI(app.diff, 1) : null;
  app.dummy = app.mode === "training" ? new AI("normal", 1, app.dummyMode || "stand") : app.mode === "tutorial" ? new AI("normal", 1, "stand") : null;
  $("#btnTrainDummy").classList.toggle("hidden", app.mode !== "training");
  if (app.mode === "tutorial") startTutorial();
}
function startMatch(chars, stage, seed, evo = [false, false], extra = {}) {
  const simMode = app.mode === "replay" ? app.replay.mode : app.mode === "training" || app.mode === "tutorial" ? "training" : "vs";
  const hazards = extra.hazards ?? true, tag = extra.tag || null, alt = extra.alt || null;
  app.S = newMatch({ chars, seed, mode: simMode, stage, evo, hazards, tag, alt });
  app.rec = []; app.recMeta = { v: 1, chars: chars.slice(), seed, stage, mode: simMode, names: (app.names || []).slice(), at: Date.now(), evo: evo.slice(), hazards, tag, alt };
  app.replaySaved = null;
  $("#tut").classList.toggle("hidden", app.mode !== "tutorial");
  $("#replayBar").classList.toggle("hidden", app.mode !== "replay");
  R.setStage(STAGES[stage].id); R.resetFx();
  app.paused = false; app.stall = 0; app.hudCache = {}; app.trail = [app.S.p[0].hp, app.S.p[1].hp]; app.trailHold = [0, 0];
  buildHud();
  show("fight");
  music("fight");
  preloadVoices(["round1", "round2", "final", "fight", "ko", "perfect", "parry", "counter", "timeup", "youwin", "youlose", "p1wins", "p2wins", "draw", "doubleko", ...chars.flatMap((c) => [c + "_ult", c + "_win"]), "william_wait", "dapsay_s1", "jiross_t0", "jiross_t1", "jiross_t2", "jiross_t3", "jiross_t4", "dap_s1", "apsay_s1", "jog_s1b", "ged_nlp", "evolve", ...(chars.includes("paulite") ? [0, 1, 2, 3, 4, 5].map((n) => "paulite_j" + n) : [])]);
  clearPressed();
}

// ================= HUD =================
const KEYS = {
  get solo() { return ["A", "P", "S1", "S2", "S3"].map((k) => keyLabel(BINDS.p1[k][0])); },
  get p2() { return ["A", "P", "S1", "S2", "S3"].map((k) => keyLabel(BINDS.p2[k][0])); },
  none: ["", "", "", "", ""],
};
function buildHud() {
  if (app.hudCache) app.hudCache.built = true;
  const S = app.S;
  for (const i of [0, 1]) {
    const f = S.p[i], c = CHARS[f.ch], side = i === 0 ? ".p1" : ".p2";
    $(`.pl${side} .nm`).classList.toggle("evo", !!f.evo);
    const ttl = app.mode === "online" && app.titles && app.titles[i] ? ` «${app.titles[i]}»` : "";
    $(`.pl${side} .nm`).textContent = c.name + (app.names[i] && app.mode === "online" ? " · " + app.names[i] + ttl : "");
    $(`.pl${side} .nm`).style.color = c.color;
    drawPortrait($(`.pl${side} .por`), f.ch, i === 1);
    const keys = twoP() ? (i === 0 ? KEYS.solo : KEYS.p2) : (i === (app.mode === "online" ? app.slot : 0) ? KEYS.solo : KEYS.none);
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
    if (f.rage) st.push(["RAGE", "#ff2a3c"]);
    if (s.power) st.push(["POWER UP", "#ffd23f"]);
    if (s.dark) st.push(["DARK -" + (s.dark / 10).toFixed(1) + "%", "#c8283c"]);
    if (f.exArm) st.push(["EX READY", "#ffffff"]);
    // super meter (2 segments of 500)
    const mEls = $$(`.pl${side} .meter i`);
    const m0 = Math.min(100, (f.meter / EX_COST) * 100), m1 = Math.max(0, Math.min(100, ((f.meter - EX_COST) / EX_COST) * 100));
    if (app.hudCache["m" + i] !== (f.meter | 0)) { app.hudCache["m" + i] = f.meter | 0; mEls[0].style.setProperty("--f", m0 + "%"); mEls[1].style.setProperty("--f", m1 + "%"); $(`.pl${side} .meter`).classList.toggle("full", f.meter >= METER_MAX); }
    if (app.touchOn && i === mySide()) { const eb = $("#touch .exb"); eb.style.setProperty("--m", (f.meter / METER_MAX) * 100 + "%"); eb.classList.toggle("full", f.meter >= EX_COST); }
    // tag partner
    const pEl = $(`.pl${side} .partner`);
    if (S.tag && S.bench) {
      const bn = S.bench[i];
      pEl.classList.remove("hidden");
      if (app.hudCache["pch" + i] !== bn.ch) { app.hudCache["pch" + i] = bn.ch; drawPortrait($("canvas", pEl), bn.ch, i === 1); }
      $(".pbar i", pEl).style.width = Math.max(0, (bn.hp / bn.maxHp) * 100) + "%";
      setText($(".ptag", pEl), "pt" + i, bn.hp <= 0 ? "K.O." : S.tagCd[i] > 0 ? "TAG " + Math.ceil(S.tagCd[i] / 60) : "TAG READY");
      if (app.hudCache["act" + i] !== f.ch) { app.hudCache["act" + i] = f.ch; if (app.hudCache["built"]) buildHud(); }
    } else pEl.classList.add("hidden");
    if (f.pst) st.push([STANCES[f.pst].name, STANCES[f.pst].color]);
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
      const curRef = currentSkillRef(S, f, n), mv = getMove(curRef);
      const el = $(".s" + n, kit), cd = f.cd[n - 1], max = mv.cd;
      if (app.hudCache[`ref${i}${n}`] !== curRef) { app.hudCache[`ref${i}${n}`] = curRef; $(".ic", el).textContent = abbr(mv.name); el.title = mv.name; if (app.touchOn && i === mySide() && touchBtns[n - 1] && n === 3) touchBtns[2].querySelector("span").textContent = curRef.endsWith("s3") ? "ULT" : abbr(mv.name); }
      const frac = cd > 0 ? (cd / max).toFixed(3) : "0";
      if (app.hudCache[`cd${i}${n}`] !== frac) { app.hudCache[`cd${i}${n}`] = frac; el.style.setProperty("--cd", frac); }
      setText($(".sec", el), `sec${i}${n}`, cd > 0 ? String(Math.ceil(cd / 60)) : "");
      setCls(el, `rdy${i}${n}`, "ready", cd <= 0);
      setCls(el, `cool${i}${n}`, "cool", cd > 0);
      setCls(el, `bl${i}${n}`, "blind", s.blind > 0);
      setCls(el, `si${i}${n}`, "sil", s.silence > 0);
      if (app.touchOn && i === mySide()) {
        const tb = touchBtns[n - 1];
        if (tb && app.hudCache[`tcd${n}`] !== frac) { app.hudCache[`tcd${n}`] = frac; tb.style.setProperty("--cd", frac); tb.querySelector(".cds").textContent = cd > 0 ? Math.ceil(cd / 60) : ""; tb.classList.toggle("cooling", cd > 0); }
      }
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
  // long banners shrink to fit one line
  $(".b-main", b).style.fontSize = main.length > 11 && cls !== "ko" ? `calc(var(--u) * ${Math.max(2.6, Math.min(6.4, 88 / main.length)).toFixed(2)})` : "";
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
    trackChallenge(e, S);
    switch (e.type) {
      case "vs": {
        const n0 = CHARS[S.p[0].ch].name, n1 = CHARS[S.p[1].ch].name;
        rivalIntro(S);
        banner(`${n0}  VS  ${n1}`, app.mode === "online" ? `${app.names[0] || ""}  ·  ${app.names[1] || ""}` : "", "vs", 1500);
        say("n_" + S.p[0].ch); setTimeout(() => say("n_" + S.p[1].ch), 800);
        break;
      }
      case "ex": sfx("ult"); buzz(e.who === mySide() ? 20 : 0); break;
      case "exArm": sfx("cast"); break;
      case "breaker": sfx("parry"); sfx("heavy"); buzz(e.who === mySide() ? 50 : 0); say("counter", 1200); break;
      case "throw": sfx("swingHeavy"); break;
      case "tech": sfx("block"); sfx("parry"); break;
      case "rage": sfx("stun"); break;
      case "first": sfx("counter"); break;
      case "guardbreak": sfx("wall"); buzz(e.who === mySide() ? 40 : 0); break;
      case "techroll": sfx("dash"); break;
      case "tauntAct": sfx("cast"); { const ch = S.p[e.who].ch; if (ch === "jiross") say("jiross_t0", 1500); else say(ch + "_win", 3000); } break;
      case "desk": sfx("wall"); break;
      case "smashthrough": sfx("ko"); sfx("wall"); buzz(80); break;
      case "jackpot": sfx("ult"); break;
      case "pickup": sfx("catch"); sfx("confirm"); break;
      case "tag": case "tagko": sfx("teleport"); say("n_" + e.ch, 500); break;
      case "djump": sfx("jump"); tutDone("djump", e.who); break;
      case "slam": sfx("slam"); tutDone("slam", e.who); buzz(e.who === mySide() ? 30 : 0); break;
      case "stance": sfx("select"); tutDone("stance", e.who); break;
      case "hit": buzz(e.who === mySide() ? (e.heavy ? 45 : 22) : e.by === mySide() ? 12 : 0); if (e.by === mySide() && (e.combo >= 3 || /:(b|d|a)3$/.test(S.p[e.by].act?.ref || ""))) tutDone("combo", e.by); sfx(e.sfx === "heavyslash" || e.sfx === "homerun" ? e.sfx : e.heavy ? (e.sfx === "bat" ? "heavybat" : "heavy") : e.sfx || "punch"); if (e.heavy && e.sfx !== "heavy") sfx("heavy"); break;
      case "block": sfx("block"); break;
      case "parry": tutDone("parry", e.who); buzz(e.who === mySide() ? 18 : 0); sfx("parry"); say("parry", 900); banner("PARRY!", "", "parry", 600); break;
      case "counter": sfx("counter"); say("counter", 1500); break;
      case "swing": sfx(e.heavy ? "swingHeavy" : "swing"); break;
      case "cast": {
        const ch = S.p[e.who].ch;
        if (/:s3$/.test(e.ref)) tutDone("ult", e.who); else tutDone("skill", e.who);
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
      case "dash": sfx("dash"); tutDone("dash", e.who); break;
      case "jump": sfx("jump"); tutDone("jump", e.who); break;
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
      case "leavepass": say("ged_nlp", 1500); break;
      case "gunshot": sfx("gunshot"); buzz(60); break;
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
        countUses(S);
        if (app.mode === "online" && app.net) app.net.send({ t: "result", winner: e.winner });
        clearTimeout(app.resultsT);
        app.resultsT = setTimeout(() => showResults(e.winner), 1900);
        const w = e.winner;
        setTimeout(() => {
          if (w < 0) say("draw");
          else if (twoP()) say(w === 0 ? "p1wins" : "p2wins");
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
  if (w >= 0) title = twoP() ? `P${w + 1} WINS!` : w === me ? "YOU WIN!" : "YOU LOSE";
  $(".res-win").textContent = title;
  $(".res-sub").textContent = w >= 0 ? `${CHARS[S.p[w].ch].name} — ${S.wins[0]} : ${S.wins[1]}` : `${S.wins[0]} : ${S.wins[1]}`;
  if (w >= 0) drawFull($(".res-spr"), S.p[w].ch, 0, false); else $(".res-spr").getContext("2d").clearRect(0, 0, 160, 192);
  $(".res-msg").textContent = "";
  $("#btnRematch").disabled = false;
  $("#btnRematch").textContent = app.mode === "replay" ? "WATCH AGAIN" : "REMATCH";
  $("#btnChange").classList.toggle("hidden", app.mode === "replay");
  $("#btnReplay").classList.toggle("hidden", app.mode === "replay" || app.mode === "tutorial");
  $("#btnReplay").disabled = false; $("#btnReplay").textContent = "SAVE & SHARE REPLAY";
  if (app.mode === "tutorial") { $("#btnRematch").textContent = "PLAY AGAIN"; }
  show("results");
}
$("#btnRematch").addEventListener("click", () => {
  sfx("confirm");
  if (app.mode === "replay") { startReplay(app.replay); return; }
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
function leaveRoom() { app.noList = false; app.reconnectCode = null; clearTimeout(app.reconnT); if (app.net) { const n = app.net; app.net = null; n.close(); } app.session = null; app.room = null; app.code = null; $("#roomInfo").classList.add("hidden"); }
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
    app.room = null; app.p2pTries = 0;
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
    // both players present -> host opens a direct peer-to-peer link
    if (!had && m.players[1 - app.slot] && app.slot === 0) setTimeout(() => net === app.net && net.startP2P(true), 300);
    if (had && !m.players[1 - app.slot]) net.stopP2P();
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
    app.titles = m.titles || ["", ""];
    startMatch(m.chars, m.stage, m.seed, m.evo || [false, false], { alt: m.alt, hazards: true });
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
  net.on("p2p", (st) => {
    app.netPath = st;
    if (st === "direct") app.p2pTries = 0;
    // direct link failed or dropped: host retries a few times, otherwise play on over the relay
    if (st === "relay" && app.slot === 0 && app.room?.players?.[1] && (app.p2pTries = (app.p2pTries || 0) + 1) <= 3)
      setTimeout(() => net === app.net && !net.direct && net.startP2P(true), 2500 * app.p2pTries);
  });
  net.on("peerRtt", (r) => {
    const el = $("#net"); $("span", el).textContent = Math.round(r) + " ms " + (net.direct ? "· DIRECT" : "· RELAY");
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
    await net.connect(code, name, playerId(), `&uid=${encodeURIComponent(uidOf())}&pub=${!quick && !app.noList && $("#optPub").checked ? 1 : 0}&title=${encodeURIComponent(store.get("title", ""))}`);
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
  app.touchOn = touchOn; $("#optTouch").checked = touchOn;
  $("#touch").classList.toggle("hidden", !(touchOn && app.screen === "fight"));
  document.body.classList.toggle("touchmode", touchOn);
  touch.haptic = store.get("haptic", true); $("#optHaptic").checked = touch.haptic;
  const ts = store.get("touchSize", 1); $("#optTouchSize").value = ts; $("#touch").style.setProperty("--ts", ts);
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
    if (app.session.ticks % 900 === 450 && app.net) {
      const s2 = app.session, n = app.net;
      n.sendWs({ t: "stats", path: n.direct ? "direct" : "relay", peerRtt: n.peerRtt, srvRtt: n.rtt, rb: s2.rollbacks, stalls: s2.stalls, frame: s2.frame, delay: s2.delay, fps: app.fps, ua: /Mobile|Android|iPhone/.test(navigator.userAgent) ? "mobile" : "desktop" });
    }
    $("#netwait").classList.toggle("hidden", app.stall < 20);
    if (app.stall === 20) $("#netwait").textContent = "WAITING FOR RIVAL'S CONNECTION…";
    if (app.stall === 600) $("#netwait").textContent = "RIVAL NOT RESPONDING — CHECK THEIR CONNECTION";
    handleEvents(ev, app.S);
  } else if (app.mode === "replay") {
    const steps = app.screen === "fight" ? app.rpSpeed : 0;
    for (let k = 0; k < steps; k++) {
      const inp = app.replay.inputs[app.rpFrame++] || [0, 0];
      const ev = [];
      step(app.S, inp, ev);
      handleEvents(ev, app.S);
      if (app.rpFrame >= app.replay.inputs.length && app.S.phase !== "end") { app.S.phase = "end"; showResults(app.S.wins[0] > app.S.wins[1] ? 0 : app.S.wins[1] > app.S.wins[0] ? 1 : -1); break; }
    }
  } else {
    const inputs = readInputs(twoP() ? "local" : "solo");
    if (app.screen !== "fight") { inputs[0] = 0; inputs[1] = 0; }
    if (app.ai) inputs[1] = app.ai.think(app.S);
    if (app.dummy) inputs[1] = app.dummy.think(app.S);
    if (app.mode === "tutorial") tutTick(inputs);
    const ev = [];
    if (app.S.phase !== "end") app.rec.push([inputs[0], inputs[1]]);
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
let fpsN = 0, fpsT = 0;
function frame(now) {
  fpsN++; if (now - fpsT > 1000) { app.fps = fpsN; fpsN = 0; fpsT = now; }
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


// =====================================================================
// Player identity, phone helpers, rankings, concerns, controls, open rooms,
// replays and the tutorial.
// =====================================================================
function myName() { return store.get("name", "") || "PLAYER"; }
function uidOf() { playerId(); return store.get("pid", ""); }
function mySide() { return app.mode === "online" ? app.slot : 0; }
function buzz(ms) { if (ms && touch.haptic && app.touchOn && navigator.vibrate) navigator.vibrate(ms); }
const escHTML = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const touchBtns = [1, 2, 3].map((n) => document.querySelector(`#touch [data-bit="S${n}"]`));

// ---- "What is your name?" (every visit, prefilled) ----
let nameCb = null;
function askName(cb) {
  nameCb = cb;
  $("#nameInput").value = store.get("name", "");
  $("#nameHint").textContent = store.get("name", "") ? "Welcome back! Keep it or change it." : "Shown to rivals online and on the leaderboard.";
  show("namebox");
  setTimeout(() => $("#nameInput").focus(), 50);
}
$("#nameForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const n = ($("#nameInput").value || "").toUpperCase().replace(/[^A-Z0-9 _\-.]/g, "").trim().slice(0, 14);
  if (!n) { $("#nameInput").focus(); return; }
  app.returning = !!store.get("name", "");
  store.set("name", n); $("#pname").value = n; $("#nameInput").blur();
  sfx("confirm");
  fetch("/api/profile", { method: "POST", body: JSON.stringify({ uid: uidOf(), name: n }) }).then((r) => r.json()).then((p) => { app.profile = p; mergeUses(p.uses); greet(); }).catch(() => {});
  const cb = nameCb || (() => show("menu")); nameCb = null; cb();
});
$("#btnName").addEventListener("click", () => askName(() => show("settings")));
function greet() {
  const p = app.profile;
  $("#hello").textContent = `${app.returning ? "WELCOME BACK" : "WELCOME"}, ${myName()}!` + (p && p.wins + p.losses ? `  ·  ${p.wins}W ${p.losses}L${p.rank ? "  ·  RANK #" + p.rank : ""}` : "");
}

// ---- phones: rotate prompt, fullscreen, touch size, pause ----
function checkRotate() {
  const portrait = innerHeight > innerWidth * 1.05;
  $("#rotate").classList.toggle("hidden", !(app.touchOn && portrait && app.screen !== "namebox" && app.screen !== "feedback"));
}
addEventListener("resize", checkRotate);
addEventListener("orientationchange", () => setTimeout(checkRotate, 200));
$("#fsBtn").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else { await document.documentElement.requestFullscreen({ navigationUI: "hide" }); await screen.orientation?.lock?.("landscape").catch(() => {}); }
  } catch {}
});
$("#optHaptic").addEventListener("change", (e) => { store.set("haptic", e.target.checked); applySettings(); if (e.target.checked && navigator.vibrate) navigator.vibrate(30); });
$("#optTouchSize").addEventListener("input", (e) => { store.set("touchSize", +e.target.value); applySettings(); });
$("#tPause").addEventListener("click", () => { if (app.screen === "fight") togglePause(); });

// ---- rankings & profile ----
async function loadRanks() {
  $("#profile").innerHTML = "<p class='dim'>Loading…</p>"; $("#board").innerHTML = "";
  try {
    const [p, b] = await Promise.all([fetch("/api/profile?uid=" + encodeURIComponent(uidOf())).then((r) => r.json()), fetch("/api/leaderboard").then((r) => r.json())]);
    app.profile = p; mergeUses(p.uses);
    const main = p.main && CHARS[p.main] ? CHARS[p.main].name : "—";
    const games = p.wins + p.losses + p.draws, pct = games ? Math.round((p.wins / games) * 100) : 0;
    $("#profile").innerHTML = `<h3>${escHTML(myName())}</h3>
      <div class="big3"><div><b class="W">${p.wins}</b>WINS</div><div><b class="L">${p.losses}</b>LOSSES</div><div><b>${pct}%</b>WIN RATE</div></div>
      <div>RANK: ${p.rank ? "#" + p.rank : "UNRANKED"}</div><div>MAIN: ${escHTML(main)}</div>
      <div style="margin-top:calc(var(--u)*.8)">RECENT ONLINE MATCHES</div>
      ${(p.recent || []).map((m) => `<div class="rec"><span class="${m.res}">${m.res}</span><span>${escHTML(CHARS[m.mine]?.name || "?")} vs ${escHTML(CHARS[m.theirs]?.name || "?")}</span><span>${escHTML(m.vs)}</span></div>`).join("") || "<div class='dim' style='text-align:left'>Play online to start your record.</div>"}`;
    $("#board").innerHTML = `<tr><th>#</th><th>PLAYER</th><th class="n">W</th><th class="n">L</th><th class="n">%</th><th>MAIN</th></tr>` +
      (b.length ? b.map((r, i) => { const g = r.wins + r.losses + r.draws; return `<tr class="${r.name === myName() ? "me" : ""}"><td>${i + 1}</td><td>${escHTML(r.name)}${r.title ? ` <small style="color:var(--gold)">${escHTML(r.title)}</small>` : ""}${r.champs ? " 🏆" : ""}</td><td class="n">${r.wins}</td><td class="n">${r.losses}</td><td class="n">${g ? Math.round((r.wins / g) * 100) : 0}</td><td>${escHTML(CHARS[r.main]?.name || "—")}</td></tr>`; }).join("") : `<tr><td colspan="6" class="dim">No ranked online matches yet — be the first!</td></tr>`);
  } catch { $("#profile").innerHTML = "<p class='dim'>Couldn't load rankings. Check your connection.</p>"; }
}

// ---- concerns / feedback ----
$("#fbForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $("#fbText").value.trim(), cat = (new FormData(e.target).get("cat")) || "other";
  if (text.length < 3) { $("#fbMsg").textContent = "Write a little more first."; return; }
  $("#fbMsg").textContent = "SENDING…";
  try {
    const r = await fetch("/api/feedback", { method: "POST", body: JSON.stringify({ name: myName(), cat, text, device: app.touchOn ? "phone" : "computer" }) });
    if (!r.ok) throw 0;
    $("#fbText").value = ""; $("#fbMsg").textContent = "THANKS! YOUR NOTE WAS SENT TO THE DEV."; sfx("confirm");
  } catch { $("#fbMsg").textContent = "COULDN'T SEND — TRY AGAIN."; }
});

// ---- controls remapping ----
const ACTIONS = [["L", "MOVE LEFT"], ["R", "MOVE RIGHT"], ["U", "JUMP"], ["D", "CROUCH"], ["A", "ATTACK"], ["P", "PARRY"], ["S1", "SKILL 1"], ["S2", "SKILL 2"], ["S3", "ULTIMATE"], ["DASH", "DASH"], ["ST", "STANCE / TAG"], ["EX", "EX / BREAKER"], ["TAUNT", "TAUNT"]];
function buildBinds() {
  $("#bindTable").innerHTML = `<tr><th>ACTION</th><th>P1 / SOLO</th><th>P2 (LOCAL)</th></tr>` + ACTIONS.map(([k, n]) =>
    `<tr><td>${n}</td><td><button data-set="p1" data-k="${k}">${keyLabel(BINDS.p1[k][0])}</button></td><td><button data-set="p2" data-k="${k}">${keyLabel(BINDS.p2[k][0])}</button></td></tr>`).join("");
  $$("#bindTable button").forEach((b) => b.addEventListener("click", () => {
    $$("#bindTable button.wait").forEach((x) => x.classList.remove("wait"));
    b.classList.add("wait"); b.textContent = "PRESS KEY";
    captureKey((code) => { if (code !== "Escape") { setBind(b.dataset.set, b.dataset.k, code); sfx("confirm"); } buildBinds(); });
  }));
}
$("#btnResetBinds").addEventListener("click", () => { resetBinds(); buildBinds(); sfx("select"); });

// ---- open rooms (public lobbies) ----
let roomsT = null;
async function pollRooms() {
  clearTimeout(roomsT);
  if (app.screen !== "online") return;
  try {
    const rooms = (await (await fetch("/api/rooms")).json()).filter((r) => r.code !== app.code);
    const el = $("#roomList");
    el.innerHTML = rooms.length ? rooms.map((r) => `<div class="roomrow"><canvas width="32" height="32" data-ch="${escHTML(r.char || "")}"></canvas><div>${escHTML(r.host || "PLAYER")}<small>${r.char && CHARS[r.char] ? escHTML(CHARS[r.char].name) : "picking…"} · ${escHTML(r.code)}</small></div><button data-code="${escHTML(r.code)}">JOIN</button></div>`).join("")
      : `<p class="dim">No open rooms right now. Create one and it shows up here for everyone.</p>`;
    $$("#roomList canvas").forEach((c) => { if (c.dataset.ch && CHARS[c.dataset.ch]) drawPortrait(c, c.dataset.ch); });
    $$("#roomList button").forEach((b) => b.addEventListener("click", () => joinRoom(b.dataset.code)));
  } catch { $("#roomList").innerHTML = `<p class="dim">Couldn't load rooms.</p>`; }
  roomsT = setTimeout(pollRooms, 4000);
}

// ---- replays ----
function packInputs(arr) { const out = []; for (const [a, b] of arr) { const l = out[out.length - 1]; if (l && l[0] === a && l[1] === b) l[2]++; else out.push([a, b, 1]); } return out; }
function unpackInputs(rle) { const out = []; for (const [a, b, n] of rle) for (let i = 0; i < n; i++) out.push([a, b]); return out; }
$("#btnReplay").addEventListener("click", async () => {
  const meta = app.recMeta; if (!meta) return;
  const inputs = app.mode === "online" && app.session ? app.session.record : app.rec;
  if (!inputs || !inputs.length) return;
  const btn = $("#btnReplay"); btn.disabled = true; btn.textContent = "SAVING…";
  const names = app.mode === "online" ? app.names : meta.names;
  const title = `${names[0] || "P1"} (${CHARS[meta.chars[0]].name}) vs ${names[1] || "P2"} (${CHARS[meta.chars[1]].name})`;
  try {
    const r = await (await fetch("/api/replay", { method: "POST", body: JSON.stringify({ title, replay: { ...meta, names, inputs: packInputs(inputs) } }) })).json();
    if (!r.id) throw 0;
    const link = `${location.origin}/?replay=${r.id}`;
    let copied = false; try { await navigator.clipboard.writeText(link); copied = true; } catch {}
    $(".res-msg").textContent = (copied ? "REPLAY LINK COPIED! " : "REPLAY SAVED: ") + link;
    btn.textContent = "REPLAY SAVED ✓";
  } catch { btn.disabled = false; btn.textContent = "SAVE & SHARE REPLAY"; $(".res-msg").textContent = "COULDN'T SAVE REPLAY."; }
});
async function playReplayId(id) {
  banner("LOADING REPLAY…", "", "", 1200);
  try {
    const r = await (await fetch("/api/replay/" + encodeURIComponent(id))).json();
    if (!r.replay) throw 0;
    const rp = r.replay; rp.inputs = unpackInputs(rp.inputs); rp.title = r.title;
    startReplay(rp);
  } catch { banner("REPLAY NOT FOUND", "", "", 1800); }
}
function startReplay(rp) {
  app.replay = rp; app.mode = "replay"; app.rpFrame = 0; app.rpSpeed = 1; $("#rpSpeed").textContent = "1x";
  app.names = rp.names || ["P1", "P2"]; app.ai = null; app.dummy = null;
  startMatch(rp.chars, rp.stage, rp.seed, rp.evo || [false, false], { hazards: rp.hazards ?? true, tag: rp.tag || null, alt: rp.alt || null });
}
$("#rpSpeed").addEventListener("click", () => { app.rpSpeed = app.rpSpeed === 1 ? 2 : app.rpSpeed === 2 ? 4 : 1; $("#rpSpeed").textContent = app.rpSpeed + "x"; });
$("#rpExit").addEventListener("click", () => { app.S = null; app.mode = "cpu"; $("#replayBar").classList.add("hidden"); show("menu"); });

// ---- tutorial ----
const TUT = [
  ["walk", () => `Walk: hold ${keyLabel(BINDS.p1.L[0])} / ${keyLabel(BINDS.p1.R[0])} (or the stick)`],
  ["jump", () => `Jump: ${keyLabel(BINDS.p1.U[0])}`],
  ["djump", () => `Double jump: press ${keyLabel(BINDS.p1.U[0])} again in the air`],
  ["dash", () => `Dash: ${keyLabel(BINDS.p1.DASH[0])} or double-tap a direction`],
  ["combo", () => `3-hit combo: ${keyLabel(BINDS.p1.A[0])} ×3 on the dummy`],
  ["skill", () => `Skill: ${keyLabel(BINDS.p1.S1[0])} or ${keyLabel(BINDS.p1.S2[0])}`],
  ["ult", () => `Ultimate: ${keyLabel(BINDS.p1.S3[0])}`],
  ["parry", () => `Parry: tap ${keyLabel(BINDS.p1.P[0])} right before the dummy's jab hits`],
  ["slam", () => `Air slam: jump, then ${keyLabel(BINDS.p1.D[0])} + ${keyLabel(BINDS.p1.A[0])}`],
  ["stance", () => `Stance: ${keyLabel(BINDS.p1.ST[0])} cycles Balanced / Aggressive / Defensive`],
];
function startTutorial() { app.tut = { done: new Set(), walk: 0 }; renderTut(); }
function renderTut() {
  if (!app.tut) return;
  const cur = TUT.find(([k]) => !app.tut.done.has(k));
  $("#tutList").innerHTML = TUT.map(([k, txt]) => `<li class="${app.tut.done.has(k) ? "done" : cur && cur[0] === k ? "now" : ""}">${escHTML(txt())}</li>`).join("");
}
function tutDone(k, who) {
  if (app.mode !== "tutorial" || who !== 0 || !app.tut || app.tut.done.has(k)) return;
  app.tut.done.add(k); sfx("confirm"); renderTut();
  if (app.tut.done.size === TUT.length) { banner("TUTORIAL COMPLETE!", "YOU'RE READY FOR ONLINE", "fight", 2600); say("perfect"); }
}
function tutTick() {
  if (!app.tut || !app.S) return;
  const p = app.S.p[0];
  if (p.st === "walk" && ++app.tut.walk > 40) tutDone("walk", 0);
  // the dummy only attacks while you're on the parry step
  const want = !app.tut.done.has("parry") && ["walk", "jump", "djump", "dash", "combo", "skill", "ult"].every((k) => app.tut.done.has(k)) ? "attack" : "stand";
  if (app.dummy && app.dummy.dummy !== want) app.dummy.dummy = want;
}


// =====================================================================
// Evolution: 50 completed matches with a fighter unlocks their evolved form
// (golden look + aura, +8% HP, ultimate cooldown -15%).
// =====================================================================
const EVOLVE_AT = 50;
app.evo = [false, false];
function usesAll() { return store.get("uses", {}); }
function usesOf(ch) { return usesAll()[ch] || 0; }
// players named ADMIN have every evolution unlocked
function isAdmin() { return myName() === "ADMIN"; }
function canEvolve(ch) { return !!ch && (isAdmin() || usesOf(ch) >= EVOLVE_AT); }
function countUses(S) {
  if (!["cpu", "local", "online", "tag"].includes(app.mode)) return;
  const mine = twoP() ? [0, 1] : [mySide()];
  const u = usesAll();
  for (const side of mine) {
    for (const ch of S.tag ? S.tag[side] : [S.p[side].ch]) {
    const before = u[ch] || 0;
    u[ch] = before + 1;
    if (before < EVOLVE_AT && u[ch] >= EVOLVE_AT) setTimeout(() => { banner(`${CHARS[ch].name} CAN EVOLVE!`, "TOGGLE ★ EVOLVED FORM ON THE SELECT SCREEN", "fight", 3200); say("evolve"); sfx("ult"); }, 2400);
    fetch("/api/use", { method: "POST", body: JSON.stringify({ uid: uidOf(), ch }) }).catch(() => {});
    }
  }
  store.set("uses", u);
}
// keep the higher of this device's and the server's counts (e.g. new phone, same name/profile)
function mergeUses(server) {
  if (!server) return;
  const u = usesAll(); let changed = false;
  for (const k in server) if ((server[k] | 0) > (u[k] || 0)) { u[k] = server[k] | 0; changed = true; }
  if (changed) store.set("uses", u);
}
function toggleEvo(p) {
  const side = $(p === 0 ? "#select .s1" : "#select .s2"), id = side.dataset.ch || app.picks[p];
  if (!canEvolve(id) || (app.locked[p] && app.mode === "online")) { sfx("select"); return; }
  app.evo[p] = !app.evo[p]; sfx(app.evo[p] ? "ult" : "select");
  renderSelect();
}
function renderEvo(side, p, id) {
  let el = side.querySelector(".evo");
  if (!el) { el = document.createElement("button"); el.className = "evo"; side.querySelector(".ctitle").after(el); el.addEventListener("click", () => toggleEvo(p)); }
  const mineSide = app.mode === "online" ? p === app.slot : twoP() ? true : p === 0;
  if (!mineSide) { const on = app.mode === "online" && app.room?.players?.[p]?.evo; el.className = "evo" + (on ? " on" : ""); el.innerHTML = on ? `<span class="star">★</span> EVOLVED` : ""; el.disabled = true; el.classList.toggle("hidden", !on); return; }
  el.classList.remove("hidden"); el.disabled = false;
  const n = isAdmin() ? Math.max(EVOLVE_AT, usesOf(id)) : usesOf(id);
  const altTxt = hasAlt(id) ? ` <small>ALT ${app.alt[p] ? "ON" : "OFF"} · C</small>` : "";
  if (n >= EVOLVE_AT) { el.className = "evo ready" + (app.evo[p] ? " on" : ""); el.innerHTML = app.evo[p] ? `<span class="star">★</span> EVOLVED FORM <small>ON · X</small>` : `<span class="star">★</span> EVOLVE AVAILABLE <small>OFF · X</small>`; el.innerHTML += altTxt; }
  else { el.className = "evo"; el.innerHTML = `EVOLUTION <span class="bar"><i style="width:${(n / EVOLVE_AT) * 100}%"></i></span> <small>${n}/${EVOLVE_AT}</small>` + altTxt; }
}


// =====================================================================
// Select-screen toggles: tag rival, stage hazards, alt colors
// =====================================================================
app.alt = [false, false]; app.team = [[], []];
$("#tagRival").addEventListener("click", () => { app.tagRival = app.tagRival === "local" ? "cpu" : "local"; sfx("select"); openSelect(); });
$("#hzBtn").addEventListener("click", () => { store.set("hazards", !store.get("hazards", true)); $("#hzBtn").textContent = "HAZARDS: " + (store.get("hazards", true) ? "ON" : "OFF"); sfx("select"); });
function hasAlt(ch) { return !!ch && !!store.get("alts", {})[ch]; }
addEventListener("keydown", (e) => {
  if (app.screen !== "select" || e.code !== "KeyC" || e.repeat) return;
  const p = app.mode === "online" ? app.slot : 0, side = $(p === 0 ? "#select .s1" : "#select .s2"), id = side.dataset.ch;
  if (!hasAlt(id)) return;
  app.alt[p] = !app.alt[p]; sfx("select"); renderSelect();
});

// =====================================================================
// Rival intros: special pre-fight exchanges for certain match-ups
// =====================================================================
const RIVALS = {
  "william|jog": ["Wait class.", "Detention. Now."],
  "jiross|lian": ["Nice frisbee. Mine now.", "Catch this, loudmouth!"],
  "dapsay|dap": ["I'm the better DAP.", "Prove it, half-DAP!"],
  "dapsay|apsay": ["Two stances beat one.", "Blink and you'll miss me."],
  "arbe|ged": ["One bullet. Your name.", "Where's your hall pass?"],
  "ged|william": ["No leave pass!", "Wait class, Ged."],
  "tanoy|johan": ["Who smells worse?", "Smell you later!"],
  "paulite|jiross": ["Why'd the jab miss? No class!", "That joke was weaker than you."],
  "gayle|acar": ["Batter up!", "My feet are faster!"],
  "dumdum|arbe": ["You'll bleed.", "You'll need more than knives."],
  "jaguilar|apsay": ["Teleport.exe has crashed.", "Too slow to ping me."],
  "acar|johan": ["Smell my feet!", "...I'll pass."],
};
function rivalIntro(S) {
  const a = S.p[0].ch, b = S.p[1].ch;
  const lines = RIVALS[a + "|" + b] || (RIVALS[b + "|" + a] ? RIVALS[b + "|" + a].slice().reverse() : null);
  if (a === b) { R.say(0, "Nice outfit."); setTimeout(() => R.say(1, "Mine's better."), 700); return; }
  if (!lines) return;
  R.say(0, lines[0], 120); setTimeout(() => R.say(1, lines[1], 120), 800);
}

// =====================================================================
// Daily challenges, lifetime stats, titles and alt colors
// =====================================================================
const CHALLENGE_POOL = [
  { id: "win2", text: "Win 2 matches", goal: 2 },
  { id: "parry10", text: "Land 10 parries", goal: 10 },
  { id: "slam5", text: "Land 5 air slams", goal: 5 },
  { id: "throw5", text: "Throw opponents 5 times", goal: 5 },
  { id: "ex5", text: "Use 5 EX skills", goal: 5 },
  { id: "combo10", text: "Land 10 three-hit combos", goal: 10 },
  { id: "breaker2", text: "Escape with 2 combo breakers", goal: 2 },
  { id: "rageRound", text: "Win a round while in RAGE", goal: 1 },
  { id: "perfect", text: "Win a round without taking damage", goal: 1 },
  { id: "arbeClean", text: "Win a match with ARB-E without firing Last Bullet", goal: 1 },
  { id: "charWin", text: "Win a match as {CHAR}", goal: 1 },
  { id: "tagWin", text: "Win a Tag Team match", goal: 1 },
  { id: "onlineWin", text: "Win an online match", goal: 1 },
  { id: "jackpot3", text: "Grab 3 arcade jackpots", goal: 3 },
  { id: "desk3", text: "Knock foes through 3 classroom desks", goal: 3 },
  { id: "smash1", text: "Smash someone off the rooftop", goal: 1 },
  { id: "taunt5", text: "Finish 5 taunts", goal: 5 },
];
const TITLES = [
  { id: "ROOKIE", need: () => true, how: "Everyone starts here" },
  { id: "PARRY GOD", need: (st) => st.parry >= 100, how: "Land 100 parries" },
  { id: "SLAM DUNKER", need: (st) => st.slam >= 30, how: "Land 30 air slams" },
  { id: "GRAPPLER", need: (st) => st.throw >= 30, how: "Throw opponents 30 times" },
  { id: "UNBREAKABLE", need: (st) => st.breaker >= 10, how: "Use 10 combo breakers" },
  { id: "COMEBACK KID", need: (st) => st.rageRound >= 5, how: "Win 5 rounds while in RAGE" },
  { id: "TRASH TALKER", need: (st) => st.taunt >= 25, how: "Finish 25 taunts" },
  { id: "DAILY GRINDER", need: (st) => st.challenges >= 10, how: "Complete 10 daily challenges" },
  { id: "EVOLVED", need: () => Object.values(store.get("uses", {})).some((n) => n >= 50), how: "Evolve any fighter" },
  { id: "CHAMPION", need: () => (app.profile?.champs || 0) > 0, how: "Win a tournament" },
];
function dayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function todays() {
  const key = dayKey();
  let st = store.get("daily", null);
  if (!st || st.day !== key) {
    let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pick = []; const pool = CHALLENGE_POOL.slice();
    for (let i = 0; i < 3; i++) { h = (h * 1103515245 + 12345) >>> 0; pick.push(pool.splice(h % pool.length, 1)[0].id); }
    h = (h * 1103515245 + 12345) >>> 0;
    st = { day: key, ids: pick, prog: {}, done: [], char: ROSTER[h % ROSTER.length] };
    store.set("daily", st);
  }
  return st;
}
function chalText(c, st) { return c.text.replace("{CHAR}", CHARS[st.char].name); }
function lifetime() { return store.get("stats", {}); }
function bumpStat(k, n = 1) { const st = lifetime(); st[k] = (st[k] || 0) + n; store.set("stats", st); }
const COUNTED = () => ["cpu", "local", "online", "tag"].includes(app.mode);
function progress(id, n = 1, S) {
  const st = todays();
  if (!st.ids.includes(id) || st.done.includes(id)) return;
  const c = CHALLENGE_POOL.find((x) => x.id === id);
  st.prog[id] = (st.prog[id] || 0) + n;
  if (st.prog[id] >= c.goal) {
    st.done.push(id);
    bumpStat("challenges");
    const ch = S ? S.p[mySide()].ch : null;
    if (ch) { // reward: +3 evolution progress + alt color for the fighter you used
      const u = store.get("uses", {}); u[ch] = (u[ch] || 0) + 3; store.set("uses", u);
      const alts = store.get("alts", {}); const newAlt = !alts[ch]; alts[ch] = true; store.set("alts", alts);
      setTimeout(() => { banner("CHALLENGE COMPLETE!", `${chalText(c, st)} · +3 ${CHARS[ch].name} EVOLUTION${newAlt ? " · ALT COLOR UNLOCKED" : ""}`, "fight", 3000); sfx("ult"); }, 400);
    }
  }
  store.set("daily", st);
}
function trackChallenge(e, S) {
  if (!COUNTED() || !S) return;
  const me = mySide();
  const mine = (w) => w === me; // challenges belong to this device's player (P1 in local play)
  switch (e.type) {
    case "parry": if (mine(e.who)) { progress("parry10", 1, S); bumpStat("parry"); } break;
    case "slam": if (mine(e.who)) { bumpStat("slam"); } break;
    case "hit":
      if (e.by === me) {
        if (S.p[me].act?.ref?.endsWith(":slam")) progress("slam5", 1, S);
        if (e.isThrow) { progress("throw5", 1, S); bumpStat("throw"); }
        if (e.combo === 3) progress("combo10", 1, S);
      }
      break;
    case "ex": if (mine(e.who)) progress("ex5", 1, S); break;
    case "breaker": if (mine(e.who)) { progress("breaker2", 1, S); bumpStat("breaker"); } break;
    case "pickup": if (mine(e.who)) progress("jackpot3", 1, S); break;
    case "desk": if (e.who !== me) progress("desk3", 1, S); break;
    case "smashthrough": if (e.who !== me) progress("smash1", 1, S); break;
    case "tauntDone": if (mine(e.who)) { progress("taunt5", 1, S); bumpStat("taunt"); } break;
    case "ko": if (e.by === me && e.perfect) progress("perfect", 1, S); if (e.by === me && S.p[me].rage) { progress("rageRound", 1, S); bumpStat("rageRound"); } break;
    case "matchEnd":
      if (e.winner === me) {
        progress("win2", 1, S); bumpStat("wins");
        if (app.mode === "tag") progress("tagWin", 1, S);
        if (app.mode === "online") progress("onlineWin", 1, S);
        if (S.p[me].ch === todays().char) progress("charWin", 1, S);
        if (S.p[me].ch === "arbe" && !S.ultUsed[me]) progress("arbeClean", 1, S);
      }
      break;
  }
}
function renderChallenges() {
  const st = todays();
  const now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
  const hrs = Math.ceil((mid - now) / 3600000);
  $("#chalReset").textContent = `new ones in ${hrs}h`;
  $("#chalList").innerHTML = st.ids.map((id) => {
    const c = CHALLENGE_POOL.find((x) => x.id === id), n = Math.min(c.goal, st.prog[id] || 0), done = st.done.includes(id);
    return `<div class="cq ${done ? "done" : ""}">${escHTML(chalText(c, st))}<small>${done ? "DONE ✓" : n + "/" + c.goal}</small><div class="bar"><i style="width:${(n / c.goal) * 100}%"></i></div></div>`;
  }).join("");
  const lt = lifetime(), cur = store.get("title", "");
  $("#titleList").innerHTML = TITLES.map((t) => {
    const ok = t.need(lt);
    return `<div class="tt ${ok ? "" : "locked"} ${cur === t.id ? "on" : ""}"><div>${escHTML(t.id)}<em>${escHTML(t.how)}</em></div>${ok ? `<button data-title="${escHTML(t.id)}">${cur === t.id ? "EQUIPPED" : "EQUIP"}</button>` : "<span class='dim'>LOCKED</span>"}</div>`;
  }).join("");
  $$("#titleList button").forEach((b) => b.addEventListener("click", () => {
    store.set("title", b.dataset.title); sfx("confirm");
    fetch("/api/profile", { method: "POST", body: JSON.stringify({ uid: uidOf(), name: myName(), title: b.dataset.title }) }).catch(() => {});
    renderChallenges();
  }));
}

// =====================================================================
// Weekly tournaments (brackets stored on the server)
// =====================================================================
app.tSize = 4;
$$(".tsz").forEach((b) => b.addEventListener("click", () => { app.tSize = +b.dataset.size; $$(".tsz").forEach((x) => x.classList.toggle("on", x === b)); sfx("select"); }));
$("#btnTCreate").addEventListener("click", async () => {
  sfx("confirm");
  const r = await (await fetch("/api/tourney/create", { method: "POST", body: JSON.stringify({ uid: uidOf(), name: myName(), tname: $("#tName").value, size: app.tSize }) })).json().catch(() => null);
  if (r && r.id) { app.tView = r.id; $("#tName").value = ""; loadTourneys(); }
});
let tourT = null;
async function loadTourneys() {
  clearTimeout(tourT);
  if (app.screen !== "tourney") return;
  try {
    const list = await (await fetch("/api/tourney")).json();
    $("#tList").innerHTML = list.length ? list.map((t) => `<div class="tt ${app.tView === t.id ? "on" : ""}"><div>${escHTML(t.name)}<em>${t.status === "done" ? "CHAMPION: " + escHTML(t.championName) : t.status === "running" ? "IN PROGRESS" : `OPEN · ${t.n}/${t.size} players`} · host ${escHTML(t.hostName)}</em></div><button data-tid="${escHTML(t.id)}">VIEW</button></div>`).join("")
      : `<p class="dim" style="text-align:left">No tournaments this week. Create one — friends can join from here.</p>`;
    $$("#tList button").forEach((b) => b.addEventListener("click", () => { app.tView = b.dataset.tid; sfx("select"); loadTourneys(); }));
    if (app.tView) await viewTourney(app.tView);
  } catch {}
  tourT = setTimeout(loadTourneys, 5000);
}
async function viewTourney(id) {
  const t = await (await fetch("/api/tourney/" + encodeURIComponent(id))).json();
  if (!t || t.error) return;
  const me = uidOf(), joined = t.players.some((p) => p.uid === me);
  const rounds = []; for (const m of t.matches) (rounds[m.round - 1] ||= []).push(m);
  const total = Math.log2(t.size);
  const nameRow = (uid, name, m) => `<div class="${m.winner && m.winner === uid ? "w" : ""} ${uid === me ? "me" : ""}">${escHTML(name || "—")}${m.winner === uid ? " ✓" : ""}</div>`;
  let html = `<h3>${escHTML(t.name)}</h3><p class="dim" style="text-align:left">${t.status === "open" ? `Waiting for players: ${t.players.map((p) => escHTML(p.name)).join(", ")} (${t.players.length}/${t.size})` : t.status === "done" ? `🏆 CHAMPION: ${escHTML(t.championName)}` : "Bracket in progress"}</p>`;
  if (t.matches.length) {
    html += `<div class="bracket">`;
    for (let r = 0; r < total; r++) {
      const ms = rounds[r] || [];
      html += `<div class="bround"><div class="dim">${r === total - 1 ? "FINAL" : r === total - 2 ? "SEMIS" : "ROUND " + (r + 1)}</div>` +
        (ms.length ? ms.map((m) => `<div class="bm">${nameRow(m.a, m.an, m)}${nameRow(m.b, m.bn, m)}</div>`).join("") : `<div class="bm dim">TBD</div>`) + `</div>`;
    }
    html += `</div>`;
  }
  const mine = t.matches.find((m) => !m.winner && (m.a === me || m.b === me));
  html += `<div class="tbtns2">` +
    (t.status === "open" && !joined ? `<button id="tJoin" class="big">JOIN</button>` : "") +
    (t.status === "open" && joined ? `<button id="tLeave">LEAVE</button><button id="tShare">COPY INVITE</button>` : "") +
    (mine ? `<button id="tPlay" class="big">PLAY MY MATCH (${escHTML(mine.a === me ? mine.bn : mine.an)})</button>` : "") + `</div>`;
  $("#tView").innerHTML = html;
  $("#tJoin")?.addEventListener("click", async () => { await fetch("/api/tourney/join", { method: "POST", body: JSON.stringify({ tid: id, uid: me, name: myName() }) }); sfx("confirm"); loadTourneys(); });
  $("#tLeave")?.addEventListener("click", async () => { await fetch("/api/tourney/leave", { method: "POST", body: JSON.stringify({ tid: id, uid: me }) }); sfx("select"); loadTourneys(); });
  $("#tShare")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(`${location.origin}/?tourney=${id}`); $("#tShare").textContent = "LINK COPIED!"; } catch {} });
  $("#tPlay")?.addEventListener("click", () => { clearTimeout(tourT); app.noList = true; show("online"); joinRoom(mine.code); });
}
