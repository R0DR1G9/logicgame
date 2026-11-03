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

function puzzle() {
  return (window.LogicGame && window.LogicGame.puzzle) || null;
}

function formulaLabel() {
  const p = puzzle();
  return p && p.r1 ? p.r1.label : 'F = ?';
}

function fitSize(text, maxWidth, maxSize) {
  return Math.max(12, Math.min(maxSize, Math.floor(maxWidth / (text.length * 0.62))));
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
      font(ctx, fitSize(formulaLabel(), 400, 26), 'normal');
      center(ctx, formulaLabel(), w / 2, 440, '#d6e4f5');
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
      font(ctx, fitSize(formulaLabel(), 460, 36));
      center(ctx, formulaLabel(), w / 2, 130, '#ffb347');
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

export function serverScreenTexture() {
  const made = make(1200, 700, function () {});
  function draw() {
    const p = puzzle();
    const list = p && p.r3 ? p.r3.formulas : [];
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = '#04141c';
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, '#4dff9a', 10);
      font(ctx, 50);
      center(ctx, 'FILA DE QUARENTENA', w / 2, 66, '#4dff9a');
      font(ctx, 26, 'normal');
      center(ctx, 'classifique cada fórmula no terminal de arquivos', w / 2, 118, '#7f95b3');
      list.forEach(function (item, i) {
        const line = (i + 1) + '.  ' + item.text;
        font(ctx, fitSize(line, 1000, 42), 'normal');
        ctx.fillStyle = '#ffb347';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(line, 100, 195 + i * 74);
        ctx.fillStyle = 'rgba(77,255,154,0.2)';
        ctx.fillRect(100, 195 + i * 74 + 34, w - 200, 2);
      });
    });
  }
  draw();
  return { texture: made.texture, set: draw };
}

export function manualTexture() {
  return make(512, 340, function (ctx, w, h) {
    ctx.fillStyle = '#10161f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#dfe8dc';
    ctx.fillRect(10, 10, 240, h - 20);
    ctx.fillRect(262, 10, 240, h - 20);
    ctx.fillStyle = '#a9b8a8';
    ctx.fillRect(250, 10, 12, h - 20);
    font(ctx, 20);
    center(ctx, 'MANUAL DE', 130, 36, '#1f3a2e');
    center(ctx, 'CLASSIFICAÇÃO', 130, 60, '#1f3a2e');
    center(ctx, 'IMPLICAÇÃO', 382, 42, '#1f3a2e');
    font(ctx, 26);
    center(ctx, 'TAUTOLOGIA', 130, 120, '#2a6a4a');
    center(ctx, 'CONTRADIÇÃO', 130, 200, '#8a4a1c');
    center(ctx, 'CONTINGÊNCIA', 130, 280, '#1f3a6a');
    font(ctx, 17, 'normal');
    center(ctx, 'sempre V', 130, 150, '#3a3a3a');
    center(ctx, 'sempre F', 130, 230, '#3a3a3a');
    center(ctx, 'às vezes V e F', 130, 310, '#3a3a3a');
    font(ctx, 28);
    center(ctx, 'A ⇒ B', 382, 120, '#1f3a2e');
    font(ctx, 17, 'normal');
    center(ctx, 'quando A → B', 382, 160, '#3a3a3a');
    center(ctx, 'é tautologia', 382, 185, '#3a3a3a');
    center(ctx, 'ordem: ¬ ∧ ∨ → ↔', 382, 250, '#8a4a1c');
  }).texture;
}

export function filesTexture() {
  const made = make(512, 300, function () {});
  function draw(done) {
    const p = puzzle();
    const list = p && p.r3 ? p.r3.formulas : [];
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = '#04141c';
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, done ? '#4dff9a' : '#3de0ff', 6);
      font(ctx, 22);
      center(ctx, 'TERMINAL DE ARQUIVOS', w / 2, 30, '#3de0ff');
      list.forEach(function (item, i) {
        const x = 24 + (i % 3) * 156;
        const y = 56 + Math.floor(i / 3) * 90;
        ctx.fillStyle = done ? '#0b2a1f' : '#0b2a3a';
        ctx.fillRect(x, y, 146, 80);
        ctx.strokeStyle = done ? '#4dff9a' : '#3de0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 146, 80);
        font(ctx, 26);
        center(ctx, String(i + 1), x + 73, y + 28, '#d6e4f5');
        font(ctx, 15, 'normal');
        center(ctx, done ? p.r3.kinds[item.kind] : 'não classificado', x + 73, y + 60, done ? '#4dff9a' : '#7f95b3');
      });
      font(ctx, 20, 'normal');
      center(ctx, done ? 'CLASSIFICAÇÃO CONCLUÍDA' : '[E] ou clique para abrir', w / 2, 270, done ? '#4dff9a' : '#7f95b3');
    });
  }
  draw(false);
  return { texture: made.texture, set: draw };
}

export function coverTexture() {
  return make(360, 400, function (ctx, w, h) {
    ctx.fillStyle = '#10141c';
    ctx.fillRect(0, 0, w, h);
    [0, h - 70].forEach(function (y) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, w, 70);
      ctx.clip();
      ctx.fillStyle = '#e8b422';
      ctx.fillRect(0, y, w, 70);
      ctx.fillStyle = '#16181d';
      for (let x = -80; x < w + 80; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x, y + 70);
        ctx.lineTo(x + 28, y + 70);
        ctx.lineTo(x + 28 + 70, y);
        ctx.lineTo(x + 70, y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
    font(ctx, 42);
    center(ctx, 'ACESSO', w / 2, 160, '#ff5c7a');
    center(ctx, 'BLOQUEADO', w / 2, 215, '#ff5c7a');
    font(ctx, 20, 'normal');
    center(ctx, 'exclua os arquivos', w / 2, 262, '#7f95b3');
  }).texture;
}

export function lawsTexture() {
  return make(1200, 700, function (ctx, w, h) {
    ctx.fillStyle = '#1a0f14';
    ctx.fillRect(0, 0, w, h);
    frame(ctx, w, h, '#ff5c7a', 10);
    font(ctx, 50);
    center(ctx, 'LEIS DE EQUIVALÊNCIA', w / 2, 72, '#ff5c7a');
    const blocks = [
      ['DE MORGAN', '¬(P ∧ Q) ≡ ¬P ∨ ¬Q     ¬(P ∨ Q) ≡ ¬P ∧ ¬Q'],
      ['CONTRAPOSITIVA', 'P → Q ≡ ¬Q → ¬P'],
      ['IMPLICAÇÃO MATERIAL', 'P → Q ≡ ¬P ∨ Q     ¬(P → Q) ≡ P ∧ ¬Q'],
      ['BICONDICIONAL', 'P ↔ Q ≡ (P → Q) ∧ (Q → P)'],
      ['DUPLA NEGAÇÃO', '¬¬P ≡ P']
    ];
    blocks.forEach(function (block, i) {
      const y = 150 + i * 106;
      font(ctx, 28);
      ctx.fillStyle = '#ffb347';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(block[0], 70, y);
      font(ctx, fitSize(block[1], 1060, 40), 'normal');
      ctx.fillStyle = '#d6e4f5';
      ctx.fillText(block[1], 70, y + 46);
      ctx.fillStyle = 'rgba(255,92,122,0.25)';
      ctx.fillRect(70, y + 82, w - 140, 2);
    });
  }).texture;
}

export function premisesTexture() {
  const made = make(1200, 700, function () {});
  function draw() {
    const p = puzzle();
    const list = p && p.r4 ? p.r4.valves.premises : [];
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = '#10161f';
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, '#ffb347', 10);
      font(ctx, 48);
      center(ctx, 'REGISTRO DO REATOR', w / 2, 62, '#ffb347');
      font(ctx, 26, 'normal');
      center(ctx, 'V = válvula aberta     F = válvula fechada     tudo abaixo é verdadeiro', w / 2, 112, '#7f95b3');
      list.forEach(function (premise, i) {
        const line = (i + 1) + '.  ' + premise.formal;
        font(ctx, fitSize(line, 1040, 44), 'normal');
        ctx.fillStyle = '#d6e4f5';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(line, 80, 170 + i * 66);
      });
    });
  }
  draw();
  return { texture: made.texture, set: draw };
}

export function valvesFaceTexture() {
  return make(720, 640, function (ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#3a465e');
    g.addColorStop(1, '#1a2130');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    frame(ctx, w, h, '#ff5c7a', 10);
    font(ctx, 40);
    center(ctx, 'VÁLVULAS DO REATOR', w / 2, 56, '#ff5c7a');
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    letters.forEach(function (letter, i) {
      const cx = 130 + (i % 3) * 230;
      const cy = 235 + Math.floor(i / 3) * 215;
      ctx.fillStyle = '#0a0f18';
      ctx.fillRect(cx - 80, cy - 80, 160, 160);
      ctx.strokeStyle = '#59627a';
      ctx.lineWidth = 4;
      ctx.strokeRect(cx - 80, cy - 80, 160, 160);
      font(ctx, 44);
      center(ctx, letter, cx, cy + 112 - 24, '#d6e4f5');
    });
  }).texture;
}

export function oracleTexture() {
  const made = make(512, 300, function () {});
  function draw(mode) {
    const p = puzzle();
    const text = p && p.r4 ? 'F = ' + p.r4.equiv.target.text : '';
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = mode === 'locked' ? '#05080d' : '#04141c';
      ctx.fillRect(0, 0, w, h);
      if (mode === 'locked') {
        font(ctx, 30);
        center(ctx, 'SEM ENERGIA', w / 2, 120, '#5a2030');
        font(ctx, 20, 'normal');
        center(ctx, 'ajuste as válvulas do reator', w / 2, 175, '#7f95b3');
        return;
      }
      frame(ctx, w, h, mode === 'done' ? '#4dff9a' : '#ff5c7a', 6);
      font(ctx, 28);
      center(ctx, 'ORÁCULO', w / 2, 50, mode === 'done' ? '#4dff9a' : '#ff5c7a');
      font(ctx, fitSize(text, 460, 34));
      center(ctx, text, w / 2, 135, '#ffb347');
      font(ctx, 22, 'normal');
      if (mode === 'done') {
        center(ctx, 'EQUIVALÊNCIA CONFIRMADA', w / 2, 215, '#4dff9a');
        center(ctx, 'PORTA LIBERADA', w / 2, 250, '#4dff9a');
      } else {
        center(ctx, 'escolha a fórmula equivalente', w / 2, 215, '#d6e4f5');
        center(ctx, '[E] ou clique para abrir', w / 2, 250, '#7f95b3');
      }
    });
  }
  draw('locked');
  return { texture: made.texture, set: draw };
}

export function islandsTexture() {
  const made = make(1200, 700, function () {});
  function draw() {
    const p = puzzle();
    const data = p && p.r5 ? p.r5.islands : null;
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = '#12091d';
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, '#c78bff', 10);
      font(ctx, 46);
      center(ctx, 'ILHA DOS CAVALEIROS', w / 2, 56, '#c78bff');
      font(ctx, 24, 'normal');
      center(ctx, 'cavaleiro sempre diz a verdade     mentiroso sempre mente', w / 2, 102, '#7f95b3');
      if (!data) {
        return;
      }
      data.statements.forEach(function (item, i) {
        const line = data.names[item.speaker] + ': ' + item.text;
        font(ctx, fitSize(line, 1060, 34), 'normal');
        ctx.fillStyle = '#d6e4f5';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(line, 70, 170 + i * 88);
        ctx.fillStyle = 'rgba(199,139,255,0.25)';
        ctx.fillRect(70, 170 + i * 88 + 38, w - 140, 2);
      });
    });
  }
  draw();
  return { texture: made.texture, set: draw };
}

export function relationsTexture() {
  const made = make(1200, 700, function () {});
  function draw() {
    const p = puzzle();
    const data = p && p.r5 ? p.r5.relations : null;
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = '#12091d';
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, '#c78bff', 10);
      font(ctx, 46);
      center(ctx, 'MATRIZ DE RELAÇÕES', w / 2, 56, '#c78bff');
      if (!data) {
        return;
      }
      const cell = 62;
      const x0 = 80;
      const y0 = 170;
      font(ctx, 26);
      for (let i = 0; i < data.size; i++) {
        center(ctx, String(i + 1), x0 + (i + 1.5) * cell, y0 + cell / 2, '#ffb347');
        center(ctx, String(i + 1), x0 + cell / 2, y0 + (i + 1.5) * cell, '#ffb347');
      }
      data.matrix.forEach(function (row, i) {
        row.forEach(function (value, j) {
          const x = x0 + (j + 1) * cell;
          const y = y0 + (i + 1) * cell;
          ctx.fillStyle = value ? 'rgba(199,139,255,0.35)' : '#0a0f18';
          ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
          font(ctx, 30);
          center(ctx, value ? '1' : '0', x + cell / 2, y + cell / 2, value ? '#ffffff' : '#59627a');
        });
      });
      font(ctx, 22, 'normal');
      center(ctx, 'R(x,y): linha x, coluna y', x0 + (data.size + 1) * cell / 2, y0 + (data.size + 1) * cell + 36, '#7f95b3');
      data.statements.forEach(function (item, i) {
        const line = (i + 1) + '. ' + item.text;
        font(ctx, fitSize(line, 640, 32), 'normal');
        ctx.fillStyle = '#d6e4f5';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(line, 500, 150 + i * 88);
      });
    });
  }
  draw();
  return { texture: made.texture, set: draw };
}

export function argsTexture() {
  const made = make(512, 300, function () {});
  function draw(done) {
    made.redraw(function (ctx, w, h) {
      ctx.fillStyle = '#0d0716';
      ctx.fillRect(0, 0, w, h);
      frame(ctx, w, h, done ? '#4dff9a' : '#c78bff', 6);
      font(ctx, 28);
      center(ctx, 'ARGUMENTOS', w / 2, 56, done ? '#4dff9a' : '#c78bff');
      font(ctx, 22, 'normal');
      if (done) {
        center(ctx, 'TODOS JULGADOS', w / 2, 150, '#4dff9a');
        center(ctx, 'SELO ABERTO', w / 2, 190, '#4dff9a');
      } else {
        center(ctx, 'válido ou inválido?', w / 2, 140, '#d6e4f5');
        center(ctx, '[E] ou clique para abrir', w / 2, 190, '#7f95b3');
      }
    });
  }
  draw(false);
  return { texture: made.texture, set: draw };
}
