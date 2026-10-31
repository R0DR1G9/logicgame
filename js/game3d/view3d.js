import * as THREE from '../../vendor/three.module.min.js';
import {
  EYE, RADIUS, REACH, SPEED, SPRINT, WALL,
  spawn, doors, roomIndexAt, lockedMessages
} from './level.js';
import { move } from './collision.js';
import { buildWorld } from './world.js';
import { createControls } from './controls.js';

const G = window.LogicGame;
const CENTER = new THREE.Vector2(0, 0);
const MAX_SUBSTEP = 0.1;
const MAX_DT = 0.1;

function byId(id) {
  return document.getElementById(id);
}

let ready = false;
let running = false;
let renderer = null;
let camera = null;
let world = null;
let controls = null;
let raycaster = null;
let target = null;
let currentRoom = 1;
let winFired = false;
let lastTime = 0;
const player = { x: spawn.x, z: spawn.z };

function status() {
  const state = G.state;
  return {
    power: state.isSolved('r1power'),
    table: state.isSolved('r1table'),
    safe: state.isSolved('r2safe'),
    lock: state.isSolved('r3lock')
  };
}

function resize() {
  const stage = byId('stage');
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  if (!width || !height || !renderer) {
    return;
  }
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function isModalOpen() {
  return !byId('modal').classList.contains('hidden');
}

function updateOverlay() {
  const locked = controls.state.locked || controls.state.drag;
  byId('overlay').classList.toggle('hidden', !running || isModalOpen() || locked);
}

function interact() {
  if (!running || !target) {
    return;
  }
  const info = target;
  if (info.door !== undefined) {
    if (world.isDoorUnlocked(info.door)) {
      G.ui.toast('A porta está aberta.', 'info');
    } else {
      G.ui.toast(lockedMessages[info.door], 'bad');
    }
    return;
  }
  G.rooms[info.room].actions[info.action]();
}

function placeCamera() {
  camera.position.set(player.x, EYE, player.z);
  camera.rotation.y = controls.state.yaw;
  camera.rotation.x = controls.state.pitch;
}

function step(dt) {
  const axes = controls.axes();
  controls.state.yaw += axes.turn * controls.turnSpeed * dt;
  let forward = axes.forward;
  let right = axes.right;
  const length = Math.hypot(forward, right);
  if (length > 1) {
    forward /= length;
    right /= length;
  }
  const speed = (axes.sprint ? SPRINT : SPEED) * dt;
  const yaw = controls.state.yaw;
  const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * speed;
  const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * speed;
  const parts = Math.max(1, Math.ceil(Math.hypot(dx, dz) / MAX_SUBSTEP));
  for (let i = 0; i < parts; i++) {
    const next = move(player.x, player.z, dx / parts, dz / parts, RADIUS, world.colliders);
    player.x = next.x;
    player.z = next.z;
  }
}

function updateRoom() {
  const index = roomIndexAt(player.z);
  if (index === currentRoom) {
    return;
  }
  currentRoom = index;
  G.state.setRoom(index);
  G.main.updateHud();
  G.ui.toast('Nível de acesso ' + index, 'info');
}

function updateTarget() {
  raycaster.setFromCamera(CENTER, camera);
  const hits = raycaster.intersectObjects(world.pickables, false);
  let info = null;
  if (hits.length > 0) {
    const hit = hits[0];
    const candidate = hit.object.userData.interact;
    if (candidate && hit.distance <= REACH) {
      if (candidate.door === undefined || world.doorOpenAmount(candidate.door) < 0.5) {
        info = candidate;
      }
    }
  }
  target = info;
  const prompt = byId('prompt');
  prompt.classList.toggle('hidden', !info || isModalOpen());
  if (info) {
    prompt.textContent = '[E] ' + info.label;
  }
  byId('crosshair').classList.toggle('active', Boolean(info));
}

function checkExit() {
  if (winFired) {
    return;
  }
  if (world.doorOpenAmount(2) > 0.8 && player.z < doors[2].zNear - WALL / 2) {
    winFired = true;
    G.main.win();
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(MAX_DT, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  if (!running) {
    return;
  }
  const modalOpen = isModalOpen();
  controls.setEnabled(!modalOpen);
  if (modalOpen && controls.state.locked) {
    document.exitPointerLock();
  }
  if (!modalOpen) {
    step(dt);
  }
  world.update(dt);
  updateRoom();
  updateTarget();
  updateOverlay();
  checkExit();
  placeCamera();
  renderer.render(world.scene, camera);
}

function init() {
  const stage = byId('stage');
  const canvas = byId('view');
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  camera = new THREE.PerspectiveCamera(72, 1, 0.05, 80);
  camera.rotation.order = 'YXZ';
  world = buildWorld();
  raycaster = new THREE.Raycaster();
  raycaster.far = REACH;
  controls = createControls(stage, canvas, { interact: interact, changed: updateOverlay });
  new ResizeObserver(resize).observe(stage);
  ready = true;
  requestAnimationFrame(frame);
}

function setPose(x, z, yaw, pitch) {
  player.x = x;
  player.z = z;
  controls.state.yaw = yaw || 0;
  controls.state.pitch = pitch || 0;
}

function reset() {
  if (!ready) {
    return;
  }
  setPose(spawn.x, spawn.z, spawn.yaw, spawn.pitch);
  currentRoom = 1;
  winFired = false;
  world.apply(status(), true);
}

function refresh() {
  if (ready) {
    world.apply(status(), false);
  }
}

function begin() {
  if (!ready) {
    try {
      init();
    } catch (error) {
      G.ui.toast('Não foi possível iniciar o 3D neste navegador (WebGL).', 'bad');
      return false;
    }
  }
  reset();
  running = true;
  resize();
  updateOverlay();
  return true;
}

function stop() {
  running = false;
  if (ready) {
    controls.setEnabled(false);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }
  byId('overlay').classList.add('hidden');
  byId('prompt').classList.add('hidden');
}

G.view3d = {
  begin: begin,
  stop: stop,
  refresh: refresh,
  setPose: setPose,
  pose: function () {
    return { x: player.x, z: player.z, yaw: controls.state.yaw, pitch: controls.state.pitch, room: currentRoom };
  },
  targetLabel: function () {
    return target ? target.label : null;
  },
  doorOpenAmount: function (index) {
    return world.doorOpenAmount(index);
  }
};
