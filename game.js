/* ============================================
   GRÚA MUNICIPAL — Operación Remolque
   Versión CABA — Porteño Arcade
   ============================================ */

// ==========================================
// 1. CONFIGURATION
// ==========================================

const CFG = {
  W: 960, H: 600,

  ROAD_W: 50,
  H_ROADS: [25, 175, 325, 475, 575],
  V_ROADS: [25, 185, 345, 505, 665, 825, 935],

  TRUCK_LEN: 44, TRUCK_W: 20, CAB_LEN: 16,
  MAX_SPEED: 160, REV_SPEED: 80,
  ACCEL: 220, BRAKE: 280, FRICTION: 90, TURN_SPEED: 2.6,

  HOOK_RANGE: 36, HOOK_RATE: 0.45, HOOK_SPEED_LIMIT: 8,

  START_TIME: 60,

  BASE: { x: 28, y: 445, w: 170, h: 130 },

  CARS: {
    comun:    { label:'COMÚN',  len:34, w:16, color:'#3abf65', points:100, timeBonus:10, speedPenalty:1.0, hookWindow:0 },
    camioneta:{ label:'4×4',   len:40, w:22, color:'#3a7bd5', points:250, timeBonus:15, speedPenalty:0.75, hookWindow:0 },
    deportivo:{ label:'DEPOR', len:30, w:14, color:'#ff6b9d', points:500, timeBonus:8,  speedPenalty:1.0, hookWindow:8 },
  },
};

// ==========================================
// 1b. CHARACTERS (CABA)
// ==========================================

const CHARACTERS = {
  evelyn: { shortName:'Evelyn "La Flaca"', color:'#ffcc00', bg:'#1a1a00' },
  tata:   { shortName:'Tata',               color:'#4488ff', bg:'#001122' },
  vibora: { shortName:'Víbora',             color:'#22aa44', bg:'#002211' },
};

// Narrow cobblestone streets (vs wide avenues)
const NARROW_V = [185, 345, 665, 825];
const NARROW_H = [175, 475];

// ==========================================
// 2. DOM REFERENCES
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('hud-score');
const hudCars = document.getElementById('hud-cars');
const hudTimer = document.getElementById('hud-timer');
const hudTimerBox = document.getElementById('hud-timer-box');
const hudTarget = document.getElementById('hud-target');
const dialChar = document.getElementById('dialogue-char');
const dialText = document.getElementById('dialogue-text');
const overlay = document.getElementById('gameover-overlay');
const finalScore = document.getElementById('final-score');
const finalCars = document.getElementById('final-cars');
const restartBtn = document.getElementById('restart-btn');

// ==========================================
// 3. UTILITY
// ==========================================

function rand(min, max)    { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, mn, mx)  { return Math.max(mn, Math.min(mx, v)); }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function padNum(n, len) { return String(Math.floor(n)).padStart(len, '0'); }

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ==========================================
// 4. MAP — ROADS, BUILDINGS & OBSTACLES
// ==========================================

let buildings = [];
let obstacles = [];

function generateBuildings() {
  buildings = [];
  const hr = CFG.H_ROADS;
  const vr = CFG.V_ROADS;
  const hw = CFG.ROAD_W / 2;

  for (let i = 0; i < vr.length - 1; i++) {
    for (let j = 0; j < hr.length - 1; j++) {
      const left  = vr[i]   + hw + 3;
      const right = vr[i+1] - hw - 3;
      const top   = hr[j]   + hw + 3;
      const bot   = hr[j+1] - hw - 3;
      if (right <= left || bot <= top) continue;

      if (vr[i] < 200 && hr[j] > 400) continue; // base area

      const hue = randInt(15, 45);
      buildings.push({
        x: left, y: top, w: right - left, h: bot - top,
        color: `hsl(${hue}, 30%, ${randInt(20, 34)}%)`,
        roof: `hsl(${hue}, 25%, ${randInt(30, 42)}%)`,
        windows: randInt(2, 5),
        winColors: Array.from({length: randInt(2,5)}, () => Math.random() < 0.55 ? '#e8d870' : '#113355'),
      });
    }
  }
}

function generateObstacles() {
  obstacles = [];
  const hw = CFG.ROAD_W / 2;
  const hr = CFG.H_ROADS;
  const vr = CFG.V_ROADS;

  for (let i = 0; i < vr.length - 1; i++) {
    for (let j = 0; j < hr.length - 1; j++) {
      const left  = vr[i]   + hw + 3;
      const right = vr[i+1] - hw - 3;
      const top   = hr[j]   + hw + 3;
      const bot   = hr[j+1] - hw - 3;
      if (right <= left || bot <= top) continue;
      if (vr[i] < 200 && hr[j] > 400) continue; // base

      const blkW = right - left;
      const blkH = bot - top;
      if (blkW < 30 || blkH < 30) continue;

      // Garbage bins along sidewalk
      if (Math.random() < 0.45) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const ox = side === -1 ? left - 3 : right - 10;
        const oy = top + 12 + rand(0, blkH - 30);
        obstacles.push({ type:'bin', x:ox, y:oy, w:10, h:12, color:'#4a4a3a' });
      }

      // Newsstand
      if (Math.random() < 0.18) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const ox = side === -1 ? left - 2 : right - 18;
        const oy = top + 20 + rand(0, blkH - 50);
        obstacles.push({ type:'stand', x:ox, y:oy, w:18, h:14, color:'#2d6a3d' });
      }
    }
  }
}

// ==========================================
// 5. DIALOGUE SYSTEM (Porteño)
// ==========================================

const DIALOGUES = {
  patrolling: [
    { s:'evelyn', t:'Bueno muchachos, nos mandaron a cubrir la zona de Palermo hoy. ¡Tata, arrancá que nos quedamos sin el bono!' },
    { s:'tata',   t:'Salgo por la avenida, Flaca, porque si agarro el empedrado se me desarma la grúa.' },
    { s:'vibora', t:'Tranqui Tata, que con estos horarios los infractores sobran. Es como pescar en una bañadera.' },
    { s:'evelyn', t:'Ojitos al celular, Víbora. Los radares me marcan tres posibles en la zona.' },
    { s:'tata',   t:'¿En Palermo? Uff, preparate que acá todos se creen dueños de la calle.' },
    { s:'vibora', t:'Yo ya estoy viendo uno, doña Evelyn. Ahí doblo y lo encaro.' },
    { s:'evelyn', t:'Acuérdense que el que regala el bono, pierde. No regalen nada.' },
  ],
  approaching: [
    { s:'evelyn', t:'¡Ahí está el fantasma! Meté la grúa despacio que no se nos escape.' },
    { s:'tata',   t:'Lo veo, lo veo. Estacionado en la ochava, el vivo.' },
    { s:'vibora', t:'¡Mirá ese fantasma! Clavó la 4x4 en la avenida para bajar a comprar facturas. ¡Alineá, Tata, que le sople el gancho!' },
    { s:'evelyn', t:'Despacito Tata, que si lo rozás nos comemos el garrón de la multa.' },
    { s:'tata',   t:'Ahí voy, ahí voy... dejame poner bien la cola de la grúa.' },
  ],
  hooking: [
    { s:'evelyn', t:'¡Enganchando! Tata, QUIETO. Ni un milímetro.' },
    { s:'tata',   t:'Estoy quieto, estoy quieto... pero si viene un bondi me corro.' },
    { s:'vibora', t:'¡Vamos, vamos, ya entra! Uy, ahí viene el dueño corriendo con las facturas en la mano. ¡No te muevas, Tata!' },
    { s:'evelyn', t:'Concéntrense que si lo perdemos nos vamos con las manos vacías.' },
    { s:'vibora', t:'¡Dale que dale que ya casi! ¡No respires, Tata!' },
  ],
  ownerAngry: [
    { s:'vibora', t:'¡Pará, flaco! ¡Fueron dos minutos! ¡Bajámelo, dale, tengo los pibes en el auto!' },
    { s:'evelyn', t:'Dos minutos en la ochava, eh. "Estacionar" no es "dejá el auto donde se te cante".' },
    { s:'tata',   t:'Yo solo manejo, señor. Háblela a ella que es la de la multa.' },
    { s:'evelyn', t:'Si quiere el auto, vaya al playón y pague la multa. Acá laburamos.' },
  ],
  hooked: [
    { s:'evelyn', t:'¡Perfecto! Bien hecho. Ahora al playón, con cuidado que llevamos carga.' },
    { s:'tata',   t:'Ahí lo llevamos. Pesadito está el muchacho, debe tener el baúl lleno de bolsas.' },
    { s:'vibora', t:'¡Lo engarchamos! Un aplauso para el equipo. ¿Viste Tata? Cuando querés podés.' },
    { s:'evelyn', t:'Buen laburo. Ahora de vuelta, que el reloj no perdona.' },
  ],
  delivering: [
    { s:'evelyn', t:'¡Excelente entrega! Directo al playón. Sumamos puntos y nos dieron unos minutos más de prórroga por radio. ¡A buscar otro!' },
    { s:'tata',   t:'Uno menos. Así se labura, muchachos.' },
    { s:'vibora', t:'¡Sí señor! Vamos por el siguiente, que la calle está llena de vivos.' },
    { s:'evelyn', t:'Bien. Descansen diez segundos... es joda, ¡al próximo!' },
  ],
  lowtime: [
    { s:'evelyn', t:'¡Se nos acaba el tiempo, muchachos! Muévanse o nos quedamos sin el bono.' },
    { s:'tata',   t:'¡Uff, la voy a pisar! Agarrate Víbora que viene curva.' },
    { s:'vibora', t:'¡No no no, yo no quiero perder! ¡Dale Tata, dale que te banco!' },
    { s:'evelyn', t:'Rápido, el próximo infractor. ¡VAMOS!' },
  ],
  hookFail: [
    { s:'vibora', t:'¡Ay, se nos fue! Lo moviste Tata, te dije que no te muevas.' },
    { s:'evelyn', t:'Perfecto... la pifiaron. Otra vez, desde cero.' },
    { s:'tata',   t:'Disculpame, venía un colectivo y me corrí. Ahora sí, no me muevo ni si me disparan.' },
    { s:'vibora', t:'¡Pero la concha de...! Bueno, vamos de nuevo.' },
  ],
  sportsFlee: [
    { s:'evelyn', t:'¡El dueño llegó! Se nos va el deportivo. Lástima, era buena plata.' },
    { s:'tata',   t:'Uh, el dueño salió disparado del café. Ni chance tuvimos.' },
    { s:'vibora', t:'¡Noooo! Ese era el de 500 puntos. ¡Maldito dueño!' },
  ],
  gameover: [
    { s:'evelyn', t:'Se acabó el tiempo. Buen laburo, equipo. Vamos a tomar un café.' },
    { s:'tata',   t:'Uh, nos quedamos con las ganas. La próxima rompemos el récord.' },
    { s:'vibora', t:'¡Noooo! Yo quería seguir... bueno, la próxima será. Vamos a la birra.' },
  ],
};

let lastDialogue = null;

function setDialogue(charKey, text) {
  const ch = CHARACTERS[charKey];
  if (!ch) return;
  dialChar.textContent = ch.shortName;
  dialChar.style.color = ch.color;
  dialText.textContent = text;

  document.querySelectorAll('.avatar').forEach(el => el.classList.remove('active'));
  const av = document.getElementById(`avatar-${charKey}`);
  if (av) av.classList.add('active');
}

function sayDialogue(phase, force) {
  const pool = DIALOGUES[phase];
  if (!pool || pool.length === 0) return;
  if (force && force.s && force.t) {
    setDialogue(force.s, force.t);
    return;
  }
  let line;
  let attempts = 0;
  do {
    line = pick(pool);
    attempts++;
  } while (line === lastDialogue && attempts < 20);
  lastDialogue = line;
  setDialogue(line.s, line.t);
  game.dialCooldown = 4;
}

// ==========================================
// 6. AUDIO
// ==========================================

let audioCtx = null;
function beep(freq, dur, vol) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = vol || 0.12;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.15));
    osc.start();
    osc.stop(audioCtx.currentTime + (dur || 0.15));
  } catch (_) {}
}

function beepHookProgress() { beep(600, 0.06, 0.05); }
function beepHookComplete()  { beep(880, 0.12, 0.1); setTimeout(() => beep(1100, 0.15, 0.1), 100); }
function beepDeliver()       { beep(660, 0.1, 0.1); setTimeout(() => beep(880, 0.15, 0.1), 120); }
function beepTimerLow()      { beep(440, 0.08, 0.06); }

// ==========================================
// 7. GAME STATE
// ==========================================

let game = {};

function resetGame() {
  game = {
    score: 0, carsDelivered: 0,
    timeLeft: CFG.START_TIME, gameOver: false,
    phase: 'patrolling',
    hookProgress: 0, isHooking: false,
    dialCooldown: 0, lowTimeBeep: 0,

    truck: {
      x: CFG.BASE.x + CFG.BASE.w / 2,
      y: CFG.BASE.y + CFG.BASE.h * 0.3,
      heading: Math.PI / 2,
      speed: 0, towing: null,
    },

    worldCars: [], target: null,
    lastSpawnTime: 0, popups: [],
  };
  generateBuildings();
  generateObstacles();
  spawnCar(true);
  sayDialogue('patrolling');
  overlay.classList.add('hidden');
}

// ==========================================
// 8. INPUT
// ==========================================

const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// ==========================================
// 9. CAR SPAWNING
// ==========================================

function randomSpawnPos() {
  const isH = Math.random() < 0.5;
  let x, y, heading;

  if (isH) {
    y = pick(CFG.H_ROADS.slice(1, -1)) + rand(-12, 12);
    x = rand(60, CFG.W - 60);
    heading = Math.random() < 0.5 ? 0 : Math.PI;
  } else {
    x = pick(CFG.V_ROADS.slice(1, -1)) + rand(-12, 12);
    y = rand(60, CFG.H - 60);
    heading = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
  }
  return { x, y, heading };
}

function spawnCar(force) {
  const types = Object.keys(CFG.CARS);
  const typeKey = pick(types);
  const type = CFG.CARS[typeKey];

  let pos, tries = 0;
  do {
    pos = randomSpawnPos();
    tries++;
  } while (
    tries < 30 &&
    (dist(pos.x, pos.y, game.truck.x, game.truck.y) < 120 ||
     isInBase(pos.x, pos.y) ||
     game.worldCars.some(c => dist(pos.x, pos.y, c.x, c.y) < 80))
  );

  const car = {
    x: pos.x, y: pos.y, heading: pos.heading,
    type: typeKey, ...type,
    hooked: false,
    fleeTimer: type.hookWindow > 0 ? type.hookWindow : 0,
    fleeing: false,
  };

  game.worldCars.push(car);
  game.target = car;
  if (force !== true) sayDialogue('approaching');
  updateHUDTarget();
}

// ==========================================
// 10. UPDATE FUNCTIONS
// ==========================================

function updatePhysics(dt) {
  const t = game.truck;

  if (keys['ArrowUp'] || keys['KeyW']) {
    t.speed += CFG.ACCEL * dt;
  } else if (keys['ArrowDown'] || keys['KeyS']) {
    t.speed -= CFG.BRAKE * dt;
  } else {
    if (Math.abs(t.speed) < 2) t.speed = 0;
    else t.speed -= Math.sign(t.speed) * CFG.FRICTION * dt;
  }

  let maxSpeed = CFG.MAX_SPEED;
  if (t.towing && t.towing.speedPenalty < 1) maxSpeed *= t.towing.speedPenalty;
  t.speed = clamp(t.speed, -CFG.REV_SPEED, maxSpeed);

  const moving = Math.abs(t.speed) > 1;
  if (moving) {
    if (keys['ArrowLeft'] || keys['KeyA'])
      t.heading -= CFG.TURN_SPEED * dt * (t.speed > 0 ? 1 : -0.6);
    if (keys['ArrowRight'] || keys['KeyD'])
      t.heading += CFG.TURN_SPEED * dt * (t.speed > 0 ? 1 : -0.6);
  }

  t.x += Math.cos(t.heading) * t.speed * dt;
  t.y += Math.sin(t.heading) * t.speed * dt;
  t.x = clamp(t.x, 20, CFG.W - 20);
  t.y = clamp(t.y, 20, CFG.H - 20);

  if (t.towing) {
    const car = t.towing;
    const td = CFG.TRUCK_LEN / 2 + car.len / 2 + 4;
    car.x = t.x - Math.cos(t.heading) * td;
    car.y = t.y - Math.sin(t.heading) * td;
    car.heading = t.heading;
  }
}

function updateHooking(dt) {
  const t = game.truck;
  const target = game.target;
  if (!target || target.hooked || target.fleeing) {
    if (game.isHooking) cancelHook();
    return;
  }

  const bx = t.x - Math.cos(t.heading) * CFG.TRUCK_LEN / 2;
  const by = t.y - Math.sin(t.heading) * CFG.TRUCK_LEN / 2;
  const d = dist(bx, by, target.x, target.y);

  // Proximity dialogue
  if (d < 120 && game.phase === 'patrolling' && !game.isHooking && game.dialCooldown <= 0)
    sayDialogue('approaching');

  if (keys['Space'] && d < CFG.HOOK_RANGE && Math.abs(t.speed) < CFG.HOOK_SPEED_LIMIT && !game.gameOver) {
    if (!game.isHooking) {
      game.isHooking = true;
      if (game.phase !== 'hooking') {
        game.phase = 'hooking';
        sayDialogue('hooking');
      }
    }
    game.hookProgress += CFG.HOOK_RATE * dt;
    beepHookProgress();

    // Random owner interruption during hook
    if (game.hookProgress > 0.2 && game.hookProgress < 0.6 && Math.random() < 0.0008)
      sayDialogue('ownerAngry');

    if (game.hookProgress >= 1) {
      game.hookProgress = 1;
      completeHook();
    }
  } else {
    if (game.isHooking) cancelHook();
  }

  if (target.fleeTimer > 0) {
    target.fleeTimer -= dt;
    if (target.fleeTimer <= 0 && !target.hooked) {
      target.fleeing = true;
      sayDialogue('sportsFlee');
      beep(300, 0.3, 0.1);
      setTimeout(() => {
        const idx = game.worldCars.indexOf(target);
        if (idx !== -1) game.worldCars.splice(idx, 1);
        if (game.target === target) game.target = null;
        if (game.truck.towing === target) game.truck.towing = null;
        spawnCar();
      }, 800);
    }
  }
}

function cancelHook() {
  if (game.hookProgress > 0.1) sayDialogue('hookFail');
  game.isHooking = false;
  game.hookProgress = 0;
  game.phase = 'patrolling';
}

function completeHook() {
  const target = game.target;
  if (!target) return;
  beepHookComplete();
  game.truck.towing = target;
  target.hooked = true;
  game.isHooking = false;
  game.hookProgress = 0;
  game.phase = 'towing';
  sayDialogue('hooked');
  const idx = game.worldCars.indexOf(target);
  if (idx !== -1) game.worldCars.splice(idx, 1);
}

function isInBase(x, y) {
  const b = CFG.BASE;
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function spawnPopup(x, y, text, color) {
  game.popups.push({ x, y, text, color: color || '#ffde5c', life: 2.0, maxLife: 2.0, vy: -40 });
}

function updateDelivery() {
  const t = game.truck;
  if (t.towing && isInBase(t.x, t.y)) {
    const car = t.towing;
    game.score += car.points;
    game.carsDelivered++;
    game.timeLeft += car.timeBonus;
    spawnPopup(CFG.BASE.x + CFG.BASE.w / 2, CFG.BASE.y + 20,
      `+${car.points} pts +${car.timeBonus}s`, '#ffde5c');
    beepDeliver();
    sayDialogue('delivering');
    game.phase = 'delivering';
    t.towing = null;
    game.target = null;
    updateHUDTarget();
    setTimeout(() => {
      if (!game.gameOver) { spawnCar(); game.phase = 'patrolling'; }
    }, 800);
  }
}

function updateTimer(dt) {
  if (game.gameOver) return;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    gameOver();
    return;
  }
  if (game.timeLeft <= 15 && game.phase !== 'lowtime') {
    game.phase = 'lowtime';
    sayDialogue('lowtime');
  }
  if (game.timeLeft <= 10) {
    game.lowTimeBeep += dt;
    if (game.lowTimeBeep >= 1) { beepTimerLow(); game.lowTimeBeep = 0; }
  }
}

function updatePopups(dt) {
  for (let i = game.popups.length - 1; i >= 0; i--) {
    const p = game.popups[i];
    p.life -= dt;
    p.y += p.vy * dt;
    if (p.life <= 0) game.popups.splice(i, 1);
  }
}

function updateDialogue(dt) {
  if (game.dialCooldown > 0) game.dialCooldown -= dt;
  if (game.dialCooldown <= 0 && !game.gameOver) {
    if (game.phase === 'patrolling' && !game.isHooking && Math.random() < 0.001) {
      sayDialogue('patrolling');
      game.dialCooldown = 5;
    }
    if (game.phase === 'towing' && Math.random() < 0.001) {
      sayDialogue('hooked');
      game.dialCooldown = 4;
    }
  }
}

// ==========================================
// 11. GAME OVER
// ==========================================

function gameOver() {
  game.gameOver = true;
  sayDialogue('gameover');
  finalScore.textContent = game.score;
  finalCars.textContent = game.carsDelivered;
  overlay.classList.remove('hidden');
  beep(200, 0.5, 0.15);
  setTimeout(() => beep(150, 0.6, 0.12), 300);
}

// ==========================================
// 12. HUD
// ==========================================

function updateHUD() {
  hudScore.textContent = padNum(game.score, 5);
  hudCars.textContent = game.carsDelivered;
  const dt = Math.max(0, Math.ceil(game.timeLeft));
  hudTimer.textContent = dt;
  hudTimerBox.classList.toggle('low', game.timeLeft <= 15);
}

function updateHUDTarget() {
  hudTarget.textContent = game.target ? game.target.label : '—';
}

// ==========================================
// 13. RENDERER
// ==========================================

// ── Roads + Cobblestone ──

function renderCobblestone(ox, oy, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, w, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(90,90,100,0.25)';
  ctx.lineWidth = 0.5;
  for (let px = ox; px < ox + w; px += 7) {
    for (let py = oy; py < oy + h; py += 7) {
      ctx.strokeRect(px, py, 7, 7);
    }
  }
  ctx.restore();
}

function renderRoads() {
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  const hw = CFG.ROAD_W / 2;

  // Draw road surfaces
  for (const y of CFG.H_ROADS) {
    ctx.fillStyle = NARROW_H.includes(y) ? '#3d3d48' : '#4a4a55';
    ctx.fillRect(0, y - hw, CFG.W, CFG.ROAD_W);
  }
  for (const x of CFG.V_ROADS) {
    ctx.fillStyle = NARROW_V.includes(x) ? '#3d3d48' : '#4a4a55';
    ctx.fillRect(x - hw, 0, CFG.ROAD_W, CFG.H);
  }

  // Cobblestone texture on narrow streets
  for (const y of CFG.H_ROADS) {
    if (NARROW_H.includes(y)) renderCobblestone(0, y - hw, CFG.W, CFG.ROAD_W);
  }
  for (const x of CFG.V_ROADS) {
    if (NARROW_V.includes(x)) renderCobblestone(x - hw, 0, CFG.ROAD_W, CFG.H);
  }

  // Lane markings on avenues
  ctx.strokeStyle = 'rgba(200,200,200,0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 14]);
  for (const y of CFG.H_ROADS) {
    if (!NARROW_H.includes(y)) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CFG.W, y); ctx.stroke();
    }
  }
  for (const x of CFG.V_ROADS) {
    if (!NARROW_V.includes(x)) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CFG.H); ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // Intersections
  ctx.fillStyle = '#4a4a58';
  for (const y of CFG.H_ROADS) {
    for (const x of CFG.V_ROADS) {
      ctx.fillRect(x - hw + 3, y - hw + 3, CFG.ROAD_W - 6, CFG.ROAD_W - 6);
    }
  }
}

// ── Yellow Curb (Cordón Amarillo) ──

function renderYellowCurb() {
  const hw = CFG.ROAD_W / 2;
  const cs = 14;
  ctx.fillStyle = '#ffcc00';
  for (let i = 0; i < CFG.V_ROADS.length - 1; i++) {
    for (let j = 0; j < CFG.H_ROADS.length - 1; j++) {
      const left  = CFG.V_ROADS[i]   + hw;
      const right = CFG.V_ROADS[i+1] - hw;
      const top   = CFG.H_ROADS[j]   + hw;
      const bot   = CFG.H_ROADS[j+1] - hw;
      if (right <= left || bot <= top) continue;
      // 4 corners of the block (on the road side)
      ctx.fillRect(left - 2, top - 2, cs, cs);
      ctx.fillRect(right - cs + 2, top - 2, cs, cs);
      ctx.fillRect(left - 2, bot - cs + 2, cs, cs);
      ctx.fillRect(right - cs + 2, bot - cs + 2, cs, cs);
    }
  }
}

// ── Buildings (Ochavas) ──

function renderBuildings() {
  const ochava = 8;
  for (const b of buildings) {
    // Shadow
    ctx.fillStyle = '#1a1a22';
    roundedRect(b.x + 2, b.y + 2, b.w, b.h, ochava);
    ctx.fill();

    // Building
    ctx.fillStyle = b.color;
    roundedRect(b.x, b.y, b.w, b.h, ochava);
    ctx.fill();

    // Roof highlight
    ctx.fillStyle = b.roof;
    ctx.beginPath();
    ctx.moveTo(b.x + ochava, b.y);
    ctx.lineTo(b.x + b.w - ochava, b.y);
    ctx.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + ochava);
    ctx.lineTo(b.x + b.w, b.y + 5);
    ctx.lineTo(b.x, b.y + 5);
    ctx.lineTo(b.x, b.y + ochava);
    ctx.quadraticCurveTo(b.x, b.y, b.x + ochava, b.y);
    ctx.fill();

    // Windows
    const cols = Math.ceil(Math.sqrt(b.windows * (b.w / b.h)));
    const rows = Math.ceil(b.windows / cols);
    const winW = 8, winH = 6;
    const gapX = (b.w - cols * winW) / (cols + 1);
    const gapY = (b.h - rows * winH) / (rows + 1);
    let wi = 0;
    for (let r = 0; r < rows && wi < b.windows; r++) {
      for (let c = 0; c < cols && wi < b.windows; c++) {
        const wx = b.x + gapX + c * (winW + gapX);
        const wy = b.y + 10 + gapY + r * (winH + gapY);
        ctx.fillStyle = b.winColors[wi];
        ctx.fillRect(wx, wy, winW, winH);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(wx, wy, winW, winH);
        wi++;
      }
    }
  }
}

// ── Obstacles (Contenedores y Puestos) ──

function renderObstacles() {
  for (const o of obstacles) {
    if (o.type === 'bin') {
      // Garbage bin
      ctx.fillStyle = '#33333a';
      ctx.fillRect(o.x + 1, o.y + 1, o.w, o.h);
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#555';
      ctx.fillRect(o.x + 1, o.y, o.w - 2, 2);
      // Lid
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(o.x - 1, o.y - 3, o.w + 2, 3);
    } else if (o.type === 'stand') {
      // Newsstand
      ctx.fillStyle = '#22222a';
      ctx.fillRect(o.x + 1, o.y + 1, o.w, o.h);
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // Roof
      ctx.fillStyle = '#1a4a2a';
      ctx.fillRect(o.x - 2, o.y - 3, o.w + 4, 3);
      // Display
      ctx.fillStyle = '#88aacc';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(o.x + 2, o.y + 3, o.w - 4, o.h - 5);
      ctx.globalAlpha = 1;
    }
  }
}

// ── Base (Playón de Infractores) ──

function renderBase() {
  const b = CFG.BASE;

  // Concrete floor
  ctx.fillStyle = '#2e2e36';
  ctx.fillRect(b.x, b.y, b.w, b.h);

  // Yellow/black safety stripes (bottom edge)
  const sh = 14;
  for (let i = 0; i < b.w; i += 20) {
    ctx.fillStyle = (Math.floor(i / 20) % 2 === 0) ? '#ffcc00' : '#111';
    ctx.fillRect(b.x + i, b.y + b.h - sh, 20, sh);
  }

  // Yellow/black safety stripes (left edge)
  for (let i = 0; i < b.h; i += 20) {
    ctx.fillStyle = (Math.floor(i / 20) % 2 === 0) ? '#ffcc00' : '#111';
    ctx.fillRect(b.x, b.y + i, 8, 20);
  }

  // Border
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);

  // Sign background
  ctx.fillStyle = '#1a1a22';
  roundedRect(b.x + b.w / 2 - 80, b.y + 8, 160, 36, 4);
  ctx.fill();
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2;
  roundedRect(b.x + b.w / 2 - 80, b.y + 8, 160, 36, 4);
  ctx.stroke();

  // Sign text
  ctx.fillStyle = '#ffcc00';
  ctx.font = '9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PLAYÓN DE', b.x + b.w / 2, b.y + 20);
  ctx.fillText('INFRACTORES', b.x + b.w / 2, b.y + 35);

  // Glow on sign
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 10;
  ctx.fillText('INFRACTORES', b.x + b.w / 2, b.y + 35);
  ctx.shadowBlur = 0;

  // Fence cross-hatch
  ctx.strokeStyle = 'rgba(120,120,130,0.15)';
  ctx.lineWidth = 0.5;
  for (let i = 16; i < b.w; i += 16) {
    ctx.beginPath(); ctx.moveTo(b.x + i, b.y); ctx.lineTo(b.x + i, b.y + b.h); ctx.stroke();
  }
  for (let i = 12; i < b.h; i += 12) {
    ctx.beginPath(); ctx.moveTo(b.x, b.y + i); ctx.lineTo(b.x + b.w, b.y + i); ctx.stroke();
  }
}

// ── World Cars ──

function renderWorldCars() {
  for (const car of game.worldCars) {
    drawCar(car);
    if (car === game.target && !car.fleeing) renderTargetIndicator(car);
    if (car.fleeing) {
      ctx.fillStyle = '#ff3333';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('¡SE FUE!', car.x, car.y - 28);
    }
    if (car.fleeTimer > 0 && car.hookWindow > 0 && !car.hooked) {
      const bw = 36, bh = 4;
      const bx = car.x - bw / 2, by = car.y - car.len / 2 - 16;
      ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = car.fleeTimer / car.hookWindow > 0.3 ? '#ff6b9d' : '#ff3333';
      ctx.fillRect(bx, by, bw * (car.fleeTimer / car.hookWindow), bh);
    }
  }
}

// ── Target Indicator ──

function renderTargetIndicator(car) {
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180);
  const radius = 28 + 8 * pulse;
  ctx.strokeStyle = `rgba(255,60,60,${0.3 + 0.4 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(car.x, car.y, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = `rgba(255,200,60,${0.2 + 0.3 * (1 - pulse)})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(car.x, car.y, radius + 8, 0, Math.PI * 2); ctx.stroke();
  const arrowY = car.y - car.len / 2 - 20 - 8 * pulse;
  ctx.fillStyle = `rgba(255,60,60,${0.6 + 0.4 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(car.x, arrowY + 8);
  ctx.lineTo(car.x - 5, arrowY);
  ctx.lineTo(car.x + 5, arrowY);
  ctx.closePath(); ctx.fill();
}

// ── Draw Vehicle (generic car) ──

function drawCar(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);
  const l = car.len, w = car.w, hl = l / 2, hw = w / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-hl + 2, -hw + 2, l, w);
  ctx.fillStyle = car.color || '#3abf65';
  ctx.fillRect(-hl, -hw, l, w);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-hl, -hw, l, w * 0.4);

  ctx.fillStyle = '#88ccff';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(hl - 8, -hw * 0.35, 6, w * 0.7);
  ctx.globalAlpha = 0.4;
  ctx.fillRect(-hl + 2, -hw * 0.35, 5, w * 0.7);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-hl, -hw, l, w);
  ctx.restore();
}

// ── Truck ──

function renderTruck() {
  const t = game.truck;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.heading);

  const tl = CFG.TRUCK_LEN, tw = CFG.TRUCK_W, cl = CFG.CAB_LEN;
  const hl = tl / 2, hw = tw / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-hl + 3, -hw + 3, tl, tw);

  ctx.fillStyle = '#cc8833';
  ctx.fillRect(-hl, -hw, tl - cl, tw);
  ctx.strokeStyle = '#aa6622';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const rx = -hl + 6 + i * 10;
    ctx.beginPath(); ctx.moveTo(rx, -hw); ctx.lineTo(rx, hw); ctx.stroke();
  }

  ctx.fillStyle = '#dd9944';
  ctx.fillRect(hl - cl, -hw, cl, tw);
  // Windshield
  ctx.fillStyle = '#88ccff';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(hl - 5, -hw * 0.75, 4, tw * 0.5);
  ctx.globalAlpha = 1;

  // Light bar
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(hl - cl + 2, -hw - 3, cl - 4, 3);
  if (Math.floor(Date.now() / 300) % 2 === 0) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(hl - cl + 3, -hw - 3, 3, 3);
  } else {
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(hl - cl + 8, -hw - 3, 3, 3);
  }

  // Back hook
  ctx.fillStyle = '#666';
  ctx.fillRect(-hl - 2, -2, 4, 4);

  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-hl, -hw, tl, tw);

  // Speed lines
  const absSpeed = Math.abs(t.speed);
  if (absSpeed > 80) {
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + 0.1 * (absSpeed / CFG.MAX_SPEED)})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const sy = -hw - 6 - i * 8;
      ctx.beginPath(); ctx.moveTo(-hl + 5, sy); ctx.lineTo(hl - 5, sy); ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Cable ──

function renderCable() {
  const t = game.truck;
  if (!t.towing) return;
  const car = t.towing;
  const bx = t.x - Math.cos(t.heading) * CFG.TRUCK_LEN / 2;
  const by = t.y - Math.sin(t.heading) * CFG.TRUCK_LEN / 2;
  const fx = car.x + Math.cos(car.heading) * car.len / 2;
  const fy = car.y + Math.sin(car.heading) * car.len / 2;
  const mx = (bx + fx) / 2, my = (by + fy) / 2 + 8;

  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(mx, my, fx, fy);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  for (const [ox, oy] of [[-2,0],[2,0]]) {
    ctx.beginPath();
    ctx.moveTo(bx + ox, by + oy);
    ctx.quadraticCurveTo(mx + ox, my + 2, fx + ox, fy + oy);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ── Hook Progress Bar ──

function renderHookProgress() {
  if (!game.isHooking && game.hookProgress === 0) return;
  const t = game.truck;
  const bw = 60, bh = 8;
  const bx = t.x - bw / 2, by = t.y - CFG.TRUCK_W / 2 - 18;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

  const p = game.hookProgress;
  const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
  if (p < 0.5)      { grad.addColorStop(0,'#ffee44'); grad.addColorStop(1,'#ffaa00'); }
  else if (p < 0.85){ grad.addColorStop(0,'#ffaa00'); grad.addColorStop(1,'#ff6600'); }
  else              { grad.addColorStop(0,'#44ff44'); grad.addColorStop(1,'#00cc00'); }
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, bw * p, bh);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${Math.floor(p * 100)}%`, t.x, by - 2);
}

// ── Towed Car ──

function renderTowedCar() {
  if (game.truck.towing) drawCar(game.truck.towing);
}

// ── Score Popups ──

function renderPopups() {
  for (const p of game.popups) {
    const alpha = Math.min(1, p.life / p.maxLife * 2);
    const scale = 1 + 0.3 * (1 - p.life / p.maxLife);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
}

// ── Controls Hint ──

function renderControlsHint() {
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '9px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('WASD/FLECHAS: Conducir | ESPACIO: Enganchar', 12, CFG.H - 10);
}

// ==========================================
// 14. MAIN UPDATE & RENDER
// ==========================================

function update(dt) {
  if (game.gameOver) return;
  updatePhysics(dt);
  updateHooking(dt);
  updateTimer(dt);
  updateDelivery();
  updatePopups(dt);
  updateDialogue(dt);
  updateHUD();
}

function render() {
  ctx.clearRect(0, 0, CFG.W, CFG.H);

  renderRoads();
  renderYellowCurb();
  renderBuildings();
  renderObstacles();
  renderBase();
  renderWorldCars();
  renderCable();
  renderTowedCar();
  renderTruck();
  renderHookProgress();
  renderPopups();
  renderControlsHint();

  // REMOLCANDO badge
  if (game.truck.towing) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('▼ REMOLCANDO ▼', game.truck.x, game.truck.y - CFG.TRUCK_W / 2 - 22);
  }

  // Playón indicator
  if (isInBase(game.truck.x, game.truck.y)) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('✔ EN PLAYÓN', game.truck.x, game.truck.y + CFG.TRUCK_W / 2 + 16);
  }
}

// ==========================================
// 15. GAME LOOP
// ==========================================

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp || 0;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

// ==========================================
// 16. RESTART
// ==========================================

restartBtn.addEventListener('click', resetGame);

// ==========================================
// 17. BOOT
// ==========================================

resetGame();
lastTime = performance.now();
requestAnimationFrame(gameLoop);
