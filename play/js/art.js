// art.js — every pixel in the game is drawn here, in code. No image files, no emoji.
// Tiles are 16x16. Characters are 16x16 with a 1px dark outline. Portraits are 32x32.

(function () {
  const P = {
    ink: "#1d1828", ink2: "#2e2740", cream: "#f3e9d2", white: "#fbf7ee",
    wood1: "#c08a5b", wood2: "#a8744a", wood3: "#835634",
    wallTop: "#3a3150", wallTop2: "#4d4268", wallFace: "#e8d9bd", wallFace2: "#ddcbab", base: "#8d6e52",
    lino1: "#dcdccc", lino2: "#cfd0bd", bath1: "#cfe3e6", bath2: "#b3cfd4",
    deck1: "#e6dfcf", deck2: "#d2c9b4",
    rug1: "#9c4658", rug2: "#bd6469", rug3: "#e3b26b",
    grass1: "#6a9f4b", grass2: "#5a8c3f", grass3: "#83b65e",
    path1: "#d9c9a6", path2: "#c2b08a", path3: "#b09d78",
    road1: "#57586b", road2: "#4b4c5e", road3: "#62647a", stripe: "#e9e1c6",
    leaf1: "#3a733a", leaf2: "#4c8f45", leaf3: "#6dad57", trunk: "#6a4a30",
    water1: "#3f8fbf", water2: "#58a8d6", water3: "#9ad6ee",
    glass: "#8ec5d6", glass2: "#5f9fb8",
    red: "#d24a3f", orange: "#e88a3a", yellow: "#f2c14e", green: "#58a65c", teal: "#3f9a96",
    blue: "#3f6fae", violet: "#7a62c9", pink: "#e58fa0", brown: "#7a5233",
    gray: "#9a97a6", dgray: "#5c596b", lgray: "#d6d3dc", metal: "#aab3c0"
  };
  window.PAL = P;

  // ---------- helpers ----------
  function mk(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    return { c, x };
  }
  function pen(x) {
    return {
      r(a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); },
      p(a, b, col) { x.fillStyle = col; x.fillRect(a, b, 1, 1); },
      clr(a, b, w = 1, h = 1) { x.clearRect(a, b, w, h); }
    };
  }
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 7;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }
  function outline(c, x, col) {
    const w = c.width, h = c.height, a = x.getImageData(0, 0, w, h).data;
    const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && a[(j * w + i) * 4 + 3] > 0;
    x.fillStyle = col;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (solid(i, j)) continue;
      if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) x.fillRect(i, j, 1, 1);
    }
  }

  // ---------- tiles ----------
  const TD = {};
  function def(key, n, draw) { TD[key] = { n, draw }; }

  def(".", 4, (g, R) => { // wood planks
    g.r(0, 0, 16, 16, P.wood1);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      g.r(0, y + 3, 16, 1, P.wood2);
      g.r(Math.floor(R() * 14) + 1, y, 1, 3, P.wood2);
      if (R() < 0.35) g.p(Math.floor(R() * 14) + 1, y + 1, P.wood3);
    }
  });
  def("K", 1, (g) => {
    g.r(0, 0, 16, 16, P.rug1);
    g.r(0, 1, 16, 1, P.rug3); g.r(0, 14, 16, 1, P.rug3);
    for (let i = 0; i < 16; i += 4) { g.p(i + 1, 4, P.rug2); g.p(i + 3, 7, P.rug2); g.p(i + 1, 10, P.rug2); }
    g.r(6, 6, 4, 4, P.rug2); g.r(7, 7, 2, 2, P.rug3);
  });
  def(",", 2, (g, R) => {
    g.r(0, 0, 16, 16, P.lino1);
    g.r(0, 0, 8, 8, P.lino2); g.r(8, 8, 8, 8, P.lino2);
    if (R() < 0.5) g.p(Math.floor(R() * 16), Math.floor(R() * 16), P.lgray);
  });
  def("_", 1, (g) => {
    g.r(0, 0, 16, 16, P.bath1);
    for (let i = 3; i < 16; i += 4) { g.r(i, 0, 1, 16, P.bath2); g.r(0, i, 16, 1, P.bath2); }
  });
  def(":", 1, (g) => {
    g.r(0, 0, 16, 16, P.deck1);
    g.r(7, 0, 1, 16, P.deck2); g.r(15, 0, 1, 16, P.deck2); g.r(0, 7, 16, 1, P.deck2); g.r(0, 15, 16, 1, P.deck2);
  });
  def("g", 4, (g, R) => {
    g.r(0, 0, 16, 16, P.grass1);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(R() * 15), y = Math.floor(R() * 14) + 1;
      g.p(x, y, P.grass2); g.p(x + 1, y - 1, P.grass3);
    }
  });
  def("f", 2, (g, R) => {
    TD.g.draw(g, R);
    const cols = [P.white, P.pink, P.yellow];
    for (let i = 0; i < 3; i++) {
      const x = 2 + Math.floor(R() * 11), y = 2 + Math.floor(R() * 11), c = cols[Math.floor(R() * 3)];
      g.p(x, y - 1, c); g.p(x - 1, y, c); g.p(x + 1, y, c); g.p(x, y + 1, c); g.p(x, y, P.orange);
    }
  });
  def("p", 2, (g, R) => {
    g.r(0, 0, 16, 16, P.path1);
    g.r(0, 7, 16, 1, P.path2); g.r(0, 15, 16, 1, P.path2);
    g.r(7, 0, 1, 7, P.path2); g.r(15, 8, 1, 7, P.path2);
    for (let i = 0; i < 4; i++) g.p(Math.floor(R() * 16), Math.floor(R() * 16), P.path3);
  });
  def("r", 3, (g, R) => {
    g.r(0, 0, 16, 16, P.road1);
    for (let i = 0; i < 6; i++) g.p(Math.floor(R() * 16), Math.floor(R() * 16), R() < 0.5 ? P.road2 : P.road3);
  });
  def("z", 1, (g) => { g.r(0, 0, 16, 16, P.road1); g.r(0, 1, 16, 3, P.stripe); g.r(0, 9, 16, 3, P.stripe); });
  def("#t", 1, (g) => { g.r(0, 0, 16, 16, P.wallTop); g.p(3, 5, P.wallTop2); g.p(11, 10, P.wallTop2); });
  function face(g) {
    g.r(0, 0, 16, 16, P.wallFace);
    g.r(0, 0, 16, 2, P.wallTop2);
    for (let i = 1; i < 16; i += 4) g.r(i, 2, 1, 11, P.wallFace2);
    g.r(0, 13, 16, 3, P.base); g.r(0, 13, 16, 1, shade(P.base, 0.2));
  }
  def("#f", 1, face);
  def("=", 1, (g) => { // blackboard
    face(g); g.r(0, 2, 16, 10, P.wood3); g.r(0, 3, 16, 8, "#2f5240");
    g.r(2, 5, 5, 1, P.cream); g.r(9, 5, 3, 1, P.cream); g.r(3, 8, 7, 1, "#a9c4b0");
  });
  def("I", 1, (g) => { // bulletin board
    face(g); g.r(1, 3, 14, 9, "#c49a62"); g.r(1, 3, 14, 1, P.wood3);
    g.r(2, 5, 4, 5, P.white); g.r(7, 4, 4, 4, P.yellow); g.r(11, 6, 3, 5, P.pink); g.p(3, 5, P.red); g.p(8, 4, P.red);
  });
  def("j", 1, (g) => { // product dispenser
    face(g); g.r(4, 3, 8, 10, P.metal); g.r(4, 3, 8, 1, P.white); g.r(5, 5, 6, 2, P.pink); g.r(6, 9, 4, 1, P.ink2); g.r(4, 12, 8, 1, P.dgray);
  });
  def("b_h", 1, (g) => {
    g.r(1, 1, 14, 15, P.wood3); g.r(2, 3, 12, 13, P.white);
    g.r(3, 3, 10, 5, P.cream); g.r(3, 7, 10, 1, P.lgray); g.r(2, 10, 12, 6, "#4f86a8"); g.r(2, 10, 12, 1, shade("#4f86a8", 0.3));
  });
  def("b_f", 1, (g) => {
    g.r(1, 0, 14, 15, P.wood3); g.r(2, 0, 12, 13, "#4f86a8");
    g.r(4, 4, 3, 1, shade("#4f86a8", 0.25)); g.r(9, 8, 3, 1, shade("#4f86a8", 0.25)); g.r(2, 13, 12, 2, P.wood2);
  });
  def("d", 3, (g, R, v) => { // desk
    g.r(1, 13, 14, 2, "rgba(0,0,0,0.18)");
    g.r(1, 3, 14, 10, P.wood2); g.r(1, 3, 14, 1, P.wood1); g.r(1, 12, 14, 1, P.wood3);
    if (v === 0) { g.r(4, 5, 5, 6, P.white); g.r(5, 6, 3, 1, P.lgray); g.r(5, 8, 3, 1, P.lgray); }
    if (v === 1) { g.r(8, 5, 5, 4, P.red); g.r(8, 8, 5, 1, shade(P.red, -0.3)); }
    if (v === 2) { g.r(3, 8, 7, 1, P.yellow); g.p(10, 8, P.pink); }
  });
  def("y", 1, (g) => { // teacher desk
    g.r(0, 13, 16, 2, "rgba(0,0,0,0.18)");
    g.r(0, 3, 16, 10, "#7a4f30"); g.r(0, 3, 16, 1, P.wood2); g.r(0, 12, 16, 1, P.wood3);
    g.r(11, 5, 3, 3, P.red); g.p(12, 4, P.green); g.r(2, 6, 6, 4, P.white);
  });
  def("o", 1, (g) => { // cabinet / wardrobe
    g.r(1, 0, 14, 16, P.wood2); g.r(1, 0, 14, 2, P.wood1); g.r(7, 2, 1, 14, P.wood3);
    g.r(1, 15, 14, 1, P.wood3); g.p(6, 8, P.yellow); g.p(9, 8, P.yellow);
  });
  def("t", 1, (g) => { // toilet
    g.r(4, 1, 8, 4, P.white); g.r(4, 4, 8, 1, P.lgray);
    g.r(4, 5, 8, 8, P.white); g.r(5, 13, 6, 1, P.white); g.r(6, 7, 4, 5, P.bath2); g.r(4, 12, 1, 1, P.lgray); g.r(11, 12, 1, 1, P.lgray);
  });
  def("x", 1, (g) => { // sink
    g.r(0, 2, 16, 12, P.lgray); g.r(0, 2, 16, 2, P.white);
    g.r(4, 6, 8, 6, P.white); g.r(5, 7, 6, 4, P.bath2); g.r(7, 3, 2, 4, P.metal); g.r(0, 13, 16, 1, P.gray);
  });
  def("X", 1, (g) => { g.r(0, 0, 16, 16, "#c4c9d4"); g.r(0, 0, 16, 2, "#9aa1b0"); g.r(7, 2, 1, 14, "#b2b8c5"); });
  def("k", 2, (g, R, v) => { // kitchen counter
    g.r(0, 4, 16, 12, P.wood2); g.r(0, 0, 16, 5, P.lgray); g.r(0, 4, 16, 1, P.gray);
    g.r(2, 7, 12, 1, P.wood3); g.r(7, 7, 1, 9, P.wood3);
    if (v === 1) { g.r(2, 1, 4, 2, P.dgray); g.r(9, 1, 4, 2, P.dgray); }
  });
  def("n", 1, (g) => {
    g.r(1, 0, 14, 16, P.white); g.r(1, 6, 14, 1, P.lgray); g.r(12, 2, 1, 3, P.dgray); g.r(12, 8, 1, 5, P.dgray); g.r(1, 15, 14, 1, P.lgray);
  });
  def("m", 1, (g) => {
    g.r(0, 14, 16, 2, "rgba(0,0,0,0.15)"); g.r(0, 1, 16, 13, P.wood1); g.r(0, 13, 16, 1, P.wood3); g.r(0, 1, 16, 1, shade(P.wood1, 0.2));
  });
  def("q", 1, (g) => { // potted plant
    g.r(5, 10, 6, 5, "#b8653f"); g.r(4, 10, 8, 1, "#cf7a50");
    g.r(4, 3, 8, 7, P.leaf2); g.r(3, 5, 10, 4, P.leaf2); g.p(5, 4, P.leaf3); g.p(9, 5, P.leaf3); g.p(7, 7, P.leaf3); g.p(10, 8, P.leaf1);
  });
  def("L", 1, (g) => { // locker
    g.r(0, 0, 16, 16, "#6b8db3"); g.r(0, 0, 16, 1, "#94b4d4"); g.r(7, 0, 2, 16, "#4a6789");
    for (const x of [2, 10]) { g.r(x, 3, 4, 1, "#4a6789"); g.r(x, 5, 4, 1, "#4a6789"); }
    g.p(5, 9, P.metal); g.p(10, 9, P.metal); g.r(0, 15, 16, 1, "#3d5677");
  });
  def("S", 3, (g, R) => { // store shelf, front view
    g.r(0, 0, 16, 16, P.wood3); g.r(1, 0, 14, 16, "#5d4030");
    const cols = [P.pink, P.violet, P.white, P.teal, P.yellow, P.red, P.orange, P.blue, "#f0a6c0"];
    for (const y of [1, 6, 11]) {
      let x = 1;
      while (x < 14) { const w = 2 + Math.floor(R() * 2); const h = 3 + Math.floor(R() * 2); g.r(x, y + 4 - h, w, h, cols[Math.floor(R() * cols.length)]); x += w + (R() < 0.3 ? 1 : 0); }
      g.r(0, y + 4, 16, 1, P.wood1);
    }
  });
  def("C", 1, (g) => { g.r(0, 3, 16, 13, P.wood2); g.r(0, 0, 16, 4, "#e7e1d4"); g.r(0, 3, 16, 1, P.gray); g.r(0, 9, 16, 1, P.wood3); });
  def("G", 1, (g) => { TD.C.draw(g); g.r(4, 0, 8, 6, P.dgray); g.r(5, 1, 6, 2, "#86d0a8"); g.r(5, 4, 6, 1, P.gray); });
  def("T", 2, (g, R, v) => { // tree
    g.r(3, 13, 10, 3, "rgba(0,0,0,0.2)");
    g.r(7, 10, 2, 5, P.trunk);
    g.r(3, 2, 10, 9, P.leaf1); g.r(2, 4, 12, 5, P.leaf1); g.r(5, 1, 6, 1, P.leaf1);
    g.r(4, 2, 7, 6, P.leaf2); g.r(3, 4, 9, 3, P.leaf2);
    g.p(5, 3, P.leaf3); g.p(6, 3, P.leaf3); g.p(4, 5, P.leaf3); g.p(9, 4, P.leaf3);
    if (v === 1) { g.p(10, 7, P.red); g.p(5, 8, P.red); }
  });
  function roof(c1, c2) {
    return (g) => {
      g.r(0, 0, 16, 16, c1);
      for (let y = 3; y < 16; y += 4) g.r(0, y, 16, 1, c2);
      for (let row = 0; row < 4; row++) { const off = row % 2 ? 2 : 6; for (let x = off; x < 16; x += 8) g.r(x, row * 4, 1, 3, c2); }
    };
  }
  function eave(c1, c2) { const base = roof(c1, c2); return (g) => { base(g); g.r(0, 12, 16, 3, c2); g.r(0, 15, 16, 1, P.ink); }; }
  const ROOFS = { R: ["#b0503c", "#8f3d2f"], U: ["#3b8b86", "#2c6d69"], Y: ["#5a6382", "#454d68"], O: ["#3f6fae", "#30578a"] };
  for (const k in ROOFS) { def(k, 1, roof(...ROOFS[k])); def(k + "_e", 1, eave(...ROOFS[k])); }
  const FACADE = {
    H: (g) => { g.r(0, 0, 16, 16, "#e4cfa3"); for (let y = 2; y < 14; y += 3) g.r(0, y, 16, 1, "#cfb886"); g.r(0, 14, 16, 2, "#a58d64"); },
    A: (g) => { g.r(0, 0, 16, 16, "#efe3c9"); for (let x = 0; x < 16; x += 8) { g.r(x, 0, 4, 5, P.red); g.r(x + 4, 0, 4, 5, P.white); } for (let x = 1; x < 16; x += 4) g.p(x, 5, x % 8 < 4 ? P.red : P.white); g.r(0, 14, 16, 2, "#bfae8c"); },
    B: (g) => { g.r(0, 0, 16, 16, "#b45f48"); for (let y = 3; y < 16; y += 4) g.r(0, y, 16, 1, "#984c39"); for (let row = 0; row < 4; row++) { const off = row % 2 ? 3 : 7; for (let x = off; x < 16; x += 8) g.r(x, row * 4, 1, 3, "#984c39"); } },
    Z: (g) => { g.r(0, 0, 16, 16, "#dfeaf0"); for (let i = 3; i < 16; i += 4) { g.r(i, 0, 1, 16, "#c3d5df"); g.r(0, i, 16, 1, "#c3d5df"); } g.r(0, 6, 16, 2, P.blue); }
  };
  for (const f in FACADE) {
    def(f, 1, FACADE[f]);
    def("v_" + f, 1, (g) => {
      FACADE[f](g);
      if (f === "A") { g.r(1, 6, 14, 9, P.cream); g.r(2, 7, 12, 7, P.glass); g.p(3, 8, P.white); g.p(4, 9, P.white); g.r(9, 10, 4, 3, P.yellow); return; }
      g.r(2, 3, 12, 9, P.cream); g.r(3, 4, 10, 7, P.glass); g.r(3, 8, 10, 3, P.glass2); g.r(7, 4, 1, 7, P.cream);
      g.p(4, 5, P.white); g.p(5, 6, P.white); g.r(1, 12, 14, 1, P.wood3);
    });
    def("D_" + f, 1, (g) => {
      FACADE[f](g);
      g.r(3, 2, 10, 14, P.cream);
      if (f === "A" || f === "Z") { g.r(4, 3, 8, 13, P.glass2); g.r(5, 4, 6, 6, P.glass); g.r(7, 3, 1, 13, P.cream); }
      else { g.r(4, 3, 8, 13, P.wood3); g.r(5, 4, 6, 5, P.wood2); g.r(5, 10, 6, 5, P.wood2); g.p(10, 10, P.yellow); }
      g.r(2, 15, 12, 1, P.gray);
    });
  }
  def("D_in", 1, (g) => { g.r(2, 3, 12, 11, P.rug1); g.r(3, 4, 10, 9, P.rug2); g.r(5, 7, 6, 1, P.rug3); g.r(7, 8, 2, 1, P.rug3); });
  for (let f = 0; f < 3; f++) {
    const draw = (g, edge) => {
      g.r(0, 0, 16, 16, P.water1);
      for (let i = 0; i < 4; i++) { const x = (i * 5 + f * 2) % 16, y = (i * 4 + 2) % 16; g.r(x, y, 3, 1, P.water2); }
      g.p((f * 5 + 3) % 16, (f * 3 + 9) % 16, P.water3);
      if (edge) { g.r(0, 0, 16, 3, "#2f6f96"); g.r(0, 3, 16, 1, P.water2); }
    };
    def("w" + f, 1, (g) => draw(g, false));
    def("we" + f, 1, (g) => draw(g, true));
  }
  def("h", 1, (g) => { // bench
    g.r(1, 12, 14, 3, "rgba(0,0,0,0.18)");
    g.r(2, 10, 1, 4, P.ink2); g.r(13, 10, 1, 4, P.ink2);
    g.r(1, 4, 14, 3, P.wood1); g.r(1, 8, 14, 3, P.wood1); g.r(1, 6, 14, 1, P.wood3); g.r(1, 10, 14, 1, P.wood3);
  });
  def("l", 1, (g) => { // lamp post
    g.r(6, 14, 4, 2, P.ink2); g.r(7, 5, 2, 10, P.dgray); g.r(5, 1, 6, 4, P.ink2); g.r(6, 2, 4, 2, P.yellow);
  });
  def("F", 1, (g) => {
    g.r(0, 6, 16, 2, P.white); g.r(0, 11, 16, 2, P.white);
    for (let x = 1; x < 16; x += 5) { g.r(x, 3, 3, 12, P.white); g.p(x + 1, 2, P.white); g.r(x + 2, 3, 1, 12, P.lgray); }
  });
  def("a", 1, (g) => { // water fountain
    g.r(3, 3, 10, 10, P.metal); g.r(4, 4, 8, 6, P.lgray); g.r(6, 6, 4, 2, P.water2); g.r(4, 12, 8, 3, P.dgray);
  });

  const OVER = new Set("bdyotxknmqTChlFaG".split(""));
  const cache = {};
  function tileCanvas(key, v) {
    const id = key + "|" + v;
    if (cache[id]) return cache[id];
    const d = TD[key] || TD["#t"];
    const { c, x } = mk(16, 16);
    d.draw(pen(x), rng(v * 977 + key.charCodeAt(0) * 31 + 5), v);
    cache[id] = c;
    return c;
  }
  function variants(key) { return (TD[key] && TD[key].n) || 1; }

  // ---------- characters ----------
  function drawChar(g, L, dir, f) {
    const b = f === 3 ? 1 : 0;
    const sk = L.skin, hr = L.hair, pa = L.pants, so = L.shoes || "#3a3340";
    const sh = L.coat ? "#f1eee6" : L.shirt, sh2 = shade(sh, -0.2);
    if (dir !== "left") {
      const lUp = f === 1, rUp = f === 2;
      g.r(5, 12, 3, lUp ? 1 : 2, pa); g.r(8, 12, 3, rUp ? 1 : 2, pa);
      g.r(5, lUp ? 13 : 14, 3, 1, so); g.r(8, rUp ? 13 : 14, 3, 1, so);
      g.r(5, 8 + b, 6, 4, sh); g.r(4, 8 + b, 1, 3, sh2); g.r(11, 8 + b, 1, 3, sh2);
      g.p(4, 11 + b - (lUp ? 1 : 0), sk); g.p(11, 11 + b - (rUp ? 1 : 0), sk);
      if (L.coat) { g.r(7, 8 + b, 2, 4, L.shirt); g.r(5, 12, 6, 1, sh); }
      if (L.apron && dir === "down") g.r(6, 9 + b, 4, 3, L.apron);
      g.r(5, 2 + b, 6, 6, sk); g.r(4, 3 + b, 1, 4, sk); g.r(11, 3 + b, 1, 4, sk);
      if (dir === "down") {
        g.p(6, 5 + b, P.ink); g.p(9, 5 + b, P.ink);
        if (L.glasses) { g.r(5, 5 + b, 6, 1, P.ink); g.p(6, 5 + b, "#bfe3ef"); g.p(9, 5 + b, "#bfe3ef"); }
        hairDown(g, L, b);
      } else hairUp(g, L, b);
    } else {
      if (f === 1) { g.r(5, 12, 2, 2, pa); g.r(9, 12, 2, 2, pa); g.r(4, 14, 3, 1, so); g.r(9, 14, 2, 1, so); }
      else if (f === 2) { g.r(7, 12, 3, 2, pa); g.r(6, 14, 4, 1, so); }
      else { g.r(6, 12, 4, 2, pa); g.r(5, 14, 4, 1, so); }
      g.r(6, 8 + b, 4, 4, sh);
      if (L.coat) g.r(6, 12, 4, 1, sh);
      const ax = f === 1 ? 5 : f === 2 ? 8 : 7;
      g.r(ax, 9 + b, 2, 2, sh2); g.p(ax, 11 + b, sk);
      g.r(5, 2 + b, 6, 6, sk); g.p(4, 5 + b, sk);
      g.p(6, 5 + b, P.ink);
      if (L.glasses) { g.r(4, 5 + b, 3, 1, P.ink); g.p(6, 5 + b, "#bfe3ef"); }
      hairSide(g, L, b);
    }
  }
  function hairDown(g, L, b) {
    const h = L.hair;
    switch (L.style) {
      case "curly": g.r(3, 1 + b, 10, 3, h); g.r(3, 4 + b, 1, 2, h); g.r(12, 4 + b, 1, 2, h); g.clr(3, 1 + b); g.clr(12, 1 + b); break;
      case "cap": g.r(4, 3 + b, 1, 2, h); g.r(11, 3 + b, 1, 2, h); g.r(4, 1 + b, 8, 2, L.cap); g.r(5, 3 + b, 6, 1, shade(L.cap, -0.3)); break;
      default:
        g.r(4, 1 + b, 8, 3, h);
        if (L.style === "long") { g.r(4, 4 + b, 1, 6, h); g.r(11, 4 + b, 1, 6, h); g.p(5, 4 + b, h); }
        else { g.p(4, 4 + b, h); g.p(11, 4 + b, h); }
        if (L.style === "bun") g.r(6, 0, 4, 1, h);
    }
  }
  function hairUp(g, L, b) {
    const h = L.hair;
    if (L.style === "curly") { g.r(3, 1 + b, 10, 6, h); g.clr(3, 1 + b); g.clr(12, 1 + b); return; }
    g.r(4, 1 + b, 8, 7, h);
    if (L.style === "long") g.r(5, 8 + b, 6, 2, h);
    if (L.style === "bun") g.r(6, 0, 4, 1, h);
    if (L.style === "cap") { g.r(4, 1 + b, 8, 3, L.cap); g.r(6, 4 + b, 4, 1, shade(L.cap, -0.3)); }
  }
  function hairSide(g, L, b) {
    const h = L.hair;
    switch (L.style) {
      case "curly": g.r(4, 1 + b, 9, 3, h); g.r(9, 4 + b, 4, 4, h); g.clr(4, 1 + b); break;
      case "cap": g.r(9, 3 + b, 3, 3, h); g.r(4, 1 + b, 8, 2, L.cap); g.r(2, 3 + b, 4, 1, shade(L.cap, -0.3)); break;
      default:
        g.r(5, 1 + b, 7, 3, h); g.r(9, 4 + b, 3, 3, h);
        if (L.style === "long") g.r(9, 7 + b, 3, 3, h);
        if (L.style === "bun") g.r(10, 0, 3, 2, h);
    }
  }
  const sheets = {};
  function sheet(id) {
    if (sheets[id]) return sheets[id];
    const L = LOOKS[id];
    const s = { down: [], up: [], left: [], right: [] };
    for (const dir of ["down", "up", "left"]) for (let f = 0; f < 4; f++) {
      const { c, x } = mk(16, 16);
      drawChar(pen(x), L, dir, f);
      outline(c, x, P.ink);
      s[dir].push(c);
      if (dir === "left") {
        const m = mk(16, 16);
        m.x.translate(16, 0); m.x.scale(-1, 1); m.x.drawImage(c, 0, 0);
        s.right.push(m.c);
      }
    }
    sheets[id] = s;
    return s;
  }

  // ---------- hormone sprites (little creatures) ----------
  const BLOBS = {
    estrogen: { c: "#e86f8e", top: "flower" },
    progesterone: { c: "#8f7fd6", top: "moon" },
    lh: { c: "#f2b33e", top: "bolt" },
    fsh: { c: "#5fae67", top: "sprout" }
  };
  function drawBlob(g, kind, f) {
    const B = BLOBS[kind], c = B.c, d = shade(c, -0.25), l = shade(c, 0.35);
    g.r(4, 6, 8, 8, c); g.r(3, 8, 10, 5, c); g.r(5, 5, 6, 1, c); g.r(5, 14, 6, 1, d);
    g.r(5, 6, 2, 2, l); g.r(3, 12, 10, 1, d);
    if (kind === "progesterone") { g.r(5, 9, 2, 1, P.ink); g.r(9, 9, 2, 1, P.ink); }
    else if (f === 1) { g.r(5, 9, 2, 1, P.ink); g.r(9, 9, 2, 1, P.ink); }
    else { g.r(5, 8, 2, 2, P.ink); g.r(9, 8, 2, 2, P.ink); g.p(5, 8, P.white); g.p(9, 8, P.white); }
    g.p(7, 11, P.ink); g.p(8, 11, P.ink);
    g.p(4, 10, "#f2a0a8"); g.p(11, 10, "#f2a0a8");
    if (B.top === "flower") { g.r(7, 1, 2, 4, P.white); g.r(6, 2, 4, 2, P.white); g.r(7, 2, 2, 2, P.yellow); }
    if (B.top === "moon") { g.r(7, 1, 3, 4, P.yellow); g.r(8, 1, 2, 3, c); }
    if (B.top === "bolt") { g.r(8, 0, 2, 2, P.white); g.r(7, 2, 2, 1, P.white); g.r(8, 3, 2, 2, P.white); }
    if (B.top === "sprout") { g.r(7, 2, 1, 3, P.leaf1); g.r(5, 1, 2, 2, P.leaf3); g.r(8, 1, 3, 2, P.leaf3); }
  }
  const blobCache = {};
  function blob(kind, f) {
    const id = kind + f;
    if (blobCache[id]) return blobCache[id];
    const { c, x } = mk(16, 16);
    drawBlob(pen(x), kind, f);
    outline(c, x, P.ink);
    return (blobCache[id] = c);
  }

  // ---------- portraits (32x32) ----------
  function drawPortrait(g, L, expr) {
    const sk = L.skin, hr = L.hair, hd = shade(hr, -0.3), skd = shade(sk, -0.14);
    const sh = L.coat ? "#f1eee6" : L.shirt;
    if (L.style === "long") g.r(7, 10, 18, 18, hr);
    g.r(4, 26, 24, 6, sh); g.r(6, 25, 20, 1, sh);
    if (L.coat) { g.r(13, 25, 6, 7, L.shirt); }
    if (L.apron) g.r(10, 27, 12, 5, L.apron);
    g.r(13, 21, 6, 5, skd);
    const rows = [[8, 12, 19], [9, 10, 21], [10, 9, 22], [11, 9, 22], [12, 9, 22], [13, 9, 22], [14, 9, 22], [15, 9, 22], [16, 9, 22], [17, 9, 22], [18, 9, 22], [19, 10, 21], [20, 11, 20], [21, 12, 19], [22, 13, 18]];
    for (const [y, a, z] of rows) g.r(a, y, z - a + 1, 1, sk);
    g.r(8, 14, 1, 3, sk); g.r(23, 14, 1, 3, sk);
    // hair
    if (L.style === "curly") {
      g.r(7, 5, 18, 7, hr); g.r(6, 7, 20, 4, hr); g.r(6, 11, 3, 7, hr); g.r(23, 11, 3, 7, hr);
      g.clr(7, 5); g.clr(12, 5); g.clr(18, 5); g.clr(24, 5);
    } else if (L.style === "cap") {
      g.r(8, 10, 2, 6, hr); g.r(22, 10, 2, 6, hr);
      g.r(9, 4, 14, 7, L.cap); g.r(7, 10, 18, 2, shade(L.cap, -0.3)); g.p(12, 6, shade(L.cap, 0.3));
    } else {
      g.r(11, 6, 10, 1, hr); g.r(9, 7, 14, 1, hr); g.r(8, 8, 16, 3, hr);
      g.r(8, 11, 4, 1, hr); g.r(20, 11, 4, 1, hr);
      if (L.style === "long") { g.r(7, 11, 3, 14, hr); g.r(22, 11, 3, 14, hr); g.r(12, 11, 3, 1, hr); }
      else { g.r(8, 11, 1, 4, hr); g.r(23, 11, 1, 4, hr); }
      if (L.style === "bun") { g.r(13, 2, 6, 4, hr); g.r(12, 3, 8, 2, hr); }
      g.p(12, 7, shade(hr, 0.25)); g.p(13, 7, shade(hr, 0.25));
    }
    // brows
    if (expr === "worried" || expr === "sad") { g.r(11, 13, 2, 1, hd); g.p(13, 12, hd); g.p(18, 12, hd); g.r(19, 13, 2, 1, hd); }
    else if (expr === "annoyed") { g.p(11, 12, hd); g.r(12, 13, 2, 1, hd); g.r(18, 13, 2, 1, hd); g.p(20, 12, hd); }
    else { g.r(11, 12, 3, 1, hd); g.r(18, 12, 3, 1, hd); }
    // eyes
    if (expr === "happy") { g.r(11, 15, 3, 1, P.ink); g.p(12, 14, P.ink); g.r(18, 15, 3, 1, P.ink); g.p(19, 14, P.ink); }
    else { g.r(12, 14, 2, 3, P.ink); g.r(18, 14, 2, 3, P.ink); g.p(12, 14, P.white); g.p(18, 14, P.white); }
    if (L.glasses) {
      for (const x0 of [10, 17]) { g.r(x0, 13, 5, 1, P.ink); g.r(x0, 17, 5, 1, P.ink); g.r(x0, 13, 1, 5, P.ink); g.r(x0 + 4, 13, 1, 5, P.ink); }
      g.r(15, 14, 2, 1, P.ink);
    }
    g.p(16, 18, skd);
    // mouth
    const m = "#7a3b3b";
    if (expr === "happy") { g.r(14, 20, 5, 2, P.ink); g.r(15, 21, 3, 1, "#c95a5a"); }
    else if (expr === "smile" || expr === "blush") { g.p(13, 19, m); g.r(14, 20, 4, 1, m); g.p(18, 19, m); }
    else if (expr === "worried" || expr === "sad") { g.r(14, 20, 4, 1, m); g.p(13, 21, m); g.p(18, 21, m); }
    else if (expr === "surprised") { g.r(15, 19, 2, 3, P.ink); }
    else g.r(14, 20, 4, 1, m);
    if (expr === "blush" || expr === "happy") { g.r(10, 18, 2, 1, "#e98a8a"); g.r(20, 18, 2, 1, "#e98a8a"); }
  }
  const portraitCache = {};
  function portrait(id, expr = "neutral") {
    const key = id + ":" + expr;
    if (portraitCache[key]) return portraitCache[key];
    const { c, x } = mk(32, 32);
    if (BLOBS[id]) { x.drawImage(blob(id, expr === "blink" ? 1 : 0), 0, 0, 32, 32); }
    else { drawPortrait(pen(x), LOOKS[id], expr); outline(c, x, P.ink); }
    return (portraitCache[key] = c.toDataURL());
  }

  // ---------- item & HUD icons (10x10) ----------
  const IC = {
    k: P.ink, w: P.white, c: P.cream, p: P.pink, r: P.red, b: P.blue, l: "#a9d6ea", y: P.yellow, o: P.orange,
    g: P.green, n: "#9a6a3e", d: "#5a3a22", v: P.violet, s: P.lgray, t: P.teal, m: "#f0a6c0"
  };
  const ICONS = {
    pad: ["..........", "...kkkk...", "..kwwwwk..", ".kkwmmwkk.", "kwwwmmwwwk", "kwwwmmwwwk", ".kkwmmwkk.", "..kwwwwk..", "...kkkk...", ".........."],
    liner: ["..........", "...kkkk...", "..kwwwwk..", "..kwccwk..", "..kwccwk..", "..kwccwk..", "..kwccwk..", "..kwwwwk..", "...kkkk...", ".........."],
    tampon: ["....kk....", "...kwwk...", "...kwwk...", "...kwwk...", "..kmmmmk..", "..kmwwmk..", "..kmwwmk..", "..kmmmmk..", "...kkkk...", "....ss...."],
    cup: ["..........", ".kkkkkkkk.", ".kvvvvvvk.", ".kvwvvvvk.", "..kvvvvk..", "..kvvvvk..", "...kvvk...", "....kk....", "....vv....", "....kk...."],
    underwear: ["..........", "kkkkkkkkkk", "kvvvvvvvvk", "kvvvvvvvvk", ".kvvvvvvk.", "..kvvvvk..", "...kvvk...", "....kk....", "..........", ".........."],
    pain: ["...kkkk...", "...kwwk...", "..kkkkkk..", "..koooook.", "..kowwwok.", "..kowrwok.", "..kowwwok.", "..koooook.", "..kkkkkkk.", ".........."],
    heat: ["..........", ".kkkkkkkk.", ".kcccccck.", ".kcoccock.", ".kccocock.", ".kcoccock.", ".kccocock.", ".kcccccck.", ".kkkkkkkk.", ".........."],
    bar: ["..........", "..........", ".kkkkkkkk.", "kynnynnynk", "knnynnnynk", "kynnnynnyk", ".kkkkkkkk.", "..........", "..........", ".........."],
    choc: ["..........", ".kkkkkkkk.", ".knndnndk.", ".knndnndk.", ".kddddddk.", ".knndnndk.", ".kwwwwwwk.", ".krrrrrrk.", ".kkkkkkkk.", ".........."],
    chips: ["..kkkkkk..", ".krrrrrrk.", ".krryyrrk.", ".kryyyyrk.", ".krryyrrk.", ".krrrrrrk.", ".krrrrrrk.", "..kkkkkk..", "..........", ".........."],
    water: ["....kk....", "...kssk...", "...kkkk...", "..kllllk..", "..klwllk..", "..kbbbbk..", "..kllllk..", "..klllwk..", "..kllllk..", "..kkkkkk.."],
    pants: [".kkkkkkkk.", ".kbbbbbbk.", ".kbbbbbbk.", ".kbbkkbbk.", ".kbbkkbbk.", ".kbbkkbbk.", ".kbbkkbbk.", ".kbbkkbbk.", ".kkkkkkkk.", ".........."],
    swim: ["..k....k..", "..kt..tk..", "..kttttk..", ".kttttttk.", ".kttwwttk.", ".kttttttk.", "..kttttk..", "...kttk...", "....kk....", ".........."],
    pill: ["..........", "kkkkkkkkkk", "kwvwvwvwvk", "kwwwwwwwwk", "kwvwvwvwvk", "kwwwwwwwwk", "kwvwvwvwvk", "kwwwwwwwwk", "kkkkkkkkkk", ".........."],
    heart: ["..........", ".kkk.kkk..", "krrrkrrrk.", "krwrrrrrk.", "krrrrrrrk.", ".krrrrrk..", "..krrrk...", "...krk....", "....k.....", ".........."],
    bolt: [".....kkk..", "....kyyk..", "...kyyk...", "..kyyyykk.", ".kkkyyyyk.", "....kyyk..", "...kyyk...", "...kyk....", "..kk......", ".........."],
    mood: ["..kkkkkk..", ".kyyyyyyk.", "kyykyykyyk", "kyykyykyyk", "kyyyyyyyyk", "kykyyyykyk", "kyykkkkyyk", ".kyyyyyyk.", "..kkkkkk..", ".........."],
    crave: ["..kkkkk...", ".knnnnnk..", "knndnnnnk.", "knnnnndnk.", "knndnnnnk.", "knnnndnnk.", ".knnnnnk..", "..kkkkk...", "..........", ".........."],
    coin: ["..kkkkkk..", ".kyyyyyyk.", "kywwyyyyok", "kywyyyyyok", "kyyyyyyyok", "kyyyyyyyok", "kyyyyyyook", ".kooooook.", "..kkkkkk..", ".........."],
    drop: ["....kk....", "...krrk...", "...krrk...", "..krrrrk..", ".krwrrrrk.", ".krwrrrrk.", ".krrrrrrk.", "..krrrrk..", "...kkkk...", ".........."],
    cramp: ["..........", ".k......k.", "kok....kok", ".kok..kok.", "..kokkok..", "...kook...", "..kokkok..", ".kok..kok.", "kok....kok", ".k......k."],
    phone: ["..kkkkkk..", ".kddddddk.", ".kllllllk.", ".klmmlllk.", ".kllllllk.", ".klllmmlk.", ".kllllllk.", ".kddddddk.", ".kddwdddk.", "..kkkkkk.."],
    bulb: ["...kkkk...", "..kyyyyk..", ".kywyyyyk.", ".kywyyyyk.", ".kyyyyyyk.", "..kyyyyk..", "...kook...", "...kssk...", "...kssk...", "....kk...."],
    book: ["..........", ".kkkkkkkk.", ".ktttttwk.", ".ktwwwtwk.", ".ktttttwk.", ".ktttttwk.", ".ktttttwk.", ".ktttttwk.", ".kkkkkkkk.", ".........."],
    bag: ["...kkkk...", "..k....k..", ".kkkkkkkk.", "kttttttttk", "ktkkkkkktk", "ktttyytttk", "kttttttttk", "kttttttttk", ".kkkkkkkk.", ".........."]
  };
  const iconCache = {};
  function icon(name) {
    if (iconCache[name]) return iconCache[name];
    const rows = ICONS[name] || ICONS.bag;
    const { c, x } = mk(10, 10);
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") { x.fillStyle = IC[ch]; x.fillRect(i, j, 1, 1); } }));
    return (iconCache[name] = c.toDataURL());
  }

  window.ART = { P, shade, mk, tileCanvas, variants, OVER, sheet, blob, portrait, icon, ICONS };
})();
