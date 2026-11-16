// demo.js — an auto-playing tour of the game, for recording the demo video.
// Open index.html?demo to use it. Without ?demo in the address, this file does nothing.
// The tour presses the same keys a player would, so everything on screen is the real game.

(function () {
  if (!/[?&]demo\b/.test(location.search)) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);
  const kd = (k) => window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
  const ku = (k) => window.dispatchEvent(new KeyboardEvent("keyup", { key: k }));
  const press = async (k, gap = 160) => { kd(k); ku(k); await sleep(gap); };
  const waitFor = async (fn, ms = 8000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) return false; await sleep(30); } return true; };
  const dlgOpen = () => !$("dialog").classList.contains("hidden");
  const choicesOpen = () => !$("choices").classList.contains("hidden");
  const modalOpen = () => !$("modal").classList.contains("hidden");
  const typed = () => $("dlg-next").style.visibility === "visible" || choicesOpen();
  const G = () => getG();

  // ---------- on-screen pieces ----------
  const css = document.createElement("style");
  css.textContent = `
    .demo #objective { display: none !important; }
    #democap { position: absolute; left: 50%; top: calc(var(--u) * 4); transform: translateX(-50%); z-index: 4; text-align: center; white-space: nowrap;
      background: #f2c14e; color: #1d1828; padding: calc(var(--u) * 1.5) calc(var(--u) * 8); border-radius: calc(var(--u) * 2);
      box-shadow: 0 0 0 var(--u) #1d1828, 0 calc(var(--u) * 2) 0 rgba(0,0,0,.35); transition: opacity .25s; }
    #democap b { display: block; color: #1d1828; font-size: calc(var(--u) * 10.5); letter-spacing: .06em; }
    #democap span { font-size: calc(var(--u) * 7.5); }
    #demoend { position: absolute; inset: 0; z-index: 20; background: #0f0c16; display: flex; align-items: center; justify-content: center; animation: fadein .5s; }
    #demoend .panel { width: calc(var(--u) * 270); padding: calc(var(--u) * 12) calc(var(--u) * 16); }
    #demoend h2 { margin: 0 0 calc(var(--u) * 6); color: #f2c14e; font-size: calc(var(--u) * 17); font-weight: 400; letter-spacing: .06em; }
    #demoend li { font-size: calc(var(--u) * 10); line-height: 1.25; margin: calc(var(--u) * 5) 0; }
    #demoend ul { margin: 0; padding-left: calc(var(--u) * 12); }
    #demoend .logo { text-align: center; }
    #demoend .tag { text-align: center; font-size: calc(var(--u) * 10); }
    #demobar { position: fixed; left: 0; right: 0; top: 0; z-index: 99; display: flex; gap: 12px; align-items: center; justify-content: center; padding: 10px;
      background: #1d1828; color: #f3e9d2; font: 15px system-ui, sans-serif; border-bottom: 2px solid #f2c14e; }
    #demobar button { font: inherit; font-weight: 600; padding: 8px 16px; border-radius: 8px; border: 0; cursor: pointer; background: #f2c14e; color: #1d1828; }
    #demobar button.alt { background: #3a3150; color: #f3e9d2; }`;
  document.head.appendChild(css);

  function caption(title, sub) {
    let el = $("democap");
    if (!el) { el = document.createElement("div"); el.id = "democap"; $("ui").appendChild(el); }
    if (!title) { el.style.opacity = 0; return; }
    el.style.opacity = 1;
    el.innerHTML = `<b>${title}</b><span>${sub || ""}</span>`;
    mark(title);
  }
  const times = []; let t0 = 0;
  function mark(label) { times.push([label, Math.round((performance.now() - t0) / 100) / 10]); window.__demoTimes = times; }

  // ---------- "press the keys a player would" helpers ----------
  async function line(hold = 1000) { await waitFor(dlgOpen); await waitFor(typed); await sleep(hold); await press(" "); await sleep(200); }
  async function sayA(who, text, expr, hold) { const p = say(who, text, expr); await line(hold); await p; }
  async function closeCard(hold = 2000) { await waitFor(modalOpen); await sleep(hold); await press(" "); await sleep(250); }
  async function pick(i, hold = 1200) { await waitFor(modalOpen); await sleep(600); for (let j = 0; j < i; j++) await press("ArrowDown", 220); await sleep(hold); await press(" "); await sleep(250); }
  async function choose(i, hold = 700) { await waitFor(choicesOpen); await sleep(hold); for (let j = 0; j < i; j++) await press("ArrowDown", 200); await sleep(250); await press(" "); await sleep(250); }
  async function face(k) { kd(k); await sleep(50); ku(k); await sleep(120); }

  const DIR = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  function path(tx, ty) {
    const g = G(), m = MAPS[g.mapId], blocked = new Set();
    for (const n of __dbg.RT.npcs) if (n.map === g.mapId) blocked.add(n.x + "," + n.y);
    const prev = {}, q = [[g.x, g.y]]; prev[g.x + "," + g.y] = null;
    while (q.length) {
      const [x, y] = q.shift(); if (x === tx && y === ty) break;
      for (const k in DIR) {
        const nx = x + DIR[k][0], ny = y + DIR[k][1], key = nx + "," + ny;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || key in prev) continue;
        const ch = m.t[ny][nx];
        if (SOLID.has(ch) || blocked.has(key) || (ch === "D" && !(nx === tx && ny === ty))) continue;
        prev[key] = [x, y, k]; q.push([nx, ny]);
      }
    }
    if (!((tx + "," + ty) in prev)) return null;
    const out = []; let c = tx + "," + ty;
    while (prev[c]) { const [px, py, k] = prev[c]; out.unshift(k); c = px + "," + py; }
    return out;
  }
  // Hold the key along each straight stretch so walking looks smooth, and let go one tile early.
  async function walkTo(tx, ty) {
    for (let tries = 0; tries < 5; tries++) {
      const p = path(tx, ty); if (!p) return false;
      let i = 0, ok = true;
      while (i < p.length && ok) {
        const k = p[i]; let n = 1; while (p[i + n] === k) n++;
        const g = G(), map = g.mapId, ex = g.x + DIR[k][0] * n, ey = g.y + DIR[k][1] * n;
        const bx = ex - DIR[k][0], by = ey - DIR[k][1];
        kd(k);
        if (n > 1) ok = await waitFor(() => (G().x === bx && G().y === by) || G().mapId !== map, 400 + n * 260);
        await sleep(40); ku(k);
        ok = ok && (await waitFor(() => (G().x === ex && G().y === ey) || G().mapId !== map, 900));
        if (G().mapId !== map) return true;
        i += n;
      }
      if (ok && G().x === tx && G().y === ty) return true;
      await sleep(250);
    }
    return false;
  }
  function seenAllFacts() { const g = G(); g.facts = g.facts || {}; Object.keys(FACTS).forEach((id) => (g.facts[id] = true)); }
  async function day(i, title, sub) {
    const p = __dbg.startChapter(i);
    __dbg.RT.events = []; (CHAPTERS[i].triggers || []).forEach((t) => (t.done = true));
    $("fade").classList.remove("on");
    caption(title, sub);
    await sleep(1400); await press(" "); await p;
    seenAllFacts();
    await sleep(350);
  }
  function endCard(title, items) {
    let el = $("demoend");
    if (!el) { el = document.createElement("div"); el.id = "demoend"; $("ui").appendChild(el); }
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    el.innerHTML = items ? `<div class="panel"><h2>${title}</h2><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`
      : `<div><div class="logo"><span>28</span> DAYS</div><div class="tag">a month in your body</div></div>`;
    mark(title || "END");
  }

  // ---------- the tour ----------
  async function tour() {
    t0 = performance.now(); mark("TITLE");
    document.body.classList.add("demo");
    CHAPTERS.forEach((c) => (c.onStart = null));
    await sleep(2200);

    // HOME
    $("screen").className = "hidden";
    { const p = __dbg.startChapter(0); __dbg.RT.events = []; (CHAPTERS[0].triggers || []).forEach((t) => (t.done = true)); await sleep(1500); await press(" "); await p; }
    seenAllFacts();
    let g = G();
    caption("HOME", "Pack your bag before school");
    const mom = npcById("mom"); if (mom) mom.wander = 0;
    await sleep(600);
    await walkTo(15, 3); await face("ArrowRight");
    await sayA("mom", "Before you go: I made you a period kit. Let me show you what's inside.", "smile", 900);
    { const p = itemCard("pad"); await closeCard(2200); await p; }
    Object.assign(g.stash, { pad: 4, liner: 6, tampon: 2, pain: 4, heat: 1 }); g.d.kit = true; g.flags.packTip = true;
    await walkTo(4, 3); await face("ArrowUp"); await press(" ");
    await choose(0, 500);
    await waitFor(modalOpen); await sleep(800);
    await press("ArrowRight", 420); await press("ArrowRight", 420);            // 2 pads
    for (let i = 0; i < 3; i++) await press("ArrowDown", 170); await press("ArrowRight", 420);   // pain reliever
    for (let i = 0; i < 2; i++) await press("ArrowDown", 170); await press("ArrowRight", 420);   // granola bar
    await sleep(1100); await press("b");
    await line(700);

    // TOWN
    caption("THE TOWN", "Four places, each with one job");
    g.time = 462;
    await walkTo(8, 7); kd("ArrowDown"); await waitFor(() => G().mapId === "town", 3000); ku("ArrowDown");
    await sleep(700);
    await walkTo(26, 5); kd("ArrowUp"); await waitFor(() => G().mapId === "school", 3000); ku("ArrowUp");
    await sleep(500);

    // SCHOOL: health class
    caption("SCHOOL", "Health class with Dr. Flo");
    g.time = 476; __dbg.tick();
    await walkTo(6, 4); await face("ArrowUp");
    g.time = 500;
    const U = CHAPTERS[0].health;
    await sayA("nurse", "Good morning, everyone! Today's question: what is a period?", "smile", 800);
    { const sl = U.slides[0], p = card({ icon: sl.icon, title: sl.title, body: sl.body, cls: "lesson", btn: "Next" }); await closeCard(2700); await p; }
    { const q = { ...U.quiz[1], head: "POP QUIZ · Question 2 of 3" }, p = __dbg.quiz("POP QUIZ", [q]); await pick(q.c, 1500); await closeCard(1200); await p; }

    // THE SURPRISE
    caption("DAY 1", "A first period, in the middle of class");
    g.time = 605;
    await sayA("narr", "Halfway through health class, you feel something weird. Kind of warm. Kind of... wet.", null, 900);
    g.flags.started = true; startCycle(); sfx.chime(); banner("DAY 1");
    await sleep(1700);
    await sayA("you", "Oh my gosh. I think I just got my period. Like, right now.", "worried", 900);

    // LEAK
    caption("LEAKS", "No pad on, or a full pad, and you leak");
    g.worn = null;
    await sleep(1000);
    for (let i = 0; i < 12; i++) { __dbg.tick(); await sleep(70); }
    await line(800); await line(1100);
    await fade(true); teleport("school", 22, 3, "up"); await fade(false);
    await sleep(400); await press(" ");
    await waitFor(modalOpen); await sleep(1100); await press(" ");   // put on a fresh pad
    await closeCard(1900);                                           // how-to card
    await line(800);                                                 // "Okay. I did it."

    // FACT
    caption("DID YOU KNOW?", "31 facts, each with its source");
    delete g.facts.use_pad; fact("use_pad");
    await closeCard(3300);

    // MART
    caption("CORNER MART", "Buy supplies with your own money");
    await fade(true); g.stained = false; g.time = 915; g.money = 20; teleport("mart", 7, 9, "up"); await fade(false);
    await sleep(700);
    await walkTo(3, 4); await face("ArrowUp"); await press(" ");
    await waitFor(modalOpen); await sleep(1300); await press(" ");   // pads
    await sleep(1300); await press("b");
    await line(800);

    // NIGHT: tracker + hormones
    caption("EVERY NIGHT", "Log your day in the cycle tracker");
    await fade(true); g.time = 1265; g.trackerUnlocked = true; g.flags.trackerTip = true; teleport("home", 3, 3, "left"); await fade(false);
    await sleep(700);
    { const p = __dbg.trackerLog(); await waitFor(modalOpen); await sleep(1000);
      await press("ArrowRight", 500);
      await press("ArrowDown", 280); await press("ArrowRight", 280); await press("ArrowRight", 500);
      await press("ArrowDown", 280); await press("ArrowDown", 700); await press(" ");
      await line(1400); await p; }
    caption("INSIDE THE BODY", "Four hormones explain what's happening");
    await fade(true);
    { const p = __dbg.dream([["estrogen", "I'm **Estrogen**! This month, Progesterone and I dropped low. That told your uterus to shed its lining. That's your period."]]);
      await line(1500); await p; }

    // THE MONTH, WEEK BY WEEK
    await day(1, "WEEK 1 · MENSTRUAL", "Heavy flow and cramps");
    g = G();
    await sayA("you", "Ow. Cramps. And this is way heavier than yesterday.", "worried", 900);
    caption("THE POOL", "Swim practice needs a tampon or a cup");
    await fade(true); g.time = 935; g.worn = { id: "pad", left: 4, since: 935 }; __dbg.tick(); teleport("pool", 2, 9, "up"); await fade(false);
    await sleep(500); await walkTo(2, 7); const coach = npcById("coach"); if (coach) coach.dir = "down";
    await sayA("coach", "You can't wear a pad in the water. A tampon or a menstrual cup would work.", "neutral", 1300);

    await day(3, "WEEK 2 · FOLLICULAR", "Period's over. Energy and mood are up");
    await sayA("you", "I feel... amazing? Like I could run a marathon.", "happy", 1000);

    await day(4, "MID-CYCLE · OVULATION", "An ovary releases an egg");
    await sayA("lh", "IT'S ME, **LH**! When Estrogen gets high enough, I surge, and an ovary releases an egg.", null, 1300);

    await day(5, "WEEK 3 · LUTEAL", "Energy drops, cravings climb");
    G().stats.cravings = 68;
    await sayA("you", "Why am I so... tired. I slept nine hours.", "sad", 1000);

    await day(6, "WEEK 4 · PMS", "Mood dips, cravings spike");
    G().bag = [{ id: "choc", n: 1 }, { id: "pad", n: 2 }];
    await sayA("you", "Everything is annoying. My jeans are annoying. The SUN is annoying.", "annoyed", 1000);
    await press("i"); await waitFor(modalOpen); await sleep(1200); await press(" ");   // eat the chocolate
    await sleep(1500);

    await day(7, "DAY 1, AGAIN", "This time, the tracker saw it coming");
    G().time = 640; G().worn = { id: "pad", left: 5, since: 640 };
    await sayA("narr", "There it is. That feeling. Day 1, right on time.", null, 800);
    await sayA("you", "And this time I packed for it. Ha. Easy.", "happy", 1000);

    // UNIT TEST + REPORT CARD
    caption("UNIT TEST", "Health class ends with a graded test");
    { const q = { ...CHAPTERS[7].health.quiz[7], head: "UNIT TEST · Question 8 of 8" }, p = __dbg.quiz("UNIT TEST", [q]); await pick(q.c, 2000); await closeCard(1100); await p; }
    { const p = card({ icon: "book", title: "Unit test: 8 / 8", cls: "paper", body: '<p class="grade">A+</p><p>Dr. Flo draws a little star next to your name.</p>' }); await closeCard(1800); await p; }
    caption(null); mark("REPORT CARD");
    g = G();
    g.log = [1, 2, 5, 9, 14, 21, 26, 1].map((d) => ({ day: d, flow: "medium", cramps: 2, mood: "okay", correct: d !== 21 }));
    g.literacy = 142; g.leaks = 1; g.quiz = { right: 21, total: 23 }; g.finalGrade = "A+"; g.money = 11.5;
    Object.assign(g.stats, { health: 84, energy: 71, mood: 80, cravings: 30 });
    g.facts = {}; Object.keys(FACTS).slice(0, 26).forEach((id) => (g.facts[id] = true));
    __dbg.ending();
    await sleep(4500);

    caption(null);
    endCard(null);
    await sleep(3000);
    mark("DONE");
    if (window.__demoStop) window.__demoStop();
  }

  // ---------- start bar: Record or just Play ----------
  // Record uses the browser's own screen sharing: pick "This tab" when Chrome asks. The video file
  // downloads by itself when the tour ends.
  async function record() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false, preferCurrentTab: true });
    const type = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8000000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(chunks, { type }));
      a.download = "28-days-demo." + (type.includes("mp4") ? "mp4" : "webm");
      document.body.appendChild(a); a.click();
    };
    window.__demoStop = () => rec.state !== "inactive" && rec.stop();
    stream.getVideoTracks()[0].addEventListener("ended", window.__demoStop);
    rec.start(1000);
  }
  window.addEventListener("load", () => {
    if (/[?&]auto\b/.test(location.search)) { setTimeout(tour, 300); return; }
    const bar = document.createElement("div"); bar.id = "demobar";
    bar.innerHTML = `<span>Demo tour (about 2 min 10 s).</span><button id="demo-rec">Record video</button><button id="demo-play" class="alt">Just play it</button><span id="demo-msg"></span>`;
    document.body.appendChild(bar);
    $("demo-play").onclick = () => { bar.remove(); tour(); };
    $("demo-rec").onclick = async () => {
      try { await record(); bar.remove(); await sleep(800); tour(); }
      catch (e) { $("demo-msg").textContent = "Recording was cancelled or blocked. Try again and choose \"This tab\"."; }
    };
  });
})();
