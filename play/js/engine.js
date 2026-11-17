// engine.js — game loop, movement, time, the body simulation, HUD, dialogue and menus.
// Story content lives in story.js and talks to the engine through the globals exported at the bottom.

(function () {
  const VW = 320, VH = 192, T = 16, STEP = 0.16;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const cv = document.getElementById("view"), ctx = cv.getContext("2d");
  const $ = (id) => document.getElementById(id);
  let S = 3;

  function resize() {
    const portraitTouch = document.body.classList.contains("touch") && innerHeight > innerWidth;
    const s = Math.min(innerWidth / VW, (innerHeight - 4 - (portraitTouch ? 230 : 0)) / VH);
    S = s >= 3 ? Math.floor(s) : Math.max(0.5, Math.floor(s * 20) / 20);
    $("game").style.width = VW * S + "px";
    $("game").style.height = VH * S + "px";
    document.documentElement.style.setProperty("--s", S);
  }
  addEventListener("resize", resize);

  // ---------- state ----------
  function newGame() {
    return {
      ci: 0, day: 0, time: 420, mapId: "home", x: 3, y: 3, dir: "down",
      stats: { health: 80, energy: 80, mood: 70, cravings: 20 }, money: 5,
      bag: [], stash: { bar: 2, water: 1, pants: 1, swim: 1, choc: 1 },
      worn: null, stained: false, overflow: 0, nightLeak: false,
      painFrom: 0, painUntil: 0, painNext: 0, heatUntil: 0,
      flags: {}, d: {}, log: [], literacy: 0, leaks: 0, preparedDays: 0,
      trackerUnlocked: false, cycleStarted: false, objective: "", target: null,
      facts: {}, quiz: { right: 0, total: 0 }, finalGrade: null
    };
  }
  let G = newGame();
  const RT = { map: null, npcs: [], queue: [], acc: 0, mv: null, stepN: 0, busy: 0, shake: 0,
               parts: [], held: [], mode: "title", events: [], t: 0, titleCam: 0, facts: [], factCur: null, factT: 0 };
  let C = null; // current chapter

  const clamp = (v) => Math.max(0, Math.min(100, v));
  function fmtTime(t) {
    const h = Math.floor(t / 60) % 24, m = Math.floor(t % 60);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
  function phaseOf(d) { return d <= 5 ? "menstrual" : d <= 13 ? "follicular" : d === 14 ? "ovulation" : "luteal"; }
  const PHASE = {
    menstrual: { label: "Menstrual", color: "#d9505f" }, follicular: { label: "Follicular", color: "#e9a04f" },
    ovulation: { label: "Ovulation", color: "#4fae84" }, luteal: { label: "Luteal", color: "#7b7fd4" }
  };

  // ---------- sound ----------
  let AC = null, muted = true;   // classroom edition: sound starts off (M turns it on)
  function blip(freq, dur = 0.04, vol = 0.025, type = "square") {
    if (muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
      o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
    } catch (e) { /* no audio */ }
  }
  const sfx = {
    move: () => blip(520, 0.03), ok: () => { blip(520, 0.05); setTimeout(() => blip(780, 0.06), 50); },
    bad: () => blip(150, 0.15, 0.035, "sawtooth"), coin: () => { blip(880, 0.05); setTimeout(() => blip(1320, 0.09), 60); },
    door: () => blip(220, 0.1, 0.03, "triangle"), leak: () => { blip(300, 0.12, 0.03, "triangle"); setTimeout(() => blip(200, 0.2, 0.03, "triangle"), 120); },
    chime: () => { [660, 880, 1100].forEach((f, i) => setTimeout(() => blip(f, 0.12, 0.025, "triangle"), i * 110)); }
  };

  // ---------- inventory ----------
  const bagCount = (id) => G.bag.filter((s) => s.id === id).reduce((a, s) => a + s.n, 0);
  // The bag holds 6 things in total, whatever they are.
  const slotsUsed = () => G.bag.reduce((a, s) => a + s.n, 0);
  function bagAdd(id, n) {
    let added = 0;
    while (n > 0 && slotsUsed() < BAG_SLOTS) {
      let s = G.bag.find((s) => s.id === id);
      if (!s) { s = { id, n: 0 }; G.bag.push(s); }
      s.n++; n--; added++;
    }
    return added;
  }
  function bagTake(id, n = 1) {
    for (const s of G.bag) if (s.id === id && n > 0) { const k = Math.min(n, s.n); s.n -= k; n -= k; }
    G.bag = G.bag.filter((s) => s.n > 0);
  }
  const stashCount = (id) => G.stash[id] || 0;
  function have(id, home) { return bagCount(id) + (home ? stashCount(id) : 0); }
  function takeOne(id, home) { if (bagCount(id) > 0) bagTake(id); else if (home) G.stash[id] = Math.max(0, stashCount(id) - 1); }
  function give(id, n = 1, quiet) {
    const added = bagAdd(id, n), rest = n - added;
    if (rest > 0) G.stash[id] = stashCount(id) + rest;
    if (!quiet) toast(`+${n} ${ITEMS[id].name}${rest > 0 ? (added ? ` (${rest} sent home)` : " (sent home, bag full)") : ""}`, ITEMS[id].icon);
  }
  const isHome = () => G.mapId === "home";

  // ---------- stats ----------
  function stat(k, dv, quiet) {
    if (k === "money") { G.money = Math.max(0, Math.round((G.money + dv) * 100) / 100); if (!quiet) toast(`${dv > 0 ? "+" : "-"}$${Math.abs(dv).toFixed(2)}`, "coin"); return; }
    G.stats[k] = clamp(G.stats[k] + dv);
    if (!quiet && Math.abs(dv) >= 1) floatText(`${dv > 0 ? "+" : ""}${Math.round(dv)} ${statName(k)}`, (dv > 0) !== (k === "cravings") ? "up" : "down");
  }
  const statName = (k) => ({ health: "Health", energy: "Energy", mood: "Mood", cravings: "Cravings" })[k];
  function flowNow() { return C ? C.flow(G.time) : "none"; }
  function crampsRaw() { return C && C.cramps ? C.cramps(G.time) : 0; }
  function crampsEff() {
    let c = crampsRaw();
    if (G.time >= G.painFrom && G.time < G.painUntil) c *= 0.3;
    if (G.time < G.heatUntil) c *= 0.6;
    return c;
  }
  const crampWord = (c) => c < 1 ? "none" : c < 3 ? "mild" : c < 5 ? "moderate" : c < 7 ? "strong" : "severe";

  // ---------- simulation (one game minute) ----------
  function tick() {
    G.time++;
    const f = flowNow(), rate = FLOW_RATE[f] || 0;
    if (rate > 0) {
      if (G.worn && G.worn.left > 0) {
        G.worn.left = Math.max(0, G.worn.left - rate / 60);
        G.overflow = 0;
        const it = ITEMS[G.worn.id];
        if (G.worn.left < it.cap * 0.18 && !G.worn.warned) { G.worn.warned = true; toast(`Your ${it.name.toLowerCase()} is almost full. Change soon.`, it.icon, true); sfx.bad(); fact("change"); }
      } else {
        G.overflow++;
        if (!G.worn && G.overflow === 1 && !G.stained) toast("You're not wearing anything and you're bleeding. Find a bathroom!", "drop", true);
      }
      if (f === "heavy") fact("amount");
      if (f === "spotting") fact("color");
      const limit = f === "spotting" ? 45 : 12;
      if (G.overflow >= limit && !G.stained) leak();
    } else G.overflow = 0;
    if (G.worn && ITEMS[G.worn.id].maxH && !G.worn.over && G.time - G.worn.since > ITEMS[G.worn.id].maxH * 60) {
      G.worn.over = true;
      if (G.worn.id === "tampon") { stat("health", -12); queue(async () => say("narr", "Your tampon has been in for over **8 hours**. That raises the risk of toxic shock syndrome (TSS). Change it as soon as you can.")); }
      else toast("Your cup needs emptying (12 hours).", "cup", true);
    }
    const ce = crampsEff();
    const st = G.stats, mul = C.energyMul || 1;
    st.energy = clamp(st.energy - (0.05 + (rate > 1 ? 0.02 : 0) + ce * 0.004) * mul);
    st.cravings = clamp(st.cravings + (C.cravingRate || 2) / 60);
    if (G.stained && !G.d.hoodie) st.mood = clamp(st.mood - 0.12);
    if (ce >= 3) st.mood = clamp(st.mood - ce * 0.006);
    if (st.cravings > 75) st.mood = clamp(st.mood - 0.04);
    if (st.energy < 15) st.mood = clamp(st.mood - 0.03);
    if (ce >= 6) st.health = clamp(st.health - 0.04);
    if (crampsRaw() >= 4 && !G.d.crampToast) { G.d.crampToast = true; toast(`Cramps: ${crampWord(crampsRaw())}. A pain reliever or heat patch would help.`, "cramp", true); fact("cramps"); }
    if (C.school && G.time === 710) toast("Lunch is over. No more classes: skip to 3:00 at your seat or the front doors.", "book");
    for (const e of RT.events) if (!e.done && G.time >= e.at && (!e.when || e.when())) { e.done = true; queue(e.run); }
    if (C.curfew && G.time >= C.curfew && G.mapId !== "home" && !G.d.curfew) { G.d.curfew = true; queue(curfew); }
    updateNPCs();
  }
  function leak() {
    G.stained = true; G.leaks++; G.overflow = 0; G.d.leaked = true;
    stat("mood", -12, true); RT.shake = 0.4; sfx.leak(); fact("stain");
    const full = G.worn && G.worn.left <= 0;
    queue(async () => {
      await say("you", full ? `Oh no. My ${ITEMS[G.worn.id].name.toLowerCase()} was full and it leaked through. There's a stain on my pants.` : "Oh no. It came through onto my pants.", "worried");
      await say("narr", "Leaks happen to basically everyone. Fixes: **spare pants** from your bag (in a bathroom), a hoodie tied around your waist, **Dr. Flo** in the health office, or your closet at home. And put on fresh protection!");
    });
  }
  async function curfew() {
    await say("mom", "It's getting late! Come home, okay?");
    await fade(true); teleport("home", 8, 7, "up"); await fade(false);
  }

  // ---------- event queue / scripts ----------
  function queue(fn) { RT.queue.push(fn); }
  async function run(fn) {
    RT.busy++; RT.held = [];
    try { await fn(); } catch (e) { console.error(e); } finally { RT.busy--; }
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- maps ----------
  function tileAt(m, x, y) { return y < 0 || y >= m.h || x < 0 || x >= m.w ? null : m.t[y][x]; }
  function prepMap(m) {
    if (m.keys) return;
    m.keys = [];
    for (let y = 0; y < m.h; y++) {
      const row = [];
      for (let x = 0; x < m.w; x++) {
        const ch = m.t[y][x], below = tileAt(m, x, y + 1), above = tileAt(m, x, y - 1);
        let key = ch;
        if (ch === "#") key = below !== null && !"#=Ij".includes(below) ? "#f" : "#t";
        else if (ch === "b") key = above === "b" ? "b_f" : "b_h";
        else if ("RUYO".includes(ch)) key = below === ch ? ch : ch + "_e";
        else if (ch === "v" || (ch === "D" && m.outdoor)) {
          let fc = "H";
          for (let d = 1; d < 8; d++) { const a = tileAt(m, x - d, y), b = tileAt(m, x + d, y); if (a && "HABZ".includes(a)) { fc = a; break; } if (b && "HABZ".includes(b)) { fc = b; break; } }
          key = ch + "_" + fc;
        } else if (ch === "D") key = "D_in";
        else if (ch === "w") key = above === "w" ? "w" : "we";
        const v = (((x * 73856093) ^ (y * 19349663)) >>> 0) % ART.variants(key);
        row.push({ key, v, over: ART.OVER.has(ch) || key === "D_in", anim: ch === "w" });
      }
      m.keys.push(row);
    }
  }
  function walkable(x, y, who) {
    const m = RT.map, ch = tileAt(m, x, y);
    if (ch === null || SOLID.has(ch)) return false;
    if (who !== "npc" && npcAt(x, y)) return false;
    if (who === "npc" && ((G.x === x && G.y === y) || (RT.mv && RT.mv.tx === x && RT.mv.ty === y))) return false;
    if (who === "npc" && (ch === "D" || RT.npcs.some((n) => n.map === m.id && n.x === x && n.y === y))) return false;
    if (who === "npc" && npcAvoid(m, x, y)) return false;
    return true;
  }
  // Tiles NPCs never walk onto: next to a door, or in a one-tile-wide gap (doorways between rooms).
  function npcAvoid(m, x, y) {
    if ((m.warps || []).some((w) => Math.abs(w.x - x) + Math.abs(w.y - y) <= 1)) return true;
    const solid = (a, b) => { const c = tileAt(m, a, b); return c === null || SOLID.has(c); };
    return (solid(x - 1, y) && solid(x + 1, y)) || (solid(x, y - 1) && solid(x, y + 1));
  }
  // If the player keeps walking into someone, they step out of the way.
  function nudgeNPC(nx, ny) {
    const n = npcAt(nx, ny); if (!n || n.mv) return;
    if ((RT.bump = (RT.bump && RT.bump.n === n ? { n, t: RT.bump.t } : { n, t: RT.t })) && RT.t - RT.bump.t < 0.35) return;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ax = n.x + dx, ay = n.y + dy;
      if ((ax === G.x && ay === G.y) || !walkable(ax, ay, "npc")) continue;
      n.mv = { tx: ax, ty: ay, t: 0, fx: n.x, fy: n.y }; n.hx = ax; n.hy = ay; RT.bump = null; return;
    }
  }
  function teleport(mapId, x, y, dir) {
    const changed = mapId !== G.mapId;
    G.mapId = mapId; G.x = x; G.y = y; if (dir) G.dir = dir;
    RT.map = MAPS[mapId]; prepMap(RT.map); RT.mv = null;
    buildLabels();
    if (changed) { const ar = RT.map.name; banner(ar); if (C && C.onEnter) queue(() => C.onEnter(mapId)); }
  }

  // ---------- NPCs ----------
  function spawnNPCs() {
    RT.npcs = (C.npcs || []).map((d) => ({ ...d, x: -9, y: -9, map: null, dir: "down", cur: null, mv: null, next: 0, phase: Math.random() * 3 }));
    for (const w of TOWNIES) RT.npcs.push({ ...w, x: -9, y: -9, map: null, dir: "left", cur: null, mv: null, next: 0, phase: Math.random() * 3, townie: true });
    updateNPCs(true);
  }
  const TOWNIES = [
    { id: "t1", look: "t1", at: [[420, 1260, "town", 3, 8, "right", 6]] },
    { id: "t2", look: "t2", at: [[420, 1260, "town", 37, 5, "left", 6]] },
    { id: "t3", look: "t3", at: [[420, 1200, "town", 30, 11, "down", 3]] },
    { id: "t4", look: "t4", at: [[480, 1200, "town", 20, 8, "left", 7]] }
  ];
  function updateNPCs(force) {
    for (const n of RT.npcs) {
      const e = n.at.find((a) => G.time >= a[0] && G.time < a[1]) || null;
      if (e === n.cur && !force) continue;
      n.cur = e; n.mv = null;
      if (!e) { n.map = null; continue; }
      n.map = e[2]; n.x = n.hx = e[3]; n.y = n.hy = e[4]; n.dir = e[5] || "down"; n.wander = e[6] || 0;
    }
  }
  function npcAt(x, y) { return RT.npcs.find((n) => n.map === G.mapId && ((n.x === x && n.y === y) || (n.mv && n.mv.tx === x && n.mv.ty === y))); }
  function updateNPCMoves(dt) {
    for (const n of RT.npcs) {
      if (n.map !== G.mapId) continue;
      if (n.mv) {
        n.mv.t += dt / (STEP * 1.6);
        if (n.mv.t >= 1) { n.x = n.mv.tx; n.y = n.mv.ty; n.mv = null; n.stepN = (n.stepN || 0) + 1; }
        continue;
      }
      if (!n.wander || RT.busy || RT.t < n.next) continue;
      n.next = RT.t + 1.2 + Math.random() * 2.5;
      const ds = Object.keys(DIRS), d = ds[Math.floor(Math.random() * 4)], [dx, dy] = DIRS[d];
      const nx = n.x + dx, ny = n.y + dy;
      n.dir = d;
      if (Math.abs(nx - n.hx) + Math.abs(ny - n.hy) > n.wander) continue;
      if (!walkable(nx, ny, "npc")) continue;
      n.mv = { tx: nx, ty: ny, t: 0, fx: n.x, fy: n.y };
    }
  }

  // ---------- input ----------
  function keyName(e) {
    const k = e.key;
    if (k === "ArrowUp" || k === "w" || k === "W") return "up";
    if (k === "ArrowDown" || k === "s" || k === "S") return "down";
    if (k === "ArrowLeft" || k === "a" || k === "A") return "left";
    if (k === "ArrowRight" || k === "d" || k === "D") return "right";
    if (k === " " || k === "Enter" || k === "e" || k === "E" || k === "z" || k === "Z") return "ok";
    if (k === "Escape" || k === "b" || k === "B" || k === "x" || k === "X" || k === "Backspace") return "back";
    if (k === "i" || k === "I" || k === "Tab") return "bag";
    if (k === "p" || k === "P") return "phone";
    if (k === "m" || k === "M") return "mute";
    if (k === "h" || k === "H") return "help";
    if (k === "t" || k === "T") return "wait";
    if (k === "f" || k === "F") return "fact";
    if (k >= "1" && k <= "9") return "n" + k;
    return null;
  }
  addEventListener("keydown", (e) => {
    const k = keyName(e);
    if (!k) return;
    e.preventDefault();
    if (k === "mute") { muted = !muted; toast(muted ? "Sound off" : "Sound on"); return; }
    if (UI.active()) { if (!e.repeat) UI.key(k); return; }
    if (RT.mode !== "play") return;
    if (DIRS[k]) { RT.held = RT.held.filter((h) => h !== k); RT.held.push(k); return; }
    if (e.repeat || RT.busy || RT.mv) return;
    if (k === "ok") interact();
    if (k === "bag") run(openBag);
    if (k === "phone") run(openPhone);
    if (k === "wait") run(waitAhead);
    if (k === "help") run(showHelp);
  });
  addEventListener("keyup", (e) => { const k = keyName(e); RT.held = RT.held.filter((h) => h !== k); });
  addEventListener("blur", () => (RT.held = []));

  function interact() {
    const [dx, dy] = DIRS[G.dir], tx = G.x + dx, ty = G.y + dy;
    let n = npcAt(tx, ty);
    const tch = tileAt(RT.map, tx, ty);
    if (!n && tch && "CG".includes(tch)) n = npcAt(tx + dx, ty + dy);
    if (n) {
      const back = n.dir;
      n.dir = { up: "down", down: "up", left: "right", right: "left" }[G.dir];
      return run(async () => {
        const h = (C.talk && C.talk[n.id]) || (window.DEFAULT_TALK && DEFAULT_TALK[n.id]);
        if (h) await h(n); else await say(n.id, "Hey!");
        n.dir = back;
      });
    }
    const o = RT.map.objects.find((o) => o.x === tx && o.y === ty);
    if (o) return run(() => useObject(o));
    // Anywhere inside a bathroom works, not only facing the toilet or sink.
    const ba = (RT.map.bathAreas || []).find((a) => G.x >= a.x && G.x < a.x + a.w && G.y >= a.y && G.y < a.y + a.h);
    if (ba) run(() => openBath(!!ba.home));
  }

  // ---------- movement ----------
  function updatePlayer(dt) {
    if (RT.mv) {
      RT.mv.t += dt / STEP;
      if (RT.mv.t >= 1) {
        G.x = RT.mv.tx; G.y = RT.mv.ty; RT.mv = null; RT.stepN++;
        if (RT.map.outdoor && RT.stepN % 2 === 0) RT.parts.push({ x: G.x * T + 8, y: G.y * T + 15, life: 0.35, kind: "dust" });
        arrived();
      }
      return;
    }
    if (RT.busy || UI.active() || RT.queue.length) return;
    let d = RT.held[RT.held.length - 1];
    if (d) RT.auto = null;                       // pressing a key cancels a tap-to-walk
    else if (RT.auto) return autoStep();
    if (!d) return;
    G.dir = d;
    const [dx, dy] = DIRS[d], nx = G.x + dx, ny = G.y + dy;
    if (walkable(nx, ny)) { RT.mv = { tx: nx, ty: ny, t: 0, fx: G.x, fy: G.y }; RT.bump = null; }
    else nudgeNPC(nx, ny);
  }
  // ---------- tap / click to walk ----------
  // Breadth-first search over walkable tiles. goal(x, y) says whether a tile is a place to stop.
  function findPath(goal) {
    const m = RT.map, key = (x, y) => x + "," + y, prev = { [key(G.x, G.y)]: null }, q = [[G.x, G.y]];
    while (q.length) {
      const [x, y] = q.shift();
      if (goal(x, y)) { const out = []; let k = key(x, y); while (prev[k]) { out.unshift(prev[k][2]); k = key(prev[k][0], prev[k][1]); } return out; }
      for (const d in DIRS) {
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1], k = key(nx, ny);
        if (k in prev || nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || !walkable(nx, ny)) continue;
        if (tileAt(m, nx, ny) === "D" && !goal(nx, ny)) continue;   // don't walk through doors on the way
        prev[k] = [x, y, d]; q.push([nx, ny]);
        if (q.length > 4000) return null;
      }
    }
    return null;
  }
  function tapAt(clientX, clientY) {
    if (RT.mode !== "play" || RT.busy || UI.active() || !RT.cam) return;
    const r = cv.getBoundingClientRect();
    const tx = Math.floor(((clientX - r.left) / S + RT.cam.cx) / T), ty = Math.floor(((clientY - r.top) / S + RT.cam.cy + 3) / T);
    const m = RT.map;
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || (tx === G.x && ty === G.y)) return;
    const npc = npcAt(tx, ty), obj = m.objects.find((o) => o.x === tx && o.y === ty);
    const ch = tileAt(m, tx, ty);
    if (npc || obj || SOLID.has(ch)) {
      if (!npc && !obj) return;
      // Walk next to it (or across a shop counter from it), then face it and use it.
      const spots = [];
      for (const d in DIRS) {
        const [dx, dy] = DIRS[d];
        spots.push([tx - dx, ty - dy, d]);
        const mid = tileAt(m, tx - dx, ty - dy);
        if (npc && mid && "CG".includes(mid)) spots.push([tx - 2 * dx, ty - 2 * dy, d]);
      }
      const facing = (x, y) => { const s = spots.find((s) => s[0] === x && s[1] === y); return s && s[2]; };
      const path = facing(G.x, G.y) ? [] : findPath((x, y) => !!facing(x, y) && tileAt(m, x, y) !== "D");
      if (!path) return;
      RT.auto = { path, goal: [tx, ty], then: () => { const end = [G.x, G.y], dir = facing(end[0], end[1]); if (dir) { G.dir = dir; interact(); } } };
    } else {
      const path = findPath((x, y) => x === tx && y === ty);
      if (!path) return;
      RT.auto = { path, goal: [tx, ty] };
    }
    RT.tapMark = { x: tx, y: ty, t: RT.t };
  }
  function autoStep() {
    const a = RT.auto;
    if (!a.path.length) { RT.auto = null; if (a.then) a.then(); return; }
    const d = a.path[0], [dx, dy] = DIRS[d], nx = G.x + dx, ny = G.y + dy;
    G.dir = d;
    if (!walkable(nx, ny)) {                     // someone stepped in the way: try a new route once
      if (a.retried) { RT.auto = null; return; }
      a.retried = true; nudgeNPC(nx, ny);
      return;
    }
    a.path.shift();
    RT.mv = { tx: nx, ty: ny, t: 0, fx: G.x, fy: G.y };
  }
  function arrived() {
    const w = (RT.map.warps || []).find((w) => w.x === G.x && w.y === G.y);
    if (w) { RT.auto = null; return run(() => doWarp(w)); }
    for (const tr of C.triggers || []) {
      if (tr.done || tr.map !== G.mapId) continue;
      if (G.x < tr.x || G.x >= tr.x + (tr.w || 1) || G.y < tr.y || G.y >= tr.y + (tr.h || 1)) continue;
      if (tr.when && !tr.when()) continue;
      if (tr.once !== false) tr.done = true;
      queue(tr.run);
    }
  }
  async function doWarp(w) {
    const hours = { school: [390, 1080], mart: [480, 1260], pool: [420, 1200] }[w.to];
    const back = () => { const [dx, dy] = DIRS[G.dir]; G.x -= dx; G.y -= dy; G.dir = { up: "down", down: "up", left: "right", right: "left" }[G.dir]; };
    if (hours && (G.time < hours[0] || G.time >= hours[1])) { back(); await say("narr", `It's locked. Open ${fmtTime(hours[0])} to ${fmtTime(hours[1])}.`); return; }
    if (C.beforeWarp) { const ok = await C.beforeWarp(w); if (ok === false) { back(); return; } }
    if (G.mapId === "school" && w.to === "town" && C.school && G.time >= 710 && G.time < 900) await freePeriod(true);
    sfx.door();
    await fade(true);
    teleport(w.to, w.tx, w.ty, w.dir);
    await fade(false);
  }

  // ---------- objects ----------
  async function useObject(o) {
    if (C.use && C.use[o.kind]) { const handled = await C.use[o.kind](o); if (handled !== false) return; }
    switch (o.kind) {
      case "bed": {
        const ok = C.canSleep ? C.canSleep() : G.time >= 1080;
        if (!ok) return say("narr", `Not tired yet. ${G.objective ? "Still to do: " + G.objective : ""}`);
        const c = await ask("narr", G.trackerUnlocked ? "Log your day in the cycle tracker, then go to sleep?" : "Go to sleep and end the day?", G.trackerUnlocked ? ["Log my day, then sleep", "Not yet"] : ["Sleep", "Not yet"]);
        if (c === 0) await endDay();
        return;
      }
      case "desk": {
        // The phone option only appears once there is something on it (tracker app or a found fact).
        const hasPhone = true;
        const opts = ["Pack your bag", "Check your phone", "Never mind"];
        const c = await ask("narr", "Your desk. Your period supplies live in the top drawer.", opts);
        if (c === 0) await openPack();
        if (c === 1 && hasPhone) await openPhone();
        return;
      }
      case "closet":
        if (G.stained) { G.stained = false; G.d.hoodie = false; stat("mood", 5); sfx.ok(); return say("narr", "You change into clean clothes and rinse the stained ones in cold water before washing. Heat would set the stain."); }
        return say("narr", "Your closet. Hoodies, jeans, and the swim team jacket you never wear.");
      case "bath": return openBath(!!(o.data && o.data.home));
      case "fridge":
        if (G.d.ate) return say("narr", "You already grabbed something. Save some for later.");
        G.d.ate = true; stat("cravings", -20); stat("energy", 10); sfx.ok();
        return say("narr", "Leftover pancakes and a banana. Exactly what you needed.");
      case "kitchen": return say("narr", "The kettle is still warm.");
      case "table": return say("narr", "The kitchen table. Someone left a crossword half-finished.");
      case "seat": return attendClass();
      case "desk_s": return say("narr", "Someone else's desk. There's a cat doodled in the corner.");
      case "tdesk": return say("narr", "The teacher's desk. A stack of quizzes and a very old apple.");
      case "board": return say("narr", C.board || "The board says: HOMEWORK DUE FRIDAY. Someone drew a frog next to it.");
      case "cot":
        if (crampsRaw() < 2 && G.stats.energy > 50) return say("narr", "The cot in Dr. Flo's office. You don't need it right now.");
        await say("narr", "You lie down for a bit."); await skip(20, "Resting..."); stat("energy", 8); stat("mood", 4); return;
      case "poster": return card({ icon: "drop", title: "When to talk to a doctor", body: "<ul class='signs'>" + WARNING_SIGNS.map((s) => `<li>${s}</li>`).join("") + "</ul><p>If any of these sound like you, tell a parent, guardian, school nurse or doctor.</p><p class='dim'>Poster in Dr. Flo's office.</p>" });
      case "dispenser": {
        const c = await ask("narr", "A pad dispenser. 25 cents each.", ["Buy a pad ($0.25)", "Leave"]);
        if (c !== 0) return;
        if (G.money < 0.25) { sfx.bad(); return say("narr", "You don't have a quarter."); }
        stat("money", -0.25); give("pad", 1); sfx.coin(); fact("freeproducts"); return;
      }
      case "fountain":
        if (G.time - (G.d.drank || -999) < 60) return say("narr", "You just had some.");
        G.d.drank = G.time; stat("health", 2); fact("water"); return say("narr", "Cold water. Nice.");
      case "locker": return say("narr", "Lockers. One of them has a sticker that says I'D RATHER BE NAPPING.");
      case "notice": return say("narr", C.notice || "Bulletin board: SCIENCE OLYMPIAD TRYOUTS SOON. DEBATE TEAM MEETS SATURDAYS.");
      case "trophy": return say("narr", "A trophy case. The swim team has a LOT of trophies.");
      case "shelf": return openShop(o.data);
      case "bench": await say("narr", "You sit for a minute and people-watch."); await skip(10); stat("energy", 3); stat("mood", 2); return;
      case "pond": return say("narr", "Two ducks are ignoring each other in the pond.");
      case "parksign": return say("narr", "MAPLE PARK. Open dawn to dusk. Ducks have the right of way.");
      case "pool": return say("narr", "The water smells like chlorine. Talk to Coach Reed about practice.");
    }
  }

  // ---------- school schedule ----------
  // The school day: Health with Dr. Flo is the only class (8:00 to 11:10), then lunch, then a free
  // period the player can skip straight through to 3:00.
  const HEALTH_BLOCK = [480, 670];
  async function attendClass() {
    if (!C.school) return say("narr", "No class today. It's weird being here when it's empty.");
    if (G.time >= 900) return say("narr", "School's out for the day.");
    if (G.time >= 670 && G.time < 710) return say("narr", "It's lunch. Go find your friends in the hallway.");
    if (G.time >= 710) return freePeriod(false);
    const c = await ask("narr", `Health class with Dr. Flo, ${fmtTime(HEALTH_BLOCK[0])} to ${fmtTime(HEALTH_BLOCK[1])}. Sit down for class?`, ["Sit down", "Not yet"]);
    if (c !== 0) return;
    if (C.health && !G.d.healthDone) return healthClass(HEALTH_BLOCK);
    await skip(HEALTH_BLOCK[1] - G.time, "HEALTH CLASS", "Dr. Flo answers questions from the anonymous question box.");
  }
  // After lunch there are no more classes. Offer to jump to the end of the school day.
  async function freePeriod(atDoor) {
    const c = await ask("narr", "Health was your only class today. School lets out at 3:00 PM. Skip ahead to then?", ["Skip to 3:00", atDoor ? "Leave now" : "Not yet"]);
    if (c !== 0) return false;
    await skip(900 - G.time, "THAT AFTERNOON", "Free period. The rest of the school day goes by.");
    return true;
  }
  // Health class: a short lesson (slides), then a quiz. The last day is a unit test.
  async function healthClass(b) {
    const U = C.health;
    G.quiz = G.quiz || { right: 0, total: 0 };
    if (G.time < b[0]) await skip(b[0] - G.time, "HEALTH CLASS", U.title);
    else { await fade(true); UI.classCard("HEALTH CLASS", U.title); await wait(1100); UI.classCard(null); await fade(false); }
    if (RT.queue.length) return; // something urgent came up (a leak); class can wait
    G.d.healthDone = true;
    for (const line of U.intro || []) await say("nurse", line, "smile");
    for (const s of U.slides || []) await card({ icon: s.icon || "book", title: s.title, body: s.body, cls: "lesson", btn: "Next" });
    await say("nurse", U.final ? "Okay, everyone. Books away, pencils out. This is the unit test. You know more than you think." : "Pop quiz! Don't panic. It's just to see what stuck.", "smile");
    const right = await quiz(U.final ? "UNIT TEST" : "POP QUIZ", U.quiz);
    const n = U.quiz.length;
    G.quiz.right += right; G.quiz.total += n; G.literacy += right * 3;
    if (U.final) {
      const pct = right / n;
      G.finalGrade = pct === 1 ? "A+" : pct >= 0.85 ? "A" : pct >= 0.75 ? "B" : pct >= 0.6 ? "C" : "Needs review";
      sfx.chime();
      await card({ icon: "book", title: `Unit test: ${right} / ${n}`, cls: "paper", body: `<p class="grade">${G.finalGrade}</p><p>${pct >= 0.75 ? "Dr. Flo draws a little star next to your name." : "Dr. Flo writes: 'Come see me and we'll go over these together.'"}</p><p>+${right * 3} Body Literacy</p>` });
      stat("mood", pct >= 0.75 ? 8 : 2);
    } else {
      if (right === n) { sfx.chime(); stat("mood", 4); }
      await say("nurse", right === n ? `${right} out of ${n}. Perfect score!` : right > 0 ? `${right} out of ${n}. Nice work. The ones you missed will come back on the unit test.` : "Zero this time. That's okay. That's what class is for.", "smile");
      toast(`+${right * 3} Body Literacy`, "book");
    }
    if (G.time < b[1]) {
      await skip(b[1] - G.time, "HEALTH CLASS", "Dr. Flo answers questions from the anonymous question box.");
    }
  }
  async function quiz(title, qs) {
    let right = 0;
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const pick = await menu({
        title: q.head || `${title} · Question ${i + 1} of ${qs.length}`, sub: () => q.q, cls: "paper", cancel: false,
        rows: () => q.a.map((t, j) => ({ label: `${"ABCD"[j]}.&nbsp; ${t}`, j })),
        onPick: (r) => r.j
      });
      const ok = pick === q.c;
      if (ok) { right++; sfx.ok(); } else sfx.bad();
      await card({ title: ok ? "Correct!" : "Not quite", cls: "paper " + (ok ? "right" : "wrong"), btn: i + 1 < qs.length ? "Next question" : "Finish",
        body: `${ok ? "" : `<p>The answer was: <b>${q.a[q.c]}</b></p>`}<p>${q.why}</p>` });
    }
    return right;
  }
  // 4-phase diagram used in lesson slides
  function phaseDiagram() {
    const seg = [["menstrual", 1, 5], ["follicular", 6, 13], ["ovulation", 14, 14], ["luteal", 15, 28]];
    let s = "";
    const pt = (r, a) => `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
    for (const [k, d0, d1] of seg) {
      const a0 = ((d0 - 1) / 28) * Math.PI * 2 - Math.PI / 2, a1 = (d1 / 28) * Math.PI * 2 - Math.PI / 2, big = a1 - a0 > Math.PI ? 1 : 0;
      s += `<path d="M${pt(26, a0)} L${pt(44, a0)} A44,44 0 ${big} 1 ${pt(44, a1)} L${pt(26, a1)} A26,26 0 ${big} 0 ${pt(26, a0)}Z" fill="${PHASE[k].color}" stroke="#1d1828" stroke-width="1.5"/>`;
    }
    return `<div class="diagram"><svg viewBox="0 0 100 100">${s}<text x="50" y="48" text-anchor="middle" font-size="9" fill="#f3e9d2">28</text><text x="50" y="58" text-anchor="middle" font-size="7" fill="#a59fb4">days</text></svg>
      <div class="legend">${seg.map(([k, a, z]) => `<div><i style="background:${PHASE[k].color}"></i><b>${PHASE[k].label}</b> day${a === z ? " " + a : "s " + a + "–" + z}</div>`).join("")}</div></div>`;
  }
  // skip time with a fade card. Stops early if something happens (leak, event).
  async function skip(mins, label, line) {
    if (label) { await fade(true); UI.classCard(label, line || ""); }
    const end = G.time + mins;
    let n = 0;
    while (G.time < end) {
      tick(); n++;
      if (RT.queue.length) break;
      if (label && n % 3 === 0) { UI.hud(); await wait(16); }
    }
    if (label) { await wait(500); UI.classCard(null); await fade(false); }
  }

  // ---------- menus ----------
  async function openPack() {
    const order = ["pad", "liner", "tampon", "cup", "underwear", "pain", "heat", "bar", "choc", "chips", "water", "pants", "swim"];
    if (!G.flags.packTip) { G.flags.packTip = true; await say("narr", "**Packing:** pick an item, press **→ / Space** to put one in your bag, **←** to take it out. Your bag holds **6 things** in total, so choose carefully."); }
    await menu({
      title: "Pack your bag",
      rows: () => [...order.filter((id) => stashCount(id) + bagCount(id) > 0).map((id) => ({ id, icon: ITEMS[id].icon, label: ITEMS[id].name, right: `home ${stashCount(id)} · bag ${bagCount(id)}` })), { label: "Done", done: true }],
      detail: (r) => r.id ? `<b>${ITEMS[r.id].name}</b><br>${ITEMS[r.id].desc}` : "Close when you're ready.",
      footer: () => `<b>Bag: ${slotsUsed()} of ${BAG_SLOTS} things</b>${slotsUsed() >= BAG_SLOTS ? " &nbsp; <span class=\"bad\">Full. Take something out to swap.</span>" : ""}`,
      onRight: (r) => { if (!r.id) return; if (stashCount(r.id) > 0 && bagAdd(r.id, 1)) { G.stash[r.id]--; sfx.move(); } else sfx.bad(); },
      onLeft: (r) => { if (!r.id) return; if (bagCount(r.id) > 0) { bagTake(r.id); G.stash[r.id] = stashCount(r.id) + 1; sfx.move(); } else sfx.bad(); },
      onPick: (r, m) => { if (r.done) return true; m.onRight(r); }
    });
    if (C.afterPack) await C.afterPack();
  }
  async function openBag() {
    await menu({
      title: "Backpack",
      sub: () => wornText(),
      rows: () => G.bag.length ? G.bag.map((s) => ({ id: s.id, icon: ITEMS[s.id].icon, label: ITEMS[s.id].name, right: "x" + s.n })) : [{ label: "(empty)", disabled: true }],
      detail: (r) => r.id ? `<b>${ITEMS[r.id].name}</b><br>${ITEMS[r.id].desc}<br><br><span class="dim">${ITEMS[r.id].kind === "use" ? "Space: use" : ITEMS[r.id].kind === "product" ? "Change in a bathroom." : ""}</span>` : "",
      footer: () => `<img class="ic" src="${ART.icon("coin")}"> $${G.money.toFixed(2)} &nbsp; Bag: ${slotsUsed()} of ${BAG_SLOTS} things`,
      onPick: async (r) => { if (r.id) { const used = await useItem(r.id); if (used) return true; } }
    });
  }
  function wornText() {
    const f = flowNow();
    let s = G.worn ? `Wearing: ${ITEMS[G.worn.id].name} (${Math.round((G.worn.left / ITEMS[G.worn.id].cap) * 100)}% left)` : "Wearing: nothing";
    if (f !== "none") s += ` · Flow: ${f}`;
    if (G.stained) s += " · <span class='bad'>stained</span>";
    return s;
  }
  async function useItem(id) {
    const st = G.stats;
    switch (id) {
      case "pain":
        if (G.time < G.painNext) { sfx.bad(); toast("Too soon for another dose. Always follow the directions on the bottle.", "pain", true); return false; }
        bagTake("pain"); G.painFrom = G.time + 30; G.painUntil = G.time + 390; G.painNext = G.time + 360;
        UI.closeMenu(); await say("narr", G.mapId === "school" ? "School rule: medicine goes through the health office. You take it there, with the form Mom signed, following the directions on the bottle." : "Mom said it was okay, so you take one pain reliever with some water, following the directions on the bottle. It takes a little while to kick in."); fact("ibuprofen"); return true;
      case "heat":
        bagTake("heat"); G.heatUntil = G.time + 240; UI.closeMenu(); await say("narr", "You stick the heat patch on your lower belly. Warm. Your cramps loosen up a little."); fact("heat"); return true;
      case "bar": bagTake("bar"); stat("cravings", -20); stat("energy", 12); sfx.ok(); return true;
      case "choc": bagTake("choc"); stat("cravings", -35); stat("mood", 6); sfx.ok(); fact("cravings"); return true;
      case "chips": bagTake("chips"); stat("cravings", -25); stat("mood", 3); if (C.bloat) stat("health", -2); sfx.ok(); fact("salt"); return true;
      case "water": bagTake("water"); stat("health", 3); if (C.bloat) stat("mood", 4); sfx.ok(); fact("water"); return true;
      default: toast(ITEMS[id].kind === "product" ? "You'll need a bathroom to change." : ITEMS[id].desc, ITEMS[id].icon); return false;
    }
  }
  async function openBath(home) {
    G.d.inBath = true;
    let result = null;
    await menu({
      title: "Bathroom",
      sub: () => wornText(),
      rows: () => {
        const r = [];
        const prod = (id, verb) => { const n = have(id, home); if (n > 0) r.push({ act: "wear", id, icon: ITEMS[id].icon, label: `${verb}`, right: "x" + n }); };
        prod("pad", "Put on a fresh pad"); prod("liner", "Put on a liner"); prod("tampon", "Insert a tampon");
        if (G.worn && G.worn.id === "cup") r.push({ act: "cup", icon: "cup", label: "Empty & rinse your cup" });
        else if (have("cup", home)) r.push({ act: "wear", id: "cup", icon: "cup", label: "Insert menstrual cup" });
        if (have("underwear", home) && !G.d.usedUW) r.push({ act: "wear", id: "underwear", icon: "underwear", label: "Put on period underwear" });
        if (G.worn) r.push({ act: "off", icon: ITEMS[G.worn.id].icon, label: `Take off the ${ITEMS[G.worn.id].name.toLowerCase()}` });
        if (G.stained && bagCount("pants")) r.push({ act: "pants", icon: "pants", label: "Change into spare pants" });
        if (!r.some((x) => x.act === "wear" || x.act === "cup")) {
          const atHome = ["pad", "liner", "tampon", "cup", "underwear"].some((id) => stashCount(id) > 0);
          r.push({ act: "none", icon: "drop", disabled: true, label: home ? "No period products at home" : atHome ? "Your products are at home, not in your bag" : "No period products in your bag",
            hint: home ? "Buy some at Corner Mart." : G.mapId === "school" ? "Try the pad dispenser on the restroom wall (25 cents), or ask Dr. Flo. Next time, pack some at your desk." : "Next time, pack some at your desk before you leave home. Corner Mart sells them." });
        }
        r.push({ act: "leave", label: "Leave" });
        return r;
      },
      detail: (r) => r.hint ? r.hint : r.id ? `<b>${ITEMS[r.id].name}</b><br>${ITEMS[r.id].desc}` : r.act === "pants" ? "Swap into your spare pants. Stain solved." : r.act === "cup" ? "Empty, rinse in the sink, reinsert. Good for another 12 hours." : "",
      onPick: (r) => { if (r.disabled) return; result = r; return true; }
    });
    G.d.inBath = false;
    if (!result || result.act === "leave") return;
    const r = result;
    if (r.act === "wear") {
      const it = ITEMS[r.id];
      if (!it.reusable) takeOne(r.id, home);
      if (r.id === "underwear") G.d.usedUW = true;
      G.worn = { id: r.id, left: it.cap, since: G.time };
      G.overflow = 0; G.d.changes = (G.d.changes || 0) + 1;
      sfx.ok(); fact("use_" + r.id);
      if (!G.flags["how_" + r.id]) { G.flags["how_" + r.id] = true; await card({ icon: it.icon, title: `How to use: ${it.name}`, body: `<p>${it.how}</p>` }); }
      else toast(`${it.name} on. You're good for a while.`, it.icon);
    } else if (r.act === "cup") { G.worn = { id: "cup", left: ITEMS.cup.cap, since: G.time }; G.overflow = 0; sfx.ok(); toast("Cup emptied and rinsed.", "cup"); }
    else if (r.act === "off") { G.worn = null; sfx.ok(); }
    else if (r.act === "pants") { bagTake("pants"); G.stained = false; G.d.hoodie = false; stat("mood", 6); sfx.ok(); await say("narr", "You change into your spare pants and roll the stained ones into a plastic bag. Crisis handled. Past-you was smart."); }
    await skip(3);
    if (C.afterBath) await C.afterBath(r);
  }
  const SHOPS = { period: ["pad", "liner", "tampon", "cup", "underwear"], comfort: ["pain", "heat", "water"], snacks: ["bar", "choc", "chips"], drinks: ["water", "bar"] };
  const SHOP_NAMES = { period: "Period care", comfort: "Pain & comfort", snacks: "Snacks", drinks: "Drinks" };
  async function openShop(group) {
    await menu({
      title: SHOP_NAMES[group],
      rows: () => [...SHOPS[group].map((id) => ({ id, icon: ITEMS[id].icon, label: ITEMS[id].pack > 1 ? `${ITEMS[id].name}s (${ITEMS[id].pack})` : ITEMS[id].name, right: "$" + ITEMS[id].price.toFixed(2), disabled: G.money < ITEMS[id].price })), { label: "Done", done: true }],
      detail: (r) => r.id ? `<b>${ITEMS[r.id].name}</b><br>${ITEMS[r.id].desc}${ITEMS[r.id].pack > 1 ? `<br><br><span class="dim">Pack of ${ITEMS[r.id].pack}. About $${(ITEMS[r.id].price / ITEMS[r.id].pack).toFixed(2)} each.</span>` : ""}` : "",
      footer: () => `<img class="ic" src="${ART.icon("coin")}"> $${G.money.toFixed(2)} &nbsp; <span class="dim">Extras go home in your shopping bag.</span>`,
      onPick: (r) => {
        if (r.done) return true;
        const it = ITEMS[r.id];
        if (G.money < it.price) { sfx.bad(); return; }
        G.money = Math.round((G.money - it.price) * 100) / 100;
        give(r.id, it.pack);
        G.d.bought = (G.d.bought || 0) + 1; G.flags.everBought = true;
        fact(r.id === "cup" || r.id === "underwear" ? "reusable" : SHOPS.period.includes(r.id) ? "cost" : "storebrand");
        sfx.coin();
      }
    });
    if (C.afterShop) await C.afterShop();
  }
  async function openPhone() {
    const ft = factCount()[1];
    for (;;) {
      const pick = await menu({
        title: "Phone",
        rows: () => [
          { k: "tracker", icon: "phone", label: "Cycle Tracker", disabled: !G.trackerUnlocked },
          { k: "facts", icon: "bulb", label: "Fact Book", right: `${factCount()[0]} / ${ft}` },
          { k: "plan", icon: "book", label: "Today's plan", disabled: !C.plan },
          { k: "glossary", icon: "book", label: "Glossary", right: `${GLOSSARY.length} words` },
          { k: "close", label: "Put phone away" }
        ],
        detail: (r) => r.k === "tracker" ? (G.trackerUnlocked ? "Your logs and the forecast for your next period." : "Not installed yet. You'll get it on Day 1.") : r.k === "facts" ? "Every 'Did you know?' you've found so far. Find them by doing things: changing, shopping, swimming, snacking..." : r.k === "glossary" ? "What the words from health class mean, plus a labeled body diagram." : r.k === "plan" ? "What's happening today, and when." : "",
        onPick: (r) => r.k
      });
      if (pick === "tracker") await openTracker();
      else if (pick === "facts") await openFactBook();
      else if (pick === "glossary") await openGlossary();
      else if (pick === "plan") await showPlan(false);
      else return;
    }
  }
  async function openGlossary() {
    for (;;) {
      const pick = await menu({
        title: "Glossary", sub: () => "Words from health class", cls: "wide",
        rows: () => [{ k: "diagram", icon: "book", label: "Body diagram" }, ...GLOSSARY.map((g) => ({ g, label: g.t })), { label: "Back", done: true }],
        detail: (r) => r.g ? `<b>${r.g.t}</b><br>${r.g.d}${r.g.s ? `<br><br><span class="src">Source: ${r.g.s}</span>` : ""}` : r.k === "diagram" ? "A labeled diagram of the uterus, the ovaries and how they connect. Press Space to open it." : "",
        onPick: (r) => (r.done ? "back" : r.k === "diagram" ? "diagram" : undefined)
      });
      if (pick !== "diagram") return;
      await card({ title: "Inside the body", cls: "lesson", btn: "Back to the glossary", body: bodyDiagram(true) });
    }
  }
  async function openFactBook() {
    const ids = Object.keys(FACTS);
    await menu({
      title: "Fact Book", sub: () => `${factCount()[0]} of ${ids.length} found`, cls: "wide",
      rows: () => [...ids.map((id) => ({ id, icon: G.facts[id] ? "bulb" : null, label: G.facts[id] ? FACTS[id].t : "? ? ?", disabled: !G.facts[id] })), { label: "Back", done: true }],
      detail: (r) => r.id ? (G.facts[r.id] ? FACTS[r.id].x + (FACTS[r.id].s ? `<br><br><span class="src">Source: ${FACTS[r.id].s}</span>` : "") : "<span class='dim'>Not found yet.</span>") : "",
      onPick: (r) => (r.done ? true : undefined)
    });
  }
  async function openTracker() {
    const rows = G.log.slice(-8).map((l) => `<tr><td>Day ${l.day}</td><td>${l.flow}</td><td>${l.cramps}/10</td><td>${l.mood}</td><td>${l.correct ? "<span class='good'>✓</span>" : "<span class='bad'>?</span>"}</td></tr>`).join("");
    const daysLeft = G.cycleStarted ? Math.max(0, 28 - G.day) : null;
    await card({
      icon: "phone", title: "Cycle Tracker",
      body: `<div class="phone-wheel">${wheelSVG(true)}</div>
        <p>${G.cycleStarted ? `Today is <b>cycle day ${G.day}</b> (${PHASE[phaseOf(G.day)].label} phase).<br>Next period expected in about <b>${daysLeft} day${daysLeft === 1 ? "" : "s"}</b>.` : "No cycle data yet."}</p>
        ${rows ? `<table class="log"><tr><th>Day</th><th>Flow</th><th>Cramps</th><th>Mood</th><th></th></tr>${rows}</table>` : "<p class='dim'>Log your day at bedtime.</p>"}
        <p class="dim">Teen cycles are often irregular, especially in the first few years. Anything from 21 to 45 days is normal. Predictions get better the more you log.</p>`
    });
  }
  async function trackerLog() {
    const flows = ["none", "spotting", "light", "medium", "heavy"], moods = ["great", "okay", "meh", "low", "irritable"];
    const e = { day: G.day, flow: 2, cramps: 0, mood: 1 };
    if (!G.flags.trackerTip) { G.flags.trackerTip = true; await say("narr", "**Bedtime log.** Think about your whole day: how heavy was your flow? How bad were the cramps (before any medicine)? An honest log is exactly what a doctor would want to see someday."); }
    await menu({
      title: `Cycle Tracker · Day ${G.day}`, sub: () => "Use ← → to change, Space on Save.",
      rows: () => [
        { k: "flow", label: "Flow", right: `◂ ${flows[e.flow]} ▸` },
        { k: "cramps", label: "Cramps", right: `◂ ${e.cramps}/10 ▸` },
        { k: "mood", label: "Mood", right: `◂ ${moods[e.mood]} ▸` },
        { k: "save", label: "Save log" }
      ],
      detail: (r) => r.k === "flow" ? "Spotting = a few drops. Light = a liner or pad lasted all day. Medium = changed a few times. Heavy = filled things fast." : r.k === "cramps" ? "0 = nothing, 10 = worst pain imaginable." : r.k === "mood" ? "How did you feel overall?" : "",
      onLeft: (r) => { if (r.k === "flow") e.flow = (e.flow + 4) % 5; if (r.k === "cramps") e.cramps = Math.max(0, e.cramps - 1); if (r.k === "mood") e.mood = (e.mood + 4) % 5; sfx.move(); },
      onRight: (r) => { if (r.k === "flow") e.flow = (e.flow + 1) % 5; if (r.k === "cramps") e.cramps = Math.min(10, e.cramps + 1); if (r.k === "mood") e.mood = (e.mood + 1) % 5; sfx.move(); },
      onPick: (r, m) => { if (r.k === "save") return true; m.onRight(r); },
      cancel: false
    });
    const t = C.truth, okFlow = [].concat(t.flow).includes(flows[e.flow]), okCramps = Math.abs(e.cramps - t.cramps) <= 2;
    const entry = { day: G.day, flow: flows[e.flow], cramps: e.cramps, mood: moods[e.mood], correct: okFlow && okCramps };
    G.log.push(entry);
    fact("vital");
    if (entry.correct) { G.literacy += 10; sfx.chime(); await say("narr", "Logged. That matches your day. **+10 Body Literacy**"); }
    else await say("narr", `Logged. Hmm, looking back, today was closer to **${[].concat(t.flow).join(" / ")}** flow with cramps around **${t.cramps}/10**. Close enough is fine. The point is noticing.`);
  }
  function planTime(t) { return t === null ? "Evening" : fmtTime(t); }
  async function showPlan(first) {
    if (!C.plan) return;
    await card({ icon: "book", title: first ? `Today's plan: ${C.sub || "Day " + G.day}` : "Today's plan", cls: "lesson", btn: first ? "Let's go" : "Close",
      body: `<table class="keys">${C.plan.map(([t, x]) => `<tr><td>${planTime(t)}</td><td>${x}</td></tr>`).join("")}</table>
        <p class="dim">Your phone (P) shows this plan any time. In free time, press <b>T</b> to skip ahead to the next thing on it.</p>` });
  }
  function nextPlan() {
    if (!C || !C.plan) return null;
    return C.plan.find(([t]) => t !== null && t > G.time) || null;
  }
  // T: skip free time until the next thing on today's plan.
  async function waitAhead() {
    const n = nextPlan();
    let until, what;
    if (n) { until = n[0]; what = n[1]; }
    else if (G.time < 1080) { until = 1080; what = "the evening"; }
    else return say("narr", "Nothing else is planned today. When you're ready, go to bed to log your day and sleep.");
    if (until - G.time < 5) return say("narr", `It's almost time: ${what}`);
    const f = flowNow();
    const warn = f !== "none" && (!G.worn || G.worn.left < (ITEMS[G.worn.id].cap * 0.4)) ? " Careful: your period product may not last that long." : "";
    const c = await ask("narr", `Skip ahead to ${fmtTime(until)}? Next: ${what}.${warn}`, ["Skip ahead", "Stay here"]);
    if (c !== 0) return;
    await skip(until - G.time, "LATER...", `Skipping to ${fmtTime(until)}`);
  }
  async function showHelp() {
    await card({ icon: "bag", title: "How to play", body: `<table class="keys">
      <tr><td>Arrows / WASD</td><td>Walk</td></tr><tr><td>Space / E</td><td>Talk, use, confirm</td></tr>
      <tr><td>Tap / click</td><td>Walk there, or talk to / use what you tapped</td></tr><tr><td>T</td><td>Skip ahead to the next thing on today's plan</td></tr><tr><td>I</td><td>Backpack (eat, take medicine)</td></tr><tr><td>P</td><td>Phone: cycle tracker, Fact Book</td></tr>
      <tr><td>B</td><td>Back / close (Esc works too)</td></tr><tr><td>M</td><td>Sound on/off (starts off)</td></tr></table>
      <p class="dim">Watch the drop meter at top-left when you're on your period. When it empties, you leak. Change in any bathroom.</p>` });
  }

  // ---------- day flow ----------
  async function startChapter(i) {
    G.ci = i; C = CHAPTERS[i];
    if (!RT.counted) { RT.counted = true; if (window.countEvent) countEvent("started playing"); }
    G.facts = G.facts || {}; G.quiz = G.quiz || { right: 0, total: 0 }; RT.facts = []; dismissFact();
    G.day = C.day; G.cycleStarted = i > 0 ? true : !!G.flags.started;
    G.time = C.startTime; G.d = {}; G.overflow = 0; G.objective = ""; G.target = null;
    G.painFrom = G.painUntil = G.heatUntil = G.painNext = 0;
    RT.events = (C.events || []).map((e) => ({ ...e, done: false }));
    (C.triggers || []).forEach((t) => (t.done = false));
    RT.queue = []; RT.held = [];
    const f0 = C.flow(G.time);
    G.worn = null;
    G.stained = false; G.d.hoodie = false;
    if (G.nightLeak && f0 !== "none") { G.stained = true; }
    else if (f0 !== "none") G.worn = { id: "pad", left: 0.6, since: G.time - 60 };
    if (C.morning) C.morning();
    teleport(C.start[0], C.start[1], C.start[2], C.start[3]);
    spawnNPCs();
    RT.mode = "play";
    $("hud").classList.remove("hidden");
    await UI.dayCard(C);
    if (G.nightLeak && f0 !== "none") { G.nightLeak = false; await say("you", "Ugh. I leaked overnight. Pajamas AND sheets.", "sad"); await say("narr", "It happens to almost everyone. Overnight pads or period underwear help. Change in the closet, and put on fresh protection in the bathroom."); fact("overnight"); }
    G.nightLeak = false;
    if (C.plan) await showPlan(true);
    if (C.onStart) await C.onStart();
  }
  async function endDay() {
    const f = flowNow();
    G.nightLeak = false;
    if (f !== "none" || (C.flowTonight && C.flowTonight !== "none")) {
      if (!G.worn) G.nightLeak = true;
      else if (G.worn.id === "tampon") { await say("narr", "Sleeping in a tampon means it stays in way past 8 hours. Overnight, a pad, a cup, or period underwear is the safer choice."); stat("health", -6); }
      else if (G.worn.id === "liner") G.nightLeak = true;
    }
    if (!G.d.leaked && (C.flowDay || f !== "none")) G.preparedDays++;
    if (G.trackerUnlocked) await trackerLog();
    if (C.recap) await card({ icon: "book", title: `Day ${G.day}: what you learned`, cls: "lesson", btn: "Good night",
      body: `<ul class="signs">${C.recap.map((x) => `<li>${x}</li>`).join("")}</ul>${C.think ? `<p><b>Think about it:</b> ${C.think}</p>` : ""}` });
    if (C.night) await C.night();
    await fade(true);
    if (C.dream) await dream(C.dream);
    const st = G.stats;
    st.energy = clamp(Math.max(st.energy, 40) + 45); st.cravings = clamp(st.cravings * 0.5); st.mood = clamp(st.mood + 12); st.health = clamp(st.health + 6);
    if (G.ci + 1 < CHAPTERS.length) { G.ci++; save(); await fade(false); await startChapter(G.ci); }
    else { clearSave(); await fade(false); await ending(); }
  }
  async function dream(lines) {
    UI.dream(true, [...new Set(lines.map((l) => l[0]))]);
    await fade(false);
    for (const [who, text] of lines) await say(who, text);
    await fade(true);
    UI.dream(false);
  }

  // ---------- save ----------
  const SAVE = "days28-school-save-v1";
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(G)); } catch (e) { /* private mode */ } }
  function loadSave() { try { const s = localStorage.getItem(SAVE); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) { /* ignore */ } }

  // ---------- rendering ----------
  function camera() {
    const m = RT.map;
    let px = G.x * T, py = G.y * T;
    if (RT.mv) { px = (RT.mv.fx + (RT.mv.tx - RT.mv.fx) * RT.mv.t) * T; py = (RT.mv.fy + (RT.mv.ty - RT.mv.fy) * RT.mv.t) * T; }
    let cx = px + 8 - VW / 2, cy = py + 8 - VH / 2;
    const mw = m.w * T, mh = m.h * T;
    cx = mw <= VW ? (mw - VW) / 2 : Math.max(0, Math.min(mw - VW, cx));
    cy = mh <= VH ? (mh - VH) / 2 : Math.max(0, Math.min(mh - VH, cy));
    if (RT.shake > 0) { cx += (Math.random() - 0.5) * 4; cy += (Math.random() - 0.5) * 4; }
    return { px, py, cx: Math.round(cx), cy: Math.round(cy) };
  }
  function drawMap(m, cx, cy) {
    const x0 = Math.max(0, Math.floor(cx / T)), y0 = Math.max(0, Math.floor(cy / T));
    const x1 = Math.min(m.w - 1, Math.floor((cx + VW) / T)), y1 = Math.min(m.h - 1, Math.floor((cy + VH) / T));
    const wf = Math.floor(RT.t * 2.5) % 3;
    const fk = { key: m.floor, v: 0 };
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = m.keys[y][x], sx = x * T - cx, sy = y * T - cy;
      if (k.over) ctx.drawImage(ART.tileCanvas(fk.key, (x + y) % ART.variants(fk.key)), sx, sy);
      ctx.drawImage(ART.tileCanvas(k.anim ? k.key + wf : k.key, k.v), sx, sy);
    }
  }
  function drawChar(look, x, y, dir, frame, stained) {
    ctx.fillStyle = "rgba(20,15,30,0.25)";
    ctx.fillRect(x + 4, y + 14, 8, 2); ctx.fillRect(x + 5, y + 13, 6, 1);
    ctx.drawImage(ART.sheet(look)[dir][frame], x, y);
    if (stained && dir !== "left" && dir !== "right") { ctx.fillStyle = "#7a2030"; ctx.fillRect(x + 7, y + 12, 2, 2); }
    else if (stained) { ctx.fillStyle = "#7a2030"; ctx.fillRect(x + (dir === "left" ? 8 : 6), y + 12, 2, 1); }
  }
  function render() {
    const m = RT.map;
    ctx.fillStyle = "#1d1828"; ctx.fillRect(0, 0, VW, VH);
    if (!m) return;
    const cam = RT.mode === "title" ? { cx: Math.round(RT.titleCam), cy: 0, px: 0, py: 0 } : camera();
    RT.cam = cam;
    drawMap(m, cam.cx, cam.cy);
    const ents = [];
    for (const n of RT.npcs) {
      if (n.map !== m.id) continue;
      let nx = n.x * T, ny = n.y * T, fr = 0;
      if (n.mv) { nx = (n.mv.fx + (n.mv.tx - n.mv.fx) * n.mv.t) * T; ny = (n.mv.fy + (n.mv.ty - n.mv.fy) * n.mv.t) * T; fr = n.mv.t < 0.5 ? ((n.stepN || 0) % 2 ? 1 : 2) : 0; }
      else if (Math.floor(RT.t * 1.4 + n.phase) % 3 === 0) fr = 3;
      ents.push({ y: ny, draw: () => drawChar(n.look, Math.round(nx - cam.cx), Math.round(ny - cam.cy) - 3, n.dir, fr) });
      if (G.target && G.target.npc === n.id) ents.push({ y: ny + 0.1, draw: () => marker(nx - cam.cx, ny - cam.cy - 3) });
    }
    if (RT.mode !== "title") {
      let fr = 0;
      if (RT.mv) fr = RT.mv.t < 0.55 ? (RT.stepN % 2 ? 1 : 2) : 0;
      else if (Math.floor(RT.t * 1.4) % 3 === 0) fr = 3;
      ents.push({ y: cam.py, draw: () => drawChar("ruby", Math.round(cam.px - cam.cx), Math.round(cam.py - cam.cy) - 3, G.dir, fr, G.stained) });
    }
    if (G.target && G.target.map === m.id && G.target.x !== undefined) ents.push({ y: G.target.y * T, draw: () => marker(G.target.x * T - cam.cx, G.target.y * T - cam.cy) });
    if (RT.tapMark && RT.t - RT.tapMark.t < 0.6 && RT.auto) {
      const k = RT.tapMark, a = 1 - (RT.t - k.t) / 0.6;
      ents.push({ y: k.y * T - 1, draw: () => { ctx.strokeStyle = `rgba(242,193,78,${a})`; ctx.lineWidth = 1; ctx.strokeRect(k.x * T - cam.cx + 2.5, k.y * T - cam.cy + 2.5, 11, 11); } });
    }
    const door = targetDoor();
    if (door) ents.push({ y: door.y * T, draw: () => marker(door.x * T - cam.cx, door.y * T - cam.cy) });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
    for (const p of RT.parts) {
      ctx.fillStyle = `rgba(230,220,200,${p.life * 1.6})`;
      const r = (0.35 - p.life) * 8;
      ctx.fillRect(Math.round(p.x - cam.cx - r), Math.round(p.y - cam.cy), 1, 1); ctx.fillRect(Math.round(p.x - cam.cx + r), Math.round(p.y - cam.cy), 1, 1);
    }
    lighting(m, cam);
    positionLabels(cam);
  }
  // When today's goal is somewhere else, point at the door that leads toward it.
  function targetDoor() {
    const t = G.target; if (!t || !RT.map) return null;
    let dest = null;
    if (t.npc) { const n = RT.npcs.find((n) => n.id === t.npc); if (!n || !n.map || n.map === G.mapId) return null; dest = n.map; }
    else if (t.map && t.map !== G.mapId) dest = t.map;
    if (!dest) return null;
    const ws = RT.map.warps || [];
    const w = G.mapId === "town" ? ws.find((w) => w.to === dest) : ws.find((w) => w.to === "town");
    return w ? { x: w.x, y: w.y } : null;
  }
  function marker(x, y) {
    const b = Math.round(Math.sin(RT.t * 6) * 1.5);
    const X = Math.round(x) + 5, Y = Math.round(y) - 8 + b;
    ctx.fillStyle = PAL.ink; ctx.fillRect(X - 1, Y - 1, 8, 5); ctx.fillRect(X + 1, Y + 4, 4, 2); ctx.fillRect(X + 2, Y + 6, 2, 1);
    ctx.fillStyle = PAL.yellow; ctx.fillRect(X, Y, 6, 3); ctx.fillRect(X + 2, Y + 3, 2, 2);
  }
  function lighting(m, cam) {
    const t = G.time;
    let col = null, a = 0;
    if (t < 480) { col = "255,170,110"; a = 0.12; }
    else if (t >= 990 && t < 1110) { col = "255,140,60"; a = 0.1 + ((t - 990) / 120) * 0.08; }
    else if (t >= 1110 && t < 1200) { col = "50,40,110"; a = 0.22 + ((t - 1110) / 90) * 0.15; }
    else if (t >= 1200) { col = "20,20,70"; a = 0.42; }
    if (!col || RT.mode === "title") return;
    if (!m.outdoor) a *= 0.45;
    ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(0, 0, VW, VH);
    if (m.outdoor && t >= 1110) {
      ctx.globalCompositeOperation = "lighter";
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const ch = m.t[y][x];
        if (ch !== "l" && ch !== "v") continue;
        const gx = x * T + 8 - cam.cx, gy = y * T + (ch === "l" ? 3 : 8) - cam.cy;
        if (gx < -40 || gx > VW + 40) continue;
        const g = ctx.createRadialGradient(gx, gy, 1, gx, gy, ch === "l" ? 26 : 12);
        g.addColorStop(0, "rgba(255,200,110,0.35)"); g.addColorStop(1, "rgba(255,200,110,0)");
        ctx.fillStyle = g; ctx.fillRect(gx - 30, gy - 30, 60, 60);
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }

  // ---------- floating labels over buildings ----------
  function buildLabels() {
    const box = $("labels"); box.innerHTML = "";
    const L = RT.map.labels || {};
    for (const k in L) { const [x, y] = k.split(",").map(Number); const el = document.createElement("div"); el.className = "label"; el.textContent = L[k]; el.dataset.x = x; el.dataset.y = y; box.appendChild(el); }
  }
  function positionLabels(cam) {
    for (const el of $("labels").children) {
      const x = (+el.dataset.x * T + 8 - cam.cx) * S, y = (+el.dataset.y * T - 30 - cam.cy) * S;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
      el.style.display = x < -60 || x > VW * S + 60 ? "none" : "";
    }
  }
  function floatText(text, kind) {
    const el = document.createElement("div");
    el.className = "float " + kind; el.textContent = text;
    el.style.top = $("floats").children.length * 1.25 + "em";   // stack so two at once don't overlap
    $("floats").appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  // ---------- HUD ----------
  function wheelSVG(big) {
    const n = 28, R1 = 18, R0 = 11, cx = 20, cy = 20;
    let s = "";
    for (let d = 1; d <= n; d++) {
      const a0 = ((d - 1) / n) * Math.PI * 2 - Math.PI / 2, a1 = (d / n) * Math.PI * 2 - Math.PI / 2;
      const cur = G.cycleStarted && d === G.day, past = G.cycleStarted && d < G.day;
      const ro = cur ? R1 + 1.5 : R1;
      const pt = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
      const col = G.cycleStarted ? PHASE[phaseOf(d)].color : "#5c596b";
      s += `<path d="M${pt(R0, a0)} L${pt(ro, a0)} A${ro},${ro} 0 0 1 ${pt(ro, a1)} L${pt(R0, a1)} A${R0},${R0} 0 0 0 ${pt(R0, a0)}Z" fill="${col}" opacity="${cur ? 1 : past ? 0.75 : 0.35}" stroke="${cur ? "#f3e9d2" : "#1d1828"}" stroke-width="${cur ? 1 : 0.5}"/>`;
    }
    if (G.cycleStarted) {
      const a = ((G.day - 0.5) / n) * Math.PI * 2 - Math.PI / 2;
      s += `<line x1="${cx}" y1="${cy}" x2="${(cx + 9 * Math.cos(a)).toFixed(2)}" y2="${(cy + 9 * Math.sin(a)).toFixed(2)}" stroke="#f3e9d2" stroke-width="1.2" stroke-linecap="round"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="2" fill="#f3e9d2"/>`;
    return `<svg viewBox="0 0 40 40" class="${big ? "big" : ""}">${s}</svg>`;
  }
  let hudSig = "";
  function hudUpdate() {
    if (RT.mode !== "play") return;
    const st = G.stats, f = flowNow(), ce = crampsEff();
    const sig = [Math.round(st.health), Math.round(st.energy), Math.round(st.mood), Math.round(st.cravings), G.money, f, G.worn && G.worn.id, G.worn && Math.round(G.worn.left * 20), G.stained, Math.round(ce), G.day, G.cycleStarted, Math.floor(G.time / 5), G.objective, G.overflow > 0].join("|");
    if (sig === hudSig) return;
    hudSig = sig;
    const LBL = { health: "Health", energy: "Energy", mood: "Mood", cravings: "Cravings" };
    const bar = (k, icon, col) => `<div class="srow"><img class="ic" src="${ART.icon(icon)}"><span class="slbl">${LBL[k]}</span><div class="bar"><span style="width:${st[k]}%;background:${col}"></span></div><span class="sval">${Math.round(st[k])}</span></div>`;
    let prot = "";
    if (f !== "none" || G.worn) {
      if (G.worn) {
        const it = ITEMS[G.worn.id], pct = Math.round((G.worn.left / it.cap) * 100);
        prot = `<div class="srow prot ${pct < 20 ? "warn" : ""}"><img class="ic" src="${ART.icon(it.icon)}"><div class="bar"><span style="width:${pct}%;background:${pct < 20 ? "#d24a3f" : "#e8e1f0"}"></span></div></div>`;
      } else prot = `<div class="srow prot warn"><img class="ic" src="${ART.icon("drop")}"><span class="tag">NO PROTECTION</span></div>`;
    }
    const cr = ce >= 1 ? `<div class="srow"><img class="ic" src="${ART.icon("cramp")}"><span class="tag ${ce >= 5 ? "bad" : ""}">${crampWord(ce)} cramps</span></div>` : "";
    const stn = G.stained ? `<div class="srow"><span class="tag bad">stained pants</span></div>` : "";
    $("stats").innerHTML = bar("health", "heart", "#d24a3f") + bar("energy", "bolt", "#f2c14e") + bar("mood", "mood", "#58a65c") + bar("cravings", "crave", "#b07a4a") +
      `<div class="srow money"><img class="ic" src="${ART.icon("coin")}">$${G.money.toFixed(2)}</div>` + prot + cr + stn;
    const ph = G.cycleStarted ? PHASE[phaseOf(G.day)] : null;
    $("clock").innerHTML = wheelSVG() + `<div class="ctext"><b>${G.cycleStarted ? "DAY " + G.day : "DAY ?"}</b><span style="color:${ph ? ph.color : "#9a97a6"}">${ph ? ph.label : "no period yet"}</span><span>${fmtTime(G.time)}</span></div>`;
    const np = nextPlan();
    $("objective").innerHTML = (G.objective ? `<span class="arrow">▸</span>${G.objective}` : "") +
      (np ? `<div class="next">Next: <b>${fmtTime(np[0])}</b> ${np[1]} <span class="tkey">T skip</span></div>` : "");
    $("objective").style.display = G.objective || np ? "" : "none";
  }

  // ---------- UI: dialogue, menus, cards ----------
  const SPEAK = {
    you: { name: "Ruby", look: "ruby" }, mom: { name: "Mom", look: "mom" }, riyansh: { name: "Riyansh", look: "riyansh" },
    keshav: { name: "Keshav", look: "keshav" }, zach: { name: "Zach", look: "zach" }, nurse: { name: "Dr. Flo", look: "nurse" },
    patel: { name: "Mr. Patel", look: "patel" }, dee: { name: "Dee", look: "dee" }, lin: { name: "Pharmacist Lin", look: "lin" },
    coach: { name: "Coach Reed", look: "coach" }, estrogen: { name: "Estrogen", look: "estrogen" }, progesterone: { name: "Progesterone", look: "progesterone" },
    lh: { name: "LH", look: "lh" }, fsh: { name: "FSH", look: "fsh" }, narr: { name: "", look: null }, phone: { name: "Phone", icon: "phone" },
    t1: { name: "Neighbor", look: "t1" }, t2: { name: "Neighbor", look: "t2" }, t3: { name: "Grandma Okafor", look: "t3" }, t4: { name: "Jogger", look: "t4" }
  };
  const PITCH = { you: 560, mom: 470, riyansh: 400, keshav: 430, zach: 380, nurse: 500, patel: 340, dee: 450, lin: 480, coach: 360, estrogen: 820, progesterone: 620, lh: 900, fsh: 700, narr: 300 };
  function markup(t) {
    const out = []; let hl = false;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === "*" && t[i + 1] === "*") { hl = !hl; i++; continue; }
      out.push({ c: t[i], hl });
    }
    return out;
  }
  function renderMarkup(seg, n) {
    let h = "", open = false;
    for (let i = 0; i < n; i++) {
      const s = seg[i];
      if (s.hl && !open) { h += "<b>"; open = true; } if (!s.hl && open) { h += "</b>"; open = false; }
      h += s.c === "<" ? "&lt;" : s.c === "&" ? "&amp;" : s.c;
    }
    return h + (open ? "</b>" : "");
  }

  // Hover only picks a row when the mouse actually moves. Redrawing a menu after an arrow key
  // otherwise fires mouseenter on whatever row sits under a resting cursor, undoing the key press.
  const mouse = { x: -1, y: -1 };
  function mouseMoved(e) {
    if (e.clientX === mouse.x && e.clientY === mouse.y) return false;
    mouse.x = e.clientX; mouse.y = e.clientY; return true;
  }
  const UI = {
    dlg: null, menuState: null, cardState: null,
    active() { return !!(this.dlg || this.menuState || this.cardState || this.dayCardState); },
    key(k) {
      if (this.dayCardState) { if (k === "ok") this.dayCardState(); return; }
      if (this.cardState) {
        if (k === "up" || k === "down") { const c = document.querySelector("#modal .card, #screen .endp"); if (c) c.scrollBy({ top: (k === "down" ? 1 : -1) * c.clientHeight * 0.4, behavior: "smooth" }); return; }
        if (k === "phone" && this.printHook) { this.printHook(); return; }
        if (k === "ok" || k === "back") this.cardState(); return;
      }
      if (this.menuState) return this.menuKey(k);
      if (this.dlg) return this.dlgKey(k);
    },
    say(who, text, expr) {
      return new Promise((res) => {
        this.dlg = { who, seg: markup(text), i: 0, res, choices: null, sel: 0, expr };
        this.showDlg();
      });
    },
    ask(who, text, choices, expr) {
      return new Promise((res) => {
        this.dlg = { who, seg: markup(text), i: 0, res, choices, sel: 0, expr };
        this.showDlg();
      });
    },
    showDlg() {
      const d = this.dlg, sp = SPEAK[d.who] || { name: d.who };
      const el = $("dialog");
      el.classList.remove("hidden");
      el.classList.toggle("narr", !sp.look && !sp.icon);
      $("dlg-name").textContent = sp.name || "";
      $("dlg-name").style.display = sp.name ? "" : "none";
      const img = $("dlg-portrait");
      if (sp.look) { img.src = ART.portrait(sp.look, d.expr || "neutral"); img.parentNode.style.display = ""; }
      else if (sp.icon) { img.src = ART.icon(sp.icon); img.parentNode.style.display = ""; }
      else img.parentNode.style.display = "none";
      $("choices").classList.add("hidden");
      $("dlg-next").style.visibility = "hidden";
      this.drawDlg();
    },
    drawDlg() {
      const d = this.dlg;
      $("dlg-text").innerHTML = renderMarkup(d.seg, Math.floor(d.i));
      const done = d.i >= d.seg.length;
      $("dlg-next").style.visibility = done && !d.choices ? "visible" : "hidden";
      if (done && d.choices) {
        const c = $("choices");
        c.classList.remove("hidden");
        c.innerHTML = d.choices.map((t, i) => `<div class="opt ${i === d.sel ? "sel" : ""}" data-i="${i}"><span class="cur">▸</span>${t}</div>`).join("");
        c.querySelectorAll(".opt").forEach((o) => { o.onclick = () => { d.sel = +o.dataset.i; this.dlgKey("ok"); }; o.onmousemove = (e) => { if (!mouseMoved(e)) return; if (d.sel !== +o.dataset.i) { d.sel = +o.dataset.i; this.drawDlg(); } }; });
      }
    },
    tickDlg(dt) {
      const d = this.dlg; if (!d || d.i >= d.seg.length) return;
      const before = Math.floor(d.i);
      d.i = Math.min(d.seg.length, d.i + dt * 60);
      if (Math.floor(d.i) !== before) {
        if (before % 3 === 0 && d.seg[before] && d.seg[before].c !== " ") blip(PITCH[d.who] || 500, 0.025, 0.012);
        this.drawDlg();
      }
    },
    dlgKey(k) {
      const d = this.dlg;
      if (d.i < d.seg.length) { if (k === "ok" || k === "back") { d.i = d.seg.length; this.drawDlg(); } return; }
      if (d.choices) {
        if (k === "up") { d.sel = (d.sel + d.choices.length - 1) % d.choices.length; sfx.move(); this.drawDlg(); return; }
        if (k === "down") { d.sel = (d.sel + 1) % d.choices.length; sfx.move(); this.drawDlg(); return; }
        if (k.startsWith("n")) { const i = +k.slice(1) - 1; if (i < d.choices.length) { d.sel = i; k = "ok"; } }
        if (k !== "ok") return;
      } else if (k !== "ok" && k !== "back") return;
      sfx.move();
      this.dlg = null;
      $("dialog").classList.add("hidden"); $("choices").classList.add("hidden");
      d.res(d.choices ? d.sel : undefined);
    },
    menu(opts) {
      return new Promise((res) => {
        const m = { ...opts, sel: 0, res };
        this.menuState = m;
        this.drawMenu();
      });
    },
    closeMenu(val = null) {
      const m = this.menuState; if (!m) return;
      this.menuState = null;
      $("modal").classList.add("hidden");
      m.res(val);
    },
    drawMenu() {
      const m = this.menuState; if (!m) return;
      const rows = m.rows();
      m.sel = Math.min(m.sel, rows.length - 1);
      const r = rows[m.sel];
      $("modal").classList.remove("hidden");
      $("modal").innerHTML = `<div class="panel menu ${m.cls || ""}">
        ${m.cancel === false ? "" : `<div class="mback" id="mback"><kbd>B</kbd>Back</div>`}
        <div class="mtitle">${m.title}</div>${m.sub ? `<div class="msub">${m.sub()}</div>` : ""}
        <div class="mbody"><div class="mlist">${rows.map((x, i) => `<div class="row ${i === m.sel ? "sel" : ""} ${x.disabled ? "dis" : ""}" data-i="${i}">
          <span class="cur">▸</span>${x.icon ? `<img class="ic" src="${ART.icon(x.icon)}">` : `<span class="icgap"></span>`}<span class="lbl">${x.label}</span>${x.right ? (m.onLeft && !x.done && !x.disabled ? `<span class="rt"><span class="arr" data-a="left">◂</span>${String(x.right).replace(/^◂ | ▸$/g, "")}<span class="arr" data-a="right">▸</span></span>` : `<span class="rt">${x.right}</span>`) : ""}</div>`).join("")}</div>
        ${m.detail ? `<div class="mdetail">${m.detail(r) || ""}</div>` : ""}</div>
        ${m.footer ? `<div class="mfoot">${m.footer()}</div>` : ""}
        <div class="mhint"><kbd>↑</kbd><kbd>↓</kbd>choose <kbd>Space</kbd>select${m.onLeft ? " <kbd>←</kbd><kbd>→</kbd>change" : ""}${m.cancel === false ? "" : " <kbd>B</kbd>back"}</div></div>`;
      const backEl = $("mback"); if (backEl) backEl.onclick = () => this.menuKey("back");
      const selEl = $("modal").querySelector(".row.sel");
      if (selEl) selEl.scrollIntoView({ block: "nearest" });
      $("modal").querySelectorAll(".row").forEach((el) => {
        el.onclick = (e) => { m.sel = +el.dataset.i; const a = e.target.closest(".arr"); this.menuKey(a ? a.dataset.a : "ok"); };
        el.onmousemove = (e) => { if (!mouseMoved(e)) return; if (m.sel !== +el.dataset.i) { m.sel = +el.dataset.i; this.drawMenu(); } };
      });
    },
    async menuKey(k) {
      const m = this.menuState, rows = m.rows(), r = rows[m.sel];
      if (k === "up") { m.sel = (m.sel + rows.length - 1) % rows.length; sfx.move(); }
      else if (k === "down") { m.sel = (m.sel + 1) % rows.length; sfx.move(); }
      else if (k === "left" && m.onLeft) m.onLeft(r);
      else if (k === "right" && m.onRight) m.onRight(r);
      else if (k === "back") { if (m.cancel === false) return; return this.closeMenu(null); }
      else if (k === "ok") {
        if (r.disabled) { sfx.bad(); return; }
        if (m.busy) return;
        m.busy = true;
        const v = m.onPick ? await m.onPick(r, m) : true;
        m.busy = false;
        if (this.menuState !== m) return;
        if (v !== undefined && v !== false) return this.closeMenu(v);
      }
      this.drawMenu();
    },
    card({ icon, title, body, cls, btn }) {
      return new Promise((res) => {
        $("modal").classList.remove("hidden");
        $("modal").innerHTML = `<div class="panel card ${cls || ""}">${icon ? `<img class="bigic" src="${ART.icon(icon)}">` : ""}<div class="mtitle">${title}</div><div class="cbody">${body}</div><div class="cbtn">▸ ${btn || "Got it"}</div><div class="mhint"><kbd>Space</kbd>or <kbd>B</kbd>to close</div></div>`;
        const done = () => { this.cardState = null; $("modal").classList.add("hidden"); sfx.move(); res(); };
        $("modal").querySelector(".cbtn").onclick = done;
        this.cardState = done;
      });
    },
    dayCard(ch) {
      return new Promise((res) => {
        const el = $("screen");
        const ph = G.cycleStarted ? PHASE[phaseOf(ch.day)] : null;
        el.className = "daycard";
        el.innerHTML = `<div class="dc-day">${G.cycleStarted ? "DAY " + ch.day : ch.kicker || "DAY ?"}</div>
          <div class="dc-title">${ch.title}</div>
          <div class="dc-sub" style="color:${ph ? ph.color : "#c9c2d6"}">${ph ? ph.label + " phase" : ""}${ch.sub ? (ph ? " · " : "") + ch.sub : ""}</div>
          <div class="dc-hint">press Space</div>`;
        const done = () => { if (this.dayCardState !== done) return; this.dayCardState = null; el.className = "hidden"; res(); };
        this.dayCardState = done;
        el.onclick = done;
        setTimeout(done, 4200);
      });
    },
    classCard(label, line) {
      const el = $("screen");
      if (!label) { el.className = "hidden"; return; }
      el.className = "classcard";
      el.innerHTML = `<div class="dc-title">${label}</div><div class="dc-line">${line}</div><div class="dc-clock" id="cc-clock"></div>`;
    },
    dream(on, who) {
      const el = $("screen");
      if (!on) { el.className = "hidden"; return; }
      el.className = "dream";
      el.innerHTML = `<div class="stars"></div>${who.filter((w) => ART.ICONS && SPEAK[w] && ["estrogen", "progesterone", "lh", "fsh"].includes(w)).map((w, i) => `<img class="blob b${i}" src="${ART.portrait(w)}">`).join("")}<div class="dream-title">Meanwhile, inside your body...</div>`;
    },
    hud: hudUpdate
  };

  // ---------- "Did you know?" facts: pop up once each, then live in the phone's Fact Book ----------
  function fact(id) {
    if (!window.FACTS || !FACTS[id]) return;
    G.facts = G.facts || {};
    if (G.facts[id]) return;
    G.facts[id] = true; G.literacy += 1; RT.facts.push(id);
  }
  function dismissFact() { RT.factCur = null; $("fact").classList.add("hidden"); }
  // A fact shows as a full-screen card as soon as nothing else is happening. Space or B closes it.
  function factTick() {
    if (RT.mode !== "play" || RT.factCur) return;
    if (!RT.facts.length || UI.active() || RT.busy > 0 || RT.mv || RT.queue.length) return;
    const id = RT.facts.shift(), F = FACTS[id];
    RT.factCur = id;
    blip(700, 0.06, 0.02, "triangle"); setTimeout(() => blip(1050, 0.1, 0.02, "triangle"), 80);
    run(async () => {
      await card({ icon: "bulb", title: "DID YOU KNOW?", cls: "factcard", btn: "Got it",
        body: `<p class="facttext">${F.x}</p>${F.s ? `<span class="src">Source: ${F.s}</span>` : ""}<p class="dim">Saved in the Fact Book on your phone.</p>` });
      RT.factCur = null;
    });
  }
  const factCount = () => [Object.keys(G.facts || {}).length, Object.keys(window.FACTS || {}).length];

  function toast(text, icon, warn) {
    const el = document.createElement("div");
    el.className = "toast" + (warn ? " warn" : "");
    el.innerHTML = (icon ? `<img class="ic" src="${ART.icon(icon)}">` : "") + text;
    $("toasts").appendChild(el);
    while ($("toasts").children.length > 3) $("toasts").firstChild.remove();
    setTimeout(() => el.classList.add("out"), 3200);
    setTimeout(() => el.remove(), 3700);
  }
  let bannerT = null;
  function banner(text) {
    const el = $("banner");
    el.textContent = text; el.classList.add("show");
    clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove("show"), 1600);
  }
  function fade(on) { $("fade").classList.toggle("on", on); return wait(260); }
  const say = (w, t, e) => UI.say(w, t, e);
  const ask = (w, t, c, e) => UI.ask(w, t, c, e);
  const menu = (o) => UI.menu(o);
  const card = (o) => UI.card(o);

  // ---------- ending ----------
  // A clean, printable report card for students to hand in. Nothing is sent anywhere.
  function printReport() {
    const st = G.stats, acc = G.log.filter((l) => l.correct).length, q = G.quiz || { right: 0, total: 0 };
    const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    let el = document.getElementById("printcard");
    if (!el) { el = document.createElement("div"); el.id = "printcard"; document.body.appendChild(el); }
    el.innerHTML = `<h1>28 Days: Report Card</h1>
      <p class="pc-sub">Classroom Edition · learn28days.org · printed ${date}</p>
      <div class="pc-name"><span>Name: ______________________________</span><span>Class: ________________</span></div>
      <table>
        <tr><th>Health class quiz answers</th><td>${q.right} / ${q.total} correct</td></tr>
        <tr><th>Unit test</th><td>${G.finalGrade || "not taken"}</td></tr>
        <tr><th>Accurate tracker logs</th><td>${acc} / ${G.log.length}</td></tr>
        <tr><th>Facts discovered</th><td>${factCount()[0]} / ${factCount()[1]}</td></tr>
        <tr><th>Body Literacy score</th><td>${G.literacy}</td></tr>
        <tr><th>Leaks</th><td>${G.leaks}</td></tr>
        <tr><th>Ruby's health / energy / mood at the end</th><td>${Math.round(st.health)} / ${Math.round(st.energy)} / ${Math.round(st.mood)}</td></tr>
      </table>
      ${G.log.length ? `<h2>Cycle tracker log</h2><table class="pc-log"><tr><th>Day</th><th>Flow</th><th>Cramps</th><th>Mood</th><th>Matched the day?</th></tr>${G.log.map((l) => `<tr><td>${l.day}</td><td>${l.flow}</td><td>${l.cramps}/10</td><td>${l.mood}</td><td>${l.correct ? "yes" : "no"}</td></tr>`).join("")}</table>` : ""}
      <h2>One thing I learned</h2><div class="pc-line"></div><div class="pc-line"></div>
      <p class="pc-foot">28 Days is not medical advice. Questions about your own body? Talk to a parent or guardian, the school nurse, or a doctor.</p>`;
    document.body.classList.add("printing");
    const done = () => { document.body.classList.remove("printing"); removeEventListener("afterprint", done); };
    addEventListener("afterprint", done);
    setTimeout(() => window.print(), 50);
  }
  async function ending() {
    RT.mode = "end";
    if (window.countEvent) countEvent("finished the game");
    $("hud").classList.add("hidden");
    const st = G.stats, avg = (st.health + st.energy + st.mood + (100 - st.cravings)) / 4;
    const acc = G.log.filter((l) => l.correct).length;
    const score = avg * 0.5 + Math.min(100, G.literacy) * 0.3 + Math.max(0, 20 - G.leaks * 5);
    const stars = score >= 72 ? 3 : score >= 52 ? 2 : 1;
    const el = $("screen");
    el.className = "endscreen";
    const page1 = `<div class="panel endp">
      <div class="mtitle">One cycle down</div>
      <div class="stars">${"<span class='on'>★</span>".repeat(stars)}${"<span>★</span>".repeat(3 - stars)}</div>
      <p>You made it through your first full cycle: four phases, one surprise, and a lot of learning.</p>
      <table class="log">
        <tr><td>Accurate tracker logs</td><td><b>${acc} / ${G.log.length}</b></td></tr>
        <tr><td>Health class answers</td><td><b>${(G.quiz || {}).right || 0} / ${(G.quiz || {}).total || 0}</b>${G.finalGrade ? " · unit test: <b>" + G.finalGrade + "</b>" : ""}</td></tr>
        <tr><td>Facts discovered</td><td><b>${factCount()[0]} / ${factCount()[1]}</b></td></tr>
        <tr><td>Body Literacy</td><td><b>${G.literacy}</b></td></tr>
        <tr><td>Leaks</td><td><b>${G.leaks}</b> ${G.leaks === 0 ? "(wow)" : "(totally normal while learning)"}</td></tr>
        <tr><td>Money left</td><td><b>$${G.money.toFixed(2)}</b></td></tr>
        <tr><td>Health / Energy / Mood</td><td><b>${Math.round(st.health)} / ${Math.round(st.energy)} / ${Math.round(st.mood)}</b></td></tr>
      </table>
      <div class="endbtns"><button class="printbtn" id="end-print"><b>P</b> Print my report card</button></div>
      <div class="cbtn" id="end-next">▸ What you learned</div></div>`;
    el.innerHTML = page1;
    UI.printHook = printReport;
    $("end-print").onclick = printReport;
    await new Promise((r) => { const go = () => { UI.cardState = null; UI.printHook = null; r(); }; $("end-next").onclick = go; UI.cardState = go; });
    sfx.move();
    el.innerHTML = `<div class="panel endp learn">
      <div class="mtitle">What you learned</div>
      <table class="log"><tr><th></th><th>Product</th><th>Hours*</th><th>Swim</th></tr>
      ${["pad", "liner", "tampon", "cup", "underwear"].map((id) => `<tr><td><img class="ic" src="${ART.icon(ITEMS[id].icon)}"></td><td>${ITEMS[id].name}</td><td>~${ITEMS[id].cap}${ITEMS[id].maxH ? " (max " + ITEMS[id].maxH + ")" : ""}</td><td>${ITEMS[id].swim ? "yes" : "no"}</td></tr>`).join("")}
      </table><p class="dim">*on a medium day. Heavy days fill things faster.</p>
      <div class="mtitle small">Talk to a doctor if...</div>
      <ul class="signs">${WARNING_SIGNS.map((s) => `<li>${s}</li>`).join("")}</ul>
      <p class="dim">${TEEN_NOTE}</p>
      <div class="cbtn" id="end-again">▸ Back to title</div></div>`;
    await new Promise((r) => { const go = () => { UI.cardState = null; r(); }; $("end-again").onclick = go; UI.cardState = go; });
    location.reload();
  }

  // ---------- title ----------
  // A fresh game set up so any day can be played by itself in one class period.
  function prepForDay(i) {
    G = newGame();
    if (i > 0) {
      G.flags.started = true; G.cycleStarted = true; G.trackerUnlocked = true; G.money = 15;
      Object.assign(G.stash, { pad: 6, liner: 6, tampon: 4, pain: 4, heat: 2, underwear: 1, bar: 2, choc: 1, water: 1, pants: 1, swim: 1 });
    }
    G.ci = i;
  }
  function titleScreen() {
    RT.mode = "title";
    RT.map = MAPS.town; prepMap(RT.map); buildLabels();
    C = { npcs: [], flow: () => "none" };
    G.time = 600; spawnNPCs();
    const saved = loadSave();
    const el = $("screen");
    el.className = "title";
    const opts = [];
    if (saved) opts.push(["cont", `Continue (Day ${CHAPTERS[saved.ci] ? CHAPTERS[saved.ci].day : "?"})`]);
    opts.push(["new", "Start the story"], ["days", "Choose a day"], ["guide", "Teacher guide"]);
    let sel = 0;
    const draw = () => {
      el.innerHTML = `<div class="logo"><span>28</span> DAYS</div>
        <div class="tag">a month in your body <span class="edition">Classroom Edition</span></div>
        <div class="tmenu">${opts.map((o, i) => `<div class="opt ${i === sel ? "sel" : ""}" data-i="${i}"><span class="cur">▸</span>${o[1]}</div>`).join("")}</div>
        <div class="tfoot">Arrows/WASD or tap to move · Space talk · B back · T skip · I bag · P phone · H help · M sound<br><span class="dim">A health class game about the menstrual cycle. Not medical advice: talk to a trusted adult, school nurse or doctor about your own body.</span></div>`;
      el.querySelectorAll(".opt").forEach((o) => (o.onclick = () => { sel = +o.dataset.i; choose(); }));
    };
    const keys = (k) => {
      if (k === "up") { sel = (sel + opts.length - 1) % opts.length; sfx.move(); draw(); }
      if (k === "down") { sel = (sel + 1) % opts.length; sfx.move(); draw(); }
      if (k === "ok") choose();
    };
    const start = (i, fromSave) => {
      UI.titleKey = null; sfx.ok(); el.className = "hidden";
      if (fromSave) G = saved; else { clearSave(); prepForDay(i); }
      startChapter(G.ci);
    };
    const choose = async () => {
      const what = opts[sel][0];
      if (what === "cont") return start(saved.ci, true);
      if (what === "new") return start(0);
      if (what === "guide") { window.open("../teacher-guide.html", "_blank"); return; }
      UI.titleKey = null;
      const pick = await menu({
        title: "Choose a day", sub: () => "Start on any day. Each one has its own health lesson.",
        rows: () => [...CHAPTERS.map((c, i) => ({ i, label: `Day ${c.day}${i === CHAPTERS.length - 1 ? " again" : ""}: ${c.title}`, right: c.health ? "class" : "no school" })), { label: "Back", done: true }],
        detail: (r) => r.i === undefined ? "" : `<b>${CHAPTERS[r.i].health ? CHAPTERS[r.i].health.title : "No health class today"}</b><br>` + (CHAPTERS[r.i].recap || []).map((x) => "• " + x).join("<br>"),
        onPick: (r) => (r.done ? -1 : r.i)
      });
      if (pick === null || pick === -1) { setTimeout(() => { UI.titleKey = keys; }, 80); return; }
      start(pick);
    };
    UI.titleKey = keys;
    draw();
  }
  addEventListener("keydown", (e) => { if (RT.mode === "title" && UI.titleKey) { const k = keyName(e); if (k) UI.titleKey(k); } });

  // ---------- main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    RT.t += dt;
    if (RT.shake > 0) RT.shake -= dt;
    RT.parts.forEach((p) => (p.life -= dt)); RT.parts = RT.parts.filter((p) => p.life > 0);
    if (RT.mode === "title") { RT.titleCam = (Math.sin(RT.t * 0.08) * 0.5 + 0.5) * (MAPS.town.w * T - VW); updateNPCMoves(dt); }
    if (RT.mode === "play") {
      updatePlayer(dt);
      updateNPCMoves(dt);
      if (!RT.busy && !UI.active() && !RT.mv && RT.queue.length) run(RT.queue.shift());
      if (!RT.busy && !UI.active()) {
        RT.acc += dt * (C.timeRate || 1);
        while (RT.acc >= 1) { RT.acc -= 1; tick(); }
      }
      hudUpdate();
    }
    factTick(dt);
    UI.tickDlg(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ---------- exports for story.js ----------
  Object.assign(window, {
    say, ask, card, menu, toast, banner, fade, wait, give, stat, have, bagCount, stashCount, bagTake, sfx, skip, teleport,
    fmtTime, queue, UI_closeMenu: () => UI.closeMenu(),
    getG: () => G,
    objective: (t, target) => {
      G.objective = t || ""; G.target = target || null;
      const el = $("objective"); el.classList.remove("flash"); void el.offsetWidth; if (t) { el.classList.add("flash"); blip(990, 0.06, 0.02, "triangle"); }
    },
    itemCard: (id) => card({ icon: ITEMS[id].icon, title: ITEMS[id].name, body: `<p>${ITEMS[id].desc}</p>${ITEMS[id].how ? `<p class="dim">${ITEMS[id].how}</p>` : ""}` }),
    startCycle: () => { G.cycleStarted = true; G.day = 1; hudSig = ""; },
    npcById: (id) => RT.npcs.find((n) => n.id === id),
    moveNPC: (id, map, x, y, dir) => { const n = RT.npcs.find((n) => n.id === id); if (n) { n.map = map; n.x = n.hx = x; n.y = n.hy = y; n.dir = dir || n.dir; n.mv = null; } },
    flowNow, crampsRaw, crampWord, phaseOf, fact, phaseDiagram
  });
  // debugging handle (used for testing; harmless in play)
  window.__dbg = { RT, chapter: () => C, startChapter, endDay, tick, useObject, setG: (g) => (G = g), quiz, trackerLog, dream, ending, updateNPCs };

  // ---------- mouse and touch ----------
  // Tap or click the world to walk there (or to talk to / use what you tapped).
  // On touch screens, a d-pad and buttons appear; every screen gets clickable Bag / Phone / Skip / Help buttons.
  const TOUCH = /[?&]touch\b/.test(location.search) || (matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0);
  function sendKey(key, down) { window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key })); }
  function setupPointer() {
    $("ui").addEventListener("click", (e) => {
      if (e.target.closest("#dialog, #choices, #modal, #screen, #touch, #actbar, #labels a")) return;
      tapAt(e.clientX, e.clientY);
    });
    $("dialog").addEventListener("click", (e) => { if (!e.target.closest(".opt") && UI.dlg && (!UI.dlg.choices || UI.dlg.i < UI.dlg.seg.length)) UI.key("ok"); });
    const bar = document.createElement("div"); bar.id = "actbar";
    bar.innerHTML = [["i", "Bag"], ["p", "Phone"], ["t", "Skip"], ["h", "Help"]].map(([k, l]) => `<button data-k="${k}"><b>${k.toUpperCase()}</b>${l}</button>`).join("");
    $("hud").appendChild(bar);
    bar.querySelectorAll("button").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); sendKey(b.dataset.k, true); sendKey(b.dataset.k, false); }));
    if (!TOUCH) return;
    document.body.classList.add("touch");
    const t = document.createElement("div"); t.id = "touch";
    t.innerHTML = `<div class="dpad">${["ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"].map((k) => `<button class="d ${k}" data-k="${k}" aria-label="${k.replace("Arrow", "")}"></button>`).join("")}</div>
      <div class="ab"><button class="b" data-k="b" aria-label="Back">B</button><button class="a" data-k=" " aria-label="Talk or use">A</button></div>`;
    document.body.appendChild(t);
    const rot = document.createElement("div"); rot.id = "rotate";
    rot.innerHTML = `<div><div class="phone"></div><p>Turn your phone sideways to play.</p><p class="dim">The game is too small to read this way up.</p></div>`;
    document.body.appendChild(rot);
    t.querySelectorAll("button").forEach((b) => {
      const k = b.dataset.k, hold = k.startsWith("Arrow");
      const down = (e) => { e.preventDefault(); b.classList.add("on"); sendKey(k, true); if (!hold) sendKey(k, false); };
      const up = (e) => { e.preventDefault(); b.classList.remove("on"); if (hold) sendKey(k, false); };
      b.addEventListener("pointerdown", down); b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up);
    });
  }
  window.addEventListener("load", () => { setupPointer(); resize(); titleScreen(); requestAnimationFrame(frame); });
})();
