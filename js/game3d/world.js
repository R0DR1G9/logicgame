import * as THREE from '../../vendor/three.module.min.js';
import {
  WALL, HEIGHT, WIDTH, DEPTH, HALF, DOOR_W, DOOR_H,
  rooms, doors, room1, buildColliders
} from './level.js';
import * as tex from './textures.js';
import { surface } from './materials.js';
import { createKit } from './kit.js';
import { addGlow, addBlob, addEdgeShade, createDust } from './effects.js';

const ACCENTS = [0x3de0ff, 0xffb347, 0x4dff9a];
const ACCENT_CSS = ['#3de0ff', '#ffb347', '#4dff9a'];
const WALL_BODY = [0x1c2b47, 0x2c2340, 0x173631];
const WALL_TINTS = [0x8fa8d6, 0xa592d6, 0x86c4ad];
const FLOOR_TINTS = [0xc9d3e6, 0xd9cbf0, 0xc6eadb];
const DOOR_LABELS = ['NÍVEL 2', 'NÍVEL 3', 'SAÍDA'];
const SOLID_LIGHT = 52;
const LED_COLORS = [0x4dff9a, 0xffb347, 0xff5c7a, 0x3de0ff];

export function buildWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03060c);
  scene.fog = new THREE.FogExp2(0x050a14, 0.03);

  const pickables = [];
  const colliders = buildColliders();
  const kit = createKit(scene, pickables);
  const hemisphere = new THREE.HemisphereLight(0x9fb8ff, 0x141b2d, 0.4);
  scene.add(hemisphere);

  const glows = [];
  const leds = [];
  const stripMats = [];
  const fixtureMats = [];
  const room1Lights = [];
  const shadowLights = [];

  function tag(mesh, info) {
    mesh.userData.interact = info;
    return mesh;
  }

  function clad(kind, w, h, x, y, z, rotationY, tint, options) {
    const o = options || {};
    const mat = surface(kind, w / 2, h / 2, tint, o);
    return kit.decal(mat, w, h, x, y, z, 0, rotationY);
  }

  function wallFace(z, rotationY, tint) {
    const sideW = HALF - DOOR_W / 2;
    const sideX = DOOR_W / 2 + sideW / 2;
    clad('wall', sideW, HEIGHT, -sideX, HEIGHT / 2, z, rotationY, tint);
    clad('wall', sideW, HEIGHT, sideX, HEIGHT / 2, z, rotationY, tint);
    clad('wall', DOOR_W, HEIGHT - DOOR_H, 0, DOOR_H + (HEIGHT - DOOR_H) / 2, z, rotationY, tint);
  }

  const frameMat = kit.material(0x28344f, { metalness: 0.6, roughness: 0.45 });
  const pipeMat = kit.material(0x3a4660, { metalness: 0.7, roughness: 0.4 });
  const cableMat = kit.material(0x07090e, { roughness: 0.6 });
  const hazardMat = surface('hazard', 4, 1, 0xffffff, { roughness: 0.7, metalness: 0.1 });

  rooms.forEach(function (room, i) {
    const cz = (room.zMin + room.zMax) / 2;
    const bodyMat = kit.material(WALL_BODY[i]);
    const tint = WALL_TINTS[i];

    const floor = kit.decal(
      surface('floor', WIDTH / 2, DEPTH / 2, FLOOR_TINTS[i], { roughness: 0.6, metalness: 0.3, bumpScale: 3 }),
      WIDTH, DEPTH, 0, 0, cz, -Math.PI / 2, 0
    );
    floor.receiveShadow = true;
    kit.decal(surface('ceiling', WIDTH / 2, DEPTH / 2, 0x7d889e, { roughness: 0.8, metalness: 0.2 }), WIDTH, DEPTH, 0, HEIGHT - 0.001, cz, Math.PI / 2, 0);

    kit.box(WALL, HEIGHT, DEPTH, bodyMat, -HALF - WALL / 2, HEIGHT / 2, cz);
    kit.box(WALL, HEIGHT, DEPTH, bodyMat, HALF + WALL / 2, HEIGHT / 2, cz);
    clad('wall', DEPTH, HEIGHT, -HALF + 0.001, HEIGHT / 2, cz, Math.PI / 2, tint);
    clad('wall', DEPTH, HEIGHT, HALF - 0.001, HEIGHT / 2, cz, -Math.PI / 2, tint);

    const farZ = room.zMin - WALL / 2;
    const sideW = HALF + WALL - DOOR_W / 2;
    const sideX = DOOR_W / 2 + sideW / 2;
    kit.box(sideW, HEIGHT, WALL, bodyMat, -sideX, HEIGHT / 2, farZ);
    kit.box(sideW, HEIGHT, WALL, bodyMat, sideX, HEIGHT / 2, farZ);
    kit.box(DOOR_W, HEIGHT - DOOR_H, WALL, bodyMat, 0, DOOR_H + (HEIGHT - DOOR_H) / 2, farZ);
    wallFace(room.zMin + 0.001, 0, tint);
    if (i < 2) {
      wallFace(room.zMin - WALL - 0.001, Math.PI, WALL_TINTS[i + 1]);
    }

    addEdgeShade(scene, -HALF + 0.004, 0.4, cz, DEPTH, 0.8, Math.PI / 2, false);
    addEdgeShade(scene, HALF - 0.004, 0.4, cz, DEPTH, 0.8, -Math.PI / 2, false);
    addEdgeShade(scene, -HALF + 0.004, HEIGHT - 0.4, cz, DEPTH, 0.8, Math.PI / 2, true);
    addEdgeShade(scene, HALF - 0.004, HEIGHT - 0.4, cz, DEPTH, 0.8, -Math.PI / 2, true);
    addEdgeShade(scene, 0, 0.4, room.zMin + 0.004, WIDTH, 0.8, 0, false);

    const mats = [];
    [-1, 1].forEach(function (side) {
      const stripMat = kit.material(0x0a1220, { emissive: ACCENTS[i], emissiveIntensity: i === 0 ? 0.25 : 0.9 });
      mats.push(stripMat);
      kit.box(0.05, 0.08, DEPTH, stripMat, side * (HALF - 0.025), 0.14, cz, undefined, { pick: false });
    });
    if (i === 0) {
      mats.forEach(function (m) {
        stripMats.push(m);
      });
    }

    [-1.9, 1.9].forEach(function (offset) {
      const fixtureMat = kit.material(0x1a2336, { emissive: 0xdfeaff, emissiveIntensity: i === 0 ? 0 : 1.2 });
      if (i === 0) {
        fixtureMats.push(fixtureMat);
      }
      kit.box(1.8, 0.06, 0.4, kit.material(0x141c2c, { metalness: 0.5 }), 0, HEIGHT - 0.03, cz + offset, undefined, { pick: false });
      kit.box(1.6, 0.02, 0.26, fixtureMat, 0, HEIGHT - 0.07, cz + offset, undefined, { pick: false, cast: false });
      const glow = addGlow(scene, 0xcfe0ff, 0, HEIGHT - 0.6, cz + offset, 3, i === 0 ? 0 : 0.22);
      glows.push({ sprite: glow, base: 0.22, scaled: i === 0 });
      if (i > 0) {
        const light = new THREE.PointLight(0xdfeaff, SOLID_LIGHT, 0, 2);
        light.position.set(0, HEIGHT - 0.4, cz + offset);
        scene.add(light);
      }
    });

    [-1, 1].forEach(function (side) {
      const x = side * (HALF - 0.35);
      kit.tube([[x, HEIGHT - 0.3, room.zMax - 0.1], [x, HEIGHT - 0.3, cz], [x, HEIGHT - 0.3, room.zMin + 0.1]], 0.07, pipeMat);
      kit.tube([[x - side * 0.2, HEIGHT - 0.22, room.zMax - 0.1], [x - side * 0.2, HEIGHT - 0.22, cz], [x - side * 0.2, HEIGHT - 0.22, room.zMin + 0.1]], 0.04, pipeMat);
      for (let b = 0; b < 5; b++) {
        kit.box(0.06, 0.3, 0.06, pipeMat, x - side * 0.1, HEIGHT - 0.15, room.zMax - 0.8 - b * 1.6, undefined, { pick: false });
      }
    });

    kit.tube([[-HALF + 0.06, 2.95, room.zMax - 0.4], [-HALF + 0.06, 2.55, cz], [-HALF + 0.06, 2.95, room.zMin + 0.4]], 0.022, cableMat);
    kit.tube([[-HALF + 0.09, 2.9, room.zMax - 0.4], [-HALF + 0.09, 2.45, cz + 0.4], [-HALF + 0.09, 2.9, room.zMin + 0.4]], 0.018, cableMat);

    kit.decal(surface('vent', 1, 1, 0xffffff, { roughness: 0.5, metalness: 0.4 }), 0.9, 0.9, -2.6, 2.3, room.zMin + 0.004, 0, 0);
  });

  kit.box(WIDTH + WALL * 2, HEIGHT, WALL, kit.material(WALL_BODY[0]), 0, HEIGHT / 2, rooms[0].zMax + WALL / 2).name = 'near-wall';
  clad('wall', WIDTH, HEIGHT, 0, HEIGHT / 2, rooms[0].zMax - 0.001, Math.PI, WALL_TINTS[0]);
  kit.box(WIDTH + WALL * 2, 0.2, rooms[0].zMax - rooms[2].zMin + WALL * 2, kit.material(0x0b1220), 0, HEIGHT + 0.1, (rooms[0].zMax + rooms[2].zMin) / 2);

  const cz1 = (rooms[0].zMin + rooms[0].zMax) / 2;
  [-1.9, 1.9].forEach(function (offset) {
    const light = new THREE.PointLight(0xdfeaff, 0, 0, 2);
    light.position.set(0, HEIGHT - 0.4, cz1 + offset);
    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = -0.002;
    light.shadow.normalBias = 0.03;
    scene.add(light);
    room1Lights.push(light);
    if (offset < 0) {
      shadowLights.push(light);
    }
  });
  const emergency = new THREE.PointLight(0xff9a3c, 9, 0, 2);
  emergency.position.set(HALF - 1.2, 2.3, room1.panel.z);
  scene.add(emergency);

  const dust = createDust(scene, {
    x0: -HALF + 0.4, x1: HALF - 0.4,
    y0: 0.2, y1: HEIGHT - 0.3,
    z0: rooms[0].zMin + 0.4, z1: rooms[0].zMax - 0.4
  }, 140);

  const note = kit.sign(tex.noteTexture(), room1.note.w, room1.note.h, room1.note.x, room1.note.y, room1.note.z, Math.PI / 2);
  tag(note, { room: 1, action: 'note', label: 'Bilhete na parede' });

  const b = room1.board;
  const boardInfo = { room: 1, action: 'board', label: 'Quadro de conectivos' };
  const boardFrameMat = kit.material(0x0a1220, { metalness: 0.5, roughness: 0.4 });
  tag(kit.box(0.04, b.h + 0.16, b.w + 0.16, boardFrameMat, -HALF + 0.02, b.y, b.z), boardInfo);
  tag(kit.box(0.1, 0.04, b.w, boardFrameMat, -HALF + 0.05, b.y - b.h / 2 - 0.1, b.z), boardInfo);
  tag(kit.sign(tex.boardTexture(), b.w, b.h, -HALF + 0.042, b.y, b.z, Math.PI / 2), boardInfo);
  addGlow(scene, 0x3de0ff, -HALF + 0.6, b.y, b.z, 3.4, 0.12);

  const p = room1.panel;
  const panelInfo = { room: 1, action: 'panel', label: 'Painel de energia' };
  const panelBodyMat = kit.material(0x241a0e, { metalness: 0.4, roughness: 0.5 });
  tag(kit.box(p.d, p.h, p.w, panelBodyMat, p.x, p.y, p.z), panelInfo);
  tag(kit.box(p.d + 0.04, 0.06, p.w + 0.04, frameMat, p.x, p.y + p.h / 2 + 0.03, p.z), panelInfo);
  tag(kit.box(p.d + 0.04, 0.06, p.w + 0.04, frameMat, p.x, p.y - p.h / 2 - 0.03, p.z), panelInfo);
  const panelTex = tex.panelTexture();
  tag(kit.sign(panelTex.texture, p.w - 0.1, p.h - 0.1, p.x - p.d / 2 - 0.005, p.y, p.z, -Math.PI / 2), panelInfo);
  [-0.3, 0.3].forEach(function (offset) {
    kit.cylinder(0.05, 0.05, HEIGHT - (p.y + p.h / 2 + 0.06), pipeMat, p.x, (HEIGHT + p.y + p.h / 2 + 0.06) / 2, p.z + offset);
  });
  const panelGlow = addGlow(scene, 0xff5c7a, p.x - 0.4, p.y, p.z, 2.4, 0.3);
  addBlob(scene, p.x - 0.25, p.z, 0.8, p.w + 0.6, 0.4);

  const d = room1.desk;
  const deskInfo = { room: 1, action: 'terminal', label: 'Terminal' };
  const deskTopMat = kit.material(0x2a3a55, { metalness: 0.35, roughness: 0.45 });
  const deskBodyMat = kit.material(0x182235, { metalness: 0.3, roughness: 0.6 });
  tag(kit.box(d.w, 0.05, d.d, deskTopMat, d.x, d.h - 0.025, d.z), deskInfo);
  [-1, 1].forEach(function (side) {
    tag(kit.box(0.05, d.h - 0.05, d.d - 0.06, deskBodyMat, d.x + side * (d.w / 2 - 0.03), (d.h - 0.05) / 2, d.z), deskInfo);
  });
  tag(kit.box(d.w - 0.1, 0.45, 0.03, deskBodyMat, d.x, 0.52, d.z - d.d / 2 + 0.04), deskInfo);
  tag(kit.box(0.5, 0.55, d.d - 0.12, deskBodyMat, d.x + d.w / 2 - 0.3, 0.33, d.z), deskInfo);
  tag(kit.box(0.46, 0.012, 0.02, kit.material(0x3de0ff, { emissive: 0x3de0ff, emissiveIntensity: 0.5 }), d.x + d.w / 2 - 0.3, 0.5, d.z + d.d / 2 - 0.05), deskInfo);

  const monitorMat = kit.material(0x0d121c, { metalness: 0.4, roughness: 0.4 });
  tag(kit.box(1.0, 0.62, 0.06, monitorMat, d.x, 1.3, d.z - 0.1), deskInfo);
  tag(kit.box(0.1, 0.3, 0.06, monitorMat, d.x, 0.95, d.z - 0.12), deskInfo);
  tag(kit.box(0.4, 0.03, 0.25, monitorMat, d.x, d.h + 0.015, d.z - 0.1), deskInfo);
  tag(kit.box(0.6, 0.025, 0.2, monitorMat, d.x, d.h + 0.0125, d.z + 0.2), deskInfo);
  tag(kit.box(0.54, 0.01, 0.14, kit.material(0x1d2a40, { emissive: 0x3de0ff, emissiveIntensity: 0.12 }), d.x, d.h + 0.03, d.z + 0.2), deskInfo);
  const screenTex = tex.screenTexture();
  tag(kit.sign(screenTex.texture, 0.92, 0.54, d.x, 1.3, d.z - 0.1 + 0.035, 0), deskInfo);
  const screenGlow = addGlow(scene, 0x3de0ff, d.x, 1.3, d.z + 0.3, 2.2, 0);
  kit.cylinder(0.04, 0.035, 0.09, kit.material(0xb5543c, { roughness: 0.5 }), d.x - 0.65, d.h + 0.045, d.z + 0.1);
  kit.box(0.21, 0.004, 0.29, kit.material(0xd9d4c0), d.x - 0.55, d.h + 0.002, d.z - 0.1, undefined, { pick: false });
  addBlob(scene, d.x, d.z, d.w + 0.7, d.d + 0.7, 0.5);

  const c = room1.chair;
  const chairMat = kit.material(0x1a2338, { metalness: 0.3, roughness: 0.7 });
  const chairOptions = { pick: false };
  kit.box(0.46, 0.07, 0.46, chairMat, c.x, 0.48, c.z, undefined, chairOptions);
  kit.box(0.44, 0.5, 0.06, chairMat, c.x, 0.8, c.z + 0.22, undefined, chairOptions);
  kit.cylinder(0.035, 0.035, 0.4, pipeMat, c.x, 0.25, c.z);
  for (let k = 0; k < 5; k++) {
    const leg = kit.box(0.34, 0.03, 0.05, pipeMat, c.x, 0.06, c.z, undefined, chairOptions);
    leg.rotation.y = k * (Math.PI * 2 / 5) + 0.3;
    leg.translateX(0.12);
  }
  addBlob(scene, c.x, c.z, 0.95, 0.95, 0.55);

  const rackMap = tex.rackTexture();
  const rackFaceMat = new THREE.MeshStandardMaterial({
    map: rackMap, emissiveMap: rackMap, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.6
  });
  const rackBodyMat = kit.material(0x10172a, { metalness: 0.45, roughness: 0.45 });
  room1.racks.forEach(function (rack, r) {
    kit.box(rack.w, rack.h, rack.d, rackBodyMat, rack.x, rack.h / 2, rack.z);
    kit.box(rack.w + 0.04, 0.04, rack.d + 0.04, frameMat, rack.x, rack.h + 0.02, rack.z, undefined, { pick: false });
    kit.decal(rackFaceMat, rack.d, rack.h, rack.x - rack.w / 2 - 0.004, rack.h / 2, rack.z, 0, -Math.PI / 2);
    for (let s = 0; s < 8; s++) {
      const y = rack.h - (14 + s * 61 + 26) / 512 * rack.h;
      [216, 196].forEach(function (px, n) {
        const color = LED_COLORS[(s + n + r * 2) % LED_COLORS.length];
        const mat = kit.material(0x050505, { emissive: color, emissiveIntensity: 1.6 });
        kit.box(0.012, 0.025, 0.025, mat, rack.x - rack.w / 2 - 0.01, y, rack.z + (px / 256 - 0.5) * rack.d, undefined, { pick: false, cast: false });
        leds.push({ mat: mat, phase: s * 1.7 + n * 3.1 + r, rate: 1.5 + ((s * 7 + n * 3 + r) % 5) * 0.9 });
      });
    }
    glows.push({ sprite: addGlow(scene, 0x3de0ff, rack.x - rack.w / 2 - 0.2, 1.1, rack.z, 1.9, 0.14), base: 0.14, scaled: true });
    addBlob(scene, rack.x, rack.z, rack.w + 0.7, rack.d + 0.7, 0.55);
  });

  const doorStates = doors.map(function (door, i) {
    const group = new THREE.Group();
    const zc = door.zFar + WALL / 2;
    group.position.set(0, DOOR_H / 2, zc);
    scene.add(group);
    const info = { door: i, label: i === 2 ? 'Porta de escape' : 'Porta' };

    const leafMat = kit.material(0x2a3a5a, { metalness: 0.55, roughness: 0.5 });
    const insetMat = kit.material(0x1c2840, { metalness: 0.5, roughness: 0.55 });
    tag(kit.box(DOOR_W - 0.04, DOOR_H, 0.2, leafMat, 0, 0, 0, group), info);
    [-1, 1].forEach(function (face) {
      tag(kit.box(DOOR_W - 0.4, DOOR_H - 0.5, 0.02, insetMat, 0, -0.1, face * 0.1, group), info);
    });
    tag(kit.box(0.5, 0.05, 0.05, kit.material(0xaab6cc, { metalness: 0.8, roughness: 0.3 }), 0, -0.25, 0.13, group), info);
    tag(kit.sign(tex.labelTexture(DOOR_LABELS[i], ACCENT_CSS[i]), 1.0, 0.31, 0, 0.55, 0.115, 0, group), info);

    const wallMid = door.zFar + WALL / 2;
    [-1, 1].forEach(function (side) {
      kit.box(0.12, DOOR_H + 0.14, WALL + 0.06, frameMat, side * (DOOR_W / 2 + 0.06), (DOOR_H + 0.14) / 2, wallMid, undefined, { pick: false });
    });
    kit.box(DOOR_W + 0.24, 0.14, WALL + 0.06, frameMat, 0, DOOR_H + 0.07, wallMid, undefined, { pick: false });
    const accentMat = kit.material(0x0a1220, { emissive: ACCENTS[i], emissiveIntensity: 1.1 });
    [door.zNear + 0.036, door.zFar - 0.036].forEach(function (z) {
      [-1, 1].forEach(function (side) {
        kit.box(0.025, DOOR_H, 0.012, accentMat, side * (DOOR_W / 2 + 0.02), DOOR_H / 2, z, undefined, { pick: false, cast: false });
      });
      kit.box(DOOR_W, 0.025, 0.012, accentMat, 0, DOOR_H + 0.02, z, undefined, { pick: false, cast: false });
    });

    kit.decal(hazardMat, DOOR_W, WALL, 0, 0.004, wallMid, -Math.PI / 2, 0);

    const lampMat = kit.material(0x050505, { emissive: 0xff5c7a, emissiveIntensity: 1.8 });
    kit.box(0.5, 0.1, 0.06, lampMat, 0, 2.74, door.zNear + 0.03, undefined, { pick: false, cast: false });
    const lampGlow = addGlow(scene, 0xff5c7a, 0, 2.74, door.zNear + 0.2, 1.1, 0.7);

    const keyX = -(DOOR_W / 2 + 0.55);
    tag(kit.box(0.26, 0.4, 0.04, kit.material(0x0c111b, { metalness: 0.6, roughness: 0.4 }), keyX, 1.35, door.zNear + 0.02), info);
    const keyMat = new THREE.MeshStandardMaterial({
      map: tex.keypadTexture(), emissiveMap: tex.keypadTexture(), emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.6
    });
    tag(kit.decal(keyMat, 0.22, 0.33, keyX, 1.35, door.zNear + 0.042, 0, 0), info);
    const keyLed = kit.material(0x050505, { emissive: 0xff5c7a, emissiveIntensity: 1.8 });
    kit.box(0.16, 0.03, 0.01, keyLed, keyX, 1.49, door.zNear + 0.046, undefined, { pick: false, cast: false });

    const exitLight = i === 2 ? new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4),
      new THREE.MeshBasicMaterial({ color: 0xd9fff0, fog: false })
    ) : null;
    if (exitLight) {
      exitLight.position.set(0, 1.6, door.zFar - 2.2);
      exitLight.visible = false;
      scene.add(exitLight);
    }

    return {
      group: group,
      lampMat: lampMat,
      lampGlow: lampGlow,
      keyLed: keyLed,
      exitLight: exitLight,
      collider: colliders.find(function (item) { return item.id === door.id; }),
      open: 0,
      target: 0,
      unlocked: false
    };
  });

  [1, 2].forEach(function (index) {
    const room = rooms[index];
    const cz = (room.zMin + room.zMax) / 2;
    kit.sign(tex.signTexture(['NÍVEL DE ACESSO ' + (index + 1), 'sala em construção'], ACCENT_CSS[index]), 2.6, 1.2, -HALF + 0.02, 1.8, cz, Math.PI / 2);
  });

  let powered = false;
  let flicker = 0;
  let flickerClock = 0;
  let level = 0;
  let clock = 0;
  let terminalMode = 'off';
  let panelOn = false;

  function setLevel(value) {
    level = value;
    hemisphere.intensity = 0.1 + 0.5 * value;
    room1Lights.forEach(function (light) {
      light.intensity = SOLID_LIGHT * value;
    });
    fixtureMats.forEach(function (mat) {
      mat.emissiveIntensity = 1.2 * value;
    });
    stripMats.forEach(function (mat) {
      mat.emissiveIntensity = 0.25 + 0.75 * value;
    });
    glows.forEach(function (glow) {
      if (glow.scaled) {
        glow.sprite.material.opacity = glow.base * value;
      }
    });
    dust.setOpacity(0.18 + 0.4 * value);
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
    panelGlow.material.color.setHex(powered ? 0x4dff9a : 0xff5c7a);

    const mode = !powered ? 'off' : (status.table ? 'done' : 'ready');
    if (mode !== terminalMode) {
      terminalMode = mode;
      screenTex.set(mode);
    }
    screenGlow.material.color.setHex(mode === 'done' ? 0x4dff9a : 0x3de0ff);
    screenGlow.material.opacity = mode === 'off' ? 0 : 0.22;

    const unlocked = [status.table, status.safe, status.lock];
    const opened = [];
    doorStates.forEach(function (state, i) {
      if (unlocked[i] && !state.unlocked) {
        opened.push(i);
      }
      state.unlocked = unlocked[i];
      state.target = unlocked[i] ? 1 : 0;
      const color = unlocked[i] ? 0x4dff9a : 0xff5c7a;
      state.lampMat.emissive.setHex(color);
      state.keyLed.emissive.setHex(color);
      state.lampGlow.material.color.setHex(color);
      if (instant) {
        state.open = state.target;
      }
    });
    return opened;
  }

  function update(dt) {
    clock += dt;
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
      if (state.exitLight) {
        state.exitLight.visible = state.open > 0.02;
      }
    });
    leds.forEach(function (led) {
      const on = Math.sin(clock * led.rate + led.phase) > 0.2;
      led.mat.emissiveIntensity = 0.1 + level * (on ? 2 : 0.35);
    });
    dust.update(clock, dt);
  }

  function setQuality(quality) {
    shadowLights.forEach(function (light) {
      light.castShadow = quality >= 2;
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
    setQuality: setQuality,
    doorOpenAmount: doorOpenAmount,
    isDoorUnlocked: isDoorUnlocked
  };
}
