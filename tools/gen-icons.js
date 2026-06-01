// Generate PNG app icons (192 & 512) without any image dependencies.
//
// The icon is simple geometry (a 3x3 Lights Out grid with a lit plus), so we
// rasterize it into an RGBA buffer and encode a real PNG using Node's built-in
// zlib. Run: node tools/gen-icons.js  (or via npm run gen-icons)

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Colors ───────────────────────────────────────────────────────────────────
const BG = [0x04, 0x08, 0x0e, 0xff];
const OFF = [0x14, 0x1d, 0x28, 0xff];
// gradient endpoints (#38bdf8 -> #a78bfa); we lerp across the icon diagonally
const G0 = [0x38, 0xbd, 0xf8];
const G1 = [0xa7, 0x8b, 0xfa];

// The lit cells (the plus shape) in a 3x3 grid.
const LIT = new Set(["1,0", "0,1", "1,1", "2,1", "1,2"]);

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  // layout scaled from the 512 reference (margin 96, cell 104, gap 4, radius 22)
  const s = size / 512;
  const margin = 96 * s;
  const cell = 104 * s;
  const step = 108 * s; // cell + 4 gap
  const radius = 22 * s;

  const setPx = (x, y, rgba) => {
    const i = (y * size + x) * 4;
    buf[i] = rgba[0];
    buf[i + 1] = rgba[1];
    buf[i + 2] = rgba[2];
    buf[i + 3] = rgba[3];
  };

  // fill background
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) setPx(x, y, BG);

  const inRoundedRect = (px, py, rx, ry, w, h, r) => {
    if (px < rx || py < ry || px >= rx + w || py >= ry + h) return false;
    // corner rounding
    const cxs = [rx + r, rx + w - r];
    const cys = [ry + r, ry + h - r];
    const nearLeft = px < cxs[0];
    const nearRight = px > cxs[1];
    const nearTop = py < cys[0];
    const nearBot = py > cys[1];
    if ((nearLeft || nearRight) && (nearTop || nearBot)) {
      const cx = nearLeft ? cxs[0] : cxs[1];
      const cy = nearTop ? cys[0] : cys[1];
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    }
    return true;
  };

  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      const lit = LIT.has(`${gx},${gy}`);
      const rx = margin + gx * step;
      const ry = margin + gy * step;
      for (let py = Math.floor(ry); py < ry + cell; py++) {
        for (let px = Math.floor(rx); px < rx + cell; px++) {
          if (px < 0 || py < 0 || px >= size || py >= size) continue;
          if (!inRoundedRect(px, py, rx, ry, cell, cell, radius)) continue;
          if (lit) {
            const t = (px + py) / (2 * size); // diagonal gradient
            setPx(px, py, [lerp(G0[0], G1[0], t), lerp(G0[1], G1[1], t), lerp(G0[2], G1[2], t), 0xff]);
          } else {
            setPx(px, py, OFF);
          }
        }
      }
    }
  }
  return buf;
}

// ── Minimal PNG encoder (RGBA, no filtering) ──────────────────────────────────
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(rgba, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // raw scanlines, each prefixed with filter byte 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const outDir = resolve(__dirname, "../web/icons");
mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const png = encodePng(drawIcon(size), size);
  const path = resolve(outDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}
