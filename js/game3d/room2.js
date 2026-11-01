import * as THREE from '../../vendor/three.module.min.js';
import { HALF, rooms, room2 } from './level.js';
import * as tex from './textures.js';
import { addGlow, addBlob, createDust } from './effects.js';

export function buildRoom2(ctx) {
  const scene = ctx.scene;
  const kit = ctx.kit;
  const tag = ctx.tag;
  const frameMat = ctx.frameMat;
  const pipeMat = ctx.pipeMat;
  const room = rooms[1];

  const boardInfo = { room: 2, action: 'rules', label: 'Quadro de regras' };
  const boardFrameMat = kit.material(0x0a1220, { metalness: 0.5, roughness: 0.4 });
  const b = room2.board;
  tag(kit.box(0.04, b.h + 0.16, b.w + 0.16, boardFrameMat, -HALF + 0.02, b.y, b.z), boardInfo);
  tag(kit.box(0.1, 0.04, b.w, boardFrameMat, -HALF + 0.05, b.y - b.h / 2 - 0.1, b.z), boardInfo);
  tag(kit.sign(tex.rulesTexture(), b.w, b.h, -HALF + 0.042, b.y, b.z, Math.PI / 2), boardInfo);
  addGlow(scene, 0xffb347, -HALF + 0.6, b.y, b.z, 3.4, 0.12);

  const s = room2.suspects;
  kit.box(0.04, s.h + 0.16, s.w + 0.16, boardFrameMat, HALF - 0.02, s.y, s.z);
  kit.sign(tex.suspectsTexture(), s.w, s.h, HALF - 0.042, s.y, s.z, -Math.PI / 2);
  addGlow(scene, 0xff5c7a, HALF - 0.6, s.y, s.z, 3.2, 0.08);

  const d = room2.desk;
  const topMat = kit.material(0x3a2e24, { metalness: 0.15, roughness: 0.55 });
  const bodyMat = kit.material(0x241b14, { metalness: 0.2, roughness: 0.6 });
  kit.box(d.w, 0.05, d.d, topMat, d.x, d.h - 0.025, d.z);
  [-1, 1].forEach(function (sx) {
    [-1, 1].forEach(function (sz) {
      kit.box(0.06, d.h - 0.05, 0.06, bodyMat, d.x + sx * (d.w / 2 - 0.06), (d.h - 0.05) / 2, d.z + sz * (d.d / 2 - 0.06));
    });
  });
  kit.box(0.03, 0.4, d.d - 0.2, bodyMat, d.x - d.w / 2 + 0.06, 0.55, d.z);
  const pedestalZ = d.z - 0.55;
  kit.box(0.7, 0.55, 0.55, bodyMat, d.x, 0.33, pedestalZ);
  const drawerInfo = { room: 2, action: 'drawer', label: 'Gaveta' };
  const drawerFrontMat = kit.material(0x4a3a2c, { metalness: 0.2, roughness: 0.5 });
  const chrome = kit.material(0xaab6cc, { metalness: 0.8, roughness: 0.3 });
  tag(kit.box(0.02, 0.2, 0.46, drawerFrontMat, d.x + 0.36, 0.5, pedestalZ), drawerInfo);
  tag(kit.box(0.025, 0.03, 0.18, chrome, d.x + 0.38, 0.5, pedestalZ), drawerInfo);
  kit.box(0.02, 0.2, 0.46, drawerFrontMat, d.x + 0.36, 0.26, pedestalZ);
  kit.box(0.025, 0.03, 0.18, chrome, d.x + 0.38, 0.26, pedestalZ);

  const diaryInfo = { room: 2, action: 'diary', label: 'Diário do investigador' };
  const bookX = d.x - 0.05;
  const bookZ = d.z + 0.2;
  tag(kit.box(0.32, 0.025, 0.5, kit.material(0x5a1d1d, { roughness: 0.7 }), bookX, d.h + 0.0125, bookZ), diaryInfo);
  const page = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.3),
    new THREE.MeshStandardMaterial({ map: tex.diaryTexture(), roughness: 0.8 })
  );
  page.rotation.order = 'YXZ';
  page.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  page.position.set(bookX, d.h + 0.027, bookZ);
  scene.add(page);
  tag(page, diaryInfo);
  ctx.pickables.push(page);

  kit.cylinder(0.04, 0.035, 0.09, kit.material(0x3d6a8a, { roughness: 0.5 }), d.x + 0.2, d.h + 0.045, d.z - 0.35);
  const paper = kit.box(0.2, 0.004, 0.28, kit.material(0xd9d4c0), d.x + 0.05, d.h + 0.002, d.z - 0.1, undefined, { pick: false });
  paper.rotation.y = 0.35;

  const lampX = d.x - 0.2;
  const lampZ = d.z + 0.7;
  const lampMetal = kit.material(0x1a1f2b, { metalness: 0.6, roughness: 0.4 });
  kit.cylinder(0.09, 0.1, 0.02, lampMetal, lampX, d.h + 0.01, lampZ);
  const arm = kit.box(0.025, 0.4, 0.025, lampMetal, lampX, d.h + 0.22, lampZ, undefined, { pick: false });
  arm.rotation.z = 0.2;
  kit.cylinder(0.04, 0.11, 0.12, kit.material(0x2a2f3d, { emissive: 0xffc27a, emissiveIntensity: 1.4 }), lampX - 0.04, d.h + 0.47, lampZ, { cast: false });
  const lampLight = new THREE.PointLight(0xffc27a, 5, 0, 2);
  lampLight.position.set(lampX - 0.04, d.h + 0.4, lampZ);
  scene.add(lampLight);
  addGlow(scene, 0xffc27a, lampX - 0.04, d.h + 0.4, lampZ, 1.3, 0.55);
  addBlob(scene, d.x, d.z, d.w + 0.7, d.d + 0.7, 0.5);

  const c = room2.chair;
  kit.chair(c.x, c.z, 1, 0);
  addBlob(scene, c.x, c.z, 0.95, 0.95, 0.55);

  const sf = room2.safe;
  const safeInfo = { room: 2, action: 'safe', label: 'Cofre' };
  const steel = kit.material(0x2b3548, { metalness: 0.7, roughness: 0.4 });
  const frontX = sf.x - sf.w / 2;
  tag(kit.box(0.05, sf.h, sf.d, steel, sf.x + sf.w / 2 - 0.025, sf.h / 2, sf.z), safeInfo);
  [-1, 1].forEach(function (side) {
    tag(kit.box(sf.w, sf.h, 0.08, steel, sf.x, sf.h / 2, sf.z + side * (sf.d / 2 - 0.04)), safeInfo);
  });
  tag(kit.box(sf.w, 0.08, sf.d, steel, sf.x, sf.h - 0.04, sf.z), safeInfo);
  tag(kit.box(sf.w, 0.08, sf.d, steel, sf.x, 0.04, sf.z), safeInfo);
  kit.box(sf.w - 0.1, 0.02, sf.d - 0.16, kit.material(0x0a0f18, { roughness: 0.9 }), sf.x, 0.09, sf.z, undefined, { pick: false });
  const keyMat = kit.material(0x050505, { emissive: 0xffb347, emissiveIntensity: 2 });
  kit.box(0.16, 0.03, 0.05, keyMat, sf.x + 0.05, 0.15, sf.z, undefined, { pick: false, cast: false });
  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 16), keyMat);
  keyRing.rotation.x = Math.PI / 2;
  keyRing.position.set(sf.x - 0.06, 0.15, sf.z);
  scene.add(keyRing);
  const keyGlow = addGlow(scene, 0xffb347, sf.x, 0.3, sf.z, 0.8, 0);
  const safeLight = new THREE.PointLight(0x4dff9a, 0, 0, 2);
  safeLight.position.set(sf.x - 0.1, 0.8, sf.z);
  scene.add(safeLight);

  const hinge = new THREE.Group();
  hinge.position.set(frontX, 0, sf.z + sf.d / 2 - 0.08);
  scene.add(hinge);
  const doorW = sf.d - 0.16;
  tag(kit.box(0.1, sf.h - 0.08, doorW, steel, 0.05, sf.h / 2, -doorW / 2, hinge), safeInfo);
  const safeTex = tex.safeTexture();
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW * 0.94, (sf.h - 0.08) * 0.94),
    new THREE.MeshStandardMaterial({ map: safeTex.texture, emissiveMap: safeTex.texture, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.4 })
  );
  face.rotation.y = -Math.PI / 2;
  face.position.set(-0.003, sf.h / 2, -doorW / 2);
  hinge.add(face);
  tag(face, safeInfo);
  ctx.pickables.push(face);
  tag(kit.box(0.06, 0.34, 0.05, chrome, -0.03, sf.h / 2 + 0.05, -doorW + 0.12, hinge), safeInfo);
  const displayGlow = addGlow(scene, 0xff5c7a, frontX - 0.2, 1.05, sf.z, 0.9, 0.5);
  addBlob(scene, sf.x - 0.2, sf.z, sf.w + 0.8, sf.d + 0.8, 0.5);

  const cab = room2.cabinet;
  const cabMat = kit.material(0x2d3646, { metalness: 0.5, roughness: 0.5 });
  kit.box(cab.w, cab.h, cab.d, cabMat, cab.x, cab.h / 2, cab.z);
  for (let k = 0; k < 4; k++) {
    kit.box(0.02, 0.34, cab.d - 0.1, kit.material(0x3a4560, { metalness: 0.5, roughness: 0.45 }), cab.x - cab.w / 2 - 0.005, 0.25 + k * 0.38, cab.z);
    kit.box(0.025, 0.03, 0.2, chrome, cab.x - cab.w / 2 - 0.02, 0.32 + k * 0.38, cab.z);
  }
  addBlob(scene, cab.x, cab.z, cab.w + 0.7, cab.d + 0.7, 0.5);

  const cr = room2.crate;
  const crateMat = kit.material(0x3a3f4a, { metalness: 0.4, roughness: 0.65 });
  kit.box(cr.w, cr.h, cr.d, crateMat, cr.x, cr.h / 2, cr.z);
  [0.2, 0.7].forEach(function (y) {
    kit.box(cr.w + 0.02, 0.06, cr.d + 0.02, pipeMat, cr.x, y, cr.z, undefined, { pick: false });
  });
  const small = kit.box(0.5, 0.4, 0.5, crateMat, cr.x - 0.1, cr.h + 0.2, cr.z + 0.05, undefined, { pick: false });
  small.rotation.y = 0.4;
  addBlob(scene, cr.x, cr.z, cr.w + 0.7, cr.d + 0.7, 0.5);

  const dust = createDust(scene, {
    x0: -HALF + 0.4, x1: HALF - 0.4,
    y0: 0.2, y1: 3,
    z0: room.zMin + 0.4, z1: room.zMax - 0.4
  }, 100);
  dust.setOpacity(0.4);

  const state = { open: 0, target: 0, opened: false };

  function apply(status, instant) {
    state.target = status.safe ? 1 : 0;
    if (instant) {
      state.open = state.target;
    }
    if (state.opened !== status.safe) {
      state.opened = status.safe;
      safeTex.set(status.safe);
    }
    const color = status.safe ? 0x4dff9a : 0xff5c7a;
    displayGlow.material.color.setHex(color);
    keyGlow.material.opacity = status.safe ? 0.8 : 0;
  }

  function update(dt, clock) {
    if (state.open !== state.target) {
      const step = dt * 0.9;
      state.open = state.open < state.target
        ? Math.min(state.target, state.open + step)
        : Math.max(state.target, state.open - step);
    }
    hinge.rotation.y = state.open * 1.8;
    safeLight.intensity = 4 * state.open;
    dust.update(clock, dt);
  }

  return { apply: apply, update: update };
}
