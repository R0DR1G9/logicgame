const SENSITIVITY = 0.0022;
const TURN_SPEED = 1.9;
const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight'
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createControls(stage, canvas, hooks) {
  const keys = {};
  const state = { yaw: 0, pitch: 0, locked: false, drag: false, enabled: false };
  let dragging = false;
  let dragMoved = 0;

  function look(dx, dy) {
    state.yaw -= dx * SENSITIVITY;
    state.pitch = clamp(state.pitch - dy * SENSITIVITY, -1.4, 1.4);
  }

  function clearKeys() {
    Object.keys(keys).forEach(function (code) {
      keys[code] = false;
    });
  }

  function requestLock() {
    try {
      const result = canvas.requestPointerLock();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          state.drag = true;
          hooks.changed();
        });
      }
    } catch (error) {
      state.drag = true;
      hooks.changed();
    }
  }

  document.addEventListener('keydown', function (event) {
    if (!state.enabled) {
      return;
    }
    if (event.code === 'KeyE') {
      if (!event.repeat) {
        hooks.interact();
      }
      return;
    }
    if (MOVE_KEYS.has(event.code)) {
      keys[event.code] = true;
      event.preventDefault();
    }
  });

  document.addEventListener('keyup', function (event) {
    keys[event.code] = false;
  });

  window.addEventListener('blur', clearKeys);

  document.addEventListener('mousemove', function (event) {
    if (!state.enabled) {
      return;
    }
    if (state.locked) {
      look(event.movementX, event.movementY);
    } else if (dragging) {
      dragMoved += Math.abs(event.movementX) + Math.abs(event.movementY);
      look(event.movementX, event.movementY);
    }
  });

  stage.addEventListener('mousedown', function () {
    if (!state.enabled) {
      return;
    }
    if (state.locked) {
      hooks.interact();
    } else if (state.drag) {
      dragging = true;
      dragMoved = 0;
    } else {
      requestLock();
    }
  });

  document.addEventListener('mouseup', function () {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (dragMoved < 4 && state.enabled) {
      hooks.interact();
    }
  });

  document.addEventListener('pointerlockchange', function () {
    state.locked = document.pointerLockElement === canvas;
    clearKeys();
    hooks.changed();
  });

  document.addEventListener('pointerlockerror', function () {
    state.drag = true;
    hooks.changed();
  });

  function axes() {
    const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const right = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const turn = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
    const sprint = Boolean(keys.ShiftLeft || keys.ShiftRight);
    return { forward: forward, right: right, turn: turn, sprint: sprint };
  }

  function setEnabled(value) {
    if (state.enabled && !value) {
      clearKeys();
      dragging = false;
    }
    state.enabled = value;
  }

  return {
    state: state,
    axes: axes,
    setEnabled: setEnabled,
    turnSpeed: TURN_SPEED
  };
}
