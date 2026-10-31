(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const KEY = 'logicgame.settings.v1';
  const DEFAULTS = { sensitivity: 1, fov: 72, quality: 2 };
  const LIMITS = { sensitivity: [0.4, 2], fov: [60, 100], quality: [0, 2] };
  const QUALITY_LABELS = ['Baixa', 'Média', 'Alta'];
  const listeners = [];

  function clamp(value, limits) {
    return Math.max(limits[0], Math.min(limits[1], value));
  }

  function load() {
    const result = Object.assign({}, DEFAULTS);
    try {
      const raw = root.localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        Object.keys(DEFAULTS).forEach(function (key) {
          if (typeof data[key] === 'number' && isFinite(data[key])) {
            result[key] = clamp(data[key], LIMITS[key]);
          }
        });
      }
    } catch (error) {
      return result;
    }
    return result;
  }

  let values = load();

  function persist() {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(values));
    } catch (error) {
      return;
    }
  }

  function notify() {
    listeners.forEach(function (listener) {
      listener(values);
    });
  }

  function get() {
    return values;
  }

  function set(key, value) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key) || !isFinite(Number(value))) {
      return;
    }
    values[key] = clamp(Number(value), LIMITS[key]);
    persist();
    notify();
  }

  function reset() {
    values = Object.assign({}, DEFAULTS);
    persist();
    notify();
  }

  function subscribe(listener) {
    listeners.push(listener);
  }

  function sliderRow(label, key, step, format) {
    const ui = G.ui;
    const row = ui.el('div', 'setting-row');
    const input = ui.el('input', 'setting-input');
    input.type = 'range';
    input.min = String(LIMITS[key][0]);
    input.max = String(LIMITS[key][1]);
    input.step = String(step);
    input.value = String(values[key]);
    const out = ui.el('span', 'setting-value', format(values[key]));
    input.addEventListener('input', function () {
      set(key, input.value);
      out.textContent = format(values[key]);
    });
    ui.append(row, ui.el('span', 'setting-name', label), input, out);
    return row;
  }

  function qualityRow() {
    const ui = G.ui;
    const row = ui.el('div', 'setting-row');
    const select = ui.el('select', 'setting-select');
    QUALITY_LABELS.forEach(function (text, index) {
      const option = ui.el('option', '', text);
      option.value = String(index);
      select.appendChild(option);
    });
    select.value = String(Math.round(values.quality));
    select.addEventListener('change', function () {
      set('quality', select.value);
    });
    ui.append(row, ui.el('span', 'setting-name', 'Qualidade gráfica'), select);
    return row;
  }

  function open() {
    const ui = G.ui;
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      sliderRow('Sensibilidade do mouse', 'sensitivity', 0.1, function (value) {
        return value.toFixed(1) + 'x';
      }),
      sliderRow('Campo de visão', 'fov', 1, function (value) {
        return Math.round(value) + '°';
      }),
      qualityRow(),
      ui.el('p', 'modal-text', 'As mudanças são aplicadas na hora e ficam salvas neste navegador.'),
      ui.button('Restaurar padrão', 'btn', function () {
        reset();
        open();
      })
    );
    ui.openModal('Configurações', body);
  }

  G.settings = {
    get: get,
    set: set,
    reset: reset,
    subscribe: subscribe,
    open: open
  };
})(typeof window !== 'undefined' ? window : globalThis);
