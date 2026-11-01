import * as THREE from '../../vendor/three.module.min.js';

const MONO = '"Share Tech Mono", "Cascadia Code", "DejaVu Sans Mono", Consolas, "Courier New", monospace';

try {
  await document.fonts.load('16px "Share Tech Mono"');
} catch (error) {
  document.fonts.ready.catch(function () {});
}

function make(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return {
    texture: texture,
    redraw: function (fn) {
      ctx.clearRect(0, 0, width, height);
      fn(ctx, width, height);
      texture.needsUpdate = true;
    }
  };
}

function font(ctx, size, weight) {
  ctx.font = (weight || 'bold') + ' ' + size + 'px ' + MONO;
}

function center(ctx, text, x, y, color) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function wrap(ctx, text, x, y, maxWidth, lineHeight, color) {
  const words = text.split(' ');
  let line = '';
  let cursor = y;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  words.forEach(function (word) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) {
    ctx.fillText(line, x, cursor);
  }
}

function frame(ctx, w, h, color, thickness) {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.strokeRect(thickness / 2, thickness / 2, w - thickness, h - thickness);
}

export function floorTexture() {
  const made = make(128, 128, function (ctx, w, h) {
    ctx.fillStyle = '#0c1424';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1b3050';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#12203a';
    ctx.fillRect(60, 60, 8, 8);
  });
  made.texture.wrapS = THREE.RepeatWrapping;
  made.texture.wrapT = THREE.RepeatWrapping;
  made.texture.repeat.set(8, 8);
  return made.texture;
}

export function noteTexture() {
  return make(256, 330, function (ctx, w, h) {
    ctx.fillStyle = '#e9e3c9';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(w / 2, 22, 9, 0, Math.PI * 2);
    ctx.fill();
    font(ctx, 26);
    center(ctx, 'AVISO', w / 2, 62, '#3a3a3a');
    font(ctx, 22, 'normal');
    wrap(ctx, 'Para reativar a energia, o circuito precisa de um sinal V (Verdadeiro).', 22, 100, w - 44, 30, '#2a2a2a');
  }).texture;
}

export function boardTexture() {
  return make(1200, 700, function (ctx, w, h) {
    ctx.fillStyle = '#0b1830';
    ctx.fillRect(0, 0, w, h);
    frame(ctx, w, h, '#3de0ff', 10);
    font(ctx, 54);
    center(ctx, 'CONECTIVOS LÓGICOS', w / 2, 80, '#3de0ff');
    const rows = [
      ['¬P', 'negação (NÃO)'],
      ['P ∧ Q', 'conjunção (E)'],
      ['P ∨ Q', 'disjunção (OU)'],
      ['P → Q', 'implicação (SE... ENTÃO)']
    ];
    rows.forEach(function (row, i) {
      const y = 190 + i * 125;
      font(ctx, 66);
      ctx.fillStyle = '#ffb347';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(row[0], 90, y);
      font(ctx, 44, 'normal');
      ctx.fillStyle = '#d6e4f5';
      ctx.fillText(row[1], 470, y);
    });
  }).texture;
}

export function panelTexture() {
  const made = make(440, 600, function () {});
  function draw(power) {
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = '#16100a';
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, '#ffb347', 10);
      font(ctx, 34);
      center(ctx, 'PAINEL DE', w / 2, 70, '#ffb347');
      center(ctx, 'ENERGIA', w / 2, 112, '#ffb347');
      ctx.fillStyle = power ? '#4dff9a' : '#ff5c7a';
      ctx.beginPath();
      ctx.arc(w / 2, 240, 58, 0, Math.PI * 2);
      ctx.fill();
      font(ctx, 38);
      center(ctx, power ? 'ENERGIA ON' : 'SEM ENERGIA', w / 2, 360, power ? '#4dff9a' : '#ff5c7a');
      font(ctx, 26, 'normal');
      center(ctx, 'F = (P ∨ ¬Q) ∧ P', w / 2, 440, '#d6e4f5');
      center(ctx, power ? 'circuito ativo' : 'precisa de sinal V', w / 2, 500, '#7f95b3');
    });
  }
  draw(false);
  return { texture: made.texture, set: draw };
}

export function screenTexture() {
  const made = make(512, 300, function () {});
  function draw(mode) {
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = mode === 'off' ? '#05080d' : '#04141c';
      ctx.fillRect(0, 0, w, h);
      if (mode === 'off') {
        font(ctx, 30);
        center(ctx, 'SEM ENERGIA', w / 2, h / 2, '#5a2030');
        return;
      }
      frame(ctx, w, h, mode === 'done' ? '#4dff9a' : '#3de0ff', 6);
      font(ctx, 30);
      center(ctx, 'TERMINAL ONLINE', w / 2, 52, '#3de0ff');
      font(ctx, 36);
      center(ctx, 'F = (P ∨ ¬Q) ∧ P', w / 2, 130, '#ffb347');
      font(ctx, 24, 'normal');
      if (mode === 'done') {
        center(ctx, 'TABELA REGISTRADA', w / 2, 205, '#4dff9a');
        center(ctx, 'PORTA LIBERADA', w / 2, 245, '#4dff9a');
      } else {
        center(ctx, 'complete a tabela-verdade', w / 2, 205, '#d6e4f5');
        center(ctx, '[E] ou clique para abrir', w / 2, 245, '#7f95b3');
      }
    });
  }
  draw('off');
  return { texture: made.texture, set: draw };
}

export function rackTexture() {
  return make(256, 512, function (ctx, w, h) {
    ctx.fillStyle = '#0c111b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a3550';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    for (let i = 0; i < 8; i++) {
      const y = 14 + i * 61;
      ctx.fillStyle = '#131b2b';
      ctx.fillRect(14, y, w - 28, 52);
      ctx.strokeStyle = '#2e3b58';
      ctx.lineWidth = 2;
      ctx.strokeRect(14, y, w - 28, 52);
      ctx.fillStyle = '#05080e';
      for (let s = 0; s < 6; s++) {
        ctx.fillRect(26, y + 10 + s * 6, w - 120, 3);
      }
      ctx.fillStyle = '#0a2230';
      ctx.fillRect(w - 80, y + 12, 52, 28);
    }
  }).texture;
}

export function keypadTexture() {
  return make(128, 192, function (ctx, w, h) {
    ctx.fillStyle = '#0c111b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3de0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = '#1b2840';
        ctx.fillRect(14 + c * 34, 76 + r * 26, 28, 20);
        ctx.fillStyle = '#3de0ff';
        ctx.fillRect(24 + c * 34, 84 + r * 26, 8, 4);
      }
    }
  }).texture;
}

export function labelTexture(text, color) {
  return make(512, 160, function (ctx, w, h) {
    ctx.fillStyle = '#0a1424';
    ctx.fillRect(0, 0, w, h);
    frame(ctx, w, h, color, 8);
    font(ctx, 54);
    center(ctx, text, w / 2, h / 2, color);
  }).texture;
}

export function signTexture(lines, color) {
  return make(900, 420, function (ctx, w, h) {
    ctx.fillStyle = '#0a1424';
    ctx.fillRect(0, 0, w, h);
    frame(ctx, w, h, color, 10);
    font(ctx, 64);
    center(ctx, lines[0], w / 2, 150, color);
    font(ctx, 44, 'normal');
    center(ctx, lines[1], w / 2, 270, '#d6e4f5');
  }).texture;
}

export function rulesTexture() {
  return make(1200, 700, function (ctx, w, h) {
    ctx.fillStyle = '#16102a';
    ctx.fillRect(0, 0, w, h);
    frame(ctx, w, h, '#ffb347', 10);
    font(ctx, 54);
    center(ctx, 'REGRAS DE INFERÊNCIA', w / 2, 80, '#ffb347');
    const rules = [
      ['MODUS PONENS', 'P → Q     P', '∴ Q'],
      ['MODUS TOLLENS', 'P → Q     ¬Q', '∴ ¬P'],
      ['SILOGISMO DISJUNTIVO', 'P ∨ Q     ¬P', '∴ Q']
    ];
    rules.forEach(function (rule, i) {
      const y = 215 + i * 160;
      font(ctx, 38);
      ctx.fillStyle = '#ffb347';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(rule[0], 80, y - 34);
      font(ctx, 54, 'normal');
      ctx.fillStyle = '#d6e4f5';
      ctx.fillText(rule[1], 80, y + 26);
      ctx.fillStyle = '#4dff9a';
      ctx.fillText(rule[2], 780, y + 26);
      ctx.fillStyle = 'rgba(255,179,71,0.3)';
      ctx.fillRect(80, y + 72, w - 160, 2);
    });
  }).texture;
}

export function suspectsTexture() {
  return make(1200, 700, function (ctx, w, h) {
    ctx.fillStyle = '#1b1510';
    ctx.fillRect(0, 0, w, h);
    frame(ctx, w, h, '#ff5c7a', 10);
    font(ctx, 52);
    center(ctx, 'SUSPEITOS', w / 2, 70, '#ff5c7a');
    const letters = ['A', 'B', 'C', 'D'];
    const pins = [];
    letters.forEach(function (letter, i) {
      const x = 70 + i * 275;
      const y = 140 + (i % 2) * 36;
      pins.push([x + 105, y + 14]);
      ctx.fillStyle = '#d9d2bc';
      ctx.fillRect(x, y, 210, 400);
      ctx.fillStyle = '#2a2f3d';
      ctx.beginPath();
      ctx.arc(x + 105, y + 150, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 105, y + 290, 92, 70, 0, Math.PI, 0);
      ctx.fill();
      font(ctx, 70);
      center(ctx, letter, x + 105, y + 345, '#1a1a1a');
      font(ctx, 26, 'normal');
      center(ctx, 'SUSPEITO ' + (i + 1), x + 105, y + 382, '#4a4a4a');
    });
    ctx.strokeStyle = 'rgba(255,92,122,0.85)';
    ctx.lineWidth = 4;
    [[0, 1], [1, 2], [2, 3], [0, 2]].forEach(function (pair) {
      ctx.beginPath();
      ctx.moveTo(pins[pair[0]][0], pins[pair[0]][1]);
      ctx.lineTo(pins[pair[1]][0], pins[pair[1]][1]);
      ctx.stroke();
    });
    pins.forEach(function (pin) {
      ctx.fillStyle = '#ff5c7a';
      ctx.beginPath();
      ctx.arc(pin[0], pin[1], 11, 0, Math.PI * 2);
      ctx.fill();
    });
  }).texture;
}

export function diaryTexture() {
  return make(512, 340, function (ctx, w, h) {
    ctx.fillStyle = '#1a140e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8dfc4';
    ctx.fillRect(10, 10, 240, h - 20);
    ctx.fillRect(262, 10, 240, h - 20);
    ctx.fillStyle = '#b8ad8c';
    ctx.fillRect(250, 10, 12, h - 20);
    font(ctx, 24);
    center(ctx, 'DIÁRIO', 130, 42, '#3a2f1f');
    center(ctx, 'PÁG. 1 A 4', 382, 42, '#3a2f1f');
    ctx.strokeStyle = '#8f8467';
    ctx.lineWidth = 3;
    [[20, 240], [272, 492]].forEach(function (span) {
      for (let y = 76; y < h - 24; y += 24) {
        ctx.beginPath();
        ctx.moveTo(span[0] + 8, y);
        ctx.lineTo(span[0] + 8 + (span[1] - span[0] - 16) * (0.55 + ((y * 7) % 40) / 100), y);
        ctx.stroke();
      }
    });
    ctx.fillStyle = '#1a140e';
    ctx.beginPath();
    ctx.moveTo(262, 10);
    for (let y = 10; y <= h - 10; y += 18) {
      ctx.lineTo(262 + (y % 36 === 10 ? 10 : 2), y);
    }
    ctx.lineTo(262, h - 10);
    ctx.closePath();
    ctx.fill();
  }).texture;
}

export function safeTexture() {
  const made = make(400, 440, function () {});
  function draw(open) {
    made.redraw(function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#46526b');
      g.addColorStop(1, '#1d2433');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, '#2a3347', 14);
      ctx.fillStyle = '#050a10';
      ctx.fillRect(60, 40, 280, 70);
      font(ctx, 40);
      center(ctx, open ? 'ABERTO' : 'TRANCADO', w / 2, 75, open ? '#4dff9a' : '#ff5c7a');
      ctx.fillStyle = '#232c3d';
      ctx.beginPath();
      ctx.arc(200, 265, 118, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8d9bb5';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.lineWidth = 3;
      for (let k = 0; k < 36; k++) {
        const a = k * Math.PI / 18;
        const r1 = k % 3 === 0 ? 88 : 98;
        ctx.beginPath();
        ctx.moveTo(200 + Math.cos(a) * r1, 265 + Math.sin(a) * r1);
        ctx.lineTo(200 + Math.cos(a) * 108, 265 + Math.sin(a) * 108);
        ctx.stroke();
      }
      ctx.fillStyle = '#aab6cc';
      ctx.beginPath();
      ctx.arc(200, 265, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5c7a';
      ctx.beginPath();
      ctx.moveTo(200, 130);
      ctx.lineTo(188, 112);
      ctx.lineTo(212, 112);
      ctx.closePath();
      ctx.fill();
    });
  }
  draw(false);
  return { texture: made.texture, set: draw };
}
