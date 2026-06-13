#!/usr/bin/env python3
"""Genera todos los assets pixel art para Grúa Municipal.
Usa solo módulos nativos de Python (struct, zlib, os)."""

import struct, zlib, os, math, random

OUT = os.path.join(os.path.dirname(__file__), 'assets')
os.makedirs(OUT, exist_ok=True)

# ── PNG Writer ──────────────────────────────────────────────

def write_png(filename, pixels, palette, width, height):
    """Escribe un PNG indexado (8-bit palette). pixels = lista de índices row-major."""
    raw = b''
    for y in range(height):
        raw += b'\x00'  # filter byte None
        for x in range(width):
            raw += bytes([pixels[y * width + x]])

    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 3, 0, 0, 0)))
        pal = b''
        for r, g, b_ in palette:
            pal += bytes([r, g, b_])
        f.write(chunk(b'PLTE', pal))
        f.write(chunk(b'IDAT', zlib.compress(raw)))
        f.write(chunk(b'IEND', b''))

# ── Pixel Canvas ────────────────────────────────────────────

class Canvas:
    """Canvas de pixel art con paleta indexada. Índice 0 = transparente/background."""
    
    def __init__(self, w, h, bg=0):
        self.w = w
        self.h = h
        self.pixels = [[bg] * w for _ in range(h)]
    
    def px(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.pixels[y][x] = color
    
    def rect(self, x, y, w, h, color, xflip=False):
        """Dibuja rectángulo relleno. xflip=true invierte horizontal."""
        for j in range(max(0, y), min(y + h, self.h)):
            for i in range(max(0, x), min(x + w, self.w)):
                ix = (self.w - 1 - i) if xflip else i
                self.pixels[j][ix] = color
    
    def hline(self, x, y, w, color):
        for i in range(w):
            self.px(x + i, y, color)
    
    def vline(self, x, y, h, color):
        for j in range(h):
            self.px(x, y + j, color)
    
    def circle(self, cx, cy, r, color):
        for j in range(max(0, cy - r), min(self.h, cy + r + 1)):
            for i in range(max(0, cx - r), min(self.w, cx + r + 1)):
                if (i - cx) ** 2 + (j - cy) ** 2 <= r ** 2 + 0.5:
                    self.pixels[j][i] = color
    
    def ellipse(self, cx, cy, rx, ry, color):
        for j in range(max(0, cy - ry), min(self.h, cy + ry + 1)):
            for i in range(max(0, cx - rx), min(self.w, cx + rx + 1)):
                if ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= 1.0:
                    self.pixels[j][i] = color
    
    def line(self, x1, y1, x2, y2, color):
        """Bresenham line"""
        dx = abs(x2 - x1)
        dy = -abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx + dy
        x, y = x1, y1
        while True:
            self.px(x, y, color)
            if x == x2 and y == y2:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x += sx
            if e2 <= dx:
                err += dx
                y += sy
    
    def fill_trapezoid(self, x1, y, x2, h, color):
        """Trapecio de ancho variable: arriba (x1,x1) → abajo (x2,x2)."""
        for j in range(h):
            t = j / max(h - 1, 1)
            cx1 = int(x1 + (x2 - x1) * t)
            cx2 = int((self.w - x1) + ((self.w - x2) - (self.w - x1)) * t) if x2 == self.w - x1 else int(x1 + (x2 - x1) * t)
            for i in range(min(cx1, cx2), max(cx1, cx2)):
                self.px(i, y + j, color)
    
    def trapezoid(self, y0, x0_left, x0_right, y1, x1_left, x1_right, color):
        """Trapecio con ancho superior e inferior independientes."""
        for j in range(y0, min(y1, self.h)):
            t = (j - y0) / max(y1 - y0 - 1, 1)
            l = int(x0_left + (x1_left - x0_left) * t)
            r = int(x0_right + (x1_right - x0_right) * t)
            for i in range(max(0, l), min(r, self.w)):
                self.pixels[j][i] = color
    
    def overlay(self, other, ox, oy):
        """Superpone otro canvas (0 = transparente)."""
        for j in range(other.h):
            for i in range(other.w):
                if other.pixels[j][i] != 0:
                    self.px(ox + i, oy + j, other.pixels[j][i])
    
    def mirror_x(self):
        """Refleja horizontalmente (para simetría)."""
        for j in range(self.h):
            for i in range(self.w // 2):
                self.pixels[j][self.w - 1 - i] = self.pixels[j][i]
    
    def to_list(self):
        return [p for row in self.pixels for p in row]
    
    def save(self, filename, palette):
        write_png(filename, self.to_list(), palette, self.w, self.h)
        print(f"  ✓ {os.path.basename(filename)} ({self.w}×{self.h})")


# ═══════════════════════════════════════════════════════════════
#  PALETTES
# ═══════════════════════════════════════════════════════════════

# Palette indices for portraits (0 = transparent, shared across all portraits)
# We'll use a shared palette with all colors needed
P_BG     = 1   # dark background
P_SKIN1  = 2   # light skin base
P_SKIN2  = 3   # light skin shadow
P_SKIN3  = 4   # dark skin base
P_SKIN4  = 5   # dark skin shadow
P_OUTLINE= 6   # dark outline
P_WHITE  = 7   # white (eyes)
P_EYE    = 8   # eye pupil

# Evelyn specific
P_HAIR_BLACK  = 9
P_HAIR_DARK   = 10
P_SHIRT_BLUE  = 11
P_SHIRT_SHADOW= 12
P_VEST_NEON   = 13
P_VEST_SHADOW = 14
P_REFLECTIVE  = 15
P_LIP        = 16
P_CHEEK      = 17

# Tata specific
P_SKIN_MED1   = 18
P_SKIN_MED2   = 19
P_SKIN_MED3   = 20
P_HAIR_GRAY   = 21
P_HAIR_DKGRAY = 22
P_BEARD       = 23
P_CAP_RED     = 24
P_CAP_MESH    = 25
P_CAP_VISOR   = 26
P_SHIRT_GRAY  = 27
P_SHIRT_DKGRAY= 28

# Vibora specific
P_HAIR_BROWN  = 29
P_HAIR_DKBRN  = 30
P_JUMPSUIT    = 31
P_JUMPSUIT_S  = 32
P_TSHIRT_WHT  = 33
P_LIPS_DK     = 34
P_SKIN_MED4   = 35
P_SKIN_MED5   = 36

# Vehicle palette (shared)
P_V_BG       = 1   # white background for vehicles
P_V_OUTLINE  = 2   # dark outline
P_V_WHEEL    = 3   # tire
P_V_WHEEL_DK = 4   # tire shadow
P_V_WINDSHIELD = 5   # dark windshield
P_V_WINDSHADE  = 6   # lighter windshield part
P_V_HEADLIGHT  = 7   # white/yellow headlight
P_V_TAILLIGHT  = 8   # red taillight

# Grua specific
P_V_YELLOW    = 9
P_V_YELLOW_S  = 10
P_V_YELLOW_DK = 11
P_V_CAB       = 12
P_V_CAB_S     = 13
P_V_BEACON    = 14
P_V_METAL     = 15
P_V_TOW       = 16

# Deportivo specific
P_V_PINK      = 9
P_V_PINK_S    = 10
P_V_PINK_DK   = 11

# Camioneta specific
P_V_NAVY      = 9
P_V_NAVY_S    = 10
P_V_NAVY_DK   = 11
P_V_NAVY_BED  = 12

# Auto Común specific
P_V_GREEN     = 9
P_V_GREEN_S   = 10
P_V_GREEN_DK  = 11

# Tileset palette
P_T_BG        = 1   # dark background fill
P_T_BG_LT     = 2   # lighter specks
P_T_ASPHALT   = 3   # road surface
P_T_ASPHALT_LT= 4   # road surface light
P_T_ASPHALT_DK= 5   # road surface dark
P_T_COBBLE1   = 6   # cobblestone light
P_T_COBBLE2   = 7   # cobblestone medium
P_T_COBBLE3   = 8   # cobblestone dark
P_T_CONCRETE  = 9   # playon concrete
P_T_CONC_LINE = 10  # concrete line
P_T_CURB      = 11  # yellow curb
P_T_CURB_DK   = 12  # yellow curb dark


# ═══════════════════════════════════════════════════════════════
#  1. CHARACTER PORTRAITS (48×56)
# ═══════════════════════════════════════════════════════════════

PORTRAIT_PALETTE = [
    (26, 26, 46),    # 0: dark background (used as fill)
    (26, 26, 46),    # 1: dark background (alias)
    (240, 200, 168), # 2: skin1 light base
    (224, 184, 152), # 3: skin1 shadow
    (212, 165, 116), # 4: skin3 tan base (Tata)
    (196, 148, 100), # 5: skin3 shadow
    (24, 24, 24),    # 6: outline dark
    (240, 240, 240), # 7: white
    (72, 72, 72),    # 8: eye pupil
    (40, 40, 40),    # 9: black hair
    (24, 24, 24),    # 10: dark hair shadow
    (143, 202, 240), # 11: light blue shirt
    (120, 175, 215), # 12: shirt shadow
    (240, 232, 56),  # 13: neon yellow vest
    (200, 192, 40),  # 14: vest shadow
    (192, 192, 192), # 15: reflective strip
    (200, 120, 120), # 16: lip color
    (230, 180, 170), # 17: cheek blush
    (212, 165, 116), # 18: skin medium (Tata) - same as 4 but separate
    (196, 148, 100), # 19: skin med shadow - same as 5
    (180, 132, 84),  # 20: skin med darker
    (136, 136, 136), # 21: gray hair
    (104, 104, 104), # 22: dark gray hair
    (192, 57, 43),   # 23: cap red (Tata)
    (168, 45, 35),   # 24: cap red shadow
    (232, 232, 232), # 25: cap mesh
    (68, 68, 68),    # 26: cap visor
    (68, 68, 68),    # 27: dark gray shirt
    (52, 52, 52),    # 28: darker shirt
    (58, 42, 26),    # 29: brown hair (Vibora)
    (40, 28, 16),    # 30: dark brown hair
    (44, 62, 107),   # 31: navy jumpsuit
    (36, 50, 86),    # 32: jumpsuit shadow
    (208, 208, 208), # 33: white t-shirt
    (180, 60, 60),   # 34: dark lip
    (224, 192, 160), # 35: skin medium (Vibora)
    (208, 172, 140), # 36: skin med shadow
]

def gen_evelyn():
    """Evelyn "La Flaca" — sarcastic, ponytail, light blue shirt + neon vest."""
    c = Canvas(48, 56, P_BG)
    
    # ── Hair (black ponytail, behind head) ──
    # Ponytail on right side
    c.rect(32, 10, 10, 12, P_HAIR_BLACK)      # main ponytail
    c.rect(33, 8, 8, 4, P_HAIR_BLACK)         # top of ponytail
    c.rect(34, 22, 8, 14, P_HAIR_BLACK)       # long ponytail falling down
    
    # ── Head/face shape ──
    c.ellipse(22, 24, 14, 16, P_SKIN1)        # face base
    c.rect(8, 22, 28, 14, P_SKIN1)            # fill out face
    
    # front hair (bangs)
    c.rect(10, 6, 20, 8, P_HAIR_BLACK)        # top hair
    c.circle(16, 9, 6, P_HAIR_BLACK)          # left side hair
    c.circle(28, 9, 6, P_HAIR_BLACK)          # right side hair
    c.rect(10, 6, 20, 12, P_HAIR_BLACK)       # fill bangs area
    c.ellipse(22, 10, 14, 8, P_HAIR_BLACK)    # hair dome
    
    # Side hair framing face
    c.rect(7, 14, 4, 16, P_HAIR_BLACK)        # left strand
    c.rect(33, 13, 4, 10, P_HAIR_BLACK)       # right strand (before ponytail)
    
    # ── Face features ──
    # Eyes (sharp, narrowed — sarcastic)
    c.px(16, 20, P_WHITE)
    c.px(17, 20, P_WHITE)
    c.px(26, 20, P_WHITE)
    c.px(27, 20, P_WHITE)
    c.px(17, 21, P_EYE)      # pupil
    c.px(27, 21, P_EYE)      # pupil
    
    # Eyebrows (slightly raised, one higher for sarcasm)
    c.hline(14, 17, 6, P_HAIR_BLACK)
    c.hline(24, 18, 6, P_HAIR_BLACK)   # one eyebrow slightly higher
    
    # Nose (subtle)
    c.px(21, 23, P_SKIN2)
    
    # Mouth (wry smirk — one side up)
    c.hline(18, 27, 3, P_LIP)
    c.px(21, 27, P_LIP)
    c.px(22, 27, P_LIP)
    c.px(23, 26, P_LIP)    # corner up = smirk
    
    # Cheeks
    c.px(12, 24, P_CHEEK)
    c.px(13, 24, P_CHEEK)
    c.px(29, 24, P_CHEEK)
    
    # ── Neck ──
    c.rect(18, 32, 10, 6, P_SKIN1)
    c.rect(18, 32, 10, 4, P_SKIN2)   # neck shadow
    
    # ── Shoulders / Body ──
    # Base body shape
    c.trapezoid(36, 12, 36, 56, 6, 42, P_SHIRT_BLUE)
    c.trapezoid(38, 14, 34, 56, 8, 40, P_SHIRT_SHADOW)
    
    # Neon yellow vest
    c.trapezoid(36, 14, 34, 56, 10, 38, P_VEST_NEON)
    # Vest shadow (left edge)
    c.rect(10, 38, 3, 18, P_VEST_SHADOW)
    # Vest reflective stripes
    c.hline(12, 42, 24, P_REFLECTIVE)
    c.hline(12, 46, 24, P_REFLECTIVE)
    c.hline(12, 50, 24, P_REFLECTIVE)
    
    # Collar
    c.px(20, 35, P_SHIRT_BLUE)
    c.px(21, 35, P_SHIRT_BLUE)
    c.px(22, 35, P_SHIRT_BLUE)
    c.px(24, 35, P_SHIRT_BLUE)
    c.px(25, 35, P_SHIRT_BLUE)
    c.px(26, 35, P_SHIRT_BLUE)
    
    # Outline
    c.rect(7, 38, 2, 16, P_OUTLINE)
    c.rect(37, 38, 2, 16, P_OUTLINE)
    
    return c


def gen_tata():
    """Tata — kind tired face, trucker cap, gray beard, dark shirt."""
    c = Canvas(48, 56, P_BG)
    
    # ── Head/face ──
    c.ellipse(22, 26, 15, 17, P_SKIN_MED1)
    c.rect(8, 22, 28, 16, P_SKIN_MED1)
    
    # ── Trucker cap ──
    # Cap dome
    c.ellipse(22, 12, 16, 10, P_CAP_RED)
    c.rect(7, 10, 30, 6, P_CAP_RED)
    # Cap brim/visor (front)
    c.ellipse(22, 17, 18, 5, P_CAP_VISOR)
    c.rect(5, 15, 34, 3, P_CAP_VISOR)
    # Cap mesh back
    c.rect(24, 8, 10, 6, P_CAP_MESH)
    # Cap shadow
    c.rect(7, 12, 30, 3, P_CAP_VISOR)
    
    # ── Hair at temples (graying) ──
    c.rect(7, 14, 4, 8, P_HAIR_GRAY)
    c.rect(33, 14, 4, 8, P_HAIR_GRAY)
    c.rect(7, 14, 4, 4, P_HAIR_DKGRAY)
    c.rect(33, 14, 4, 4, P_HAIR_DKGRAY)
    
    # ── Face features ──
    # Eyes (tired, slightly closed)
    c.hline(15, 22, 4, P_WHITE)
    c.hline(25, 22, 4, P_WHITE)
    c.px(16, 23, P_EYE)
    c.px(26, 23, P_EYE)
    # Heavy eyelids (tired)
    c.hline(14, 21, 6, P_SKIN_MED2)
    c.hline(24, 21, 6, P_SKIN_MED2)
    # Eyebrows (thick, graying)
    c.hline(13, 19, 8, P_HAIR_GRAY)
    c.hline(23, 19, 8, P_HAIR_GRAY)
    
    # Nose
    c.px(21, 25, P_SKIN_MED2)
    c.px(22, 25, P_SKIN_MED2)
    
    # Mustache/beard (short stubby)
    c.rect(14, 28, 16, 6, P_BEARD)
    c.rect(13, 29, 18, 5, P_BEARD)
    c.rect(15, 28, 14, 2, P_SKIN_MED3)  # mustache area skin showing
    
    # Mouth (kind smile)
    c.hline(17, 30, 10, P_LIP)
    
    # Cheeks
    c.px(12, 25, P_CHEEK)
    c.px(30, 25, P_CHEEK)
    
    # ── Neck ──
    c.rect(18, 34, 10, 6, P_SKIN_MED1)
    c.rect(19, 34, 8, 4, P_SKIN_MED2)
    
    # ── Body (dark gray t-shirt) ──
    c.trapezoid(38, 12, 36, 56, 6, 42, P_SHIRT_GRAY)
    c.trapezoid(40, 14, 34, 56, 8, 40, P_SHIRT_DKGRAY)
    # Collar
    c.vline(21, 37, 4, P_SKIN_MED1)
    c.vline(23, 37, 4, P_SKIN_MED1)
    
    # Outline
    c.rect(7, 40, 2, 14, P_OUTLINE)
    c.rect(37, 40, 2, 14, P_OUTLINE)
    
    return c


def gen_vibora():
    """Víbora — sly smirk, mechanic jumpsuit, dark messy hair."""
    c = Canvas(48, 56, P_BG)
    
    # ── Hair (messy dark brown) ──
    c.ellipse(22, 10, 16, 11, P_HAIR_BROWN)
    c.rect(7, 8, 30, 8, P_HAIR_BROWN)
    # Spiky bits
    for dx, dy in [(-6, -3), (-2, -5), (2, -5), (6, -4), (8, -2)]:
        c.px(22 + dx, 10 + dy, P_HAIR_BROWN)
        c.px(22 + dx, 11 + dy, P_HAIR_DKBRN)
    
    # ── Head/face ──
    c.ellipse(22, 24, 14, 16, P_SKIN_MED4)
    c.rect(9, 20, 26, 16, P_SKIN_MED4)
    
    # ── Face features ──
    # Small clever eyes (narrowed)
    c.px(16, 21, P_WHITE)
    c.px(17, 21, P_WHITE)
    c.px(26, 21, P_WHITE)
    c.px(27, 21, P_WHITE)
    c.px(17, 22, P_EYE)
    c.px(27, 22, P_EYE)
    # Eyebrows (raised, mischievous)
    c.hline(14, 18, 5, P_HAIR_BROWN)
    c.hline(25, 18, 5, P_HAIR_BROWN)
    # Under-eye lines (sly look)
    c.hline(15, 23, 4, P_SKIN_MED5)
    c.hline(25, 23, 4, P_SKIN_MED5)
    
    # Nose (sharp)
    c.px(21, 24, P_SKIN_MED5)
    
    # Mouth (smirk — one side up)
    c.hline(17, 28, 3, P_LIPS_DK)
    c.hline(20, 28, 4, P_LIPS_DK)
    c.px(24, 27, P_LIPS_DK)  # upward smirk corner
    
    # Cheeks
    c.px(12, 25, P_CHEEK)
    c.px(30, 25, P_CHEEK)
    
    # ── Neck ──
    c.rect(18, 32, 10, 6, P_SKIN_MED4)
    
    # ── Body (mechanic jumpsuit, unzipped) ──
    c.trapezoid(36, 12, 36, 56, 6, 42, P_JUMPSUIT)
    c.trapezoid(38, 14, 34, 56, 8, 40, P_JUMPSUIT_S)
    # White t-shirt underneath (unzipped V)
    c.trapezoid(38, 16, 28, 50, 12, 36, P_TSHIRT_WHT)
    
    # Jumpsuit collar/lapels
    c.rect(12, 36, 4, 6, P_JUMPSUIT)
    c.rect(30, 36, 4, 6, P_JUMPSUIT)
    
    # Outline
    c.rect(7, 38, 2, 16, P_OUTLINE)
    c.rect(37, 38, 2, 16, P_OUTLINE)
    
    return c


# ═══════════════════════════════════════════════════════════════
#  2. VEHICLE SPRITES (top-down)
# ═══════════════════════════════════════════════════════════════

VEHICLE_PALETTE = [
    (255,255,255),    # 0: white bg (for isolation) — index 0 is first palette entry
    (255,255,255),    # 1: white bg alias
    (24,24,24),       # 2: outline
    (48,48,48),       # 3: tire
    (36,36,36),       # 4: tire dark/shadow
    (20,24,40),       # 5: windshield dark
    (60,68,88),       # 6: windshield shade
    (255,240,200),    # 7: headlight
    (220,60,60),      # 8: taillight
    (240,200,56),     # 9: yellow (grua)
    (200,168,44),     # 10: yellow shadow
    (180,150,36),     # 11: yellow dark
    (200,180,120),    # 12: cab interior
    (160,140,80),     # 13: cab shadow
    (255,80,80),      # 14: beacon
    (160,160,160),    # 15: metal
    (120,120,120),    # 16: tow apparatus
]

def gen_veh_grua():
    """Tow truck (grúa) — 48×24, top-down, cab on right (facing right = rotation 0)."""
    w, h = 48, 24
    c = Canvas(w, h, P_V_BG)
    
    # ── Flatbed (left side) ──
    c.rect(2, 3, 28, 18, P_V_YELLOW)
    # Flatbed shadow
    c.rect(2, 18, 28, 3, P_V_YELLOW_S)
    
    # Tow apparatus on top of flatbed
    c.rect(8, 5, 16, 14, P_V_YELLOW_S)  # recessed area
    c.rect(10, 7, 12, 10, P_V_YELLOW_DK)  # inner
    # Winch
    c.circle(16, 12, 4, P_V_METAL)
    c.circle(16, 12, 2, P_V_YELLOW)
    # Tow bar
    c.rect(20, 11, 8, 2, P_V_TOW)
    
    # ── Wheels (visible on sides) ──
    # Left side (flatbed area)
    c.rect(0, 4, 2, 16, P_V_WHEEL)
    c.rect(0, 5, 2, 14, P_V_WHEEL_DK)
    c.rect(26, 4, 2, 16, P_V_WHEEL)
    c.rect(26, 5, 2, 14, P_V_WHEEL_DK)
    # Right side (cab area)
    c.rect(0, 4, 2, 16, P_V_WHEEL)  # re-use same area since it covers full
    
    # Flatbed side detail (metal trim)
    c.hline(3, 3, 26, P_V_METAL)
    c.hline(3, 20, 26, P_V_METAL)
    
    # ── Cab (right side) ──
    cab_x = 28
    cab_w = 18
    cab_h = 20
    # Cab body
    c.rect(cab_x, 2, cab_w - 2, cab_h, P_V_YELLOW)
    # Cab roof/slight indent
    c.rect(cab_x + 2, 3, cab_w - 6, cab_h - 2, P_V_CAB)
    # Windshield (front of cab = right side)
    c.rect(cab_x + cab_w - 6, 4, 4, cab_h - 8, P_V_WINDSHIELD)
    c.rect(cab_x + cab_w - 6, 4, 4, 3, P_V_WINDSHADE)
    # Cab side windows
    c.px(cab_x + 2, 5, P_V_WINDSHIELD)
    c.px(cab_x + 2, 6, P_V_WINDSHIELD)
    c.px(cab_x + 2, 13, P_V_WINDSHIELD)
    c.px(cab_x + 2, 14, P_V_WINDSHIELD)
    
    # ── Beacon on cab ──
    c.circle(cab_x + cab_w // 2 - 1, 4, 3, P_V_BEACON)
    c.circle(cab_x + cab_w // 2 - 1, 4, 2, P_V_YELLOW)  # yellow glow
    
    # ── Grille / front detail ──
    c.rect(cab_x + cab_w - 2, 6, 2, 8, P_V_METAL)
    c.px(cab_x + cab_w - 1, 3, P_V_HEADLIGHT)
    c.px(cab_x + cab_w - 1, 16, P_V_HEADLIGHT)
    
    # ── Rear (left edge) ──
    c.rect(0, 3, 2, 18, P_V_YELLOW_S)
    c.px(1, 3, P_V_TAILLIGHT)
    c.px(1, 20, P_V_TAILLIGHT)
    
    return c


def gen_veh_deportivo():
    """Sports car — 30×16, top-down, hot pink."""
    w, h = 34, 18  # matches CFG: len+4=34, w+4=18
    c = Canvas(w, h, P_V_BG)
    
    # ── Body ──
    # Sleek silhouette
    c.ellipse(w//2, h//2 - 1, w//2 - 2, h//2 - 2, P_V_PINK)
    c.rect(3, 3, w-6, h-6, P_V_PINK)
    
    # Shadow bottom
    c.rect(3, h-5, w-6, 3, P_V_PINK_S)
    
    # ── Windshield (front = right side) ──
    c.rect(w-9, 4, 5, h-8, P_V_WINDSHIELD)
    c.rect(w-9, 4, 5, 3, P_V_WINDSHADE)
    
    # ── Rear (left) ──
    c.rect(1, 3, 3, h-6, P_V_PINK_S)
    c.px(2, 3, P_V_TAILLIGHT)
    c.px(2, h-4, P_V_TAILLIGHT)
    
    # ── Wheels ──
    # Front wheels (near right)
    c.rect(0, 2, 2, 4, P_V_WHEEL)
    c.rect(0, h-6, 2, 4, P_V_WHEEL)
    # Rear wheels (near left)
    c.rect(w-3, 2, 3, 4, P_V_WHEEL)
    c.rect(w-3, h-6, 3, 4, P_V_WHEEL)
    
    # ── Headlights ──
    c.px(w-2, 4, P_V_HEADLIGHT)
    c.px(w-2, h-5, P_V_HEADLIGHT)
    
    # ── Racing stripe ──
    c.rect(4, h//2 - 1, w-8, 2, P_V_PINK_DK)
    
    return c


def gen_veh_camioneta():
    """4x4 pickup truck — 40×24, top-down, dark navy."""
    w, h = 44, 26  # matches CFG with padding
    c = Canvas(w, h, P_V_BG)
    
    # ── Body ──
    c.rect(2, 3, w-4, h-6, P_V_NAVY)
    c.rect(2, h-6, w-4, 3, P_V_NAVY_S)
    
    # ── Pickup bed (left side) ──
    bed_x = 2
    bed_w = 20
    c.rect(bed_x, 4, bed_w, h-8, P_V_NAVY_BED)
    # Bed interior
    c.rect(bed_x + 2, 5, bed_w - 4, h-10, P_V_NAVY_DK)
    # Bed divider / tailgate
    c.rect(bed_x, h-6, bed_w, 3, P_V_NAVY)
    
    # ── Cab (right side) ──
    cab_x = 22
    cab_w = 18
    c.rect(cab_x, 2, cab_w, h-4, P_V_NAVY)
    # Windshield
    c.rect(cab_x + cab_w - 7, 4, 5, h-8, P_V_WINDSHIELD)
    c.rect(cab_x + cab_w - 7, 4, 5, 3, P_V_WINDSHADE)
    # Side windows
    c.px(cab_x + 2, 5, P_V_WINDSHIELD)
    c.px(cab_x + 2, h-6, P_V_WINDSHIELD)
    
    # ── Wheels (larger for 4x4) ──
    c.rect(0, 3, 3, 6, P_V_WHEEL)
    c.rect(0, h-9, 3, 6, P_V_WHEEL)
    c.rect(w-3, 3, 3, 6, P_V_WHEEL)
    c.rect(w-3, h-9, 3, 6, P_V_WHEEL)
    c.rect(1, 3, 2, 6, P_V_WHEEL_DK)
    c.rect(1, h-9, 2, 6, P_V_WHEEL_DK)
    c.rect(w-2, 3, 2, 6, P_V_WHEEL_DK)
    c.rect(w-2, h-9, 2, 6, P_V_WHEEL_DK)
    
    # ── Headlights ──
    c.px(w-2, 5, P_V_HEADLIGHT)
    c.px(w-2, h-6, P_V_HEADLIGHT)
    
    # ── Roll bar (behind cab) ──
    c.rect(20, 5, 2, h-10, P_V_METAL)
    c.px(21, 12, P_V_HEADLIGHT)  # work light
    
    # ── Tail lights ──
    c.px(2, 4, P_V_TAILLIGHT)
    c.px(2, h-5, P_V_TAILLIGHT)
    
    return c


def gen_veh_comun():
    """Common car — 34×16, top-down, green."""
    w, h = 38, 20  # matches CFG with padding
    c = Canvas(w, h, P_V_BG)
    
    # ── Body ──
    c.rect(2, 2, w-4, h-4, P_V_GREEN)
    c.rect(2, h-5, w-4, 3, P_V_GREEN_S)
    
    # ── Windshield (front = right) ──
    c.rect(w-8, 3, 5, h-6, P_V_WINDSHIELD)
    c.rect(w-8, 3, 5, 3, P_V_WINDSHADE)
    
    # ── Rear ──
    c.rect(1, 3, 3, h-6, P_V_GREEN_S)
    c.px(2, 3, P_V_TAILLIGHT)
    c.px(2, h-4, P_V_TAILLIGHT)
    
    # ── Wheels ──
    c.rect(0, 2, 2, 4, P_V_WHEEL)
    c.rect(0, h-6, 2, 4, P_V_WHEEL)
    c.rect(w-2, 2, 2, 4, P_V_WHEEL)
    c.rect(w-2, h-6, 2, 4, P_V_WHEEL)
    
    # ── Headlights ──
    c.px(w-2, 4, P_V_HEADLIGHT)
    c.px(w-2, h-5, P_V_HEADLIGHT)
    
    return c


# ═══════════════════════════════════════════════════════════════
#  3. TILESET (6 tiles × 10×10 = 60×10)
# ═══════════════════════════════════════════════════════════════

TILESET_PALETTE = [
    (42, 42, 48),       # 0: background dark
    (42, 42, 48),       # 1: background dark alias
    (52, 52, 60),       # 2: background light specks
    (58, 58, 69),       # 3: asphalt surface
    (68, 68, 80),       # 4: asphalt light
    (48, 48, 58),       # 5: asphalt dark
    (100, 100, 110),    # 6: cobble light
    (85, 85, 95),       # 7: cobble medium
    (70, 70, 80),       # 8: cobble dark
    (46, 46, 54),       # 9: concrete
    (55, 55, 65),       # 10: concrete line
    (220, 180, 40),     # 11: yellow curb
    (180, 140, 30),     # 12: yellow curb dark
]

def gen_tiles():
    """Genera tileset de 6 tiles de 10×10 cada uno = 60×10."""
    T = 10
    n_tiles = 6
    canvas = Canvas(T * n_tiles, T, 0)
    
    # Tile 0: Background (building area) — dark with slight noise
    data = [
        [1,1,1,1,2,1,1,1,1,2],
        [1,1,2,1,1,1,1,2,1,1],
        [1,1,1,1,1,2,1,1,1,1],
        [2,1,1,2,1,1,1,1,2,1],
        [1,1,1,1,1,1,2,1,1,1],
        [1,2,1,1,1,1,1,1,1,2],
        [1,1,1,2,1,1,2,1,1,1],
        [1,1,1,1,1,1,1,1,1,1],
        [2,1,1,1,2,1,1,1,1,1],
        [1,1,2,1,1,1,1,2,1,1],
    ]
    for y in range(T):
        for x in range(T):
            canvas.px(x, y, data[y][x])
    
    # Tile 1: Asfalto (avenida) — road surface with subtle texture
    data = [
        [3,3,4,3,3,3,5,3,3,4],
        [3,5,3,3,4,3,3,3,5,3],
        [3,3,3,4,3,3,3,4,3,3],
        [4,3,3,3,3,5,3,3,3,4],
        [3,3,5,3,3,3,4,3,3,3],
        [3,4,3,3,5,3,3,3,4,3],
        [5,3,3,3,3,4,3,5,3,3],
        [3,3,4,3,3,3,3,3,4,3],
        [3,3,3,5,3,3,4,3,3,3],
        [4,3,3,3,4,3,3,3,5,3],
    ]
    for y in range(T):
        for x in range(T):
            canvas.px(x + T*1, y, data[y][x])
    
    # Tile 2: Adoquines (cobblestone) — stone pattern
    # Cobblestone pattern with grout lines
    data = [
        [7,7,7,7,0,0,8,8,8,0],
        [7,6,6,7,0,8,8,7,8,0],
        [7,7,7,7,0,8,7,7,8,0],
        [0,0,0,0,0,8,8,8,8,0],
        [0,0,0,0,0,0,0,0,0,0],
        [8,8,8,0,0,7,7,7,7,0],
        [8,7,8,0,7,7,6,6,7,0],
        [8,8,8,0,7,7,7,7,7,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
    ]
    for y in range(T):
        for x in range(T):
            canvas.px(x + T*2, y, data[y][x])
    
    # Tile 3: Esquina (intersection) — slightly different asphalt
    data = [
        [4,3,3,3,5,3,3,4,3,3],
        [3,3,4,3,3,3,5,3,3,3],
        [3,5,3,3,4,3,3,3,4,3],
        [3,3,3,5,3,3,3,4,3,5],
        [4,3,3,3,3,4,3,3,3,3],
        [3,3,5,3,3,3,4,3,5,3],
        [3,4,3,3,5,3,3,3,3,4],
        [5,3,3,4,3,3,5,3,3,3],
        [3,3,3,3,4,3,3,3,4,3],
        [4,3,4,3,3,5,3,3,3,5],
    ]
    for y in range(T):
        for x in range(T):
            canvas.px(x + T*3, y, data[y][x])
    
    # Tile 4: Playón (base) — concrete with subtle line
    data = [
        [9,9,9,9,9,9,9,9,9,9],
        [9,9,9,9,9,9,9,9,9,9],
        [9,9,10,9,9,9,10,9,9,9],
        [9,9,9,9,9,9,9,9,9,9],
        [9,9,9,9,9,9,9,9,9,9],
        [9,9,9,9,9,9,9,9,9,9],
        [9,9,10,9,9,9,10,9,9,9],
        [9,9,9,9,9,9,9,9,9,9],
        [9,9,9,9,9,9,9,9,9,9],
        [9,9,9,9,9,9,9,9,9,9],
    ]
    for y in range(T):
        for x in range(T):
            canvas.px(x + T*4, y, data[y][x])
    
    # Tile 5: Cordón (yellow curb) — yellow band
    data = [
        [11,11,11,11,12,11,11,12,11,11],
        [11,12,11,11,11,12,11,11,11,12],
        [11,11,12,11,11,11,12,11,11,11],
        [12,11,11,11,12,11,11,11,12,11],
        [5,5,5,5,5,5,5,5,5,5],
        [5,4,5,5,5,5,4,5,5,5],
        [5,5,5,4,5,5,5,5,4,5],
        [4,5,5,5,5,4,5,5,5,5],
        [5,5,4,5,5,5,5,4,5,5],
        [5,5,5,5,4,5,5,5,5,4],
    ]
    for y in range(T):
        for x in range(T):
            canvas.px(x + T*5, y, data[y][x])
    
    return canvas


# ═══════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("🎨 Generando assets pixel art...\n")
    
    # ── Character portraits ──
    print("Personajes:")
    portrait_pal = PORTRAIT_PALETTE
    # Need to handle index 0 as transparent for png writer - use first color as placeholder
    # Actually, PNG index 0 = first palette entry. We want it to be a color.
    # Let's shift: background will be index 1, so index 0 is a placeholder we don't use
    # But in the palette list, index 0 maps to transparent in our convention.
    # PNG index 0 will be a real color. Let's fix this.
    
    # PNG index 0 = first palette entry. We'll make it dark background for the portraits
    # and set all canvas pixels that should be "transparent" to actual bg color.
    # There are no truly transparent pixels in portraits (they have a solid bg).
    
    gen_evelyn().save(os.path.join(OUT, 'evelyn.png'), portrait_pal)
    gen_tata().save(os.path.join(OUT, 'tata.png'), portrait_pal)
    gen_vibora().save(os.path.join(OUT, 'vibora.png'), portrait_pal)
    
    # ── Vehicles ──
    print("\nVehículos:")
    veh_pal = VEHICLE_PALETTE
    gen_veh_grua().save(os.path.join(OUT, 'grua.png'), veh_pal)
    gen_veh_deportivo().save(os.path.join(OUT, 'auto_deportivo.png'), veh_pal)
    gen_veh_camioneta().save(os.path.join(OUT, 'camioneta.png'), veh_pal)
    gen_veh_comun().save(os.path.join(OUT, 'auto_comun.png'), veh_pal)
    
    # ── Tileset ──
    print("\nTileset:")
    tile_pal = TILESET_PALETTE
    gen_tiles().save(os.path.join(OUT, 'tileset.png'), tile_pal)
    
    print("\n✅ Todos los assets generados en", OUT)
