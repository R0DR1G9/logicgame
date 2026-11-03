import * as THREE from '../../vendor/three.module.min.js';
import { HALF, rooms, room4 } from './level.js';
import * as tex from './textures.js';
import { addGlow, addBlob, createDust } from './effects.js';

const CLOSED = 2.2;
const OPEN = 1.0;

export function buildRoom4(ctx) {
  const scene = ctx.scene;
  const kit = ctx.kit;
  const tag = ctx.tag;
  const room = rooms[3];
  const chrome = kit.material(0xaab6cc, { metalness: 0.8, roughness: 0.3 });
  const steel = kit.material(0x2b3548, { metalness: 0.7, roughness: 0.4 });
  const frameMat = kit.material(0x0a1220, { metalness: 0.5, roughness: 0.4 });

  const lawsInfo = { room: 4, action: 'laws', label: 'Leis de equivalência' };
  const lb = room4.laws;
  tag(kit.box(0.04, lb.h + 0.16, lb.w + 0.16, frameMat, -HALF + 0.02, lb.y, lb.z), lawsInfo);
  tag(kit.box(0.1, 0.04, lb.w, frameMat, -HALF + 0.05, lb.y - lb.h / 2 - 0.1, lb.z), lawsInfo);
  tag(kit.sign(tex.lawsTexture(), lb.w, lb.h, -HALF + 0.042, lb.y, lb.z, Math.PI / 2), lawsInfo);
  addGlow(scene, 0xff5c7a, -HALF + 0.6, lb.y, lb.z, 3.4, 0.1);

  const premInfo = { room: 4, action: 'premises', label: 'Registro do reator' };
  const pb = room4.premises;
  const premTex = tex.premisesTexture();
  tag(kit.box(0.04, pb.h + 0.16, pb.w + 0.16, frameMat, HALF - 0.02, pb.y, pb.z), premInfo);
  tag(kit.box(0.1, 0.04, pb.w, frameMat, HALF - 0.05, pb.y - pb.h / 2 - 0.1, pb.z), premInfo);
  tag(kit.sign(premTex.texture, pb.w, pb.h, HALF - 0.042, pb.y, pb.z, -Math.PI / 2), premInfo);
  addGlow(scene, 0xffb347, HALF - 0.6, pb.y, pb.z, 3.4, 0.1);

  const v = room4.valves;
  const valvesInfo = { room: 4, action: 'valves', label: 'Painel de válvulas' };
  const frontX = v.x - v.w / 2;
  tag(kit.box(v.w, v.h, v.d, steel, v.x, v.h / 2, v.z), valvesInfo);
  tag(kit.sign(tex.valvesFaceTexture(), v.d, v.h, frontX - 0.004, v.h / 2, v.z, -Math.PI / 2), valvesInfo);
  const levers = [];
  for (let i = 0; i < 6; i++) {
    const cx = 130 + (i % 3) * 230;
    const cy = 235 + Math.floor(i / 3) * 215;
    const z = v.z + (cx / 720 - 0.5) * v.d;
    const y = v.h - cy / 640 * v.h;
    kit.cylinder(0.055, 0.055, 0.05, chrome, frontX - 0.02, y, z, { rz: Math.PI / 2 });
    const pivot = new THREE.Group();
    pivot.position.set(frontX - 0.03, y, z);
    pivot.rotation.z = CLOSED;
    scene.add(pivot);
    tag(kit.box(0.03, 0.22, 0.03, chrome, 0, 0.11, 0, pivot), valvesInfo);
    const knobMat = kit.material(0x050505, { emissive: 0xff5c7a, emissiveIntensity: 1.5 });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), knobMat);
    knob.position.set(0, 0.24, 0);
    pivot.add(knob);
    tag(knob, valvesInfo);
    ctx.pickables.push(knob);
    levers.push({ pivot: pivot, knobMat: knobMat, angle: CLOSED, target: CLOSED });
  }
  addGlow(scene, 0xff5c7a, frontX - 0.5, v.h / 2, v.z, 2.6, 0.14);
  addBlob(scene, v.x - 0.2, v.z, v.w + 0.8, v.d + 0.8, 0.5);

  const c = room4.core;
  const coreGroup = new THREE.Group();
  coreGroup.position.set(c.x, 0, c.z);
  scene.add(coreGroup);
  kit.cylinder(0.55, 0.6, 0.25, steel, c.x, 0.125, c.z);
  const coreMat = kit.material(0x120608, { emissive: 0xff5c7a, emissiveIntensity: 1.4 });
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.6, 20), coreMat);
  inner.position.y = 1.05;
  coreGroup.add(inner);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 1.9, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.18, roughness: 0.1, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false })
  );
  glass.position.y = 1.2;
  coreGroup.add(glass);
  [0.45, 1.2, 1.95].forEach(function (y) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 28), chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    coreGroup.add(ring);
  });
  kit.cylinder(0.45, 0.45, 0.15, steel, c.x, 2.17, c.z);
  kit.cylinder(0.09, 0.09, 3.2 - 2.25, steel, c.x, (3.2 + 2.25) / 2, c.z);
  const coreLight = new THREE.PointLight(0xff5c7a, 7, 0, 2);
  coreLight.position.set(c.x, 1.2, c.z);
  scene.add(coreLight);
  const coreGlow = addGlow(scene, 0xff5c7a, c.x, 1.2, c.z, 2.8, 0.4);
  addBlob(scene, c.x, c.z, 1.9, 1.9, 0.55);

  const d = room4.desk;
  const oracleInfo = { room: 4, action: 'oracle', label: 'Oráculo' };
  const deskTopMat = kit.material(0x2a3a55, { metalness: 0.35, roughness: 0.45 });
  const deskBodyMat = kit.material(0x182235, { metalness: 0.3, roughness: 0.6 });
  tag(kit.box(d.w, 0.05, d.d, deskTopMat, d.x, d.h - 0.025, d.z), oracleInfo);
  [-1, 1].forEach(function (side) {
    tag(kit.box(0.05, d.h - 0.05, d.d - 0.06, deskBodyMat, d.x + side * (d.w / 2 - 0.03), (d.h - 0.05) / 2, d.z), oracleInfo);
  });
  tag(kit.box(d.w - 0.1, 0.45, 0.03, deskBodyMat, d.x, 0.52, d.z - d.d / 2 + 0.04), oracleInfo);
  const monitorMat = kit.material(0x0d121c, { metalness: 0.4, roughness: 0.4 });
  tag(kit.box(1.0, 0.62, 0.06, monitorMat, d.x, 1.3, d.z - 0.1), oracleInfo);
  tag(kit.box(0.1, 0.3, 0.06, monitorMat, d.x, 0.95, d.z - 0.12), oracleInfo);
  tag(kit.box(0.4, 0.03, 0.25, monitorMat, d.x, d.h + 0.015, d.z - 0.1), oracleInfo);
  tag(kit.box(0.6, 0.025, 0.2, monitorMat, d.x, d.h + 0.0125, d.z + 0.2), oracleInfo);
  const oracleTex = tex.oracleTexture();
  tag(kit.sign(oracleTex.texture, 0.92, 0.54, d.x, 1.3, d.z - 0.1 + 0.035, 0), oracleInfo);
  const oracleGlow = addGlow(scene, 0xff5c7a, d.x, 1.3, d.z + 0.3, 2.2, 0);
  addBlob(scene, d.x, d.z, d.w + 0.7, d.d + 0.7, 0.5);
  kit.chair(room4.chair.x, room4.chair.z, 0, 1);
  addBlob(scene, room4.chair.x, room4.chair.z, 0.95, 0.95, 0.55);

  const dust = createDust(scene, {
    x0: -HALF + 0.4, x1: HALF - 0.4,
    y0: 0.2, y1: 3,
    z0: room.zMin + 0.4, z1: room.zMax - 0.4
  }, 100);
  dust.setOpacity(0.4);

  const flags = { valves: false, equiv: false };
  let oracleMode = 'locked';

  function puzzle() {
    return window.LogicGame.puzzle && window.LogicGame.puzzle.r4;
  }

  function colorAll(solved) {
    const hex = solved ? 0x4dff9a : 0xff5c7a;
    levers.forEach(function (lever) {
      lever.knobMat.emissive.setHex(hex);
    });
    coreMat.emissive.setHex(hex);
    coreLight.color.setHex(hex);
    coreGlow.material.color.setHex(hex);
  }

  function apply(status, instant) {
    flags.valves = status.valves;
    flags.equiv = status.equiv;
    const p = puzzle();
    levers.forEach(function (lever, i) {
      const open = Boolean(p) && status.valves && p.valves.solution[p.valves.names[i]];
      lever.target = open ? OPEN : CLOSED;
      if (instant) {
        lever.angle = lever.target;
      }
    });
    colorAll(status.valves);
    const mode = !status.valves ? 'locked' : (status.equiv ? 'done' : 'ready');
    if (mode !== oracleMode) {
      oracleMode = mode;
      oracleTex.set(mode);
    }
    oracleGlow.material.color.setHex(mode === 'done' ? 0x4dff9a : 0xff5c7a);
    oracleGlow.material.opacity = mode === 'locked' ? 0 : 0.22;
  }

  function update(dt, clock) {
    levers.forEach(function (lever) {
      const diff = lever.target - lever.angle;
      lever.angle += Math.sign(diff) * Math.min(Math.abs(diff), dt * 3);
      lever.pivot.rotation.z = lever.angle;
    });
    const pulse = 1.2 + 0.5 * Math.sin(clock * (flags.valves ? 1.5 : 4));
    coreMat.emissiveIntensity = pulse;
    coreLight.intensity = 5 + 2 * Math.sin(clock * (flags.valves ? 1.5 : 4));
    dust.update(clock, dt);
  }

  function refresh() {
    premTex.set();
    oracleTex.set(oracleMode);
  }

  return { apply: apply, update: update, refresh: refresh };
}
