(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const ui = G.ui;
  const dom = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function pad(number) {
    return number < 10 ? '0' + number : String(number);
  }

  function formatTime(total) {
    return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
  }

  function buildProgress() {
    dom.progress.textContent = '';
    for (let i = 1; i <= G.config.totalRooms; i++) {
      const node = ui.el('span', 'hud-node');
      node.dataset.room = String(i);
      dom.progress.appendChild(node);
    }
  }

  function updateHud() {
    const current = G.state.get();
    const room = G.rooms[current.room];
    dom.hudRoom.textContent = 'Nível de acesso ' + current.room + '/' + G.config.totalRooms + ' - ' + room.title;
    Array.from(dom.progress.children).forEach(function (node) {
      const number = Number(node.dataset.room);
      node.classList.toggle('is-current', number === current.room);
      node.classList.toggle('is-done', number < current.room);
    });
    dom.noteCount.textContent = String(current.notes.length);
  }

  function render() {
    const current = G.state.get();
    const room = G.rooms[current.room];
    dom.scene.className = 'scene room-' + current.room;
    dom.scene.textContent = '';
    room.build(dom.scene);
    updateHud();
  }

  function collect(id, roomId, title, text) {
    if (G.state.addNote(id, roomId, title, text)) {
      updateHud();
      ui.toast('Pista guardada no caderno.', 'info');
    }
  }

  function goToRoom(number) {
    G.state.setRoom(number);
    ui.closeModal();
    render();
    ui.toast('Nível de acesso ' + number + ' liberado.', 'ok');
  }

  function win() {
    G.state.finish();
    ui.closeModal();
    const current = G.state.get();
    dom.endTime.textContent = formatTime(G.state.elapsedSeconds());
    dom.endAttempts.textContent = String(current.attempts);
    dom.endHints.textContent = String(current.hintsUsed);
    dom.game.classList.add('hidden');
    dom.end.classList.remove('hidden');
  }

  function start() {
    G.state.reset();
    dom.start.classList.add('hidden');
    dom.end.classList.add('hidden');
    dom.game.classList.remove('hidden');
    render();
  }

  function showNotebook() {
    const notes = G.state.get().notes;
    const body = ui.el('div', 'stack');
    if (notes.length === 0) {
      body.appendChild(ui.el('p', 'modal-text', 'Nenhuma pista guardada ainda. Clique nos objetos da sala para investigar.'));
    }
    notes.forEach(function (note) {
      const card = ui.el('div', 'note-card');
      ui.append(
        card,
        ui.el('h3', '', 'Sala ' + note.room + ' - ' + note.title),
        ui.el('p', '', note.text)
      );
      body.appendChild(card);
    });
    ui.openModal('Caderno de pistas', body);
  }

  function showHint() {
    const current = G.state.get();
    const info = G.rooms[current.room].hints();
    const text = G.state.nextHint(info.stage, info.list);
    ui.openModal('Dica', ui.el('p', 'modal-text', text));
  }

  function init() {
    dom.start = byId('screen-start');
    dom.game = byId('screen-game');
    dom.end = byId('screen-end');
    dom.scene = byId('scene');
    dom.hudRoom = byId('hud-room');
    dom.progress = byId('hud-progress');
    dom.noteCount = byId('note-count');
    dom.endTime = byId('end-time');
    dom.endAttempts = byId('end-attempts');
    dom.endHints = byId('end-hints');

    ui.initModal();
    buildProgress();

    byId('btn-start').addEventListener('click', start);
    byId('btn-restart').addEventListener('click', start);
    byId('btn-notebook').addEventListener('click', showNotebook);
    byId('btn-hint').addEventListener('click', showHint);
  }

  G.main = {
    render: render,
    updateHud: updateHud,
    collect: collect,
    goToRoom: goToRoom,
    win: win
  };

  init();
})(typeof window !== 'undefined' ? window : globalThis);
