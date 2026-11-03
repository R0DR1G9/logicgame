import * as THREE from '../../vendor/three.module.min.js';
import { HALF, rooms, room3 } from './level.js';
import * as tex from './textures.js';
import { addGlow, addBlob, createDust } from './effects.js';

const LED_COLORS = [0x4dff9a, 0xffb347, 0x3de0ff, 0xff5c7a];

export function buildRoom3(ctx) {
  const scene = ctx.scene;
  const kit = ctx.kit;
  const tag = ctx.tag;
  const room = rooms[2];
  const chrome = kit.material(0xaab6cc, { metalness: 0.8, roughness: 0.3 });
  const steel = kit.material(0x2b3548, { metalness: 0.7, roughness: 0.4 });

  const screenInfo = { room: 3, action: 'screen', label: 'Tela do servidor' };
  const sc = room3.screen;
  const screenFrameMat = kit.material(0x0a1220, { metalness: 0.5, roughness: 0.4 });
  tag(kit.box(0.04, sc.h + 0.16, sc.w + 0.16, screenFrameMat, HALF - 0.02, sc.y, sc.z), screenInfo);
  const serverTex = tex.serverScreenTexture();
  tag(kit.sign(serverTex.texture, sc.w, sc.h, HALF - 0.042, sc.y, sc.z, -Math.PI / 2), screenInfo);
  addGlow(scene, 0x4dff9a, HALF - 0.7, sc.y, sc.z, 3.8, 0.16);

  const rackMap = tex.rackTexture();
  const rackFaceMat = new THREE.MeshStandardMaterial({
    map: rackMap, emissiveMap: rackMap, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.6
  });
  const rackBodyMat = kit.material(0x10172a, { metalness: 0.45, roughness: 0.45 });
  const rackTop = kit.material(0x28344f, { metalness: 0.6, roughness: 0.45 });
  room3.racks.forEach(function (rack, r) {
    kit.box(rack.w, rack.h, rack.d, rackBodyMat, rack.x, rack.h / 2, rack.z);
    kit.box(rack.w + 0.04, 0.04, rack.d + 0.04, rackTop, rack.x, rack.h + 0.02, rack.z, undefined, { pick: false });
    kit.decal(rackFaceMat, rack.d, rack.h, rack.x + rack.w / 2 + 0.004, rack.h / 2, rack.z, 0, Math.PI / 2);
    for (let s = 0; s < 8; s++) {
      const y = rack.h - (14 + s * 61 + 26) / 512 * rack.h;
      [216, 196].forEach(function (px, n) {
        const color = LED_COLORS[(s + n + r) % LED_COLORS.length];
        const mat = kit.material(0x050505, { emissive: color, emissiveIntensity: 1.6 });
        kit.box(0.012, 0.025, 0.025, mat, rack.x + rack.w / 2 + 0.01, y, rack.z - (px / 256 - 0.5) * rack.d, undefined, { pick: false, cast: false });
        ctx.leds.push({ mat: mat, phase: s * 1.3 + n * 2.7 + r * 1.9, rate: 1.2 + ((s * 5 + n * 3 + r * 2) % 6) * 0.8 });
      });
    }
    addBlob(scene, rack.x, rack.z, rack.w + 0.7, rack.d + 0.7, 0.5);
  });
  addGlow(scene, 0x4dff9a, -2.8, 1.2, -19.9, 3.6, 0.18);
  const rackLight = new THREE.PointLight(0x4dff9a, 4, 0, 2);
  rackLight.position.set(-2.6, 1.6, -19.9);
  scene.add(rackLight);

  const lc = room3.lectern;
  const lecternMat = kit.material(0x1a2338, { metalness: 0.4, roughness: 0.55 });
  kit.box(0.5, 0.05, 0.4, lecternMat, lc.x, 0.025, lc.z);
  kit.box(0.18, lc.h - 0.12, 0.18, lecternMat, lc.x, (lc.h - 0.12) / 2 + 0.05, lc.z);
  kit.box(lc.w, 0.05, lc.d, lecternMat, lc.x, lc.h - 0.025, lc.z);
  const manualInfo = { room: 3, action: 'manual', label: 'Manual de quantificadores' };
  tag(kit.box(0.32, 0.025, 0.5, kit.material(0x1f3a2e, { roughness: 0.7 }), lc.x, lc.h + 0.0125, lc.z), manualInfo);
  const page = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.3),
    new THREE.MeshStandardMaterial({ map: tex.manualTexture(), roughness: 0.8 })
  );
  page.rotation.order = 'YXZ';
  page.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  page.position.set(lc.x, lc.h + 0.027, lc.z);
  scene.add(page);
  tag(page, manualInfo);
  ctx.pickables.push(page);
  addGlow(scene, 0x4dff9a, lc.x, lc.h + 0.5, lc.z, 1.4, 0.3);
  addBlob(scene, lc.x, lc.z, 1.2, 1.1, 0.5);

  const d = room3.desk;
  const filesInfo = { room: 3, action: 'files', label: 'Terminal de arquivos' };
  const deskTopMat = kit.material(0x2a3a55, { metalness: 0.35, roughness: 0.45 });
  const deskBodyMat = kit.material(0x182235, { metalness: 0.3, roughness: 0.6 });
  tag(kit.box(d.w, 0.05, d.d, deskTopMat, d.x, d.h - 0.025, d.z), filesInfo);
  [-1, 1].forEach(function (side) {
    tag(kit.box(0.05, d.h - 0.05, d.d - 0.06, deskBodyMat, d.x + side * (d.w / 2 - 0.03), (d.h - 0.05) / 2, d.z), filesInfo);
  });
  tag(kit.box(d.w - 0.1, 0.45, 0.03, deskBodyMat, d.x, 0.52, d.z - d.d / 2 + 0.04), filesInfo);
  const monitorMat = kit.material(0x0d121c, { metalness: 0.4, roughness: 0.4 });
  tag(kit.box(1.0, 0.62, 0.06, monitorMat, d.x, 1.3, d.z - 0.1), filesInfo);
  tag(kit.box(0.1, 0.3, 0.06, monitorMat, d.x, 0.95, d.z - 0.12), filesInfo);
  tag(kit.box(0.4, 0.03, 0.25, monitorMat, d.x, d.h + 0.015, d.z - 0.1), filesInfo);
  tag(kit.box(0.6, 0.025, 0.2, monitorMat, d.x, d.h + 0.0125, d.z + 0.2), filesInfo);
  tag(kit.box(0.54, 0.01, 0.14, kit.material(0x1d2a40, { emissive: 0x3de0ff, emissiveIntensity: 0.12 }), d.x, d.h + 0.03, d.z + 0.2), filesInfo);
  const filesTex = tex.filesTexture();
  tag(kit.sign(filesTex.texture, 0.92, 0.54, d.x, 1.3, d.z - 0.1 + 0.035, 0), filesInfo);
  const filesGlow = addGlow(scene, 0x3de0ff, d.x, 1.3, d.z + 0.3, 2.2, 0.22);
  addBlob(scene, d.x, d.z, d.w + 0.7, d.d + 0.7, 0.5);
  kit.chair(room3.chair.x, room3.chair.z, 0, 1);
  addBlob(scene, room3.chair.x, room3.chair.z, 0.95, 0.95, 0.55);

  const lockInfo = { room: 3, action: 'lock', label: 'Cadeado final' };
  const lz = room3.lock.z;
  const ly = room3.lock.y;
  tag(kit.box(0.06, 1.1, 1.1, steel, HALF - 0.03, ly, lz), lockInfo);
  const body = tag(kit.box(0.16, 0.34, 0.4, kit.material(0x8a6a1c, { metalness: 0.9, roughness: 0.3 }), HALF - 0.14, ly - 0.1, lz), lockInfo);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 10, 24, Math.PI), chrome);
  shackle.rotation.y = Math.PI / 2;
  shackle.position.set(HALF - 0.14, ly + 0.07, lz);
  scene.add(shackle);
  shackle.castShadow = true;
  ctx.pickables.push(shackle);
  tag(shackle, lockInfo);
  const lockLed = kit.material(0x050505, { emissive: 0xff5c7a, emissiveIntensity: 1.8 });
  kit.box(0.01, 0.05, 0.12, lockLed, HALF - 0.225, ly - 0.02, lz, undefined, { pick: false, cast: false });
  const lockGlow = addGlow(scene, 0xff5c7a, HALF - 0.4, ly, lz, 0.9, 0);
  body.castShadow = true;

  const cover = new THREE.Group();
  cover.position.set(0, 0, 0);
  scene.add(cover);
  tag(kit.box(0.04, 1.0, 1.0, steel, HALF - 0.28, ly, lz, cover), lockInfo);
  const coverFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.0),
    new THREE.MeshStandardMaterial({ map: tex.coverTexture(), roughness: 0.6, metalness: 0.3 })
  );
  coverFace.rotation.y = -Math.PI / 2;
  coverFace.position.set(HALF - 0.302, ly, lz);
  cover.add(coverFace);
  tag(coverFace, lockInfo);
  ctx.pickables.push(coverFace);
  [-0.42, 0.42].forEach(function (oz) {
    [-0.42, 0.42].forEach(function (oy) {
      kit.box(0.03, 0.05, 0.05, chrome, HALF - 0.3, ly + oy, lz + oz, cover, { pick: false });
    });
  });
  const coverState = { open: 0, target: 0 };
  const lockState = { open: 0, target: 0 };
  const lockLight = new THREE.PointLight(0x4dff9a, 0, 0, 2);
  lockLight.position.set(HALF - 0.8, ly, lz);
  scene.add(lockLight);

  const dust = createDust(scene, {
    x0: -HALF + 0.4, x1: HALF - 0.4,
    y0: 0.2, y1: 3,
    z0: room.zMin + 0.4, z1: room.zMax - 0.4
  }, 100);
  dust.setOpacity(0.4);

  let filesDone = false;

  function apply(status, instant) {
    coverState.target = status.files ? 1 : 0;
    lockState.target = status.lock ? 1 : 0;
    if (instant) {
      coverState.open = coverState.target;
      lockState.open = lockState.target;
    }
    if (filesDone !== status.files) {
      filesDone = status.files;
      filesTex.set(status.files);
      filesGlow.material.color.setHex(status.files ? 0x4dff9a : 0x3de0ff);
    }
    const color = status.lock ? 0x4dff9a : 0xff5c7a;
    lockLed.emissive.setHex(color);
    lockGlow.material.color.setHex(color);
  }

  function slide(state, dt, speed) {
    if (state.open !== state.target) {
      const step = dt * speed;
      state.open = state.open < state.target
        ? Math.min(state.target, state.open + step)
        : Math.max(state.target, state.open - step);
    }
  }

  function update(dt, clock) {
    slide(coverState, dt, 1.2);
    slide(lockState, dt, 1.4);
    cover.position.y = coverState.open * 1.4;
    cover.visible = coverState.open < 0.99;
    shackle.position.y = ly + 0.07 + lockState.open * 0.1;
    shackle.rotation.z = lockState.open * 0.5;
    lockLight.intensity = 3 * lockState.open;
    lockGlow.material.opacity = coverState.open > 0.5 ? 0.5 : 0;
    dust.update(clock, dt);
  }

  function refresh() {
    serverTex.set();
    filesTex.set(filesDone);
  }

  return { apply: apply, update: update, refresh: refresh };
}
