/* ============================================
   GRÚA MUNICIPAL — Operación Remolque
   Full Game Script — Vanilla JS + Canvas
   ============================================ */

// ==========================================
// 1. CONFIGURATION
// ==========================================

const CFG = {
  // Canvas
  W: 960,
  H: 600,

  // Roads
  ROAD_W: 50,
  H_ROADS: [25, 175, 325, 475, 575], // y centers
  V_ROADS: [25, 185, 345, 505, 665, 825, 935], // x centers

  // Truck
  TRUCK_LEN: 44,
  TRUCK_W: 20,
  CAB_LEN: 16,
  MAX_SPEED: 160,
  REV_SPEED: 80,
  ACCEL: 220,
  BRAKE: 280,
  FRICTION: 90,
  TURN_SPEED: 2.6,

  // Hooking
  HOOK_RANGE: 36,
  HOOK_RATE: 0.45, // progress per second (full in ~2.2s)
  HOOK_SPEED_LIMIT: 8, // max truck speed for hooking

  // Timer
  START_TIME: 60,

  // Delivery
  BASE: { x: 28, y: 445, w: 170, h: 130 },

  // Car types
  CARS: {
    comun:   { label: 'COMÚN',  len: 34, w: 16, color: '#3abf65', points: 100, timeBonus: 10, speedPenalty: 1.0, hookWindow: 0 },
    camioneta:{ label: '4×4',   len: 40, w: 22, color: '#3a7bd5', points: 250, timeBonus: 15, speedPenalty: 0.75, hookWindow: 0 },
    deportivo:{ label: 'DEPOR', len: 30, w: 14, color: '#ff6b9d', points: 500, timeBonus: 8,  speedPenalty: 1.0, hookWindow: 8 },
  },
};

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

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function padNum(n, len) {
  return String(Math.floor(n)).padStart(len, '0');
}

// ==========================================
// 4. MAP — ROADS & BUILDINGS
// ==========================================

let buildings = [];

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

      // Skip base area (bottom-left corner)
      if (vr[i] < 200 && hr[j] > 400) continue;

      const hue = randInt(10, 50);
      buildings.push({
        x: left, y: top, w: right - left, h: bot - top,
        color: `hsl(${hue}, 30%, ${randInt(18, 32)}%)`,
        roof: `hsl(${hue}, 25%, ${randInt(28, 40)}%)`,
        windows: randInt(2, 5),
      });
    }
  }
}

// ==========================================
// 5. DIALOGUE SYSTEM
// ==========================================

const DIALOGUES = {
  patrolling: [
    { s: 'Evelyn', t: 'Bien equipo, busquen infractores. La ciudad no se limpia sola.' },
    { s: 'Tito', t: 'Ahí voy, doña Evelyn. Con cuidado que estos baches...' },
    { s: 'Cacho', t: 'Ojalá sea uno fácil, no tengo ganas de complicarme.' },
    { s: 'Evelyn', t: 'Circulen, circulen. No tenemos todo el día.' },
    { s: 'Tito', t: '¿Alguien ve algo? Yo no veo nada raro por acá.' },
    { s: 'Cacho', t: '¿Cuántos autos tenemos que remolcar hoy?' },
    { s: 'Evelyn', t: 'No me gusta repetir las órdenes. Estén atentos.' },
  ],
  approaching: [
    { s: 'Evelyn', t: '¡Ahí está! Acérquense despacio, no lo espanten.' },
    { s: 'Tito', t: 'Lo veo. Dejame acomodar la grúa bien cerquita.' },
    { s: 'Cacho', t: 'Dale Tito, dale, que me muero de ansiedad.' },
    { s: 'Evelyn', t: 'Despacito, que no se nos escape.' },
    { s: 'Tito', t: 'Ahí voy, ahí voy... un poquito más...' },
  ],
  hooking: [
    { s: 'Evelyn', t: '¡Enganchando! Tito, QUIETO. No te muevas ni un milímetro.' },
    { s: 'Tito', t: 'Estoy quieto, estoy quieto... aguanta...' },
    { s: 'Cacho', t: '¡Vamos, vamos, ya casi! ¡No respiren!' },
    { s: 'Evelyn', t: 'Concéntrense. Un movimiento en falso y perdemos el auto.' },
    { s: 'Cacho', t: '¡Dale que dale que ya sale!' },
  ],
  hooked: [
    { s: 'Evelyn', t: '¡Perfecto! Bien hecho. Ahora a la base, con cuidado.' },
    { s: 'Tito', t: 'Ahí lo llevamos. Pesadito está el muchacho.' },
    { s: 'Cacho', t: '¡Lo logramos! Un aplauso para el equipo.' },
    { s: 'Evelyn', t: 'Buen trabajo. Ahora de vuelta, que el reloj no perdona.' },
  ],
  delivering: [
    { s: 'Evelyn', t: '¡Entrega exitosa! Excelente, equipo.' },
    { s: 'Tito', t: 'Uno más para el récord. Así se hace.' },
    { s: 'Cacho', t: '¡Sí señor! Vamos por el siguiente, rápido rápido.' },
    { s: 'Evelyn', t: 'Bien. Descansen 10 segundos... es broma, ¡al próximo!' },
  ],
  lowtime: [
    { s: 'Evelyn', t: '¡Se nos acaba el tiempo! Muévanse.' },
    { s: 'Tito', t: '¡Uff, la voy a pisar! Agárrense todos.' },
    { s: 'Cacho', t: '¡No no no, yo no quiero perder! ¡Dale Tito!' },
    { s: 'Evelyn', t: 'Rápido, el próximo auto. ¡VAMOS!' },
  ],
  hookFail: [
    { s: 'Cacho', t: '¡Ay, se nos fue! Lo moviste Tito, te dije que no te muevas.' },
    { s: 'Evelyn', t: 'Perfecto... lo perdieron. Otra vez, desde cero.' },
    { s: 'Tito', t: 'Disculpen, me tembló el pie. Ahora sí, quieto total.' },
    { s: 'Cacho', t: '¡Pero qué hacés Tito! Bueno, vamos de nuevo.' },
  ],
  sportsFlee: [
    { s: 'Evelyn', t: '¡El dueño llegó! Se nos va el deportivo. Mierda.' },
    { s: 'Tito', t: 'Uh, era rápido el dueño. Ni chance tuvimos.' },
    { s: 'Cacho', t: '¡Noooo! Ese era el de 500 puntos...' },
  ],
  gameover: [
    { s: 'Evelyn', t: 'Se acabó el tiempo. Buen trabajo, equipo. Descansen.' },
    { s: 'Tito', t: 'Uh, nos quedamos con ganas de más...' },
    { s: 'Cacho', t: '¡Noooo! Yo quería seguir... bueno, la próxima será.' },
  ],
};

let lastDialogue = null;

function setDialogue(speaker, text) {
  dialChar.textContent = speaker;
  dialText.textContent = text;
}

function sayDialogue(phase, force) {
  const pool = DIALOGUES[phase];
  if (!pool || pool.length === 0) return;
  if (force && force.speaker && force.text) {
    setDialogue(force.speaker, force.text);
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
// 6. AUDIO (simple beeps via Web Audio)
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
  } catch (_) { /* silent fail */ }
}

function beepHookProgress() { beep(600, 0.06, 0.05); }
function beepHookComplete() { beep(880, 0.12, 0.1); setTimeout(() => beep(1100, 0.15, 0.1), 100); }
function beepDeliver() { beep(660, 0.1, 0.1); setTimeout(() => beep(880, 0.15, 0.1), 120); }
function beepTimerLow() { beep(440, 0.08, 0.06); }

// ==========================================
// 7. GAME STATE
// ==========================================

let game = {};

function resetGame() {
  game = {
    score: 0,
    carsDelivered: 0,
    timeLeft: CFG.START_TIME,
    gameOver: false,
    phase: 'patrolling',
    hookProgress: 0,
    isHooking: false,
    hookCancel: false,
    dialCooldown: 0,
    lowTimeBeep: 0,

    truck: {
      x: CFG.BASE.x + CFG.BASE.w / 2,
      y: CFG.BASE.y + CFG.BASE.h * 0.3,
      heading: Math.PI / 2, // facing down
      speed: 0,
      towing: null,
    },

    worldCars: [],
    target: null,   // the current target car (in worldCars)
    lastSpawnTime: 0,
    sportsTimer: 0,
    popups: [],
  };
  generateBuildings();
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
  // Spawn on a random road position, aligned with road direction
  const isHorizontal = Math.random() < 0.5;
  let x, y, heading;

  if (isHorizontal) {
    y = pick(CFG.H_ROADS.slice(1, -1)); // middle of horizontal road
    y += rand(-12, 12);
    x = rand(60, CFG.W - 60);
    heading = Math.random() < 0.5 ? 0 : Math.PI; // facing left or right
  } else {
    x = pick(CFG.V_ROADS.slice(1, -1)); // middle of vertical road
    x += rand(-12, 12);
    y = rand(60, CFG.H - 60);
    heading = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2; // facing up or down
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
    x: pos.x,
    y: pos.y,
    heading: pos.heading,
    type: typeKey,
    ...type,
    hooked: false,
    fleeTimer: type.hookWindow > 0 ? type.hookWindow : 0,
    fleeing: false,
  };

  game.worldCars.push(car);
  game.target = car;
  if (force !== true) {
    sayDialogue('approaching');
  }
  updateHUDTarget();
}

// ==========================================
// 10. UPDATE FUNCTIONS
// ==========================================

function updatePhysics(dt) {
  const t = game.truck;

  // Acceleration / braking
  if (keys['ArrowUp'] || keys['KeyW']) {
    t.speed += CFG.ACCEL * dt;
  } else if (keys['ArrowDown'] || keys['KeyS']) {
    t.speed -= CFG.BRAKE * dt;
  } else {
    // Friction
    if (Math.abs(t.speed) < 2) t.speed = 0;
    else t.speed -= Math.sign(t.speed) * CFG.FRICTION * dt;
  }

  // Speed limit
  let maxSpeed = CFG.MAX_SPEED;
  if (t.towing && t.towing.speedPenalty < 1) {
    maxSpeed *= t.towing.speedPenalty;
  }
  t.speed = clamp(t.speed, -CFG.REV_SPEED, maxSpeed);

  // Rotation (only if moving)
  const moving = Math.abs(t.speed) > 1;
  if (moving) {
    if (keys['ArrowLeft'] || keys['KeyA']) {
      t.heading -= CFG.TURN_SPEED * dt * (t.speed > 0 ? 1 : -0.6);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      t.heading += CFG.TURN_SPEED * dt * (t.speed > 0 ? 1 : -0.6);
    }
  }

  // Position
  t.x += Math.cos(t.heading) * t.speed * dt;
  t.y += Math.sin(t.heading) * t.speed * dt;

  // Clamp to map with margin
  const margin = 20;
  t.x = clamp(t.x, margin, CFG.W - margin);
  t.y = clamp(t.y, margin, CFG.H - margin);

  // Update towed car position
  if (t.towing) {
    const car = t.towing;
    const towDist = CFG.TRUCK_LEN / 2 + car.len / 2 + 4;
    car.x = t.x - Math.cos(t.heading) * towDist;
    car.y = t.y - Math.sin(t.heading) * towDist;
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

  // Calculate truck back position
  const bx = t.x - Math.cos(t.heading) * CFG.TRUCK_LEN / 2;
  const by = t.y - Math.sin(t.heading) * CFG.TRUCK_LEN / 2;
  const d = dist(bx, by, target.x, target.y);

  // Proximity approach dialogue
  if (d < 120 && game.phase === 'patrolling' && !game.isHooking && game.dialCooldown <= 0) {
    sayDialogue('approaching');
  }

  if (keys['Space'] && d < CFG.HOOK_RANGE && Math.abs(t.speed) < CFG.HOOK_SPEED_LIMIT && !game.gameOver) {
    // Hooking
    if (!game.isHooking) {
      game.isHooking = true;
      if (game.phase !== 'hooking') {
        game.phase = 'hooking';
        sayDialogue('hooking');
      }
    }
    game.hookProgress += CFG.HOOK_RATE * dt;
    beepHookProgress();

    if (game.hookProgress >= 1) {
      // Hook complete!
      game.hookProgress = 1;
      completeHook();
    }
  } else {
    if (game.isHooking) {
      cancelHook();
    }
  }

  // Sports car flee timer
  if (target.fleeTimer > 0) {
    target.fleeTimer -= dt;
    if (target.fleeTimer <= 0 && !target.hooked) {
      target.fleeing = true;
      sayDialogue('sportsFlee');
      beep(300, 0.3, 0.1);
      // Remove it after a moment
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
  if (game.hookProgress > 0.1) {
    sayDialogue('hookFail');
  }
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

  // Remove from world cars list
  const idx = game.worldCars.indexOf(target);
  if (idx !== -1) game.worldCars.splice(idx, 1);
}

function spawnPopup(x, y, text, color) {
  game.popups.push({
    x, y, text, color: color || '#ffde5c',
    life: 2.0,
    maxLife: 2.0,
    vy: -40, // pixels per second upward
  });
}

function isInBase(x, y) {
  const b = CFG.BASE;
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function updateDelivery() {
  const t = game.truck;
  if (t.towing && isInBase(t.x, t.y)) {
    // Deliver!
    const car = t.towing;
    game.score += car.points;
    game.carsDelivered++;
    game.timeLeft += car.timeBonus;

    spawnPopup(CFG.BASE.x + CFG.BASE.w / 2, CFG.BASE.y + 20,
      `+${car.points} pts  +${car.timeBonus}s`, '#ffde5c');
    beepDeliver();
    sayDialogue('delivering');
    game.phase = 'delivering';

    t.towing = null;
    game.target = null;
    updateHUDTarget();

    // Spawn next car after a short delay
    setTimeout(() => {
      if (!game.gameOver) {
        spawnCar();
        game.phase = 'patrolling';
      }
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

  // Low time warning
  if (game.timeLeft <= 15 && game.phase !== 'lowtime') {
    game.phase = 'lowtime';
    sayDialogue('lowtime');
  }

  // Periodic beep when low
  if (game.timeLeft <= 10) {
    game.lowTimeBeep += dt;
    if (game.lowTimeBeep >= 1) {
      beepTimerLow();
      game.lowTimeBeep = 0;
    }
  }
}

function updatePopups(dt) {
  for (let i = game.popups.length - 1; i >= 0; i--) {
    const p = game.popups[i];
    p.life -= dt;
    p.y += p.vy * dt;
    if (p.life <= 0) {
      game.popups.splice(i, 1);
    }
  }
}

function updateDialogue(dt) {
  if (game.dialCooldown > 0) {
    game.dialCooldown -= dt;
  }

  // Random banter while patrolling or towing
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
// 12. HUD UPDATES
// ==========================================

function updateHUD() {
  hudScore.textContent = padNum(game.score, 5);
  hudCars.textContent = game.carsDelivered;
  const displayTime = Math.max(0, Math.ceil(game.timeLeft));
  hudTimer.textContent = displayTime;

  if (game.timeLeft <= 15) {
    hudTimerBox.classList.add('low');
  } else {
    hudTimerBox.classList.remove('low');
  }
}

function updateHUDTarget() {
  hudTarget.textContent = game.target ? game.target.label : '—';
}

// ==========================================
// 13. RENDERER
// ==========================================

// ---- Background & Roads ----

function renderRoads() {
  // Asphalt background
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  const hw = CFG.ROAD_W / 2;

  // Draw horizontal roads
  ctx.fillStyle = '#3d3d45';
  for (const y of CFG.H_ROADS) {
    ctx.fillRect(0, y - hw, CFG.W, CFG.ROAD_W);
  }
  // Draw vertical roads
  for (const x of CFG.V_ROADS) {
    ctx.fillRect(x - hw, 0, CFG.ROAD_W, CFG.H);
  }

  // Lane markings (dashed)
  ctx.strokeStyle = '#5a5a66';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);

  for (const y of CFG.H_ROADS) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CFG.W, y);
    ctx.stroke();
  }
  for (const x of CFG.V_ROADS) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CFG.H);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Intersection highlights
  ctx.fillStyle = '#44444d';
  for (const y of CFG.H_ROADS) {
    for (const x of CFG.V_ROADS) {
      ctx.fillRect(x - hw + 2, y - hw + 2, CFG.ROAD_W - 4, CFG.ROAD_W - 4);
    }
  }
}

// ---- Buildings ----

function renderBuildings() {
  for (const b of buildings) {
    // Building body (shadow)
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(b.x + 2, b.y + 2, b.w, b.h);
    // Building
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // Roof highlight
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x, b.y, b.w, 4);

      // Windows (pre-computed)
    if (!b.winColors) {
      b.winColors = [];
      const count = b.windows;
      for (let i = 0; i < count; i++) {
        b.winColors.push(Math.random() < 0.6 ? '#e8d870' : '#113355');
      }
    }
    const cols = Math.ceil(Math.sqrt(b.windows * (b.w / b.h)));
    const rows = Math.ceil(b.windows / cols);
    const winW = 8, winH = 6;
    const gapX = (b.w - cols * winW) / (cols + 1);
    const gapY = (b.h - rows * winH) / (rows + 1);
    let wi = 0;
    for (let r = 0; r < rows && wi < b.windows; r++) {
      for (let c = 0; c < cols && wi < b.windows; c++) {
        const wx = b.x + gapX + c * (winW + gapX);
        const wy = b.y + 8 + gapY + r * (winH + gapY);
        ctx.fillStyle = b.winColors[wi];
        ctx.fillRect(wx, wy, winW, winH);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, winW, winH);
        wi++;
      }
    }
  }
}

// ---- Base ----

function renderBase() {
  const b = CFG.BASE;
  // Green zone
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = '#3aff3a';
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x, b.y, b.w, b.h);

  // Hatching
  ctx.strokeStyle = 'rgba(58, 255, 58, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < b.w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(b.x + i, b.y);
    ctx.lineTo(b.x + i - 20, b.y + b.h);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = '#3aff3a';
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BASE', b.x + b.w / 2, b.y + b.h / 2);

  // Glow
  ctx.shadowColor = '#3aff3a';
  ctx.shadowBlur = 15;
  ctx.fillText('BASE', b.x + b.w / 2, b.y + b.h / 2);
  ctx.shadowBlur = 0;
}

// ---- Cars (on map) ----

function renderWorldCars() {
  for (const car of game.worldCars) {
    drawCar(car);

    // Warning indicator for target
    if (car === game.target && !car.fleeing) {
      renderTargetIndicator(car);
    }

    // Fleeing effect
    if (car.fleeing) {
      ctx.fillStyle = '#ff3333';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('¡HUYE!', car.x, car.y - 28);
    }

    // Hook window bar (sports car)
    if (car.fleeTimer > 0 && car.hookWindow > 0 && !car.hooked) {
      const bw = 36;
      const bh = 4;
      const bx = car.x - bw / 2;
      const by = car.y - car.len / 2 - 16;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = car.fleeTimer / car.hookWindow > 0.3 ? '#ff6b9d' : '#ff3333';
      ctx.fillRect(bx, by, bw * (car.fleeTimer / car.hookWindow), bh);
    }
  }
}

// ---- Target Indicator ----

function renderTargetIndicator(car) {
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180);
  const radius = 28 + 8 * pulse;

  ctx.strokeStyle = `rgba(255, 60, 60, ${0.3 + 0.4 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(car.x, car.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Second ring
  ctx.strokeStyle = `rgba(255, 200, 60, ${0.2 + 0.3 * (1 - pulse)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(car.x, car.y, radius + 8, 0, Math.PI * 2);
  ctx.stroke();

  // Arrow pointing down from above
  const arrowY = car.y - car.len / 2 - 20 - 8 * pulse;
  ctx.fillStyle = `rgba(255, 60, 60, ${0.6 + 0.4 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(car.x, arrowY + 8);
  ctx.lineTo(car.x - 5, arrowY);
  ctx.lineTo(car.x + 5, arrowY);
  ctx.closePath();
  ctx.fill();
}

// ---- Draw Vehicle ----

function drawCar(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);

  const l = car.len;
  const w = car.w;
  const hl = l / 2;
  const hw = w / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-hl + 2, -hw + 2, l, w);

  // Body
  ctx.fillStyle = car.color || '#3abf65';
  ctx.fillRect(-hl, -hw, l, w);

  // Roof/cabin (slightly darker top section)
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-hl, -hw, l, w * 0.4);

  // Windshield
  ctx.fillStyle = '#88ccff';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(hl - 8, -hw * 0.35, 6, w * 0.7);
  ctx.globalAlpha = 1;

  // Rear window
  ctx.fillStyle = '#88ccff';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(-hl + 2, -hw * 0.35, 5, w * 0.7);
  ctx.globalAlpha = 1;

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-hl, -hw, l, w);

  ctx.restore();
}

// ---- Truck ----

function renderTruck() {
  const t = game.truck;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.heading);

  const tl = CFG.TRUCK_LEN;
  const tw = CFG.TRUCK_W;
  const cl = CFG.CAB_LEN;
  const hl = tl / 2;
  const hw = tw / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-hl + 3, -hw + 3, tl, tw);

  // Flatbed (rear)
  ctx.fillStyle = '#cc8833';
  ctx.fillRect(-hl, -hw, tl - cl, tw);

  // Flatbed details
  ctx.strokeStyle = '#aa6622';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const rx = -hl + 6 + i * 10;
    ctx.beginPath();
    ctx.moveTo(rx, -hw);
    ctx.lineTo(rx, hw);
    ctx.stroke();
  }

  // Cab (front)
  ctx.fillStyle = '#dd9944';
  ctx.fillRect(hl - cl, -hw, cl, tw);

  // Windshield
  ctx.fillStyle = '#88ccff';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(hl - 5, -hw * 0.75, 4, tw * 0.5);
  ctx.globalAlpha = 1;

  // Light bar (top of cab)
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(hl - cl + 2, -hw - 3, cl - 4, 3);
  // Strobe effect
  if (Math.floor(Date.now() / 300) % 2 === 0) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(hl - cl + 3, -hw - 3, 3, 3);
  } else {
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(hl - cl + 8, -hw - 3, 3, 3);
  }

  // Hook at the back
  ctx.fillStyle = '#666';
  ctx.fillRect(-hl - 2, -2, 4, 4);

  // Outline
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-hl, -hw, tl, tw);

  // Speed lines (when going fast)
  const absSpeed = Math.abs(t.speed);
  if (absSpeed > 80) {
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + 0.1 * (absSpeed / CFG.MAX_SPEED)})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const sy = -hw - 6 - i * 8;
      ctx.beginPath();
      ctx.moveTo(-hl + 5, sy);
      ctx.lineTo(hl - 5, sy);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ---- Cable ----

function renderCable() {
  const t = game.truck;
  if (!t.towing) return;

  const car = t.towing;
  const bx = t.x - Math.cos(t.heading) * CFG.TRUCK_LEN / 2;
  const by = t.y - Math.sin(t.heading) * CFG.TRUCK_LEN / 2;
  const fx = car.x + Math.cos(car.heading) * car.len / 2;
  const fy = car.y + Math.sin(car.heading) * car.len / 2;

  // Cable with sag
  ctx.beginPath();
  ctx.moveTo(bx, by);
  const midX = (bx + fx) / 2;
  const midY = (by + fy) / 2 + 8; // sag
  ctx.quadraticCurveTo(midX, midY, fx, fy);
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.stroke();

  // Second cable (double chain look)
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 2, by);
  ctx.quadraticCurveTo(midX - 2, midY + 2, fx - 2, fy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + 2, by);
  ctx.quadraticCurveTo(midX + 2, midY + 2, fx + 2, fy);
  ctx.stroke();
}

// ---- Hook Progress Bar ----

function renderHookProgress() {
  if (!game.isHooking && game.hookProgress === 0) return;

  const t = game.truck;
  const bw = 60;
  const bh = 8;
  const bx = t.x - bw / 2;
  const by = t.y - CFG.TRUCK_W / 2 - 18;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

  // Progress
  const p = game.hookProgress;
  const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
  if (p < 0.5) {
    grad.addColorStop(0, '#ffee44');
    grad.addColorStop(1, '#ffaa00');
  } else if (p < 0.85) {
    grad.addColorStop(0, '#ffaa00');
    grad.addColorStop(1, '#ff6600');
  } else {
    grad.addColorStop(0, '#44ff44');
    grad.addColorStop(1, '#00cc00');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, bw * p, bh);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);

  // Percentage text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${Math.floor(p * 100)}%`, t.x, by - 2);
}

// ---- Score Popups ----

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

// ---- Towed Car render ----

function renderTowedCar() {
  if (game.truck.towing) {
    drawCar(game.truck.towing);
  }
}

// ---- Controls hint ----

function renderControlsHint() {
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('WASD/FLECHAS: Conducir  |  ESPACIO: Enganchar', 12, CFG.H - 10);
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

  // Map layers
  renderRoads();
  renderBase();
  renderBuildings();

  // World cars (on map)
  renderWorldCars();

  // Cable (behind tower if towing)
  renderCable();

  // Towed car (behind truck)
  renderTowedCar();

  // Truck (on top)
  renderTruck();

  // Effects
  renderHookProgress();
  renderPopups();

  // HUD overlay on canvas
  renderControlsHint();

  // "REMOLCANDO" indicator
  if (game.truck.towing) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('▼ REMOLCANDO ▼', game.truck.x, game.truck.y - CFG.TRUCK_W / 2 - 22);
  }

  // "EN BASE" indicator when near base
  if (isInBase(game.truck.x, game.truck.y)) {
    ctx.fillStyle = '#3aff3a';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('✔ EN BASE', game.truck.x, game.truck.y + CFG.TRUCK_W / 2 + 16);
  }

  // Game Over overlay is handled by HTML/CSS
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

restartBtn.addEventListener('click', () => {
  resetGame();
});

// ==========================================
// 17. BOOT
// ==========================================

resetGame();
lastTime = performance.now();
requestAnimationFrame(gameLoop);
