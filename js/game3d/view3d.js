import * as THREE from '../../vendor/three.module.min.js';
import {
  EYE, RADIUS, REACH, SPEED, SPRINT, WALL,
  spawn, doors, roomIndexAt, lockedMessages
} from './level.js';
import { move, collides } from './collision.js';
import { buildWorld } from './world.js';
import { createControls } from './controls.js';

const G = window.LogicGame;
const CENTER = new THREE.Vector2(0, 0);
const MAX_SUBSTEP = 0.1;
const MAX_DT = 0.1;
const HINT_DELAY = 700;

function byId(id) {
  return document.getElementById(id);
}

let ready = false;
let running = false;
let paused = false;
let intro = false;
let wasModal = false;
let hintAfter = 0;
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

function pixelRatioFor(quality) {
  const ratios = [0.6, 1, Math.min(window.devicePixelRatio || 1, 2)];
  return ratios[Math.max(0, Math.min(2, Math.round(quality)))];
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

function applySettings() {
  if (!ready) {
    return;
  }
  const settings = G.settings.get();
  camera.fov = settings.fov;
  renderer.setPixelRatio(pixelRatioFor(settings.quality));
  resize();
}

function isModalOpen() {
  return !byId('modal').classList.contains('hidden');
}

function syncUi(modalOpen) {
  const free = controls.state.locked || controls.state.drag;
  if (free) {
    intro = false;
  }
  byId('overlay').classList.toggle('hidden', !(running && intro && !paused && !modalOpen));
  byId('pause').classList.toggle('hidden', !(running && paused));
  const needHint = running && !intro && !paused && !modalOpen && !free && performance.now() > hintAfter;
  byId('relock').classList.toggle('hidden', !needHint);
}

function changed() {
  if (ready) {
    syncUi(isModalOpen());
  }
}

function openPause() {
  if (!running || paused) {
    return;
  }
  paused = true;
  if (controls.state.locked) {
    document.exitPointerLock();
  }
  G.save.write();
  syncUi(isModalOpen());
}

function resume() {
  if (!running || !paused) {
    return;
  }
  paused = false;
  hintAfter = performance.now() + HINT_DELAY;
  controls.setEnabled(!isModalOpen());
  if (!controls.state.drag) {
    controls.requestLock(false);
  }
  syncUi(isModalOpen());
}

function onLockLost() {
  if (running && !paused && !intro && !isModalOpen()) {
    openPause();
  }
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

function updateTarget(modalOpen) {
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
  prompt.classList.toggle('hidden', !info || modalOpen || paused || intro);
  if (info) {
    prompt.textContent = '[E] ' + info.label;
  }
  byId('crosshair').classList.toggle('active', Boolean(info) && !paused);
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
  controls.setEnabled(!modalOpen && !paused);
  if (modalOpen && controls.state.locked) {
    document.exitPointerLock();
  }
  const free = controls.state.locked || controls.state.drag;
  if (wasModal && !modalOpen && !paused && !intro && !free) {
    hintAfter = performance.now() + HINT_DELAY;
    controls.requestLock(true);
  }
  wasModal = modalOpen;
  if (!modalOpen && !paused && !intro) {
    step(dt);
  }
  world.update(dt);
  updateRoom();
  updateTarget(modalOpen);
  syncUi(modalOpen);
  checkExit();
  placeCamera();
  renderer.render(world.scene, camera);
}

function init() {
  const stage = byId('stage');
  const canvas = byId('view');
  const settings = G.settings.get();
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(pixelRatioFor(settings.quality));
  camera = new THREE.PerspectiveCamera(settings.fov, 1, 0.05, 80);
  camera.rotation.order = 'YXZ';
  world = buildWorld();
  raycaster = new THREE.Raycaster();
  raycaster.far = REACH;
  controls = createControls(stage, canvas, {
    interact: interact,
    changed: changed,
    lockLost: onLockLost,
    sensitivity: function () {
      return G.settings.get().sensitivity;
    },
    notebook: function () {
      G.main.showNotebook();
    },
    hint: function () {
      G.main.showHint();
    }
  });
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

function reset(resumePose) {
  world.apply(status(), true);
  world.update(0);
  let pose = spawn;
  if (resumePose && [resumePose.x, resumePose.z, resumePose.yaw, resumePose.pitch].every(Number.isFinite)) {
    if (!collides(resumePose.x, resumePose.z, RADIUS, world.colliders)) {
      pose = resumePose;
    }
  }
  setPose(pose.x, pose.z, pose.yaw, pose.pitch);
  currentRoom = roomIndexAt(player.z);
  G.state.setRoom(currentRoom);
  winFired = false;
}

function refresh() {
  if (ready) {
    world.apply(status(), false);
  }
}

function begin(resumePose) {
  if (!ready) {
    try {
      init();
    } catch (error) {
      G.ui.toast('Não foi possível iniciar o 3D neste navegador (WebGL).', 'bad');
      return false;
    }
  }
  reset(resumePose);
  running = true;
  paused = false;
  intro = true;
  wasModal = false;
  resize();
  syncUi(isModalOpen());
  return true;
}

function stop() {
  running = false;
  paused = false;
  intro = false;
  if (ready) {
    controls.setEnabled(false);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }
  ['overlay', 'pause', 'relock', 'prompt'].forEach(function (id) {
    byId(id).classList.add('hidden');
  });
}

document.addEventListener('keydown', function (event) {
  if (event.code !== 'Escape' || !running || paused || isModalOpen()) {
    return;
  }
  openPause();
}, true);

G.settings.subscribe(applySettings);

G.view3d = {
  begin: begin,
  stop: stop,
  refresh: refresh,
  resume: resume,
  openPause: openPause,
  setPose: setPose,
  isRunning: function () {
    return running;
  },
  pose: function () {
    return { x: player.x, z: player.z, yaw: controls.state.yaw, pitch: controls.state.pitch, room: currentRoom };
  },
  targetLabel: function () {
    return target ? target.label : null;
  },
  doorOpenAmount: function (index) {
    return world.doorOpenAmount(index);
  },
  stats: function () {
    return { fov: camera.fov, pixelRatio: renderer.getPixelRatio() };
  }
};
