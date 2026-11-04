import * as THREE from '../../vendor/three.module.min.js';
import { HALF, rooms, room5 } from './level.js';
import * as tex from './textures.js';
import { addGlow, addBlob, createDust } from './effects.js';

const VIOLET = 0xc78bff;
const GREEN = 0x4dff9a;

export function buildRoom5(ctx) {
  const scene = ctx.scene;
  const kit = ctx.kit;
  const tag = ctx.tag;
  const room = rooms[4];
  const steel = kit.material(0x2b3548, { metalness: 0.7, roughness: 0.4 });
  const chrome = kit.material(0xaab6cc, { metalness: 0.8, roughness: 0.3 });
  const frameMat = kit.material(0x0a1220, { metalness: 0.5, roughness: 0.4 });

  const islandsInfo = { room: 5, action: 'islands', label: 'Ilha dos Cavaleiros' };
  const ib = room5.islands;
  const islandsTex = tex.islandsTexture();
  tag(kit.box(0.04, ib.h + 0.16, ib.w + 0.16, frameMat, -HALF + 0.02, ib.y, ib.z), islandsInfo);
  tag(kit.box(0.1, 0.04, ib.w, frameMat, -HALF + 0.05, ib.y - ib.h / 2 - 0.1, ib.z), islandsInfo);
  tag(kit.sign(islandsTex.texture, ib.w, ib.h, -HALF + 0.042, ib.y, ib.z, Math.PI / 2), islandsInfo);
  addGlow(scene, VIOLET, -HALF + 0.6, ib.y, ib.z, 3.4, 0.1);

  const tableauInfo = { room: 5, action: 'tableau', label: 'Árvore de Refutação' };
  const rb = room5.tableau;
  const tableauTex = tex.tableauTexture();
  tag(kit.box(0.04, rb.h + 0.16, rb.w + 0.16, frameMat, HALF - 0.02, rb.y, rb.z), tableauInfo);
  tag(kit.box(0.1, 0.04, rb.w, frameMat, HALF - 0.05, rb.y - rb.h / 2 - 0.1, rb.z), tableauInfo);
  tag(kit.sign(tableauTex.texture, rb.w, rb.h, HALF - 0.042, rb.y, rb.z, -Math.PI / 2), tableauInfo);
  addGlow(scene, VIOLET, HALF - 0.6, rb.y, rb.z, 3.4, 0.1);

  const d = room5.desk;
  const argsInfo = { room: 5, action: 'args', label: 'Terminal de argumentos' };
  const deskTopMat = kit.material(0x2a3a55, { metalness: 0.35, roughness: 0.45 });
  const deskBodyMat = kit.material(0x182235, { metalness: 0.3, roughness: 0.6 });
  tag(kit.box(d.w, 0.05, d.d, deskTopMat, d.x, d.h - 0.025, d.z), argsInfo);
  [-1, 1].forEach(function (side) {
    tag(kit.box(0.05, d.h - 0.05, d.d - 0.06, deskBodyMat, d.x + side * (d.w / 2 - 0.03), (d.h - 0.05) / 2, d.z), argsInfo);
  });
  tag(kit.box(d.w - 0.1, 0.45, 0.03, deskBodyMat, d.x, 0.52, d.z - d.d / 2 + 0.04), argsInfo);
  const monitorMat = kit.material(0x0d121c, { metalness: 0.4, roughness: 0.4 });
  tag(kit.box(1.0, 0.62, 0.06, monitorMat, d.x, 1.3, d.z - 0.1), argsInfo);
  tag(kit.box(0.1, 0.3, 0.06, monitorMat, d.x, 0.95, d.z - 0.12), argsInfo);
  tag(kit.box(0.4, 0.03, 0.25, monitorMat, d.x, d.h + 0.015, d.z - 0.1), argsInfo);
  tag(kit.box(0.6, 0.025, 0.2, monitorMat, d.x, d.h + 0.0125, d.z + 0.2), argsInfo);
  const argsTex = tex.argsTexture();
  tag(kit.sign(argsTex.texture, 0.92, 0.54, d.x, 1.3, d.z - 0.1 + 0.035, 0), argsInfo);
  const argsGlow = addGlow(scene, VIOLET, d.x, 1.3, d.z + 0.3, 2.2, 0.22);
  addBlob(scene, d.x, d.z, d.w + 0.7, d.d + 0.7, 0.5);
  kit.chair(room5.chair.x, room5.chair.z, 0, 1);
  addBlob(scene, room5.chair.x, room5.chair.z, 0.95, 0.95, 0.55);

  const pd = room5.pedestal;
  kit.cylinder(pd.r, pd.r + 0.05, 0.9, steel, pd.x, 0.45, pd.z);
  kit.cylinder(pd.r + 0.06, pd.r + 0.06, 0.06, chrome, pd.x, 0.93, pd.z);
  const orbMat = kit.material(0x120a1c, { emissive: VIOLET, emissiveIntensity: 1.4 });
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), orbMat);
  orb.position.set(pd.x, 1.5, pd.z);
  orb.castShadow = true;
  scene.add(orb);
  const orbLight = new THREE.PointLight(VIOLET, 5, 0, 2);
  orbLight.position.set(pd.x, 1.5, pd.z);
  scene.add(orbLight);
  const orbGlow = addGlow(scene, VIOLET, pd.x, 1.5, pd.z, 2.2, 0.35);
  addBlob(scene, pd.x, pd.z, 1.6, 1.6, 0.5);

  const sealMats = [];
  const seals = room5.seals;
  kit.box(seals.w, seals.h, 0.06, steel, seals.x, seals.y, room.zMin + 0.03);
  for (let i = 0; i < 3; i++) {
    const mat = kit.material(0x050505, { emissive: 0xff5c7a, emissiveIntensity: 1.8 });
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20), mat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(seals.x - 0.5 + i * 0.5, seals.y, room.zMin + 0.08);
    scene.add(lamp);
    sealMats.push(mat);
  }
  const sealGlow = addGlow(scene, 0xff5c7a, seals.x, seals.y, room.zMin + 0.4, 2.4, 0.12);

  const dust = createDust(scene, {
    x0: -HALF + 0.4, x1: HALF - 0.4,
    y0: 0.2, y1: 3,
    z0: room.zMin + 0.4, z1: room.zMax - 0.4
  }, 100);
  dust.setOpacity(0.4);

  let doneCount = 0;
  let argsDone = false;

  function apply(status) {
    const flags = [status.islands, status.tableau, status.args];
    doneCount = flags.filter(Boolean).length;
    flags.forEach(function (flag, i) {
      sealMats[i].emissive.setHex(flag ? GREEN : 0xff5c7a);
    });
    const all = doneCount === 3;
    sealGlow.material.color.setHex(all ? GREEN : 0xff5c7a);
    const color = all ? GREEN : VIOLET;
    orbMat.emissive.setHex(color);
    orbLight.color.setHex(color);
    orbGlow.material.color.setHex(color);
    if (argsDone !== status.args) {
      argsDone = status.args;
      argsTex.set(argsDone);
      argsGlow.material.color.setHex(argsDone ? GREEN : VIOLET);
    }
  }

  function update(dt, clock) {
    orb.rotation.y = clock * 0.8;
    orb.rotation.x = clock * 0.5;
    orb.position.y = 1.5 + 0.06 * Math.sin(clock * 1.6);
    orbMat.emissiveIntensity = 1.2 + 0.4 * Math.sin(clock * (doneCount === 3 ? 1.5 : 3));
    dust.update(clock, dt);
  }

  function refresh() {
    islandsTex.set();
    tableauTex.set();
    argsTex.set(argsDone);
  }

  return { apply: apply, update: update, refresh: refresh };
}
