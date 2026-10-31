import * as THREE from '../../vendor/three.module.min.js';
import {
  WALL, HEIGHT, WIDTH, DEPTH, HALF, DOOR_W, DOOR_H,
  rooms, doors, room1, buildColliders
} from './level.js';
import * as tex from './textures.js';

const ACCENTS = [0x3de0ff, 0xffb347, 0x4dff9a];
const ACCENT_CSS = ['#3de0ff', '#ffb347', '#4dff9a'];
const WALL_COLORS = [0x1c2b47, 0x2c2340, 0x173631];
const FLOOR_TINTS = [0xffffff, 0xe6d6ff, 0xd6ffe9];
const DOOR_LABELS = ['NÍVEL 2', 'NÍVEL 3', 'SAÍDA'];
const SOLID_LIGHT = 52;

export function buildWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03060c);
  scene.fog = new THREE.Fog(0x03060c, 10, 40);

  const pickables = [];
  const colliders = buildColliders();
  const ambient = new THREE.AmbientLight(0x8fb2ff, 0.42);
  scene.add(ambient);

  function material(color, options) {
    const o = options || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.roughness === undefined ? 0.85 : o.roughness,
      metalness: o.metalness === undefined ? 0.1 : o.metalness,
      emissive: o.emissive === undefined ? 0x000000 : o.emissive,
      emissiveIntensity: o.emissiveIntensity === undefined ? 1 : o.emissiveIntensity
    });
  }

  function solid(w, h, d, mat, x, y, z, parent) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    (parent || scene).add(mesh);
    pickables.push(mesh);
    return mesh;
  }

  function sign(map, w, h, x, y, z, rotationY, parent) {
    const mat = new THREE.MeshStandardMaterial({
      map: map,
      emissiveMap: map,
      emissive: 0xffffff,
      emissiveIntensity: 0.55,
      roughness: 0.7
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    (parent || scene).add(mesh);
    pickables.push(mesh);
    return mesh;
  }

  function tag(mesh, info) {
    mesh.userData.interact = info;
  }

  const floorMap = tex.floorTexture();
  const stripMats = [[], [], []];
  const fixtureMats = [];
  const room1Lights = [];

  rooms.forEach(function (room, i) {
    const cx = 0;
    const cz = (room.zMin + room.zMax) / 2;
    const wallMat = material(WALL_COLORS[i]);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(WIDTH, DEPTH),
      new THREE.MeshStandardMaterial({ map: floorMap, color: FLOOR_TINTS[i], roughness: 0.9, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    scene.add(floor);

    solid(WALL, HEIGHT, DEPTH, wallMat, -HALF - WALL / 2, HEIGHT / 2, cz);
    solid(WALL, HEIGHT, DEPTH, wallMat, HALF + WALL / 2, HEIGHT / 2, cz);

    const farZ = room.zMin - WALL / 2;
    const sideW = HALF + WALL - DOOR_W / 2;
    const sideX = DOOR_W / 2 + sideW / 2;
    solid(sideW, HEIGHT, WALL, wallMat, -sideX, HEIGHT / 2, farZ);
    solid(sideW, HEIGHT, WALL, wallMat, sideX, HEIGHT / 2, farZ);
    solid(DOOR_W, HEIGHT - DOOR_H, WALL, wallMat, 0, DOOR_H + (HEIGHT - DOOR_H) / 2, farZ);

    [-1, 1].forEach(function (side) {
      const stripMat = material(0x0a1220, { emissive: ACCENTS[i], emissiveIntensity: i === 0 ? 0.25 : 0.9 });
      stripMats[i].push(stripMat);
      solid(0.05, 0.08, DEPTH, stripMat, side * (HALF - 0.025), 0.14, cz);
    });

    [-1.9, 1.9].forEach(function (offset) {
      const fixtureMat = material(0x1a2336, { emissive: 0xdfeaff, emissiveIntensity: i === 0 ? 0 : 1.1 });
      if (i === 0) {
        fixtureMats.push(fixtureMat);
      }
      solid(1.8, 0.05, 0.35, fixtureMat, 0, HEIGHT - 0.03, cz + offset);
    });

    if (i > 0) {
      [-1.9, 1.9].forEach(function (offset) {
        const light = new THREE.PointLight(0xdfeaff, SOLID_LIGHT, 0, 2);
        light.position.set(0, HEIGHT - 0.4, cz + offset);
        scene.add(light);
      });
    }
  });

  const nearWall = solid(WIDTH + WALL * 2, HEIGHT, WALL, material(WALL_COLORS[0]), 0, HEIGHT / 2, rooms[0].zMax + WALL / 2);
  nearWall.name = 'near-wall';

  const ceilingMat = material(0x0b1220);
  solid(WIDTH + WALL * 2, 0.2, rooms[0].zMax - rooms[2].zMin + WALL * 2, ceilingMat, 0, HEIGHT + 0.1, (rooms[0].zMax + rooms[2].zMin) / 2);

  [-1.9, 1.9].forEach(function (offset) {
    const light = new THREE.PointLight(0xdfeaff, 0, 0, 2);
    light.position.set(0, HEIGHT - 0.4, (rooms[0].zMin + rooms[0].zMax) / 2 + offset);
    scene.add(light);
    room1Lights.push(light);
  });
  const emergency = new THREE.PointLight(0xff9a3c, 9, 0, 2);
  emergency.position.set(HALF - 1.2, 2.3, room1.panel.z);
  scene.add(emergency);

  const noteMap = tex.noteTexture();
  const note = sign(noteMap, room1.note.w, room1.note.h, room1.note.x, room1.note.y, room1.note.z, Math.PI / 2);
  tag(note, { room: 1, action: 'note', label: 'Bilhete na parede' });

  const boardFrame = solid(0.02, room1.board.h + 0.2, room1.board.w + 0.2, material(0x0a1220, { metalness: 0.4 }), -HALF + 0.01, room1.board.y, room1.board.z);
  tag(boardFrame, { room: 1, action: 'board', label: 'Quadro de conectivos' });
  const board = sign(tex.boardTexture(), room1.board.w, room1.board.h, room1.board.x + 0.01, room1.board.y, room1.board.z, Math.PI / 2);
  tag(board, { room: 1, action: 'board', label: 'Quadro de conectivos' });

  const p = room1.panel;
  const panelBody = solid(p.d, p.h, p.w, material(0x241a0e, { metalness: 0.3 }), p.x, p.y, p.z);
  tag(panelBody, { room: 1, action: 'panel', label: 'Painel de energia' });
  const panelTex = tex.panelTexture();
  const panelFront = sign(panelTex.texture, p.w - 0.1, p.h - 0.1, p.x - p.d / 2 - 0.005, p.y, p.z, -Math.PI / 2);
  tag(panelFront, { room: 1, action: 'panel', label: 'Painel de energia' });

  const d = room1.desk;
  const deskMat = material(0x1b2638, { metalness: 0.25 });
  const desk = solid(d.w, d.h, d.d, deskMat, d.x, d.h / 2, d.z);
  tag(desk, { room: 1, action: 'terminal', label: 'Terminal' });
  const monitor = solid(1.0, 0.62, 0.08, material(0x0d121c, { metalness: 0.3 }), d.x, 1.3, d.z - 0.1);
  tag(monitor, { room: 1, action: 'terminal', label: 'Terminal' });
  solid(0.12, 0.3, 0.1, deskMat, d.x, 0.95, d.z - 0.1);
  const keyboard = solid(0.6, 0.03, 0.2, material(0x0d121c), d.x, d.h + 0.015, d.z + 0.2);
  tag(keyboard, { room: 1, action: 'terminal', label: 'Terminal' });
  const screenTex = tex.screenTexture();
  const screen = sign(screenTex.texture, 0.92, 0.54, d.x, 1.3, d.z - 0.1 + 0.045, 0);
  tag(screen, { room: 1, action: 'terminal', label: 'Terminal' });

  const ledColors = [0x4dff9a, 0xffb347, 0xff5c7a, 0x3de0ff];
  room1.racks.forEach(function (rack, r) {
    solid(rack.w, rack.h, rack.d, material(0x131b2b, { metalness: 0.3 }), rack.x, rack.h / 2, rack.z);
    for (let k = 0; k < 9; k++) {
      const color = ledColors[(k + r * 2) % ledColors.length];
      const led = material(0x050505, { emissive: color, emissiveIntensity: 1.6 });
      solid(0.03, 0.04, 0.12, led, rack.x - rack.w / 2 - 0.01, 0.35 + k * 0.17, rack.z - 0.2 + (k % 3) * 0.2);
    }
  });

  const doorStates = doors.map(function (door, i) {
    const group = new THREE.Group();
    const zCenter = door.zFar + WALL / 2;
    group.position.set(0, DOOR_H / 2, zCenter);
    scene.add(group);

    const leaf = solid(DOOR_W - 0.04, DOOR_H, 0.2, material(0x233350, { metalness: 0.35, roughness: 0.6 }), 0, 0, 0, group);
    tag(leaf, { door: i, label: i === 2 ? 'Porta de escape' : 'Porta' });
    const label = sign(tex.labelTexture(DOOR_LABELS[i], ACCENT_CSS[i]), 1.0, 0.31, 0, 0.55, 0.105, 0, group);
    tag(label, { door: i, label: i === 2 ? 'Porta de escape' : 'Porta' });

    const lampMat = material(0x050505, { emissive: 0xff5c7a, emissiveIntensity: 1.6 });
    solid(0.5, 0.1, 0.06, lampMat, 0, 2.62, door.zNear + 0.03);

    [-1, 1].forEach(function (side) {
      const post = material(0x0a1220, { emissive: ACCENTS[i], emissiveIntensity: 0.9 });
      solid(0.06, DOOR_H, 0.04, post, side * (DOOR_W / 2 + 0.03), DOOR_H / 2, door.zNear + 0.02);
    });

    return {
      group: group,
      lampMat: lampMat,
      collider: colliders.find(function (c) { return c.id === door.id; }),
      open: 0,
      target: 0,
      unlocked: false
    };
  });

  const signRooms = [1, 2];
  signRooms.forEach(function (index) {
    const room = rooms[index];
    const cz = (room.zMin + room.zMax) / 2;
    sign(tex.signTexture(['NÍVEL DE ACESSO ' + (index + 1), 'sala em construção'], ACCENT_CSS[index]), 2.6, 1.2, -HALF + 0.02, 1.8, cz, Math.PI / 2);
  });

  let powered = false;
  let flicker = 0;
  let flickerClock = 0;
  let level = 0;
  let terminalMode = 'off';
  let panelOn = false;

  function setLevel(value) {
    level = value;
    ambient.intensity = 0.42 + 0.5 * value;
    room1Lights.forEach(function (light) {
      light.intensity = SOLID_LIGHT * value;
    });
    fixtureMats.forEach(function (mat) {
      mat.emissiveIntensity = 1.1 * value;
    });
    stripMats[0].forEach(function (mat) {
      mat.emissiveIntensity = 0.25 + 0.75 * value;
    });
    emergency.intensity = 9 * (1 - value);
  }

  function apply(status, instant) {
    const wasPowered = powered;
    powered = status.power;
    if (powered && !wasPowered) {
      flicker = instant ? 0 : 0.9;
      flickerClock = 0;
      setLevel(instant ? 1 : 0);
    }
    if (!powered) {
      setLevel(0);
      flicker = 0;
    }

    if (panelOn !== powered) {
      panelOn = powered;
      panelTex.set(powered);
    }

    const mode = !powered ? 'off' : (status.table ? 'done' : 'ready');
    if (mode !== terminalMode) {
      terminalMode = mode;
      screenTex.set(mode);
    }

    const unlocked = [status.table, status.safe, status.lock];
    const opened = [];
    doorStates.forEach(function (state, i) {
      if (unlocked[i] && !state.unlocked) {
        opened.push(i);
      }
      state.unlocked = unlocked[i];
      state.target = unlocked[i] ? 1 : 0;
      state.lampMat.emissive.setHex(unlocked[i] ? 0x4dff9a : 0xff5c7a);
      if (instant) {
        state.open = state.target;
      }
    });
    return opened;
  }

  function update(dt) {
    if (flicker > 0) {
      flicker -= dt;
      flickerClock -= dt;
      if (flickerClock <= 0) {
        flickerClock = 0.07;
        setLevel(Math.random() > 0.45 ? 1 : 0.15);
      }
      if (flicker <= 0) {
        setLevel(1);
      }
    }
    doorStates.forEach(function (state) {
      if (state.open !== state.target) {
        const step = dt * 1.1;
        state.open = state.open < state.target
          ? Math.min(state.target, state.open + step)
          : Math.max(state.target, state.open - step);
      }
      state.group.position.y = DOOR_H / 2 + state.open * (DOOR_H - 0.05);
      state.group.visible = state.open < 0.999;
      state.collider.disabled = state.open > 0.8;
    });
  }

  function doorOpenAmount(index) {
    return doorStates[index].open;
  }

  function isDoorUnlocked(index) {
    return doorStates[index].unlocked;
  }

  return {
    scene: scene,
    pickables: pickables,
    colliders: colliders,
    apply: apply,
    update: update,
    doorOpenAmount: doorOpenAmount,
    isDoorUnlocked: isDoorUnlocked
  };
}
