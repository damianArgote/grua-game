/* ============================================
   GRÚA MUNICIPAL — Phaser 3 Edition
   Operación Remolque CABA
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

  NARROW_V: [185, 345, 665, 825],
  NARROW_H: [175, 475],

  TILE: 10,
};

// ==========================================
// 2. CHARACTERS
// ==========================================

const CHARACTERS = {
  evelyn: { shortName:'Evelyn "La Flaca"', color:'#ffcc00', bg:'#1a1a00' },
  tata:   { shortName:'Tata',               color:'#4488ff', bg:'#001122' },
  vibora: { shortName:'Víbora',             color:'#22aa44', bg:'#002211' },
};

// ==========================================
// 3. DIALOGUE (Porteño)
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

// ==========================================
// 4. DOM REFERENCES
// ==========================================

const $ = id => document.getElementById(id);
const hudScore   = $('hud-score');
const hudCars    = $('hud-cars');
const hudTimer   = $('hud-timer');
const hudTimerBox= $('hud-timer-box');
const hudTarget  = $('hud-target');
const dialChar   = $('dialogue-char');
const dialText   = $('dialogue-text');
const overlay    = $('gameover-overlay');
const finalScore = $('final-score');
const finalCars  = $('final-cars');
const restartBtn = $('restart-btn');

// ==========================================
// 5. AUDIO (new Audio + beep)
// ==========================================

// ── File-based sounds (new Audio) ──

const AUDIO = {
  ext: '.wav',
  sounds: {
    musica_fondo: null,
    gancho:       null,
    monedas:      null,
    alarma:       null,
  },
  audioUnlocked: false,
  init() {
    for (const key of Object.keys(this.sounds)) {
      const a = new Audio(`sonidos/${key}${this.ext}`);
      if (key === 'musica_fondo') { a.loop = true; a.volume = 0.4; }
      else a.volume = 0.6;
      this.sounds[key] = a;
    }
  },
  play(key) {
    const a = this.sounds[key];
    if (!a) return;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch (_) {}
  },
  startMusic() {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    const bg = this.sounds.musica_fondo;
    if (bg) { bg.currentTime = 0; bg.play().catch(() => {}); }
  },
};
AUDIO.init();

// ── Web Audio beep (UI feedback) ──

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
// 6. UTILITY
// ==========================================

function rand(min, max)    { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, mn, mx)  { return Math.max(mn, Math.min(mx, v)); }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function padNum(n, len) { return String(Math.floor(n)).padStart(len, '0'); }

// ==========================================
// 7. BOOT SCENE
// ==========================================

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.setPath('assets');
    // Solo cargamos el tileset de PNG (es procedural y funciona bien).
    // Grúa y autos se generan proceduralmente en create() como fallback
    // — los PNGs generados por IA a 1254×1254 no escalan bien a sprites de juego.
    this.load.image('tileset', 'tileset.png');
  }

  create() {
    const T = CFG.TILE;
    const W = CFG.TRUCK_LEN + 4;
    const H = CFG.TRUCK_W + 4;

    // ── Tileset (6 tiles de TxT) — fallback si la PNG no cargó ──
    if (!this.textures.exists('tileset')) {
      const g = this.make.graphics({ add: false });
      [
        [0x2a2a30], [0x3a3a45], [0x555568],
        [0x3a3a45], [0x2e2e36], [0x3a3520],
      ].forEach((c, i) => {
        g.fillStyle(c[0]);
        g.fillRect(i * T, 0, T, T);
      });
      g.generateTexture('tileset', T * 6, T);
      g.destroy();
      console.warn('Tileset PNG no cargó, usando fallback generado');
    }

    // ── Fallback: truck ──
    if (!this.textures.exists('spr_truck')) {
      const g = this.make.graphics({ add: false });
      const l = CFG.TRUCK_LEN, w = CFG.TRUCK_W, cl = CFG.CAB_LEN;
      // Sombra
      g.fillStyle(0x000000, 0.3);
      g.fillRect(3, 3, l, w);
      // Caja
      g.fillStyle(0xcc8833);
      g.fillRect(0, 0, l - cl, w);
      g.lineStyle(1, 0xaa6622);
      for (let i = 0; i < 3; i++) g.lineBetween(6 + i * 10, 0, 6 + i * 10, w);
      // Cabina
      g.fillStyle(0xdd9944);
      g.fillRect(l - cl, 0, cl, w);
      g.fillStyle(0x88ccff, 0.6);
      g.fillRect(l - 5, w * 0.25, 4, w * 0.5);
      // Baliza
      g.fillStyle(0xff4444);
      g.fillRect(l - cl + 2, 0, cl - 4, 3);
      g.lineStyle(1.5, 0x5a3a1a);
      g.strokeRect(0, 0, l, w);
      g.fillStyle(0x666666);
      g.fillRect(0, w / 2 - 2, 4, 4);
      g.generateTexture('spr_truck', l + 4, w + 4);
      g.destroy();
    }

    // ── Fallback: cars ──
    this.genFallbackCar('spr_car_comun', 0x3abf65, 1);
    this.genFallbackCar('spr_car_camioneta', 0x3a7bd5, 1.2);
    this.genFallbackCar('spr_car_deportivo', 0xff6b9d, 0.9);

    this.scene.start('GameScene');
  }

  genFallbackCar(key, color, scale) {
    if (this.textures.exists(key)) return;
    const baseLen = 34, baseW = 16;
    const l = Math.round(baseLen * scale);
    const w = Math.round(baseW * scale);
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.25);
    g.fillRect(2, 2, l, w);
    g.fillStyle(color);
    g.fillRect(0, 0, l, w);
    g.fillStyle(0x000000, 0.15);
    g.fillRect(0, 0, l, Math.round(w * 0.35));
    g.fillStyle(0x88ccff, 0.5);
    g.fillRect(l - 6, Math.round(w * 0.3), 5, Math.round(w * 0.4));
    g.lineStyle(1, 0x000000, 0.35);
    g.strokeRect(0, 0, l, w);
    g.generateTexture(key, l + 4, w + 4);
    g.destroy();
  }
}

// ==========================================
// 8. GAME SCENE
// ==========================================

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  // ── CREATE ──────────────────────────────────

  create() {
    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey('W'),
      A: this.input.keyboard.addKey('A'),
      S: this.input.keyboard.addKey('S'),
      D: this.input.keyboard.addKey('D'),
    };
    this.keyL = this.input.keyboard.addKey('L');
    this.keyM = this.input.keyboard.addKey('M');
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._audioUnlocked = false;

    this.input.keyboard.on('keydown', (e) => {
      if (!this._audioUnlocked && /^(Arrow|Key[WASD])$/.test(e.code)) {
        this._audioUnlocked = true;
        AUDIO.startMusic();
      }
    });

    // ── Tilemap ──
    this.buildTilemap();

    // ── Persistent Graphics layers ──
    this.gBuildings = this.add.graphics().setDepth(1);
    this.gDeco      = this.add.graphics().setDepth(2);
    this.gObstacles = this.add.graphics().setDepth(3);
    this.gCable     = this.add.graphics().setDepth(7);
    this.gHookBar   = this.add.graphics().setDepth(8);
    this.gIndicator = this.add.graphics().setDepth(10);
    this.gSpeedLines= this.add.graphics().setDepth(6);
    this.gTowedLabel= this.add.graphics().setDepth(9);

    // ── Truck sprite ──
    this.truck = this.add.sprite(0, 0, 'spr_truck').setDepth(6).setOrigin(0.5, 0.5);

    // ── Estado ──
    this.truckHeading = Math.PI / 2;
    this.truckSpeed = 0;
    this._bounceCooldown = 0;
    this.truckTowing = null;
    this.lastDialogue = null;
    this.buildings = [];
    this.obstacles = [];

    this.resetGame();
  }

  // ── TILEMAP ─────────────────────────────────

  buildTilemap() {
    const T = CFG.TILE;
    const mapW = Math.ceil(CFG.W / T);
    const mapH = Math.ceil(CFG.H / T);
    const hw = CFG.ROAD_W / 2;
    const data = [];

    for (let row = 0; row < mapH; row++) {
      data[row] = [];
      for (let col = 0; col < mapW; col++) {
        const px = col * T, py = row * T;

        // Playón
        if (px >= CFG.BASE.x && px < CFG.BASE.x + CFG.BASE.w &&
            py >= CFG.BASE.y && py < CFG.BASE.y + CFG.BASE.h) {
          data[row][col] = 4; continue;
        }

        let onH = false, onV = false, nh = false, nv = false;
        for (const ry of CFG.H_ROADS) {
          if (py >= ry - hw && py < ry + hw) { onH = true; if (CFG.NARROW_H.includes(ry)) nh = true; break; }
        }
        for (const rx of CFG.V_ROADS) {
          if (px >= rx - hw && px < rx + hw) { onV = true; if (CFG.NARROW_V.includes(rx)) nv = true; break; }
        }

        if (onH && onV)       data[row][col] = 3;
        else if (onH)         data[row][col] = nh ? 2 : 1;
        else if (onV)         data[row][col] = nv ? 2 : 1;
        else                  data[row][col] = 0;
      }
    }

    const map = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const tiles = map.addTilesetImage('tileset');
    map.createLayer(0, tiles, 0, 0).setDepth(0);
    this.map = map; // ← guardamos referencia para chequeos viales
  }

  /** Devuelve true si (px,py) está sobre un tile de calle válido (1..4) */
  isOnRoad(px, py) {
    if (!this.map) return true;
    const T = CFG.TILE;
    const col = Math.floor(px / T);
    const row = Math.floor(py / T);
    if (col < 0 || col >= 96 || row < 0 || row >= 60) return false;
    const tile = this.map.getTileAt(col, row);
    return tile && tile.index >= 1 && tile.index <= 4;
  }

  /** Devuelve true si (px,py) está dentro de algún obstáculo */
  isOnObstacle(px, py) {
    for (const o of this.obstacles) {
      if (px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h) return true;
    }
    return false;
  }

  /** Chequea si el camión está pisando un obstáculo (4 esquinas) */
  isTruckOnObstacle() {
    const hl = (CFG.TRUCK_LEN + 4) / 2 * 0.55;
    const hw = (CFG.TRUCK_W + 4) / 2 * 0.55;
    const cos = Math.cos(this.truckHeading);
    const sin = Math.sin(this.truckHeading);
    const corners = [
      [-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]
    ];
    for (const [lx, ly] of corners) {
      const wx = this.truck.x + lx * cos - ly * sin;
      const wy = this.truck.y + lx * sin + ly * cos;
      if (this.isOnObstacle(wx, wy)) return true;
    }
    return false;
  }

  // ── RESET ───────────────────────────────────

  resetGame() {
    if (this.truckTowing) { this.truckTowing.destroy(); this.truckTowing = null; }
    this.carGroup?.clear(true, true);

    this.state = {
      score: 0, carsDelivered: 0,
      timeLeft: CFG.START_TIME, gameOver: false,
      phase: 'patrolling',
      hookProgress: 0, isHooking: false,
      dialCooldown: 0, lowTimeBeep: 0,
      target: null,
      popups: [],
      lastSpawnTime: 0,
    };

    this.truck.setPosition(CFG.BASE.x + CFG.BASE.w / 2, CFG.BASE.y + CFG.BASE.h * 0.3);
    this.truck.setRotation(Math.PI / 2);
    this.truckSpeed = 0;
    this.truckHeading = Math.PI / 2;
    this.truck.setVisible(true);

    if (!this.carGroup) {
      this.carGroup = this.add.group();
    }

    this.buildings = [];
    this.obstacles = [];
    this.generateBuildings();
    this.generateObstacles();
    this.renderBuildings();
    this.renderObstacles();
    this.renderDeco();

    this.popupTexts?.forEach(t => t.destroy());
    this.popupTexts = [];

    this.spawnCar(true);
    this.sayDialogue('patrolling');
    overlay.classList.add('hidden');
  }

  // ── MAP GENERATION ──────────────────────────

  generateBuildings() {
    this.buildings = [];
    const hr = CFG.H_ROADS, vr = CFG.V_ROADS, hw = CFG.ROAD_W / 2;
    for (let i = 0; i < vr.length - 1; i++) {
      for (let j = 0; j < hr.length - 1; j++) {
        const left  = vr[i]   + hw + 3;
        const right = vr[i+1] - hw - 3;
        const top   = hr[j]   + hw + 3;
        const bot   = hr[j+1] - hw - 3;
        if (right <= left || bot <= top) continue;
        if (vr[i] < 200 && hr[j] > 400) continue;

        const hue = randInt(15, 45);
        this.buildings.push({
          x: left, y: top, w: right - left, h: bot - top,
          color: Phaser.Display.Color.HSLToColor(hue / 360, 0.3, 0.27).color,
          roof: Phaser.Display.Color.HSLToColor(hue / 360, 0.25, 0.36).color,
          windows: randInt(2, 5),
          winColors: Array.from({length: randInt(2,5)}, () => Math.random() < 0.55 ? 0xe8d870 : 0x113355),
        });
      }
    }
  }

  generateObstacles() {
    this.obstacles = [];
    const hw = CFG.ROAD_W / 2, hr = CFG.H_ROADS, vr = CFG.V_ROADS;
    for (let i = 0; i < vr.length - 1; i++) {
      for (let j = 0; j < hr.length - 1; j++) {
        const left  = vr[i]   + hw + 3;
        const right = vr[i+1] - hw - 3;
        const top   = hr[j]   + hw + 3;
        const bot   = hr[j+1] - hw - 3;
        if (right <= left || bot <= top) continue;
        if (vr[i] < 200 && hr[j] > 400) continue;
        const bw = right - left, bh = bot - top;
        if (bw < 30 || bh < 30) continue;

        if (Math.random() < 0.45) {
          const side = Math.random() < 0.5 ? -1 : 1;
          this.obstacles.push({
            type:'bin', x: side === -1 ? left - 3 : right - 10,
            y: top + 12 + rand(0, bh - 30), w:10, h:12, color:0x4a4a3a,
          });
        }
        if (Math.random() < 0.18) {
          const side = Math.random() < 0.5 ? -1 : 1;
          this.obstacles.push({
            type:'stand', x: side === -1 ? left - 2 : right - 18,
            y: top + 20 + rand(0, bh - 50), w:18, h:14, color:0x2d6a3d,
          });
        }
      }
    }
  }

  // ── BUILDING RENDER ─────────────────────────

  renderBuildings() {
    const g = this.gBuildings;
    g.clear();
    for (const b of this.buildings) {
      g.fillStyle(0x1a1a22); this.rr(g, b.x + 2, b.y + 2, b.w, b.h, 6);
      g.fillStyle(b.color);  this.rr(g, b.x, b.y, b.w, b.h, 6);
      g.fillStyle(b.roof);   g.fillRect(b.x, b.y, b.w, 5);

      const winW = 8, winH = 6;
      const cols = Math.ceil(Math.sqrt(b.windows * (b.w / b.h)));
      const rows = Math.ceil(b.windows / cols);
      const gapX = (b.w - cols * winW) / (cols + 1);
      const gapY = (b.h - rows * winH) / (rows + 1);
      let wi = 0;
      for (let r = 0; r < rows && wi < b.windows; r++) {
        for (let c = 0; c < cols && wi < b.windows; c++) {
          const wx = b.x + gapX + c * (winW + gapX);
          const wy = b.y + 10 + gapY + r * (winH + gapY);
          g.fillStyle(b.winColors[wi]); g.fillRect(wx, wy, winW, winH);
          g.lineStyle(0.5, 0x222222); g.strokeRect(wx, wy, winW, winH);
          wi++;
        }
      }
    }
  }

  rr(g, x, y, w, h, r) {
    // Rounded rect helper for Phaser Graphics
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    g.lineTo(x + w, y + h - r);
    g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    g.lineTo(x + r, y + h);
    g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    g.lineTo(x, y + r);
    g.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    g.closePath();
    g.fillPath();
  }

  // ── DECO ────────────────────────────────────

  renderDeco() {
    const g = this.gDeco;
    g.clear();

    // Cordón amarillo
    const hw = CFG.ROAD_W / 2, cs = 14;
    g.fillStyle(0xffcc00);
    for (let i = 0; i < CFG.V_ROADS.length - 1; i++) {
      for (let j = 0; j < CFG.H_ROADS.length - 1; j++) {
        const l = CFG.V_ROADS[i] + hw, r = CFG.V_ROADS[i+1] - hw;
        const t = CFG.H_ROADS[j] + hw, b = CFG.H_ROADS[j+1] - hw;
        if (r <= l || b <= t) continue;
        g.fillRect(l - 2, t - 2, cs, cs);
        g.fillRect(r - cs + 2, t - 2, cs, cs);
        g.fillRect(l - 2, b - cs + 2, cs, cs);
        g.fillRect(r - cs + 2, b - cs + 2, cs, cs);
      }
    }

    // Playón
    const bx = CFG.BASE;
    g.fillStyle(0x2e2e36); g.fillRect(bx.x, bx.y, bx.w, bx.h);
    for (let i = 0; i < bx.w; i += 20) {
      g.fillStyle((Math.floor(i / 20) % 2 === 0) ? 0xffcc00 : 0x111111);
      g.fillRect(bx.x + i, bx.y + bx.h - 14, 20, 14);
    }
    for (let i = 0; i < bx.h; i += 20) {
      g.fillStyle((Math.floor(i / 20) % 2 === 0) ? 0xffcc00 : 0x111111);
      g.fillRect(bx.x, bx.y + i, 8, 20);
    }
    g.lineStyle(2, 0x888888); g.strokeRect(bx.x, bx.y, bx.w, bx.h);
    g.fillStyle(0x1a1a22); g.fillRect(bx.x + bx.w / 2 - 80, bx.y + 8, 160, 36);
    g.lineStyle(2, 0xffcc00); g.strokeRect(bx.x + bx.w / 2 - 80, bx.y + 8, 160, 36);
    g.lineStyle(0.5, 0x787882, 0.15);
    for (let i = 16; i < bx.w; i += 16) g.lineBetween(bx.x + i, bx.y, bx.x + i, bx.y + bx.h);
    for (let i = 12; i < bx.h; i += 12) g.lineBetween(bx.x, bx.y + i, bx.x + bx.w, bx.y + i);
  }

  // ── OBSTACLES ───────────────────────────────

  renderObstacles() {
    const g = this.gObstacles;
    g.clear();
    for (const o of this.obstacles) {
      if (o.type === 'bin') {
        g.fillStyle(0x33333a); g.fillRect(o.x + 1, o.y + 1, o.w, o.h);
        g.fillStyle(o.color);  g.fillRect(o.x, o.y, o.w, o.h);
        g.fillStyle(0x555555); g.fillRect(o.x + 1, o.y, o.w - 2, 2);
        g.fillStyle(0x2a2a30); g.fillRect(o.x - 1, o.y - 3, o.w + 2, 3);
      } else {
        g.fillStyle(0x22222a); g.fillRect(o.x + 1, o.y + 1, o.w, o.h);
        g.fillStyle(o.color);  g.fillRect(o.x, o.y, o.w, o.h);
        g.fillStyle(0x1a4a2a); g.fillRect(o.x - 2, o.y - 3, o.w + 4, 3);
        g.fillStyle(0x88aacc, 0.3); g.fillRect(o.x + 2, o.y + 3, o.w - 4, o.h - 5);
      }
    }
  }

  // ── CAR SPAWNING ────────────────────────────

  randomSpawnPos() {
    const isH = Math.random() < 0.5;
    if (isH) {
      const y = pick(CFG.H_ROADS.slice(1, -1)) + rand(-12, 12);
      return { x: rand(60, CFG.W - 60), y, heading: Math.random() < 0.5 ? 0 : Math.PI };
    }
    const x = pick(CFG.V_ROADS.slice(1, -1)) + rand(-12, 12);
    return { x, y: rand(60, CFG.H - 60), heading: Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2 };
  }

  isInBase(x, y) {
    const b = CFG.BASE;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  spawnCar(force) {
    const types = Object.keys(CFG.CARS);
    const typeKey = pick(types);
    const type = CFG.CARS[typeKey];

    let pos, tries = 0;
    do {
      pos = this.randomSpawnPos();
      tries++;
    } while (
      tries < 30 &&
      (dist(pos.x, pos.y, this.truck.x, this.truck.y) < 120 ||
       this.isInBase(pos.x, pos.y) ||
       this.carGroup.getChildren().some(c => dist(pos.x, pos.y, c.x, c.y) < 80))
    );

    const texKey = typeKey === 'comun' ? 'spr_car_comun'
                 : typeKey === 'camioneta' ? 'spr_car_camioneta' : 'spr_car_deportivo';

    const sprite = this.add.sprite(pos.x, pos.y, texKey)
      .setOrigin(0.5, 0.5)
      .setRotation(pos.heading)
      .setDepth(4);

    sprite.carData = {
      type: typeKey, label: type.label,
      len: type.len, w: type.w, color: type.color,
      points: type.points, timeBonus: type.timeBonus,
      speedPenalty: type.speedPenalty, hookWindow: type.hookWindow,
      hooked: false, fleeTimer: type.hookWindow > 0 ? type.hookWindow : 0, fleeing: false,
    };

    this.carGroup.add(sprite);
    this.state.target = sprite;
    AUDIO.play('alarma');
    if (force !== true) this.sayDialogue('approaching');
    this.updateHUDTarget();
  }

  // ── PHYSICS ─────────────────────────────────

  updatePhysics(dt) {
    const up   = this.cursors.up.isDown   || this.wasd.W.isDown || this.keyL.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown || this.keyM.isDown;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right= this.cursors.right.isDown|| this.wasd.D.isDown;

    if (up) this.truckSpeed += CFG.ACCEL * dt;
    else if (down) this.truckSpeed -= CFG.BRAKE * dt;
    else {
      if (Math.abs(this.truckSpeed) < 2) this.truckSpeed = 0;
      else this.truckSpeed -= Math.sign(this.truckSpeed) * CFG.FRICTION * dt;
    }

    let maxSpeed = CFG.MAX_SPEED;
    if (this.truckTowing?.carData?.speedPenalty < 1) maxSpeed *= this.truckTowing.carData.speedPenalty;
    this.truckSpeed = clamp(this.truckSpeed, -CFG.REV_SPEED, maxSpeed);

    const moving = Math.abs(this.truckSpeed) > 1;
    if (moving) {
      const tm = this.truckSpeed > 0 ? 1 : -0.6;
      if (left)  this.truckHeading -= CFG.TURN_SPEED * dt * tm;
      if (right) this.truckHeading += CFG.TURN_SPEED * dt * tm;
    }

    // ── Guardar posición previa para rebote ──
    const prevX = this.truck.x;
    const prevY = this.truck.y;

    this.truck.x += Math.cos(this.truckHeading) * this.truckSpeed * dt;
    this.truck.y += Math.sin(this.truckHeading) * this.truckSpeed * dt;
    this.truck.x = clamp(this.truck.x, 20, CFG.W - 20);
    this.truck.y = clamp(this.truck.y, 20, CFG.H - 20);

    // ── Chequeo vial: el camión debe estar sobre la calle ──
    // Usamos caja de colisión más chica (55%) para que las calles de 50px
    // no traben al camión cuando gira (48×24 real, ~26×13 de chequeo)
    const hl = (CFG.TRUCK_LEN + 4) / 2 * 0.55;
    const hw = (CFG.TRUCK_W + 4) / 2 * 0.55;
    const cos = Math.cos(this.truckHeading);
    const sin = Math.sin(this.truckHeading);
    const corners = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]];
    let offRoad = false;
    for (const [lx, ly] of corners) {
      const wx = this.truck.x + lx * cos - ly * sin;
      const wy = this.truck.y + lx * sin + ly * cos;
      if (!this.isOnRoad(wx, wy)) { offRoad = true; break; }
    }

    // Cooldown de 4 frames para evitar rebotes encadenados
    if (this._bounceCooldown > 0) this._bounceCooldown--;

    if ((offRoad || this.isTruckOnObstacle()) && this._bounceCooldown <= 0) {
      this.truck.x = prevX * 0.7 + this.truck.x * 0.3;
      this.truck.y = prevY * 0.7 + this.truck.y * 0.3;
      this.truckSpeed *= -0.15;
      this._bounceCooldown = 4;
      beep(120, 0.08, 0.15);
    }

    this.truck.setRotation(this.truckHeading);

    if (this.truckTowing) {
      const td = CFG.TRUCK_LEN / 2 + this.truckTowing.carData.len / 2 + 4;
      this.truckTowing.setPosition(
        this.truck.x - Math.cos(this.truckHeading) * td,
        this.truck.y - Math.sin(this.truckHeading) * td
      );
      this.truckTowing.setRotation(this.truckHeading);
    }
  }

  // ── HOOKING ─────────────────────────────────

  updateHooking(dt) {
    const st = this.state;
    const target = st.target;
    if (!target || target.carData.hooked || target.carData.fleeing) {
      if (st.isHooking) this.cancelHook();
      return;
    }

    const bx = this.truck.x - Math.cos(this.truckHeading) * CFG.TRUCK_LEN / 2;
    const by = this.truck.y - Math.sin(this.truckHeading) * CFG.TRUCK_LEN / 2;
    const d = dist(bx, by, target.x, target.y);

    if (d < 120 && st.phase === 'patrolling' && !st.isHooking && st.dialCooldown <= 0)
      this.sayDialogue('approaching');

    if (this.spaceKey.isDown && d < CFG.HOOK_RANGE && Math.abs(this.truckSpeed) < CFG.HOOK_SPEED_LIMIT && !st.gameOver) {
      if (!st.isHooking) {
        st.isHooking = true;
        if (st.phase !== 'hooking') { st.phase = 'hooking'; this.sayDialogue('hooking'); }
      }
      st.hookProgress += CFG.HOOK_RATE * dt;
      beepHookProgress();

      if (st.hookProgress > 0.2 && st.hookProgress < 0.6 && Math.random() < 0.0008)
        this.sayDialogue('ownerAngry');

      if (st.hookProgress >= 1) { st.hookProgress = 1; this.completeHook(); }
    } else {
      if (st.isHooking) this.cancelHook();
    }

    if (target.carData.fleeTimer > 0) {
      target.carData.fleeTimer -= dt;
      if (target.carData.fleeTimer <= 0 && !target.carData.hooked) {
        target.carData.fleeing = true;
        this.sayDialogue('sportsFlee');
        beep(300, 0.3, 0.1);
        this.time.delayedCall(800, () => {
          this.carGroup.remove(target, true, true);
          if (st.target === target) st.target = null;
          if (this.truckTowing === target) this.truckTowing = null;
          this.spawnCar();
        });
      }
    }
  }

  cancelHook() {
    const st = this.state;
    if (st.hookProgress > 0.1) this.sayDialogue('hookFail');
    st.isHooking = false; st.hookProgress = 0; st.phase = 'patrolling';
  }

  completeHook() {
    const st = this.state;
    if (!st.target) return;
    beepHookComplete();
    AUDIO.play('gancho');
    this.truckTowing = st.target;
    st.target.carData.hooked = true;
    st.isHooking = false; st.hookProgress = 0; st.phase = 'towing';
    this.sayDialogue('hooked');
    this.carGroup.remove(st.target);
    this.truckTowing.setDepth(1);
  }

  // ── DELIVERY ────────────────────────────────

  updateDelivery() {
    const st = this.state;
    const tow = this.truckTowing;
    if (tow && this.isInBase(this.truck.x, this.truck.y)) {
      const cd = tow.carData;
      st.score += cd.points;
      st.carsDelivered++;
      st.timeLeft += cd.timeBonus;
      this.spawnPopup(CFG.BASE.x + CFG.BASE.w / 2, CFG.BASE.y + 20,
        `+${cd.points} pts +${cd.timeBonus}s`, '#ffde5c');

      beepDeliver();
      AUDIO.play('monedas');
      this.sayDialogue('delivering');
      st.phase = 'delivering';
      this.truckTowing.destroy();
      this.truckTowing = null;
      st.target = null;
      this.updateHUDTarget();

      this.time.delayedCall(800, () => {
        if (!st.gameOver) { this.spawnCar(); st.phase = 'patrolling'; }
      });
    }
  }

  // ── TIMER ───────────────────────────────────

  updateTimer(dt) {
    const st = this.state;
    if (st.gameOver) return;
    st.timeLeft -= dt;
    if (st.timeLeft <= 0) { st.timeLeft = 0; this.gameOver(); return; }
    if (st.timeLeft <= 15 && st.phase !== 'lowtime') {
      st.phase = 'lowtime'; this.sayDialogue('lowtime');
    }
    if (st.timeLeft <= 10) {
      st.lowTimeBeep += dt;
      if (st.lowTimeBeep >= 1) { beepTimerLow(); st.lowTimeBeep = 0; }
    }
  }

  // ── POPUPS ──────────────────────────────────

  spawnPopup(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: color || '#ffde5c',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(11);

    this.state.popups.push({ obj: t, life: 2.0, maxLife: 2.0, vy: -40 });
  }

  updatePopups(dt) {
    const pps = this.state.popups;
    for (let i = pps.length - 1; i >= 0; i--) {
      const p = pps[i];
      p.life -= dt;
      p.obj.y += p.vy * dt;
      p.obj.setAlpha(Math.min(1, p.life / p.maxLife * 2));
      p.obj.setScale(1 + 0.3 * (1 - p.life / p.maxLife));
      if (p.life <= 0) { p.obj.destroy(); pps.splice(i, 1); }
    }
  }

  // ── DIALOGUE ────────────────────────────────

  sayDialogue(phase, force) {
    const pool = DIALOGUES[phase];
    if (!pool || pool.length === 0) return;
    let line, attempts = 0;
    do { line = pick(pool); attempts++; }
    while (line === this.lastDialogue && attempts < 20);
    this.lastDialogue = line;

    const ch = CHARACTERS[line.s];
    if (!ch) return;
    dialChar.textContent = ch.shortName;
    dialChar.style.color = ch.color;
    dialText.textContent = line.t;
    document.querySelectorAll('.avatar').forEach(el => el.classList.remove('active'));
    const av = document.getElementById(`avatar-${line.s}`);
    if (av) av.classList.add('active');
    this.state.dialCooldown = 4;
  }

  updateDialogue(dt) {
    const st = this.state;
    if (st.dialCooldown > 0) st.dialCooldown -= dt;
    if (st.dialCooldown <= 0 && !st.gameOver) {
      if (st.phase === 'patrolling' && !st.isHooking && Math.random() < 0.001) {
        this.sayDialogue('patrolling'); st.dialCooldown = 5;
      }
      if (st.phase === 'towing' && Math.random() < 0.001) {
        this.sayDialogue('hooked'); st.dialCooldown = 4;
      }
    }
  }

  // ── GAME OVER ───────────────────────────────

  gameOver() {
    this.state.gameOver = true;
    this.sayDialogue('gameover');
    finalScore.textContent = this.state.score;
    finalCars.textContent = this.state.carsDelivered;
    overlay.classList.remove('hidden');
    beep(200, 0.5, 0.15);
    setTimeout(() => beep(150, 0.6, 0.12), 300);
  }

  // ── HUD ─────────────────────────────────────

  updateHUD() {
    const st = this.state;
    hudScore.textContent = padNum(st.score, 5);
    hudCars.textContent = st.carsDelivered;
    hudTimer.textContent = Math.max(0, Math.ceil(st.timeLeft));
    hudTimerBox.classList.toggle('low', st.timeLeft <= 15);
  }

  updateHUDTarget() {
    hudTarget.textContent = this.state.target ? this.state.target.carData.label : '—';
  }

  // ── CABLE ───────────────────────────────────

  renderCable() {
    const g = this.gCable;
    g.clear();
    const tow = this.truckTowing;
    if (!tow) return;

    const bx = this.truck.x - Math.cos(this.truckHeading) * CFG.TRUCK_LEN / 2;
    const by = this.truck.y - Math.sin(this.truckHeading) * CFG.TRUCK_LEN / 2;
    const fx = tow.x + Math.cos(tow.rotation) * tow.carData.len / 2;
    const fy = tow.y + Math.sin(tow.rotation) * tow.carData.len / 2;
    const mx = (bx + fx) / 2, my = (by + fy) / 2 + 8;

    g.lineStyle(2.5, 0x888888);
    g.beginPath();
    g.moveTo(bx, by); g.lineTo(mx, my); g.lineTo(fx, fy);
    g.strokePath();

    g.lineStyle(1, 0x666666);
    for (const [ox, oy] of [[-2,0],[2,0]]) {
      g.beginPath();
      g.moveTo(bx + ox, by + oy);
      g.lineTo(mx + ox, my + 2);
      g.lineTo(fx + ox, fy + oy);
      g.strokePath();
    }
  }

  // ── HOOK BAR ────────────────────────────────

  renderHookBar() {
    const g = this.gHookBar;
    g.clear();
    const st = this.state;
    if (!st.isHooking && st.hookProgress === 0) return;

    const bw = 60, bh = 8;
    const bx = this.truck.x - bw / 2, by = this.truck.y - CFG.TRUCK_W / 2 - 18;

    g.fillStyle(0x000000, 0.7);
    g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

    const p = st.hookProgress;
    g.fillStyle(p < 0.5 ? 0xffee44 : p < 0.85 ? 0xffaa00 : 0x44ff44);
    g.fillRect(bx, by, bw * p, bh);
    g.lineStyle(1, 0xffffff);
    g.strokeRect(bx, by, bw, bh);
  }

  // ── TARGET INDICATOR ────────────────────────

  renderIndicator() {
    const g = this.gIndicator;
    g.clear();
    const st = this.state;
    const target = st.target;
    if (!target || target.carData.hooked || target.carData.fleeing) return;

    const t = this.time.now;
    const pulse = 0.5 + 0.5 * Math.sin(t / 180);
    const radius = 28 + 8 * pulse;

    g.lineStyle(3, 0xff3c3c, 0.3 + 0.4 * pulse);
    g.strokeCircle(target.x, target.y, radius);
    g.lineStyle(2, 0xffc83c, 0.2 + 0.3 * (1 - pulse));
    g.strokeCircle(target.x, target.y, radius + 8);

    const arrowY = target.y - target.carData.len / 2 - 20 - 8 * pulse;
    g.fillStyle(0xff3c3c, 0.6 + 0.4 * pulse);
    g.fillTriangle(target.x, arrowY + 8, target.x - 5, arrowY, target.x + 5, arrowY);

    // Timer bar para deportivo
    if (target.carData.hookWindow > 0 && !target.carData.hooked) {
      const bw = 36, bh = 4;
      const bx = target.x - bw / 2, by = target.y - target.carData.len / 2 - 16;
      g.fillStyle(0x333333); g.fillRect(bx, by, bw, bh);
      g.fillStyle(target.carData.fleeTimer / target.carData.hookWindow > 0.3 ? 0xff6b9d : 0xff3333);
      g.fillRect(bx, by, bw * (target.carData.fleeTimer / target.carData.hookWindow), bh);
    }
  }

  // ── SPEED LINES ─────────────────────────────

  renderSpeedLines() {
    const g = this.gSpeedLines;
    g.clear();
    const absSpeed = Math.abs(this.truckSpeed);
    if (absSpeed <= 80) return;

    const alpha = 0.1 + 0.1 * (absSpeed / CFG.MAX_SPEED);
    g.lineStyle(2, 0xffffff, alpha);

    const hw = CFG.TRUCK_W / 2;
    for (let i = 0; i < 3; i++) {
      const sy = -hw - 6 - i * 8;
      const cx = this.truck.x, cy = this.truck.y;
      const cos = Math.cos(this.truckHeading), sin = Math.sin(this.truckHeading);
      const x1 = cx + cos * (-CFG.TRUCK_LEN / 2 + 5) - sin * sy;
      const y1 = cy + sin * (-CFG.TRUCK_LEN / 2 + 5) + cos * sy;
      const x2 = cx + cos * (CFG.TRUCK_LEN / 2 - 5) - sin * sy;
      const y2 = cy + sin * (CFG.TRUCK_LEN / 2 - 5) + cos * sy;
      g.lineBetween(x1, y1, x2, y2);
    }
  }

  // ── TOWED LABEL ─────────────────────────────

  renderTowedLabel() {
    const g = this.gTowedLabel;
    g.clear();
    if (!this.truckTowing) return;

    const y = this.truck.y - CFG.TRUCK_W / 2 - 22;
    // Dibujamos un fondo para el texto
    g.fillStyle(0x000000, 0.6);
    const labelW = 170, labelH = 12;
    g.fillRect(this.truck.x - labelW / 2, y - 1, labelW, labelH + 2);
    // Triángulo apuntando hacia abajo
    g.fillStyle(0xffaa00);
    g.fillTriangle(
      this.truck.x, y + labelH + 8,
      this.truck.x - 5, y + labelH + 2,
      this.truck.x + 5, y + labelH + 2
    );

    // Texto "REMOLCANDO" como Phaser Text en vez de Graphics
    if (!this._towedText) {
      this._towedText = this.add.text(this.truck.x, y + labelH / 2, '▼ REMOLCANDO ▼', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffaa00',
      }).setOrigin(0.5).setDepth(12);
    }
    this._towedText.setPosition(this.truck.x, y + labelH / 2);
    this._towedText.setVisible(true);
  }

  clearTowedLabel() {
    if (this._towedText) this._towedText.setVisible(false);
  }

  // ── SIGNAGE RENDER (Playón text) ────────────

  renderSignage() {
    if (!this._signPlayon) {
      this._signPlayon = this.add.text(CFG.BASE.x + CFG.BASE.w / 2, CFG.BASE.y + 15, 'PLAYÓN DE\nINFRACTORES', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffcc00',
        align: 'center',
        lineSpacing: 2,
      }).setOrigin(0.5).setDepth(2);
    }
    // Glow effect
    this._signPlayon.setShadow(0, 0, '#ffcc00', this.gameOver ? 0 : 10, false, true);
  }

  // ── CONTROLS HINT ───────────────────────────

  renderControlsHint() {
    if (!this._controlsText) {
      // Fondo semi-oscuro
      const bg = this.add.graphics().setDepth(19);
      bg.fillStyle(0x000000, 0.5);
      bg.fillRoundedRect(CFG.W / 2 - 220, CFG.H - 38, 440, 30, 6);
      this._controlsBg = bg;

      this._controlsText = this.add.text(CFG.W / 2, CFG.H - 23,
        'W/↑ ACELERAR · S/↓ FRENAR · A/← IZQ · D/→ DER\n'
        + 'L ACELERAR · M FRENAR · ESPACIO ENGANCHAR', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 2,
      }).setOrigin(0.5, 0.5).setAlpha(0.55).setDepth(20);
    }
  }

  // ── MAIN LOOP ───────────────────────────────

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const st = this.state;
    if (st.gameOver) return;

    this.updatePhysics(dt);
    this.updateHooking(dt);
    this.updateTimer(dt);
    this.updateDelivery();
    this.updatePopups(dt);
    this.updateDialogue(dt);
    this.updateHUD();

    // Render overlays
    this.renderCable();
    this.renderHookBar();
    this.renderIndicator();
    this.renderSpeedLines();
    this.renderTowedLabel();
    this.renderSignage();
    this.renderControlsHint();
  }
}

// ==========================================
// 9. PHASER CONFIG & BOOT
// ==========================================

const gameConfig = {
  type: Phaser.AUTO,
  width: CFG.W,
  height: CFG.H,
  parent: 'phaser-wrapper',
  backgroundColor: '#2a2a30',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene],
};

const game = new Phaser.Game(gameConfig);

// Restart button (DOM)
restartBtn.addEventListener('click', () => {
  // Soft reset: reiniciar la escena
  const gs = game.scene.getScene('GameScene');
  if (gs && gs.state?.gameOver) {
    gs.scene.restart();
  } else if (gs) {
    gs.resetGame();
  }
});
