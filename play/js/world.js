// world.js — items, character looks, and the five maps (home, town, school, Corner Mart, pool).

(function () {
  // cap = hours of protection on a MEDIUM day. maxH = hard time limit for safety.
  window.ITEMS = {
    pad:       { name: "Pad", icon: "pad", price: 6, pack: 8, stack: 6, cap: 5, kind: "product",
                 how: "Peel off the backing, stick it to the inside of your underwear, and fold the wings around the sides. Change it at least every 4 to 8 hours, or whenever it feels full or wet.",
                 desc: "Worn inside your underwear to soak up the flow. Easiest to start with. Not for swimming." },
    liner:     { name: "Panty liner", icon: "liner", price: 4, pack: 12, stack: 8, cap: 1.5, kind: "product",
                 how: "Same as a pad, just thinner and shorter. Good for light days at the end of a period, or days you think your period might come.",
                 desc: "A thin pad for spotting or very light days." },
    tampon:    { name: "Tampon", icon: "tampon", price: 7, pack: 8, stack: 6, cap: 6, maxH: 8, swim: true, kind: "product",
                 how: "Wash your hands, then follow the directions in the box. Once it's in correctly, you shouldn't feel it. The string stays outside so you can remove it later. Use the lowest absorbency you need, change it every 4 to 8 hours, and never wear one longer than 8: leaving a tampon in too long has been linked to toxic shock syndrome (TSS).",
                 desc: "Worn inside, so it works for swimming. Change every 4–8 hours, never longer than 8." },
    cup:       { name: "Menstrual cup", icon: "cup", price: 22, pack: 1, stack: 1, cap: 10, maxH: 12, swim: true, reusable: true, kind: "product",
                 how: "It's inserted into the vagina to catch the flow. Remove and empty it every 8 to 12 hours. Clean a reusable cup every day, and sanitize it in boiling water after your period.",
                 desc: "A cup worn inside to catch the flow. Some can be washed and reused. Works for swimming." },
    underwear: { name: "Period underwear", icon: "underwear", price: 14, pack: 1, stack: 1, cap: 5, reusable: true, kind: "product",
                 how: "Wear it like normal underwear. Special material in the fabric soaks up the blood. You can wear it for a full day, and most of it is machine washable. Follow the product directions.",
                 desc: "Absorbent underwear. Good for light days, overnight, or as backup. Reusable." },
    pain:      { name: "Pain reliever", icon: "pain", price: 5, pack: 6, stack: 6, kind: "use",
                 desc: "Ibuprofen or naproxen eases cramps. Only with a parent or guardian's okay, and always follow the directions on the bottle. At school, medicine goes through the health office." },
    heat:      { name: "Heat patch", icon: "heat", price: 4, pack: 3, stack: 3, kind: "use",
                 desc: "Stick it on your lower belly or back. Heat can soothe cramps." },
    bar:       { name: "Granola bar", icon: "bar", price: 1, pack: 1, stack: 3, kind: "use", desc: "Steady energy, and it takes the edge off cravings." },
    choc:      { name: "Chocolate", icon: "choc", price: 2, pack: 1, stack: 3, kind: "use", desc: "Hits a craving fast. Small mood boost." },
    chips:     { name: "Hot chips", icon: "chips", price: 2, pack: 1, stack: 3, kind: "use", desc: "Spicy and salty. Satisfying, but doctors suggest going easy on salt when you have PMS." },
    water:     { name: "Water bottle", icon: "water", price: 1, pack: 1, stack: 2, kind: "use", desc: "Drinking enough liquids is a healthy habit during your period." },
    pants:     { name: "Spare pants", icon: "pants", stack: 1, slots: 2, kind: "gear", desc: "Backup if you leak." },
    swim:      { name: "Swimsuit", icon: "swim", stack: 1, kind: "gear", desc: "For swim practice." }
  };
  window.BAG_SLOTS = 6;
  window.FLOW_RATE = { none: 0, spotting: 0.3, light: 0.6, medium: 1, heavy: 1.7 };

  window.LOOKS = {
    ruby:   { skin: "#c68a5e", hair: "#2b1d1a", style: "long", shirt: "#3f8f8a", pants: "#2f3d63", shoes: "#efe6d2" },
    mom:     { skin: "#bd8056", hair: "#33241f", style: "bun", shirt: "#9a3f4f", pants: "#4a4458" },
    riyansh: { skin: "#b37a51", hair: "#1f1a1a", style: "cap", cap: "#c94a3c", shirt: "#7c8798", pants: "#b49a6e" },
    keshav:  { skin: "#9e6640", hair: "#1c1716", style: "curly", shirt: "#34507a", pants: "#3b3846", glasses: true },
    zach:    { skin: "#efc49c", hair: "#d8b15a", style: "short", shirt: "#c43f3a", pants: "#2f3d63" },
    nurse:   { skin: "#d7a171", hair: "#5a3a26", style: "bun", shirt: "#4fa3a8", pants: "#4fa3a8" },
    patel:   { skin: "#8f5f3d", hair: "#a7a4ab", style: "short", shirt: "#5d7a4b", pants: "#4b4a52", glasses: true },
    dee:     { skin: "#6e4329", hair: "#1d1715", style: "curly", shirt: "#e0b04a", pants: "#3b3846", apron: "#3f7d3a" },
    lin:     { skin: "#f0cfa6", hair: "#191516", style: "short", shirt: "#6a8fbf", pants: "#4b4a52", coat: true, glasses: true },
    coach:   { skin: "#e3b089", hair: "#6b4a33", style: "cap", cap: "#2f3d63", shirt: "#2f3d63", pants: "#2f3d63" },
    t1:      { skin: "#e8b98f", hair: "#8a5a2e", style: "long", shirt: "#e88a3a", pants: "#3b3846" },
    t2:      { skin: "#7a4b2e", hair: "#151212", style: "short", shirt: "#58a65c", pants: "#57586b" },
    t3:      { skin: "#f1d0aa", hair: "#cfcac2", style: "bun", shirt: "#7a62c9", pants: "#4a4458" },
    t4:      { skin: "#a86b45", hair: "#2a1d18", style: "pony", shirt: "#e58fa0", pants: "#2f3d63" }
  };

  // ---------- map builder ----------
  const grid = (w, h, ch) => Array.from({ length: h }, () => Array(w).fill(ch));
  const R = (g, x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[0].length) g[j][i] = ch; };
  const S = (g, x, y, ch) => R(g, x, y, 1, 1, ch);
  const box = (g, w, h) => { R(g, 0, 0, w, 2, "#"); R(g, 0, 0, 1, h, "#"); R(g, w - 1, 0, 1, h, "#"); R(g, 0, h - 1, w, 1, "#"); };
  function objs(list, kind, cells, data) { cells.forEach(([x, y]) => list.push({ x, y, kind, data })); }
  const span = (x, y, w, h = 1) => { const a = []; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) a.push([i, j]); return a; };

  const MAPS = {};

  // HOME
  {
    const g = grid(20, 9, "."), o = [];
    box(g, 20, 9);
    R(g, 10, 2, 1, 4, "#"); R(g, 14, 2, 1, 4, "#"); R(g, 10, 5, 5, 1, "#"); R(g, 11, 2, 3, 3, "_"); S(g, 12, 5, "_");
    S(g, 11, 2, "t"); S(g, 12, 2, "x");
    R(g, 1, 2, 2, 2, "b"); R(g, 4, 2, 2, 1, "d"); R(g, 7, 2, 2, 1, "o"); R(g, 3, 4, 4, 2, "K"); S(g, 1, 6, "q"); S(g, 9, 2, "q");
    R(g, 15, 2, 3, 1, "k"); S(g, 18, 2, "n"); R(g, 16, 4, 2, 2, "m");
    S(g, 8, 8, "D");
    objs(o, "bed", span(1, 2, 2, 2)); objs(o, "desk", span(4, 2, 2)); objs(o, "closet", span(7, 2, 2));
    objs(o, "bath", [[11, 2], [12, 2]], { home: true }); objs(o, "fridge", [[18, 2]]); objs(o, "kitchen", span(15, 2, 3));
    objs(o, "table", span(16, 4, 2, 2));
    MAPS.home = { id: "home", name: "Home", floor: ".", t: g, objects: o,
      bathAreas: [{ x: 11, y: 2, w: 3, h: 4, home: true }],
      warps: [{ x: 8, y: 8, to: "town", tx: 5, ty: 5, dir: "down" }] };
  }

  // TOWN
  {
    const W = 44, H = 15, g = grid(W, H, "g"), o = [];
    R(g, 0, 0, W, 1, "T"); R(g, 0, H - 1, W, 1, "T"); R(g, 0, 0, 1, H, "T"); R(g, W - 1, 0, 1, H, "T");
    const bld = (x, w, roof, fac, door, wins) => {
      R(g, x, 1, w, 3, roof); R(g, x, 4, w, 1, fac);
      wins.forEach((wx) => S(g, wx, 4, "v")); S(g, door, 4, "D");
    };
    bld(2, 6, "R", "H", 5, [3, 7]);
    bld(10, 8, "U", "A", 14, [11, 12, 16]);
    bld(20, 13, "Y", "B", 26, [21, 22, 24, 28, 30, 31]);
    bld(35, 7, "O", "Z", 38, [36, 40]);
    for (const [x, y] of [[8, 1], [9, 3], [18, 1], [19, 3], [33, 1], [34, 3], [42, 2]]) S(g, x, y, "T");
    R(g, 8, 2, 1, 1, "f"); R(g, 18, 3, 1, 1, "f");
    R(g, 1, 5, W - 2, 1, "p"); R(g, 1, 6, W - 2, 2, "r"); R(g, 1, 8, W - 2, 1, "p");
    R(g, 13, 6, 1, 2, "z"); R(g, 14, 6, 1, 2, "z"); R(g, 30, 6, 2, 2, "z");
    for (const x of [9, 19, 34]) S(g, x, 5, "l");
    for (const x of [4, 24, 40]) S(g, x, 8, "l");
    for (const [x, y] of [[2, 10], [6, 12], [11, 10], [36, 12], [41, 10], [14, 13], [34, 13]]) S(g, x, y, "T");
    R(g, 3, 11, 2, 1, "f"); R(g, 8, 10, 3, 1, "f"); R(g, 38, 9, 2, 1, "f");
    // Maple Park: fenced, with a gate and sign off the sidewalk, a path, benches and a pond.
    R(g, 16, 9, 17, 1, "F"); R(g, 16, 10, 1, 4, "F"); R(g, 32, 10, 1, 4, "F");
    R(g, 18, 9, 2, 1, "p"); S(g, 20, 9, "J");
    R(g, 18, 10, 2, 3, "p"); R(g, 17, 13, 15, 1, "p");
    R(g, 22, 10, 6, 3, "w");
    R(g, 20, 10, 2, 1, "h"); R(g, 29, 12, 2, 1, "h");
    S(g, 17, 10, "T"); S(g, 31, 10, "T"); R(g, 28, 10, 2, 1, "f"); S(g, 17, 12, "f"); R(g, 20, 12, 2, 1, "f");
    objs(o, "bench", span(20, 10, 2)); objs(o, "bench", span(29, 12, 2)); objs(o, "pond", span(22, 10, 6, 3)); objs(o, "parksign", [[20, 9]]);
    MAPS.town = { id: "town", name: "Maple Street", floor: "g", outdoor: true, t: g, objects: o,
      labels: { "5,4": "Home: pack + sleep", "14,4": "Corner Mart: buy supplies", "26,4": "School: health class", "38,4": "Pool: swim practice", "19,9": "Maple Park" },
      bathAreas: [],
      warps: [
        { x: 5, y: 4, to: "home", tx: 8, ty: 7, dir: "up" },
        { x: 14, y: 4, to: "mart", tx: 7, ty: 9, dir: "up" },
        { x: 26, y: 4, to: "school", tx: 14, ty: 11, dir: "up" },
        { x: 38, y: 4, to: "pool", tx: 9, ty: 10, dir: "up" }
      ] };
  }

  // SCHOOL
  {
    const W = 30, H = 13, g = grid(W, H, ","), o = [];
    box(g, W, H);
    R(g, 1, 6, W - 2, 1, "#"); S(g, 6, 6, ","); S(g, 17, 6, ","); S(g, 24, 6, "_");
    R(g, 13, 2, 1, 4, "#"); R(g, 20, 2, 1, 4, "#");
    R(g, 3, 1, 6, 1, "="); R(g, 10, 2, 2, 1, "y");
    for (const [x, y] of [[2, 3], [4, 3], [6, 3], [8, 3], [2, 5], [4, 5], [9, 5], [11, 5]]) S(g, x, y, "d");
    R(g, 14, 2, 1, 2, "b"); R(g, 16, 2, 2, 1, "d"); R(g, 18, 2, 2, 1, "o"); S(g, 15, 1, "I");
    R(g, 21, 2, 8, 4, "_");
    for (const x of [22, 24, 26]) S(g, x, 2, "t");
    for (const x of [23, 25, 27]) S(g, x, 2, "X");
    S(g, 28, 4, "x"); S(g, 28, 5, "x"); S(g, 21, 1, "j");
    R(g, 1, 7, 4, 1, "L"); R(g, 8, 7, 8, 1, "L"); R(g, 19, 7, 4, 1, "L"); R(g, 26, 7, 3, 1, "L");
    S(g, 2, 11, "a"); S(g, 1, 11, "q"); S(g, 28, 11, "q"); R(g, 20, 11, 2, 1, "o"); S(g, 10, 6, "I");
    S(g, 14, 12, "D"); S(g, 15, 12, "D");
    objs(o, "seat", [[6, 3]]);
    objs(o, "desk_s", [[2, 3], [4, 3], [8, 3], [2, 5], [4, 5], [9, 5], [11, 5]]);
    objs(o, "tdesk", span(10, 2, 2)); objs(o, "board", span(3, 1, 6));
    objs(o, "cot", span(14, 2, 1, 2)); objs(o, "poster", [[15, 1]]);
    objs(o, "bath", [[22, 2], [24, 2], [26, 2], [28, 4], [28, 5]]);
    objs(o, "dispenser", [[21, 1]]); objs(o, "fountain", [[2, 11]]);
    objs(o, "locker", [...span(1, 7, 4), ...span(8, 7, 8), ...span(19, 7, 4), ...span(26, 7, 3)]);
    objs(o, "notice", [[10, 6]]); objs(o, "trophy", span(20, 11, 2));
    MAPS.school = { id: "school", name: "Lincoln Middle School", floor: ",", t: g, objects: o,
      bathAreas: [{ x: 21, y: 2, w: 8, h: 5 }],
      areas: [{ name: "Room 104", x: 1, y: 2, w: 12, h: 4 }, { name: "Dr. Flo's Office", x: 14, y: 2, w: 6, h: 4 }, { name: "Girls' Restroom", x: 21, y: 2, w: 8, h: 4 }],
      warps: [{ x: 14, y: 12, to: "town", tx: 26, ty: 5, dir: "down" }, { x: 15, y: 12, to: "town", tx: 26, ty: 5, dir: "down" }] };
  }

  // CORNER MART
  {
    const W = 16, H = 11, g = grid(W, H, ","), o = [];
    box(g, W, H);
    R(g, 2, 3, 5, 1, "S"); R(g, 9, 3, 3, 1, "S"); R(g, 2, 6, 5, 1, "S"); R(g, 9, 6, 3, 1, "S");
    R(g, 13, 3, 2, 1, "C"); R(g, 10, 8, 3, 1, "C"); S(g, 11, 8, "G");
    S(g, 1, 9, "t"); S(g, 2, 9, "x"); R(g, 3, 8, 1, 2, "X"); S(g, 14, 9, "q");
    S(g, 7, 10, "D");
    objs(o, "shelf", span(2, 3, 5), "period"); objs(o, "shelf", span(9, 3, 3), "comfort");
    objs(o, "shelf", span(2, 6, 5), "snacks"); objs(o, "shelf", span(9, 6, 3), "drinks");
    objs(o, "bath", [[1, 9], [2, 9]]);
    MAPS.mart = { id: "mart", name: "Corner Mart", floor: ",", t: g, objects: o,
      bathAreas: [{ x: 1, y: 8, w: 2, h: 1 }],
      warps: [{ x: 7, y: 10, to: "town", tx: 14, ty: 5, dir: "down" }] };
  }

  // POOL
  {
    const W = 20, H = 12, g = grid(W, H, ":"), o = [];
    box(g, W, H);
    R(g, 3, 4, 11, 5, "w");
    S(g, 15, 2, "X"); S(g, 15, 4, "X"); R(g, 16, 2, 3, 3, "_");
    R(g, 16, 2, 2, 1, "L"); S(g, 18, 2, "t"); S(g, 18, 4, "x");
    R(g, 3, 10, 3, 1, "h"); S(g, 1, 10, "q"); S(g, 18, 10, "q");
    S(g, 9, 11, "D");
    objs(o, "bath", [[18, 2], [18, 4]]); objs(o, "locker", span(16, 2, 2)); objs(o, "bench", span(3, 10, 3));
    objs(o, "pool", span(3, 4, 11, 5));
    MAPS.pool = { id: "pool", name: "Community Pool", floor: ":", t: g, objects: o,
      bathAreas: [{ x: 15, y: 2, w: 4, h: 3 }],
      warps: [{ x: 9, y: 11, to: "town", tx: 38, ty: 5, dir: "down" }] };
  }

  for (const id in MAPS) { const m = MAPS[id]; m.h = m.t.length; m.w = m.t[0].length; }
  window.MAPS = MAPS;
  window.SOLID = new Set("#=IjbdyotxXknmqLSCGTRUYOHABZvwhlFaJ".split(""));
})();
