import * as THREE from '../../vendor/three.module.min.js';

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function surfaceCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function grain(ctx, size, amount, random) {
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (random() - 0.5) * amount;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(image, 0, 0);
}

function rivet(ctx, x, y, r, light, dark) {
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function streaks(ctx, size, random, count, alpha) {
  for (let i = 0; i < count; i++) {
    const x = random() * size;
    const w = 2 + random() * 10;
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5 + random() * 0.4, 'rgba(0,0,0,' + (alpha * random()) + ')');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, w, size);
  }
}

function buildWall() {
  const size = 512;
  const random = rng(11);
  const map = surfaceCanvas(size);
  const bump = surfaceCanvas(size);
  const c = map.getContext('2d');
  const b = bump.getContext('2d');
  c.fillStyle = '#d4dbe6';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);
  const half = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const x = i * half;
      const y = j * half;
      const tone = 0.94 + random() * 0.08;
      c.fillStyle = 'rgba(255,255,255,' + (tone - 0.9) + ')';
      c.fillRect(x + 4, y + 4, half - 8, half - 8);
      c.strokeStyle = '#7b8496';
      c.lineWidth = 6;
      c.strokeRect(x + 3, y + 3, half - 6, half - 6);
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 2;
      c.strokeRect(x + 12, y + 12, half - 24, half - 24);
      b.strokeStyle = '#2a2a2a';
      b.lineWidth = 8;
      b.strokeRect(x + 3, y + 3, half - 6, half - 6);
      b.strokeStyle = '#a0a0a0';
      b.lineWidth = 3;
      b.strokeRect(x + 14, y + 14, half - 28, half - 28);
      [[22, 22], [half - 22, 22], [22, half - 22], [half - 22, half - 22]].forEach(function (p) {
        rivet(c, x + p[0], y + p[1], 4, '#eef2f8', '#59627a');
        rivet(b, x + p[0], y + p[1], 4, '#f0f0f0', '#303030');
      });
    }
  }
  streaks(c, size, random, 26, 0.18);
  grain(c, size, 16, random);
  grain(b, size, 14, random);
  return { map: map, bump: bump };
}

function buildFloor() {
  const size = 512;
  const random = rng(23);
  const map = surfaceCanvas(size);
  const bump = surfaceCanvas(size);
  const rough = surfaceCanvas(size);
  const c = map.getContext('2d');
  const b = bump.getContext('2d');
  const r = rough.getContext('2d');
  c.fillStyle = '#a8b2c2';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#7a7a7a';
  b.fillRect(0, 0, size, size);
  r.fillStyle = '#6e6e6e';
  r.fillRect(0, 0, size, size);
  const half = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const x = i * half;
      const y = j * half;
      c.strokeStyle = '#4b5468';
      c.lineWidth = 7;
      c.strokeRect(x + 3, y + 3, half - 6, half - 6);
      c.strokeStyle = 'rgba(255,255,255,0.4)';
      c.lineWidth = 2;
      c.strokeRect(x + 9, y + 9, half - 18, half - 18);
      b.strokeStyle = '#222';
      b.lineWidth = 9;
      b.strokeRect(x + 3, y + 3, half - 6, half - 6);
      c.strokeStyle = 'rgba(40,50,70,0.35)';
      b.strokeStyle = '#9a9a9a';
      c.lineWidth = 3;
      b.lineWidth = 3;
      for (let k = -half; k < half * 2; k += 18) {
        c.beginPath();
        c.moveTo(x + 24 + k, y + 24);
        c.lineTo(x + 24 + k + (half - 48), y + half - 24);
        c.stroke();
        b.beginPath();
        b.moveTo(x + 24 + k, y + 24);
        b.lineTo(x + 24 + k + (half - 48), y + half - 24);
        b.stroke();
      }
      c.fillStyle = '#a8b2c2';
      c.fillRect(x, y, 22, half);
      c.fillRect(x + half - 22, y, 22, half);
      c.fillRect(x, y, half, 22);
      c.fillRect(x, y + half - 22, half, 22);
      c.strokeStyle = '#4b5468';
      c.lineWidth = 7;
      c.strokeRect(x + 3, y + 3, half - 6, half - 6);
      [[16, 16], [half - 16, 16], [16, half - 16], [half - 16, half - 16]].forEach(function (p) {
        rivet(c, x + p[0], y + p[1], 4, '#e6ebf4', '#3d4558');
        rivet(b, x + p[0], y + p[1], 4, '#f0f0f0', '#303030');
      });
    }
  }
  for (let i = 0; i < 40; i++) {
    r.fillStyle = 'rgba(255,255,255,' + (0.1 + random() * 0.25) + ')';
    r.fillRect(random() * size, random() * size, 10 + random() * 70, 2 + random() * 4);
  }
  streaks(c, size, random, 10, 0.2);
  grain(c, size, 20, random);
  grain(b, size, 12, random);
  grain(r, size, 26, random);
  return { map: map, bump: bump, rough: rough };
}

function buildCeiling() {
  const size = 512;
  const random = rng(37);
  const map = surfaceCanvas(size);
  const bump = surfaceCanvas(size);
  const c = map.getContext('2d');
  const b = bump.getContext('2d');
  c.fillStyle = '#9aa4b6';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);
  const half = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const x = i * half;
      const y = j * half;
      c.strokeStyle = '#4e586d';
      c.lineWidth = 8;
      c.strokeRect(x + 4, y + 4, half - 8, half - 8);
      b.strokeStyle = '#242424';
      b.lineWidth = 10;
      b.strokeRect(x + 4, y + 4, half - 8, half - 8);
      for (let s = 0; s < 6; s++) {
        const yy = y + 60 + s * 22;
        c.fillStyle = '#2d3548';
        c.fillRect(x + 50, yy, half - 100, 8);
        b.fillStyle = '#1c1c1c';
        b.fillRect(x + 50, yy, half - 100, 8);
      }
    }
  }
  grain(c, size, 18, random);
  grain(b, size, 10, random);
  return { map: map, bump: bump };
}

function buildHazard() {
  const w = 256;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  c.fillStyle = '#e8b422';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#16181d';
  for (let x = -h; x < w + h; x += 44) {
    c.beginPath();
    c.moveTo(x, h);
    c.lineTo(x + 22, h);
    c.lineTo(x + 22 + h, 0);
    c.lineTo(x + h, 0);
    c.closePath();
    c.fill();
  }
  return { map: canvas };
}

function buildVent() {
  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  c.fillStyle = '#10151f';
  c.fillRect(0, 0, w, h);
  for (let y = 18; y < h - 10; y += 22) {
    const g = c.createLinearGradient(0, y, 0, y + 14);
    g.addColorStop(0, '#5d6a82');
    g.addColorStop(1, '#202838');
    c.fillStyle = g;
    c.fillRect(14, y, w - 28, 14);
  }
  c.strokeStyle = '#6b7791';
  c.lineWidth = 8;
  c.strokeRect(4, 4, w - 8, h - 8);
  return { map: canvas };
}

const BUILDERS = { wall: buildWall, floor: buildFloor, ceiling: buildCeiling, hazard: buildHazard, vent: buildVent };
const cache = {};

function source(kind) {
  if (!cache[kind]) {
    cache[kind] = BUILDERS[kind]();
  }
  return cache[kind];
}

function tile(canvas, repeatX, repeatY, srgb) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  if (srgb) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  return texture;
}

export function surface(kind, repeatX, repeatY, color, options) {
  const o = options || {};
  const parts = source(kind);
  const params = {
    color: color,
    map: tile(parts.map, repeatX, repeatY, true),
    roughness: o.roughness === undefined ? 0.8 : o.roughness,
    metalness: o.metalness === undefined ? 0.1 : o.metalness
  };
  if (parts.bump) {
    params.bumpMap = tile(parts.bump, repeatX, repeatY, false);
    params.bumpScale = o.bumpScale === undefined ? 2 : o.bumpScale;
  }
  if (parts.rough) {
    params.roughnessMap = tile(parts.rough, repeatX, repeatY, false);
  }
  if (o.emissive !== undefined) {
    params.emissive = o.emissive;
    params.emissiveMap = params.map;
    params.emissiveIntensity = o.emissiveIntensity === undefined ? 0.3 : o.emissiveIntensity;
  }
  return new THREE.MeshStandardMaterial(params);
}
