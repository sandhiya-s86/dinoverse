/* ===========================================================
   DINOVERSE — The Last Dino on Earth
   Vanilla JS + Canvas. 100% offline, zero dependencies.
   =========================================================== */
'use strict';
(function () {
const $ = s => document.querySelector(s);

/* ---------- safe storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('dinoverse.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dinoverse.' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- deterministic pseudo-random (stable scenery) ---------- */
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ===========================================================
   THEMES — one engine, six worlds
   =========================================================== */
const THEMES = [
  { id:'dunes', name:'GOLDEN DUNES', kind:'dune', night:false,
    sky:['#2d1b4e','#ff7b54','#ffb45c','#ffd98a'], sun:'#fff0c4', sunY:.56,
    far:'#6b3f6e', near:'#a4506a', gnd:['#f2b562','#c97f3e','#8c4f27'],
    obs:['#2f7d52','#1d5436','#9be38a'], gem:'#ffd166', pcol:'#ffd9a0', ptype:'dust',
    card:'linear-gradient(180deg,#2d1b4e,#ff7b54 55%,#ffd98a)', cardG:'#c97f3e' },
  { id:'jungle', name:'JUNGLE PARADISE', kind:'palm', night:false,
    sky:['#0e8f8f','#2ed3c3','#7df0cf','#f4ffd9'], sun:'#fffbd0', sunY:.5,
    far:'#136b55','near':'#1d8f63', gnd:['#54d17a','#2a9a52','#145c32'],
    obs:['#1f8f4e','#0d5c30','#b6ff7a'], gem:'#36ffd0', pcol:'#b7ff9e', ptype:'leaf',
    card:'linear-gradient(180deg,#0e8f8f,#2ed3c3 55%,#f4ffd9)', cardG:'#2a9a52' },
  { id:'candy', name:'CANDY KINGDOM', kind:'lolli', night:false,
    sky:['#ff8fd0','#ffb3e6','#e8c4ff','#fff0fb'], sun:'#fffaf0', sunY:.46,
    far:'#c98ae0', near:'#ff9ed2', gnd:['#ffd6f0','#ff9ed6','#d667a8'],
    obs:['#ff6fae','#c43c82','#fff3b0'], gem:'#ff4fd8', pcol:'#fff0fa', ptype:'sparkle',
    card:'linear-gradient(180deg,#ff8fd0,#e8c4ff 55%,#fff0fb)', cardG:'#ff9ed6' },
  { id:'volcano', name:'VOLCANO RUSH', kind:'volcano', night:true,
    sky:['#3d0f1c','#9e1d1d','#e85418','#ffae55'], sun:'#ffc46b', sunY:.62,
    far:'#4a2234', near:'#6e2c33', gnd:['#8a6158','#4e3537','#2a1a1d'],
    obs:['#8a4038','#4a1f1c','#ff9a3f'], gem:'#ffb13d', pcol:'#ff8a3f', ptype:'ember',
    card:'linear-gradient(180deg,#3d0f1c,#e85418 60%,#ffae55)', cardG:'#4e3537' },
  { id:'neon', name:'NEON CYBER CITY', kind:'city', night:true,
    sky:['#17093f','#3a1180','#6a24c4','#b54ae8'], sun:'#ff5fe0', sunY:.52,
    far:'#2f1a7a', near:'#4426a8', gnd:['#4a2a9e','#2a1763','#140a30'],
    obs:['#4426a8','#241253','#49f6ff'], gem:'#49f6ff', pcol:'#49f6ff', ptype:'digital',
    card:'linear-gradient(180deg,#17093f,#6a24c4 60%,#b54ae8)', cardG:'#2a1763' },
  { id:'rainbow', name:'RAINBOW SKY', kind:'island', night:false,
    sky:['#6a5bff','#38b6ff','#8ef5c6','#ffe79e'], sun:'#ffffff', sunY:.42,
    far:'#7a6bff', near:'#ff8fc8', gnd:['#b4f0ff','#7bc8ff','#5a86e0'],
    obs:['#ff7bd5','#8b5cf6','#ffe066'], gem:'#ffffff', pcol:'#ffffff', ptype:'star',
    card:'linear-gradient(180deg,#6a5bff,#8ef5c6 62%,#ffe79e)', cardG:'#7bc8ff' }
];

/* ===========================================================
   SKINS + ACCESSORIES
   =========================================================== */
const SKINS = [
  { id:'jungle',  name:'JUNGLE GREEN',   body:'#4fd98a', belly:'#d8ffe8', dark:'#1f8a52', cost:0 },
  { id:'ocean',   name:'OCEAN BLUE',     body:'#4db8ff', belly:'#dff2ff', dark:'#1f6fb8', cost:0 },
  { id:'purple',  name:'ELECTRIC PURPLE',body:'#a97bff', belly:'#eee2ff', dark:'#6b3fc4', cost:0 },
  { id:'pink',    name:'BUBBLEGUM PINK', body:'#ff8fc8', belly:'#ffe4f3', dark:'#c4457f', cost:0 },
  { id:'orange',  name:'SUNSET ORANGE',  body:'#ff9752', belly:'#ffe6cf', dark:'#c45a1f', cost:0 },
  { id:'gold',    name:'GOLDEN YELLOW',  body:'#ffd24d', belly:'#fff5d0', dark:'#c49518', cost:0 },
  { id:'rainbow', name:'RAINBOW MODE',   body:'#ff6fae', belly:'#ffffff', dark:'#7a3fb8', cost:30, rainbow:true },
  { id:'void',    name:'VOID CRYSTAL',   body:'#2a2a4e', belly:'#36f0ff', dark:'#12122a', cost:60, glow:'#36f0ff' }
];
const ACCS = [
  { id:'none', name:'NONE' }, { id:'shades', name:'SUNGLASSES' },
  { id:'crown', name:'CROWN' }, { id:'hat', name:'PARTY HAT' }
];

/* ===========================================================
   AUDIO (Web Audio, generated — no files)
   =========================================================== */
const Sfx = {
  ctx:null, on:store.get('sound', true),
  boot() { if (this.ctx) return; try { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); } catch (e) {} },
  play(type, freq, dur, vol, slide) {
    if (!this.on) return; this.boot(); const c = this.ctx; if (!c) return;
    try {
      if (c.state === 'suspended') c.resume();
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  },
  jump()  { this.play('square',   440, .16, .13, 880); },
  flap()  { this.play('triangle', 230, .09, .055, 150); },
  land()  { this.play('triangle', 180, .09, .08, 110); },
  gem()   { this.play('sine',     900, .16, .14, 1700); },
  combo(n){ this.play('sine',     700 + n * 90, .12, .11, 1400 + n * 110); },
  hit()   { this.play('sawtooth', 260, .45, .17, 60); },
  ui()    { this.play('triangle', 620, .06, .07, 760); },
  shield(){ this.play('sine',     300, .3,  .12, 1200); }
};

/* ===========================================================
   CANVAS / VIEWPORT
   =========================================================== */
const cvs = $('#cvs'), ctx = cvs.getContext('2d');
let DPR = 1, VW = 960, VH = 420, SC = 1, groundY = 340;

function resize() {
  const r = $('#stage').getBoundingClientRect();
  const w = Math.max(240, r.width), h = Math.max(200, r.height);
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cvs.width = Math.round(w * DPR); cvs.height = Math.round(h * DPR);
  VH = 420; SC = h / VH; VW = w / SC;
  if (VW > 1120) { SC = w / 1120; VW = 1120; VH = h / SC; }
  if (VW < 500)  { SC = w / 500;  VW = 500;  VH = h / SC; }
  ctx.setTransform(SC * DPR, 0, 0, SC * DPR, 0, 0);
  groundY = VH - clamp(VH * 0.19, 62, 110);
  if (G) G.dino.feet = Math.min(G.dino.feet, groundY);
}

/* ===========================================================
   GAME STATE
   =========================================================== */
const DINO_X_RATIO = 0.17;
let G = null, state = 'menu', last = 0, started = false;

function freshState() {
  return {
    dino:{ x:0, feet:groundY, vy:0, grounded:true, duck:false, phase:0, coyote:0, buffer:0,
           pose:'run', squash:0, hitT:0, pickT:0, hold:false, flying:false, flap:0 },
    obs:[], gems:[], parts:[], floats:[],
    speed:320, score:0, dist:0, runGems:0, combo:0, comboT:0,
    fly:1, flapT:0,
    obsT:0.9, gemT:1.6, dustT:0, shield:0, stage:1, tint:0,
    shake:0, flash:0, scroll:0, t:0, dead:false
  };
}

const Save = {
  best:store.get('best', 0),
  gems:store.get('gems', 0),
  skin:store.get('skin', 'jungle'),
  acc:store.get('acc', 'none'),
  world:store.get('world', 'jungle'),
  owned:store.get('owned', ['jungle','ocean','purple','pink','orange','gold'])
};
if (!Array.isArray(Save.owned)) Save.owned = ['jungle','ocean','purple','pink','orange','gold'];

const theme = () => THEMES.find(t => t.id === Save.world) || THEMES[1];
const skin  = () => SKINS.find(s => s.id === Save.skin)  || SKINS[0];

/* ===========================================================
   PARTICLES / FLOATERS  (hard-capped)
   =========================================================== */
const MAX_P = 240;
function spark(x, y, n, col, opt) {
  opt = opt || {};
  for (let i = 0; i < n && G.parts.length < MAX_P; i++) {
    const a = opt.ang != null ? opt.ang + (Math.random() - .5) * (opt.spread || 2) : Math.random() * Math.PI * 2;
    const sp = (opt.sp || 90) * (.35 + Math.random() * .9);
    G.parts.push({ x, y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp, life:opt.life || .6,
      max:opt.life || .6, r:(opt.r || 3) * (.5 + Math.random()), col, g:opt.g == null ? 220 : opt.g, sq:opt.sq });
  }
}
function floatTxt(x, y, txt, col) {
  if (G.floats.length > 18) G.floats.shift();
  G.floats.push({ x, y, txt, col, life:.95, max:.95 });
}
function updateParticles(dt) {
  for (let i = G.parts.length - 1; i >= 0; i--) {
    const p = G.parts[i]; p.life -= dt;
    if (p.life <= 0) { G.parts.splice(i, 1); continue; }
    p.x += (p.vx - G.speed * .35) * dt; p.y += p.vy * dt; p.vy += p.g * dt;
  }
  for (let i = G.floats.length - 1; i >= 0; i--) {
    const f = G.floats[i]; f.life -= dt; f.y -= 42 * dt;
    if (f.life <= 0) G.floats.splice(i, 1);
  }
}

/* ===========================================================
   SPAWNING
   =========================================================== */
function spawnObstacle() {
  const r = Math.random(), hard = Math.min(1, G.score / 1400);
  let o;
  if (r < .46) {                                   // cactus / foliage cluster
    const n = 1 + (Math.random() < .35 + hard * .3 ? 1 : 0) + (Math.random() < hard * .35 ? 1 : 0);
    o = { kind:'cactus', n, w:12 + n * 11, h:34 + Math.random() * 16 };
  } else if (r < .74) {                            // boulder / barrier
    o = { kind:'rock', w:34 + Math.random() * 22, h:24 + Math.random() * 12 };
  } else {                                         // flyer: low (jump) or head-height (duck)
    const high = Math.random() < .5;
    // sky patrol -> only a threat while flying;  high = head height -> DUCK;  low -> JUMP
    const sky = Math.random() < .3;
    o = { kind:'flyer', w:38, h:22, fly:sky ? 120 + Math.random() * 60 : high ? 30 : 6, wing:0, high, sky };
  }
  o.x = VW + 40; o.y = groundY;
  G.obs.push(o);
  const gap = (G.speed * .62) + 110 + Math.random() * 190 - hard * 60;
  G.obsT = gap / G.speed;
}
function spawnCrystal() {
  const shield = G.shield <= 0 && Math.random() < .12;
  const sky = !shield && Math.random() < .3;              // high line — fly up to reach these
  if (sky) {                                              // a short arc of 3 sky crystals
    const base = groundY - (130 + Math.random() * 70);
    for (let i = 0; i < 3; i++)
      G.gems.push({ x:VW + 30 + i * 46, y:base - Math.sin(i / 2 * Math.PI) * 26, r:11, t:i * .7, sky:true });
    G.gemT = 1.6 + Math.random() * 2;
    return;
  }
  G.gems.push({ x:VW + 30, y:groundY - (38 + Math.random() * 78), r:11, t:Math.random() * 6, shield });
  G.gemT = .9 + Math.random() * 2.1;
}

/* ===========================================================
   UPDATE
   =========================================================== */
function update(dt) {
  const d = G.dino;
  G.t += dt;
  d.x = VW * DINO_X_RATIO;

  if (state === 'dying' || state === 'over') {     // freeze the run, keep the impact alive
    updateParticles(dt);
    G.shake = Math.max(0, G.shake - dt * 3.2);
    G.flash = Math.max(0, G.flash - dt * 3.6);
    return;
  }
  if (state !== 'running') {                       // idle breathing on menus
    d.phase += dt * 2.2; d.flap += dt * 2.2; d.feet = groundY; d.pose = 'idle';
    G.scroll += 26 * dt; ambient(dt, 26); updateParticles(dt); return;
  }

  /* difficulty + score */
  G.speed = 320 + Math.min(330, G.score * .34);
  G.scroll += G.speed * dt;
  G.dist += G.speed * dt / 26;
  G.score += G.speed * dt * .052;

  const st = G.score > 1500 ? 3 : G.score > 650 ? 2 : 1;
  G.stage = st;
  G.tint = lerp(G.tint, (st - 1) / 2, dt * .6);     // smooth stage transition

  /* physics */
  d.coyote -= dt; d.buffer -= dt;

  /* ---- FLIGHT: hold jump in the air to flap. Energy-limited, ceiling-limited. ---- */
  const ceiling = 100;
  d.flying = !d.grounded && d.hold && G.fly > 0 && d.feet > ceiling && d.vy > -420;
  if (d.flying) {
    d.vy = Math.max(-300, d.vy - 1800 * dt);
    G.fly = Math.max(0, G.fly - dt * 0.6);
    d.flap += dt * 26;
    G.flapT -= dt;
    if (G.flapT <= 0) {
      G.flapT = .17; Sfx.flap();
      spark(d.x - 16, d.feet - 30, 2, theme().pcol,
            { ang:Math.PI * .5, spread:1.3, sp:80, life:.34, r:2.3, g:70 });
    }
  } else d.flap += dt * (d.grounded ? 3.5 : 9);
  if (d.grounded) G.fly = Math.min(1, G.fly + dt * 0.5);

  if (!d.grounded || d.vy < 0) { d.vy += 2050 * dt; d.feet += d.vy * dt; }
  if (d.feet >= groundY) {
    if (!d.grounded) {                               // landing
      spark(d.x, groundY, 7, theme().pcol, { ang:-Math.PI / 2, spread:2.2, sp:110, life:.4, r:2.6 });
      d.squash = 1; Sfx.land();
    }
    d.feet = groundY; d.vy = 0; d.grounded = true; d.coyote = .1;
  } else d.grounded = false;

  if (d.buffer > 0 && (d.grounded || d.coyote > 0)) doJump();
  d.squash = Math.max(0, d.squash - dt * 5);
  d.hitT = Math.max(0, d.hitT - dt);
  d.pickT = Math.max(0, d.pickT - dt);
  d.pose = d.flying ? 'fly' : d.grounded ? (d.duck ? 'duck' : 'run') : (d.vy < 0 ? 'jump' : 'fall');
  d.phase += (d.grounded && !d.duck ? G.speed * .024 : 4) * dt;

  /* running dust */
  G.dustT -= dt;
  if (d.grounded && G.dustT <= 0) {
    G.dustT = .07;
    spark(d.x - 12, groundY - 1, 1, theme().pcol, { ang:Math.PI * 1.15, spread:.8, sp:60, life:.35, r:2.4, g:40 });
  }

  /* shield */
  if (G.shield > 0) {
    G.shield -= dt;
    $('#shieldTime').textContent = Math.max(0, G.shield).toFixed(1);
    if (G.shield <= 0) $('#shieldBadge').classList.add('hidden');
  }

  /* combo decay */
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }

  /* spawn + move */
  G.obsT -= dt; if (G.obsT <= 0) spawnObstacle();
  G.gemT -= dt; if (G.gemT <= 0) spawnCrystal();
  for (let i = G.obs.length - 1; i >= 0; i--) {
    const o = G.obs[i]; o.x -= G.speed * dt;
    if (o.kind === 'flyer') { o.wing += dt * 13; o.x -= G.speed * .18 * dt; }
    if (o.x + o.w < -60) G.obs.splice(i, 1);
  }
  for (let i = G.gems.length - 1; i >= 0; i--) {
    const c = G.gems[i]; c.x -= G.speed * dt; c.t += dt * 3;
    if (c.x < -40) G.gems.splice(i, 1);
  }

  checkCollisions();
  updateParticles(dt);
  ambient(dt, G.speed);
  G.shake = Math.max(0, G.shake - dt * 3.2);
  G.flash = Math.max(0, G.flash - dt * 3.6);
  syncHud();
}

function dinoBox() {
  const d = G.dino, duck = d.pose === 'duck';
  const w = duck ? 36 : 26, h = duck ? 27 : 44;
  return { x:d.x - w / 2 + 1, y:d.feet - h, w:w - 2, h:h - 2 };
}
function obsBox(o) {
  if (o.kind === 'flyer') return { x:o.x + 7, y:o.y - o.fly - o.h + 4, w:o.w - 14, h:o.h - 7 };
  if (o.kind === 'rock')  return { x:o.x + 4, y:o.y - o.h + 3, w:o.w - 8, h:o.h - 4 };
  return { x:o.x + 3, y:o.y - o.h, w:o.w - 6, h:o.h };
}
const hits = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function checkCollisions() {
  const db = dinoBox();
  for (let i = 0; i < G.obs.length; i++) {
    if (hits(db, obsBox(G.obs[i]))) {
      if (G.shield > 0) {
        G.shield = 0; $('#shieldBadge').classList.add('hidden');
        G.obs.splice(i, 1); G.shake = .5; G.flash = .4;
        spark(G.dino.x, G.dino.feet - 22, 26, '#36f0ff', { sp:200, life:.6, r:3.4, g:0 });
        floatTxt(G.dino.x, G.dino.feet - 60, 'SHIELD BROKE!', '#36f0ff'); Sfx.shield();
        return;
      }
      return gameOver();
    }
  }
  for (let i = G.gems.length - 1; i >= 0; i--) {
    const c = G.gems[i];
    if (hits(db, { x:c.x - c.r, y:c.y - c.r, w:c.r * 2, h:c.r * 2 })) {
      G.gems.splice(i, 1);
      G.dino.pickT = .32;
      if (c.shield) {
        G.shield = 7; Sfx.shield();
        $('#shieldBadge').classList.remove('hidden');
        floatTxt(c.x, c.y - 14, 'SHIELD +7s', '#36f0ff');
        spark(c.x, c.y, 22, '#36f0ff', { sp:170, life:.7, r:3, g:0 });
      } else {
        G.combo++; G.comboT = 2.4;
        G.fly = Math.min(1, G.fly + (c.sky ? .22 : .14));   // crystals refuel flight
        const bonus = (c.sky ? 15 : 10) * Math.min(5, G.combo);
        G.score += bonus; G.runGems++; Save.gems++;
        store.set('gems', Save.gems);
        floatTxt(c.x, c.y - 12, (G.combo > 1 ? 'x' + G.combo + '  ' : '') + '+' + bonus, theme().gem);
        spark(c.x, c.y, 18, theme().gem, { sp:150, life:.62, r:2.8, g:30, sq:1 });
        G.combo > 1 ? Sfx.combo(G.combo) : Sfx.gem();
      }
    }
  }
}

/* ambient world particles (leaves / embers / sparkles / data) */
function ambient(dt, sp) {
  const th = theme();
  if (G.parts.length > MAX_P - 50) return;
  const rate = th.ptype === 'ember' ? .055 : th.ptype === 'digital' ? .07 : .1;
  G._amb = (G._amb || 0) - dt;
  if (G._amb > 0) return;
  G._amb = rate;
  const up = th.ptype === 'ember' || th.ptype === 'digital' || th.ptype === 'sparkle' || th.ptype === 'star';
  G.parts.push({
    x:VW + 10 + Math.random() * 40,
    y:up ? groundY - Math.random() * 20 : Math.random() * groundY * .7,
    vx:-20 - Math.random() * 30, vy:up ? -30 - Math.random() * 60 : 12 + Math.random() * 18,
    life:2.4, max:2.4, r:1.6 + Math.random() * 2.2, col:th.pcol, g:up ? -8 : 10, sq:th.ptype === 'digital' ? 1 : 0
  });
}

/* ===========================================================
   DRAWING — background
   =========================================================== */
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawBackground() {
  const th = theme(), night = th.night || G.tint > .55;
  /* sky */
  const g = ctx.createLinearGradient(0, 0, 0, groundY + 30);
  th.sky.forEach((c, i) => g.addColorStop(i / (th.sky.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);

  /* stage tint: deepen to night / neon as score grows */
  if (G.tint > .01) {
    ctx.globalAlpha = G.tint * .5;
    const t2 = ctx.createLinearGradient(0, 0, 0, groundY);
    t2.addColorStop(0, '#0a0526'); t2.addColorStop(1, 'rgba(60,20,110,.1)');
    ctx.fillStyle = t2; ctx.fillRect(0, 0, VW, groundY); ctx.globalAlpha = 1;
  }

  /* stars */
  if (night || G.tint > .25) {
    const a = th.night ? .8 : G.tint;
    for (let i = 0; i < 46; i++) {
      const x = (hash(i) * VW * 1.4 - G.scroll * .012) % (VW + 20);
      const y = hash(i + 90) * groundY * .62;
      const tw = .45 + .55 * Math.abs(Math.sin(G.t * 1.6 + i));
      ctx.globalAlpha = a * tw; ctx.fillStyle = '#fff';
      ctx.fillRect((x + VW + 20) % (VW + 20), y, 1.8, 1.8);
    }
    ctx.globalAlpha = 1;
  }

  /* sun / moon */
  const sx = VW * .76, sy = groundY * th.sunY, sr = Math.min(VW, VH) * .085;
  const gg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4.2);
  gg.addColorStop(0, th.sun); gg.addColorStop(.18, th.sun); gg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = .55; ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(sx, sy, sr * 4.2, 0, 7); ctx.fill();
  ctx.globalAlpha = 1; ctx.fillStyle = th.sun;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
  if (th.night || G.tint > .6) { ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.arc(sx + sr * .42, sy - sr * .3, sr * .22, 0, 7);
    ctx.arc(sx - sr * .3, sy + sr * .3, sr * .15, 0, 7); ctx.fill(); }

  /* clouds */
  ctx.fillStyle = th.night ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.42)';
  for (let i = 0; i < 6; i++) {
    const sp = 14 + (i % 3) * 7;
    let x = (hash(i + 7) * (VW + 300) - G.scroll * sp * .01) % (VW + 300) - 150;
    if (x < -150) x += VW + 300;
    const y = 26 + hash(i + 21) * groundY * .34, s = .6 + hash(i + 33) * .8;
    ctx.beginPath();
    ctx.arc(x, y, 17 * s, 0, 7); ctx.arc(x + 20 * s, y - 7 * s, 22 * s, 0, 7);
    ctx.arc(x + 44 * s, y, 16 * s, 0, 7); ctx.rect(x - 14 * s, y, 62 * s, 15 * s);
    ctx.fill();
  }

  /* mountain layers */
  mountains(th.far, .06, groundY * .62, groundY * .26, 190, 0);
  mountains(th.near, .13, groundY * .80, groundY * .18, 140, 51);
  /* scenery silhouettes */
  scenery(th);
  drawGround(th);
}

function mountains(col, par, baseY, amp, step, seed) {
  const off = G.scroll * par;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, groundY + 4);
  const n = Math.ceil(VW / step) + 3;
  for (let i = 0; i <= n; i++) {
    const idx = Math.floor(off / step) + i;
    const x = idx * step - off;
    ctx.lineTo(x - step * .5, baseY + amp * .25);
    ctx.lineTo(x, baseY - amp * (.45 + hash(idx + seed) * .55));
  }
  ctx.lineTo(VW + 20, groundY + 4); ctx.closePath(); ctx.fill();
}

function scenery(th) {
  const step = 170, off = G.scroll * .3, n = Math.ceil(VW / step) + 2;
  for (let i = -1; i <= n; i++) {
    const idx = Math.floor(off / step) + i, x = idx * step - off + hash(idx) * 70;
    if (x < -120 || x > VW + 120) continue;
    const s = .75 + hash(idx + 5) * .6, h = 90 * s;
    ctx.save(); ctx.translate(x, groundY + 2);
    switch (th.kind) {
      case 'palm':
        ctx.strokeStyle = '#0c4f33'; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10 * s, -h * .6, 2 * s, -h); ctx.stroke();
        ctx.fillStyle = th.near;
        for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .46;
          ctx.beginPath(); ctx.moveTo(2 * s, -h);
          ctx.quadraticCurveTo(Math.cos(a) * 44 * s, -h + Math.sin(a) * 36 * s - 10,
                                Math.cos(a) * 60 * s, -h + Math.sin(a) * 20 * s + 14);
          ctx.quadraticCurveTo(Math.cos(a) * 34 * s, -h + Math.sin(a) * 22 * s, 2 * s, -h); ctx.fill(); }
        break;
      case 'lolli':
        ctx.strokeStyle = '#fff6fb'; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h * .8); ctx.stroke();
        for (let k = 0; k < 4; k++) { ctx.beginPath();
          ctx.arc(0, -h * .8 - 16 * s, (30 - k * 7) * s, 0, 7);
          ctx.fillStyle = ['#ff6fae', '#fff0fa', '#ffd166', '#c77bff'][k]; ctx.fill(); }
        break;
      case 'volcano':
        ctx.fillStyle = '#1d0f14'; ctx.beginPath();
        ctx.moveTo(-50 * s, 0); ctx.lineTo(-14 * s, -h); ctx.lineTo(14 * s, -h); ctx.lineTo(50 * s, 0); ctx.fill();
        ctx.fillStyle = '#ff7a2f'; ctx.globalAlpha = .75 + .25 * Math.sin(G.t * 3 + idx);
        ctx.beginPath(); ctx.moveTo(-13 * s, -h); ctx.lineTo(13 * s, -h);
        ctx.lineTo(6 * s, -h * .45); ctx.lineTo(-4 * s, -h * .5); ctx.fill(); ctx.globalAlpha = 1;
        break;
      case 'city': {
        const bw = 48 * s, bh = h * (.7 + hash(idx + 9) * .9);
        ctx.fillStyle = th.far; ctx.fillRect(-bw / 2, -bh, bw, bh);
        const neon = idx % 2 ? '#49f6ff' : '#ff5fe0';
        ctx.fillStyle = neon; ctx.shadowColor = neon; ctx.shadowBlur = 14;
        ctx.fillRect(-bw / 2, -bh - 3, bw, 3);
        ctx.shadowBlur = 8; ctx.globalAlpha = .92;
        for (let r2 = 0; r2 < 6; r2++) for (let c2 = 0; c2 < 3; c2++)
          if (hash(idx * 31 + r2 * 7 + c2) > .45)
            ctx.fillRect(-bw / 2 + 7 + c2 * (bw / 3.4), -bh + 10 + r2 * (bh / 7), 6 * s, 7 * s);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1; break; }
      case 'island':
        ctx.fillStyle = th.near; ctx.globalAlpha = .9;
        ctx.beginPath(); ctx.ellipse(0, -h - 20, 52 * s, 13 * s, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-50 * s, -h - 18); ctx.lineTo(50 * s, -h - 18);
        ctx.lineTo(0, -h + 26 * s); ctx.fill(); ctx.globalAlpha = 1;
        break;
      default: /* dune mesas */
        ctx.fillStyle = th.near; ctx.globalAlpha = .85;
        rr(-46 * s, -h * .7, 92 * s, h * .7, 6); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

function drawGround(th) {
  const g = ctx.createLinearGradient(0, groundY - 4, 0, VH);
  g.addColorStop(0, th.gnd[0]); g.addColorStop(.3, th.gnd[1]); g.addColorStop(1, th.gnd[2]);
  ctx.fillStyle = g; ctx.fillRect(0, groundY, VW, VH - groundY);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(0, groundY, VW, 2.5);
  /* repeating texture */
  const step = 34, off = G.scroll % step;
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  for (let x = -off; x < VW + step; x += step) {
    const i = Math.floor((x + G.scroll) / step);
    ctx.fillRect(x, groundY + 8 + hash(i) * 14, 12 + hash(i + 3) * 16, 2.4);
    if (hash(i + 11) > .72) ctx.fillRect(x + 6, groundY + 26 + hash(i) * 10, 7, 2);
  }
  if (th.id === 'neon' || G.tint > .6) {
    ctx.fillStyle = 'rgba(54,240,255,.5)';
    for (let x = -off; x < VW + step; x += step * 2) ctx.fillRect(x, groundY + 6, 18, 1.6);
  }
}

/* ===========================================================
   DRAWING — dinosaur (procedural)
   =========================================================== */
function skinColors() {
  const s = skin();
  if (s.rainbow) {
    const h = (G.t * 60) % 360;
    return { body:`hsl(${h},85%,62%)`, belly:`hsl(${(h + 40) % 360},100%,90%)`, dark:`hsl(${h},70%,38%)`, glow:`hsl(${h},90%,60%)` };
  }
  return { body:s.body, belly:s.belly, dark:s.dark, glow:s.glow };
}

function drawDinosaur(x, feetY, scl, pose, phase, col, acc, opts) {
  opts = opts || {};
  ctx.save();
  ctx.translate(x, feetY);
  if (opts.shakeHit) ctx.rotate(opts.shakeHit);
  const sq = opts.squash || 0;
  ctx.scale(scl * (1 + sq * .12), scl * (1 - sq * .16));
  if (pose === 'duck') ctx.scale(1.14, .6);
  if (pose === 'idle') { const b = Math.sin(phase) * .025; ctx.scale(1 + b, 1 - b); }

  if (col.glow) { ctx.shadowColor = col.glow; ctx.shadowBlur = 16; }

  const sw = Math.sin(phase), legA = pose === 'run' ? sw * .7 : pose === 'duck' ? .3 : -.5;
  const legB = pose === 'run' ? -sw * .7 : pose === 'duck' ? -.2 : .25;

  /* ---- dragon wings (behind the body) ---- */
  const flapP = opts.flap || 0;
  const beat = pose === 'fly' ? Math.sin(flapP) * .95
             : pose === 'jump' || pose === 'fall' ? .3 + Math.sin(flapP) * .12
             : pose === 'duck' ? -.55 : -.35 + Math.sin(flapP) * .06;
  const drawWing = (ang, col, s2) => {
    ctx.save(); ctx.translate(-3, -34); ctx.rotate(ang); ctx.scale(s2, s2);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-16, -26, -44, -23);     /* leading edge to tip */
    ctx.quadraticCurveTo(-33, -13, -28, -9);      /* scalloped trailing edge */
    ctx.quadraticCurveTo(-24, -16, -17, -5);
    ctx.quadraticCurveTo(-12, -11, -2, 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-42, -22);
    ctx.moveTo(-6, -4); ctx.lineTo(-27, -10); ctx.moveTo(-5, -2); ctx.lineTo(-17, -6);
    ctx.stroke(); ctx.restore();
  };
  drawWing(beat * .85 - .3, col.dark, .92);                 /* far wing */

  /* tail */
  ctx.fillStyle = col.body;
  ctx.beginPath(); ctx.moveTo(-10, -34);
  ctx.quadraticCurveTo(-34, -32 + (pose === 'jump' ? -8 : 0), -40, -16 + (pose === 'jump' ? -10 : 0));
  ctx.quadraticCurveTo(-26, -22, -8, -20); ctx.closePath(); ctx.fill();

  /* legs */
  const leg = (ang, dx, shade) => {
    ctx.save(); ctx.translate(dx, -16); ctx.rotate(ang);
    ctx.fillStyle = shade;
    rr(-4, 0, 8.5, 15, 3.5); ctx.fill();
    rr(-5.5, 12, 13, 5, 2.5); ctx.fill();     /* foot */
    ctx.restore();
  };
  leg(legB, 3, col.dark);
  /* body */
  ctx.fillStyle = col.body;
  rr(-15, -38, 29, 25, 11); ctx.fill();
  /* back spikes */
  ctx.fillStyle = col.dark;
  for (let i = 0; i < 3; i++) { ctx.beginPath();
    ctx.moveTo(-11 + i * 7, -37); ctx.lineTo(-7.5 + i * 7, -44); ctx.lineTo(-4 + i * 7, -37); ctx.fill(); }
  /* belly */
  ctx.fillStyle = col.belly; ctx.globalAlpha = .9;
  rr(-9, -26, 20, 13, 6.5); ctx.fill(); ctx.globalAlpha = 1;
  leg(legA, -6, col.body);

  /* neck + head */
  ctx.fillStyle = col.body;
  rr(2, -44, 12, 14, 5); ctx.fill();
  const hy = -56 + (pose === 'duck' ? 4 : 0);
  rr(1, hy, 23, 17, 7.5); ctx.fill();
  rr(17, hy + 7, 12, 9, 3.5); ctx.fill();         /* snout */
  /* nostril + mouth */
  ctx.fillStyle = col.dark; ctx.fillRect(25, hy + 9, 2, 2);
  ctx.globalAlpha = .55; rr(17, hy + 13, 11, 1.8, 1); ctx.fill(); ctx.globalAlpha = 1;
  /* eye */
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(14, hy + 6, 4.1, 0, 7); ctx.fill();
  ctx.fillStyle = '#10121f';
  const blink = opts.dead ? 0 : 1;
  if (opts.dead) { ctx.lineWidth = 1.6; ctx.strokeStyle = '#10121f';
    ctx.beginPath(); ctx.moveTo(11.6, hy + 3.6); ctx.lineTo(16.4, hy + 8.4);
    ctx.moveTo(16.4, hy + 3.6); ctx.lineTo(11.6, hy + 8.4); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(15.4, hy + 6, 2 * blink, 0, 7); ctx.fill(); }
  /* near wing — drawn over the body so the flap reads clearly */
  drawWing(beat, col.body, 1);
  ctx.globalAlpha = .18; ctx.fillStyle = '#000';
  ctx.globalAlpha = 1;

  /* tiny arm */
  ctx.fillStyle = col.dark;
  ctx.save(); ctx.translate(6, -32); ctx.rotate(pose === 'run' ? sw * .35 : -.4);
  rr(0, -2, 10, 4.6, 2.2); ctx.fill(); ctx.restore();

  /* accessory */
  ctx.shadowBlur = 0;
  if (acc === 'shades') {
    ctx.fillStyle = '#14131f'; rr(8, hy + 2.5, 18, 6.5, 2.4); ctx.fill();
    ctx.fillStyle = 'rgba(120,230,255,.55)'; rr(9.5, hy + 3.5, 6.5, 4, 1.6); ctx.fill();
    rr(17.5, hy + 3.5, 6.5, 4, 1.6); ctx.fill();
    ctx.fillStyle = '#14131f'; ctx.fillRect(2, hy + 4, 7, 2);
  } else if (acc === 'crown') {
    ctx.fillStyle = '#ffd166'; ctx.beginPath();
    ctx.moveTo(3, hy - 1); ctx.lineTo(6, hy - 12); ctx.lineTo(9.5, hy - 4);
    ctx.lineTo(13, hy - 14); ctx.lineTo(16.5, hy - 4); ctx.lineTo(20, hy - 12);
    ctx.lineTo(22, hy - 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff6f7d'; ctx.beginPath(); ctx.arc(12.5, hy - 4.5, 2, 0, 7); ctx.fill();
  } else if (acc === 'hat') {
    ctx.fillStyle = '#ff5fa8'; ctx.beginPath();
    ctx.moveTo(4, hy); ctx.lineTo(13, hy - 22); ctx.lineTo(21, hy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#36d8ff';
    ctx.beginPath(); ctx.moveTo(8, hy - 10); ctx.lineTo(13, hy - 13); ctx.lineTo(12, hy - 6); ctx.fill();
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(13, hy - 24, 3.4, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/* ===========================================================
   DRAWING — obstacles / crystals
   =========================================================== */
function drawObstacles() {
  const c = theme().obs;
  G.obs.forEach(o => {
    ctx.save();
    if (o.kind === 'cactus') {
      for (let i = 0; i < o.n; i++) {
        const x = o.x + i * 11, h = o.h * (i === 0 ? 1 : .62 + hash(i + o.h) * .4);
        ctx.fillStyle = c[0]; rr(x, o.y - h, 9, h, 4.5); ctx.fill();
        ctx.fillStyle = c[1]; rr(x + 5.5, o.y - h, 3.5, h, 2); ctx.fill();
        if (h > 30) { ctx.fillStyle = c[0];
          rr(x - 6, o.y - h * .72, 7, 4.5, 2.2); ctx.fill();
          rr(x - 6, o.y - h * .72, 4.5, 13, 2.2); ctx.fill(); }
        ctx.fillStyle = c[2]; ctx.globalAlpha = .85;
        ctx.beginPath(); ctx.arc(x + 4.5, o.y - h + 4, 2.2, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      }
    } else if (o.kind === 'rock') {
      ctx.fillStyle = c[1]; ctx.beginPath();
      ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.w * .16, o.y - o.h * .82);
      ctx.lineTo(o.x + o.w * .52, o.y - o.h); ctx.lineTo(o.x + o.w * .86, o.y - o.h * .64);
      ctx.lineTo(o.x + o.w, o.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c[0]; ctx.beginPath();
      ctx.moveTo(o.x + o.w * .16, o.y - o.h * .82); ctx.lineTo(o.x + o.w * .52, o.y - o.h);
      ctx.lineTo(o.x + o.w * .5, o.y); ctx.lineTo(o.x + o.w * .2, o.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c[2]; ctx.globalAlpha = .7; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(o.x + o.w * .3, o.y - o.h * .5);
      ctx.lineTo(o.x + o.w * .62, o.y - o.h * .3); ctx.stroke(); ctx.globalAlpha = 1;
    } else {
      const y = o.y - o.fly - o.h / 2, f = Math.sin(o.wing) * 11;
      ctx.fillStyle = c[0];
      ctx.beginPath(); ctx.moveTo(o.x + 4, y); ctx.lineTo(o.x + 19, y - f);
      ctx.lineTo(o.x + 30, y + 2); ctx.closePath(); ctx.fill();         /* far wing */
      rr(o.x + 8, y - 4, 22, 11, 5); ctx.fill();                        /* body */
      ctx.beginPath(); ctx.moveTo(o.x + 28, y - 1); ctx.lineTo(o.x + 40, y - 6);
      ctx.lineTo(o.x + 36, y + 3); ctx.closePath(); ctx.fill();         /* beak/head */
      ctx.fillStyle = c[2];
      ctx.beginPath(); ctx.moveTo(o.x + 6, y + 1); ctx.lineTo(o.x + 20, y + f * .9 + 4);
      ctx.lineTo(o.x + 30, y + 4); ctx.closePath(); ctx.fill();         /* near wing */
      ctx.beginPath(); ctx.moveTo(o.x + 10, y - 4); ctx.lineTo(o.x + 2, y - 10);
      ctx.lineTo(o.x + 7, y - 2); ctx.fill();                           /* crest/tail */
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x + 31, y - 3, 1.9, 0, 7); ctx.fill();
    }
    ctx.restore();
  });
}

function drawCollectibles() {
  const th = theme();
  G.gems.forEach(c => {
    const bob = Math.sin(c.t) * 5, sp = Math.cos(c.t * 1.4);
    const col = c.shield ? '#36f0ff' : th.gem;
    ctx.save(); ctx.translate(c.x, c.y + bob);
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
    gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = .38 + .14 * Math.sin(c.t * 3); ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.scale(clamp(sp, .22, 1) * (c.shield ? 1.15 : 1), 1);
    if (c.shield) {
      ctx.strokeStyle = col; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(54,240,255,.35)'; ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#eaffff'; rr(-2, -5, 4, 10, 2); ctx.fill(); rr(-5, -2, 10, 4, 2); ctx.fill();
    } else {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, -2); ctx.lineTo(0, 13); ctx.lineTo(-8, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(3.4, -2); ctx.lineTo(0, 13); ctx.lineTo(-1.6, -2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  });
}

function drawParticles() {
  G.parts.forEach(p => {
    const a = clamp(p.life / p.max, 0, 1);
    ctx.globalAlpha = a * .9; ctx.fillStyle = p.col;
    if (p.sq) ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, 7); ctx.fill(); }
  });
  ctx.globalAlpha = 1;
  G.floats.forEach(f => {
    const a = clamp(f.life / f.max, 0, 1);
    ctx.globalAlpha = a; ctx.font = '900 17px ui-rounded, Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,6,20,.85)';
    ctx.strokeText(f.txt, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x, f.y);
  });
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}

/* ===========================================================
   RENDER
   =========================================================== */
function render() {
  ctx.save();
  if (G.shake > 0) {
    const m = G.shake * 11;
    ctx.translate((Math.random() - .5) * m, (Math.random() - .5) * m);
  }
  drawBackground();

  const d = G.dino, col = skinColors();
  /* shadow */
  const air = clamp((groundY - d.feet) / 130, 0, 1);
  ctx.globalAlpha = .3 * (1 - air * .7); ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(d.x, groundY + 3, 20 * (1 - air * .4), 5, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;

  drawObstacles();
  drawCollectibles();

  /* dino — bigger on menu/lab screens */
  const inPlay = state === 'running' || state === 'paused' || state === 'dying' || state === 'over';
  const scl = (state === 'lab') ? 2.5 : inPlay ? 1.18 : 1.55;
  const dx  = (state === 'lab') ? VW * .3 : inPlay ? d.x : VW * .5;
  if (d.pickT > 0) { ctx.save(); ctx.globalAlpha = .5; ctx.shadowColor = theme().gem; ctx.shadowBlur = 24; }
  drawDinosaur(dx, inPlay ? d.feet : groundY, scl, inPlay ? d.pose : 'idle',
    d.phase, col, Save.acc, { squash:d.squash, dead:G.dead, flap:d.flap,
      shakeHit:G.dead ? clamp(G.shake, 0, .5) * .5 : 0 });
  if (d.pickT > 0) ctx.restore();

  /* shield bubble */
  if (G.shield > 0 && state !== 'menu') {
    const a = G.shield < 2 ? (Math.sin(G.t * 18) > 0 ? .9 : .3) : .8;
    ctx.globalAlpha = a; ctx.strokeStyle = '#36f0ff'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(d.x + 2, d.feet - 26, 36, 0, 7); ctx.stroke();
    ctx.globalAlpha = a * .13; ctx.fillStyle = '#36f0ff'; ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawParticles();

  /* big in-canvas score ghost while running */
  if (state === 'running' || state === 'paused') {
    ctx.globalAlpha = .1; ctx.font = '900 ' + Math.round(VH * .3) + 'px ui-rounded, Segoe UI, sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText(String(Math.floor(G.score)), VW / 2, groundY - 22);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
  ctx.restore();

  /* vignette + hit flash */
  const v = ctx.createRadialGradient(VW / 2, VH / 2, VH * .36, VW / 2, VH / 2, VH * .95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,3,16,.26)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
  if (G.flash > 0) { ctx.globalAlpha = G.flash * .55; ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
}

/* ===========================================================
   LOOP (single rAF — never duplicated)
   =========================================================== */
function frame(ts) {
  const dt = clamp((ts - last) / 1000, 0, 0.05);   // clamp after tab switch
  last = ts;
  if (state !== 'paused') update(dt);
  render();
  requestAnimationFrame(frame);
}

/* ===========================================================
   STATE MACHINE
   =========================================================== */
const SCREENS = { menu:'#scMenu', lab:'#scLab', studio:'#scStudio', paused:'#scPause', over:'#scOver' };
function show(which) {
  Object.keys(SCREENS).forEach(k => $(SCREENS[k]).classList.toggle('show', k === which));
  const playing = which === null;
  $('#hud').classList.toggle('hidden', !(playing || which === 'paused'));
  $('#touch').classList.toggle('hidden', !playing);
}
function setState(s) {
  state = s;
  show(s === 'running' ? null : s);
}

function doJump() {
  const d = G.dino;
  d.vy = -690; d.grounded = false; d.coyote = 0; d.buffer = 0; d.duck = false;
  spark(d.x, groundY, 6, theme().pcol, { ang:-Math.PI / 2, spread:1.6, sp:90, life:.35, r:2.4 });
  Sfx.jump();
}
function requestJump() {
  if (state === 'menu') return startGame();
  if (state === 'over') return startGame();
  if (state !== 'running') return;
  const d = G.dino;
  if (d.grounded || d.coyote > 0) doJump(); else d.buffer = .13;   // jump buffering
}
function setHold(v) { if (G && G.dino) G.dino.hold = !!v && state === 'running'; }
function setDuck(v) { if (state === 'running') G.dino.duck = v && G.dino.grounded ? true : (v ? (G.dino.vy = 900, false) : false); }

function resetGame() { G = freshState(); G.dino.x = VW * DINO_X_RATIO; $('#shieldBadge').classList.add('hidden'); }
function startGame() { Sfx.boot(); resetGame(); setState('running'); syncHud(); }
function pauseGame() { if (state === 'running') { setState('paused'); Sfx.ui(); } }
function resumeGame() { if (state === 'paused') { setState('running'); Sfx.ui(); } }

function gameOver() {
  G.dead = true; G.shake = 1; G.flash = 1;
  spark(G.dino.x, G.dino.feet - 24, 30, '#ff6f7d', { sp:230, life:.8, r:3.6, g:320 });
  spark(G.dino.x, G.dino.feet - 24, 16, '#ffd166', { sp:300, life:.7, r:2.6, g:280 });
  Sfx.hit();
  const sc = Math.floor(G.score), nb = sc > Save.best;
  if (nb) { Save.best = sc; store.set('best', sc); }
  $('#overScore').textContent = sc;
  $('#overBest').textContent = Save.best;
  $('#overGems').textContent = G.runGems;
  $('#overDist').textContent = Math.floor(G.dist) + ' m';
  $('#overTitle').textContent = nb ? 'NEW RECORD!' : (sc > 400 ? 'RUN ENDED' : 'EXTINCTION!');
  $('#newBest').classList.toggle('hidden', !nb);
  setTimeout(() => { if (G.dead) setState('over'); }, 480);   // let the impact land
  state = 'dying';
  $('#hud').classList.remove('hidden');
}

function syncHud() {
  $('#hudScore').textContent = Math.floor(G.score);
  $('#hudBest').textContent = Save.best;
  $('#hudGems').textContent = G.runGems;
  $('#hudWorld').textContent = theme().name + ' ⇄';
  $('#flyFill').style.transform = 'scaleX(' + G.fly.toFixed(3) + ')';
  $('#flyBar').classList.toggle('empty', G.fly < .18);
  const pct = G.stage === 3 ? 100 : clamp(G.score / (G.stage === 1 ? 650 : 1500) * 100, 0, 100);
  $('#meterFill').style.width = pct + '%';
  $('#meterTxt').textContent = 'STAGE ' + G.stage + ' · ' + Math.floor(G.dist) + ' m';
}
function syncMenu() {
  $('#menuBest').textContent = Save.best;
  $('#menuGems').textContent = Save.gems;
  $('#menuWorld').textContent = theme().name.split(' ')[0];
  $('#hudWorld').textContent = theme().name + ' ⇄';
}

/* ===========================================================
   DINO LAB + WORLD STUDIO (built once, state-driven)
   =========================================================== */
function buildLab() {
  const wrap = $('#swatches'); wrap.innerHTML = '';
  SKINS.forEach(s => {
    const owned = Save.owned.indexOf(s.id) >= 0;
    const el = document.createElement('button');
    el.className = 'sw' + (Save.skin === s.id ? ' sel' : '') + (owned ? '' : ' locked');
    el.innerHTML = '<span class="dot" style="background:' +
      (s.rainbow ? 'conic-gradient(#ff6fae,#ffd166,#4fd98a,#36d8ff,#a97bff,#ff6fae)' :
       'linear-gradient(145deg,' + s.body + ',' + s.dark + ')') + '"></span><span class="nm">' +
      s.name + '</span>' + (owned ? '' : '<span class="cost">◆' + s.cost + '</span>');
    el.onclick = () => selectSkin(s.id);
    wrap.appendChild(el);
  });
  const pills = $('#accPills'); pills.innerHTML = '';
  ACCS.forEach(a => {
    const el = document.createElement('button');
    el.className = 'pill' + (Save.acc === a.id ? ' sel' : '');
    el.textContent = a.name;
    el.onclick = () => { Save.acc = a.id; store.set('acc', a.id); Sfx.ui(); buildLab(); };
    pills.appendChild(el);
  });
}
function selectSkin(id) {
  const s = SKINS.find(x => x.id === id);
  if (Save.owned.indexOf(id) < 0) {
    if (Save.gems >= s.cost) {
      Save.gems -= s.cost; Save.owned.push(id);
      store.set('gems', Save.gems); store.set('owned', Save.owned);
      $('#unlockNote').textContent = '✦ UNLOCKED ' + s.name + '!';
      Sfx.shield();
    } else {
      $('#unlockNote').textContent = 'Need ◆' + (s.cost - Save.gems) + ' more crystals';
      Sfx.hit(); buildLab(); return;
    }
  } else $('#unlockNote').textContent = '';
  Save.skin = id; store.set('skin', id); Sfx.ui(); buildLab(); syncMenu();
}
function buildStudio() {
  const grid = $('#worldGrid'); grid.innerHTML = '';
  THEMES.forEach(t => {
    const el = document.createElement('button');
    el.className = 'wcard' + (Save.world === t.id ? ' sel' : '');
    el.innerHTML = '<span class="wsky" style="background:' + t.card + '"></span>' +
      '<span class="wgnd" style="background:' + t.cardG + '"></span>' +
      '<span class="wtick">✓</span><span class="wnm">' + t.name + '</span>';
    el.onclick = () => selectWorld(t.id);
    grid.appendChild(el);
  });
}
function selectWorld(id) {
  Save.world = id; store.set('world', id);
  G.parts.length = 0; Sfx.ui(); buildStudio(); syncMenu();
  if (state === 'running') {
    G.flash = .35;                                        // soft cross-fade into the new world
    floatTxt(VW / 2, groundY - 150, theme().name, theme().gem);
  }
}
function cycleWorld(dir) {
  const i = THEMES.findIndex(t => t.id === Save.world);
  selectWorld(THEMES[(i + (dir || 1) + THEMES.length) % THEMES.length].id);
}

/* ===========================================================
   INPUT (listeners bound exactly once)
   =========================================================== */
function initInput() {
  const KEYS = [' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'Up', 'Down', 'PageDown', 'PageUp'];
  addEventListener('keydown', e => {
    if (KEYS.indexOf(e.key) >= 0) e.preventDefault();
    if (e.key >= '1' && e.key <= '6') { selectWorld(THEMES[+e.key - 1].id); return; }
    if (e.repeat) { if (e.key === 'ArrowDown') setDuck(true); return; }
    switch (e.key) {
      case ' ': case 'Spacebar': case 'ArrowUp': case 'Up': case 'w': case 'W':
        setHold(true); requestJump(); break;
      case 'ArrowDown': case 'Down': case 's': case 'S': setDuck(true); break;
      case 'p': case 'P': case 'Escape': state === 'running' ? pauseGame() : state === 'paused' ? resumeGame() : 0; break;
      case 'r': case 'R': if (state === 'over' || state === 'paused' || state === 'running') startGame(); break;
      case 'Enter': if (state === 'menu' || state === 'over') startGame(); break;
    }
  }, { passive:false });
  addEventListener('keyup', e => {
    if (e.key === 'ArrowDown' || e.key === 'Down' || e.key === 's' || e.key === 'S') setDuck(false);
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'Up' ||
        e.key === 'w' || e.key === 'W') setHold(false);
  });

  /* canvas pointer = jump, hold = fly (only in gameplay) */
  const tap = e => { if (state === 'running') { e.preventDefault(); setHold(true); requestJump(); } };
  cvs.addEventListener('pointerdown', tap);
  cvs.addEventListener('pointerup', () => setHold(false));
  cvs.addEventListener('pointerleave', () => setHold(false));
  cvs.addEventListener('pointercancel', () => setHold(false));

  const hold = (el, on, off) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); on(); });
    el.addEventListener('pointerup', e => { e.preventDefault(); off && off(); });
    el.addEventListener('pointerleave', () => off && off());
    el.addEventListener('pointercancel', () => off && off());
  };
  hold($('#btnJump'), () => { setHold(true); requestJump(); }, () => setHold(false));
  hold($('#btnDuck'), () => setDuck(true), () => setDuck(false));

  const click = (sel, fn) => $(sel).addEventListener('click', e => { e.preventDefault(); fn(); });
  click('#btnStart',  () => startGame());
  click('#btnAgain',  () => startGame());
  click('#btnRestart',() => startGame());
  click('#btnResume', resumeGame);
  click('#btnPause',  pauseGame);
  click('#btnQuit',   () => { Sfx.ui(); resetGame(); setState('menu'); syncMenu(); });
  click('#btnMenu',   () => { Sfx.ui(); resetGame(); setState('menu'); syncMenu(); });
  click('#btnLab',    () => { Sfx.boot(); Sfx.ui(); buildLab(); setState('lab'); });
  click('#btnStudio', () => { Sfx.boot(); Sfx.ui(); buildStudio(); setState('studio'); });
  click('#btnLabBack',   () => { Sfx.ui(); setState('menu'); syncMenu(); });
  click('#btnStudioBack',() => { Sfx.ui(); setState('menu'); syncMenu(); });
  click('#btnRandom', () => {
    const avail = SKINS.filter(s => Save.owned.indexOf(s.id) >= 0);
    Save.skin = avail[Math.floor(Math.random() * avail.length)].id;
    Save.acc = ACCS[Math.floor(Math.random() * ACCS.length)].id;
    store.set('skin', Save.skin); store.set('acc', Save.acc);
    Sfx.gem(); buildLab(); syncMenu();
  });
  const toggleSound = () => {
    Sfx.on = !Sfx.on; store.set('sound', Sfx.on);
    $('#soundWord').textContent = Sfx.on ? 'ON' : 'OFF';
    $('#btnSound').classList.toggle('off', !Sfx.on);
    $('#soundIcon').textContent = Sfx.on ? '◼◣' : '◼✕';
    if (Sfx.on) { Sfx.boot(); Sfx.ui(); }
  };
  click('#hudWorld', () => cycleWorld(1));     // swap the background without leaving the run
  click('#btnSound', toggleSound);
  click('#btnSound2', toggleSound);
  $('#soundWord').textContent = Sfx.on ? 'ON' : 'OFF';
  $('#btnSound').classList.toggle('off', !Sfx.on);
  $('#soundIcon').textContent = Sfx.on ? '◼◣' : '◼✕';

  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 120));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
  addEventListener('blur', pauseGame);
  document.addEventListener('contextmenu', e => { if (e.target === cvs) e.preventDefault(); });
}

/* ===========================================================
   BOOT
   =========================================================== */
function initGame() {
  if (started) return; started = true;
  G = freshState();
  resize();
  G.dino.x = VW * DINO_X_RATIO; G.dino.feet = groundY;
  initInput(); buildLab(); buildStudio(); syncMenu(); syncHud();
  setState('menu');
  last = performance.now();
  requestAnimationFrame(frame);
}
initGame();
})();
