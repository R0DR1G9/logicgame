(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  let toastTimer = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function append(parent) {
    for (let i = 1; i < arguments.length; i++) {
      if (arguments[i]) {
        parent.appendChild(arguments[i]);
      }
    }
    return parent;
  }

  function button(text, className, onClick) {
    const node = el('button', className, text);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }

  function openModal(title, content) {
    byId('modal-title').textContent = title;
    const body = byId('modal-body');
    body.textContent = '';
    body.appendChild(content);
    byId('modal').classList.remove('hidden');
    byId('modal-close').focus();
  }

  function closeModal() {
    byId('modal').classList.add('hidden');
  }

  function isModalOpen() {
    return !byId('modal').classList.contains('hidden');
  }

  function initModal() {
    byId('modal-close').addEventListener('click', closeModal);
    byId('modal').addEventListener('click', function (event) {
      if (event.target === byId('modal')) {
        closeModal();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isModalOpen()) {
        closeModal();
      }
    });
  }

  function toast(message, kind) {
    const node = byId('toast');
    node.textContent = message;
    node.className = 'toast ' + (kind || 'info');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.classList.add('hidden');
    }, 2800);
  }

  function hotspot(options) {
    const node = el('button', 'hotspot ' + options.cls);
    node.type = 'button';
    node.setAttribute('aria-label', options.label);
    if (options.status) {
      node.classList.add('is-' + options.status);
    }
    append(
      node,
      el('span', 'hotspot-glyph', options.glyph),
      el('span', 'hotspot-label', options.label)
    );
    node.addEventListener('click', options.onClick);
    return node;
  }

  function feedback() {
    const node = el('p', 'feedback');
    node.setAttribute('role', 'status');
    return node;
  }

  function setFeedback(node, message, kind) {
    node.textContent = message;
    node.className = 'feedback ' + (kind || '');
  }

  function shake(node) {
    node.classList.remove('shake');
    void node.offsetWidth;
    node.classList.add('shake');
    node.addEventListener('animationend', function () {
      node.classList.remove('shake');
    }, { once: true });
  }

  function createToggle(name, initial) {
    const node = el('button', 'toggle');
    node.type = 'button';
    const stateEl = el('span', 'toggle-state');
    if (name) {
      node.appendChild(el('span', 'toggle-name', name));
    }
    node.appendChild(stateEl);
    let value = initial;

    function paint() {
      node.classList.toggle('is-true', value === true);
      node.classList.toggle('is-false', value === false);
      node.classList.toggle('is-unset', value === null);
      stateEl.textContent = value === null ? '?' : (value ? 'V' : 'F');
      node.setAttribute('aria-pressed', String(value === true));
    }

    node.addEventListener('click', function () {
      value = value === null ? true : !value;
      paint();
    });

    paint();
    return {
      node: node,
      get: function () {
        return value;
      }
    };
  }

  function table(headers, rows, className) {
    const tableNode = el('table', 'logic-table ' + (className || ''));
    const head = el('thead');
    const headRow = el('tr');
    headers.forEach(function (text) {
      headRow.appendChild(el('th', '', text));
    });
    head.appendChild(headRow);
    tableNode.appendChild(head);
    const body = el('tbody');
    rows.forEach(function (row) {
      const tr = el('tr');
      row.forEach(function (cell) {
        const td = el('td');
        if (typeof cell === 'string') {
          td.textContent = cell;
        } else {
          td.appendChild(cell);
        }
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    tableNode.appendChild(body);
    return tableNode;
  }

  G.ui = {
    el: el,
    append: append,
    button: button,
    openModal: openModal,
    closeModal: closeModal,
    initModal: initModal,
    toast: toast,
    hotspot: hotspot,
    feedback: feedback,
    setFeedback: setFeedback,
    shake: shake,
    createToggle: createToggle,
    table: table
  };
})(typeof window !== 'undefined' ? window : globalThis);
