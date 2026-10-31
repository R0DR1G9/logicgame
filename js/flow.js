(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const ui = G.ui;
  const dom = {};
  const AUTOSAVE_MS = 5000;

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
    updateHud();
    if (G.view3d) {
      G.view3d.refresh();
    }
    G.save.write();
  }

  function collect(id, roomId, title, text) {
    if (G.state.addNote(id, roomId, title, text)) {
      updateHud();
      ui.toast('Pista guardada no caderno.', 'info');
      G.save.write();
    }
  }

  function showScreen(name) {
    dom.start.classList.toggle('hidden', name !== 'start');
    dom.game.classList.toggle('hidden', name !== 'game');
    dom.end.classList.toggle('hidden', name !== 'end');
  }

  function refreshMenu() {
    const data = G.save.read();
    dom.continueBtn.disabled = !data;
    if (data) {
      const room = Number(data.state.room) || 1;
      dom.continueInfo.textContent = 'Nível ' + room + '/' + G.config.totalRooms + ' - ' + formatTime(Number(data.state.elapsed) || 0);
    } else {
      dom.continueInfo.textContent = 'Nenhum jogo salvo';
    }
  }

  function enter(pose) {
    ui.closeModal();
    showScreen('game');
    if (!G.view3d || !G.view3d.begin(pose)) {
      showScreen('start');
      refreshMenu();
      return;
    }
    updateHud();
  }

  function startNew() {
    G.save.clear();
    G.state.reset();
    enter(null);
  }

  function askNewGame() {
    if (!G.save.exists()) {
      startNew();
      return;
    }
    const body = ui.el('div', 'stack');
    const actions = ui.el('div', 'confirm-actions');
    ui.append(
      actions,
      ui.button('Cancelar', 'btn', ui.closeModal),
      ui.button('Apagar e começar', 'btn primary', startNew)
    );
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Começar um novo jogo apaga o progresso salvo. Deseja continuar?'),
      actions
    );
    ui.openModal('Novo jogo', body);
  }

  function continueGame() {
    const data = G.save.read();
    if (!data) {
      refreshMenu();
      return;
    }
    G.state.load(data.state);
    enter(data.pose);
  }

  function toMenu() {
    G.save.write();
    if (G.view3d) {
      G.view3d.stop();
    }
    ui.closeModal();
    showScreen('start');
    refreshMenu();
  }

  function win() {
    G.state.finish();
    G.view3d.stop();
    G.save.clear();
    ui.closeModal();
    const current = G.state.get();
    dom.endTime.textContent = formatTime(G.state.elapsedSeconds());
    dom.endAttempts.textContent = String(current.attempts);
    dom.endHints.textContent = String(current.hintsUsed);
    showScreen('end');
  }

  function showNotebook() {
    const notes = G.state.get().notes;
    const body = ui.el('div', 'stack');
    if (notes.length === 0) {
      body.appendChild(ui.el('p', 'modal-text', 'Nenhuma pista guardada ainda. Aproxime-se dos objetos e interaja para investigar.'));
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
    G.save.write();
  }

  function init() {
    dom.start = byId('screen-start');
    dom.game = byId('screen-game');
    dom.end = byId('screen-end');
    dom.hudRoom = byId('hud-room');
    dom.progress = byId('hud-progress');
    dom.noteCount = byId('note-count');
    dom.endTime = byId('end-time');
    dom.endAttempts = byId('end-attempts');
    dom.endHints = byId('end-hints');
    dom.continueBtn = byId('btn-continue');
    dom.continueInfo = byId('continue-info');

    ui.initModal();
    buildProgress();
    refreshMenu();

    byId('btn-new').addEventListener('click', askNewGame);
    dom.continueBtn.addEventListener('click', continueGame);
    byId('btn-settings').addEventListener('click', G.settings.open);
    byId('btn-restart').addEventListener('click', startNew);
    byId('btn-end-menu').addEventListener('click', toMenu);
    byId('btn-notebook').addEventListener('click', showNotebook);
    byId('btn-hint').addEventListener('click', showHint);
    byId('btn-menu').addEventListener('click', function () {
      G.view3d.openPause();
    });
    byId('btn-resume').addEventListener('click', function () {
      G.view3d.resume();
    });
    byId('btn-pause-settings').addEventListener('click', G.settings.open);
    byId('btn-quit').addEventListener('click', toMenu);

    root.setInterval(G.save.write, AUTOSAVE_MS);
    root.addEventListener('pagehide', G.save.write);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        G.save.write();
      }
    });
  }

  G.main = {
    render: render,
    updateHud: updateHud,
    collect: collect,
    showNotebook: showNotebook,
    showHint: showHint,
    win: win
  };

  init();
})(typeof window !== 'undefined' ? window : globalThis);
