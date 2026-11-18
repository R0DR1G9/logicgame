(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const DEMO_SEED = 20261117;
  const SOLVED_BY_ROOM = [
    ['r1power', 'r1table'],
    ['r2safe'],
    ['r3files', 'r3lock'],
    ['r4valves', 'r4equiv'],
    ['r5islands', 'r5tableau', 'r5args']
  ];
  const ROOM_DEPTH = 8.4;
  const state = { active: false };

  function byId(id) {
    return root.document.getElementById(id);
  }

  function label(value) {
    return value ? 'V' : 'F';
  }

  function sheetRoom1(puzzle) {
    const E = G.evaluator;
    const rows = E.truthTable(puzzle.r1.formula);
    const power = rows.filter(function (row) { return row.value; }).map(function (row) {
      return 'P = ' + label(row.env.P) + ', Q = ' + label(row.env.Q);
    });
    return [
      ['Fórmula', puzzle.r1.label],
      ['Painel de energia (qualquer uma destas combinações liga)', power.join('   |   ')],
      ['Terminal, coluna F linha a linha', rows.map(function (row) {
        return 'P=' + label(row.env.P) + ' Q=' + label(row.env.Q) + ' -> ' + label(row.value);
      }).join('   |   ')]
    ];
  }

  function sheetRoom2(puzzle) {
    const r2 = puzzle.r2;
    const guilty = r2.names.filter(function (name) { return r2.forced[name]; });
    const innocent = r2.names.filter(function (name) { return !r2.forced[name]; });
    return [
      ['Culpados', guilty.join(', ')],
      ['Inocentes', innocent.join(', ')],
      ['Senha do cofre', r2.code],
      ['Onde está a página 5', 'Gaveta da mesa, ao lado da cadeira']
    ];
  }

  function sheetRoom3(puzzle) {
    const r3 = puzzle.r3;
    return [
      ['Terminal de arquivos', r3.formulas.map(function (item, index) {
        return (index + 1) + '. ' + item.text + ' -> ' + r3.kinds[item.kind];
      }).join('\n')],
      ['Cadeado final (V se A ⇒ B vale)', r3.implications.map(function (item, index) {
        return (index + 1) + '. ' + item.left.text + ' ⇒ ' + item.right.text + ' -> ' + label(item.valid);
      }).join('\n')]
    ];
  }

  function sheetRoom4(puzzle) {
    const r4 = puzzle.r4;
    const names = r4.valves.names;
    const option = r4.equiv.options[r4.equiv.answerIndex];
    return [
      ['Painel de válvulas (V aberta, F fechada)', names.map(function (name) {
        return name + ' = ' + label(r4.valves.solution[name]);
      }).join(',  ')],
      ['Oráculo, fórmula alvo', 'F = ' + r4.equiv.target.text],
      ['Oráculo, opção correta', String.fromCharCode(65 + r4.equiv.answerIndex) + ') ' + option.text]
    ];
  }

  function sheetRoom5(puzzle) {
    const r5 = puzzle.r5;
    return [
      ['Selo 1, cavaleiros e mentirosos', r5.islands.names.map(function (name, index) {
        return name + ' = ' + (r5.islands.solution[index] ? 'cavaleiro (V)' : 'mentiroso (F)');
      }).join('\n')],
      ['Selo 2, tableaux (V satisfatível, F insatisfatível)', r5.tableau.sets.map(function (set, index) {
        return (index + 1) + '. ' + label(set.sat);
      }).join('   ')],
      ['Selo 3, argumentos (V válido, F inválido)', r5.args.items.map(function (item, index) {
        return (index + 1) + '. ' + label(item.valid);
      }).join('   ')]
    ];
  }

  const SHEETS = [sheetRoom1, sheetRoom2, sheetRoom3, sheetRoom4, sheetRoom5];

  function openAnswers() {
    const ui = G.ui;
    const room = Math.min(Math.max(G.state.get().room, 1), SHEETS.length);
    const body = ui.el('div', 'stack');
    SHEETS[room - 1](G.puzzle).forEach(function (entry) {
      const card = ui.el('div', 'rule');
      card.appendChild(ui.el('h3', '', entry[0]));
      entry[1].split('\n').forEach(function (line) {
        card.appendChild(ui.el('div', 'rule-line', line));
      });
      body.appendChild(card);
    });
    ui.openModal('Gabarito - Sala ' + room, body);
  }

  function setActive(value) {
    state.active = value;
    const button = byId('btn-answers');
    if (button) {
      button.classList.toggle('hidden', !value);
    }
  }

  function start(room) {
    setActive(true);
    G.state.reset(DEMO_SEED);
    G.state.freezeClock();
    G.puzzle = G.generator.generate(DEMO_SEED);
    for (let i = 0; i < room - 1; i++) {
      SOLVED_BY_ROOM[i].forEach(function (key) {
        G.state.markSolved(key);
      });
    }
    G.ui.closeModal();
    G.main.enter({ x: 0, z: (1 - room) * ROOM_DEPTH - 1.2, yaw: 0, pitch: 0 });
  }

  function openMenu() {
    const ui = G.ui;
    const body = ui.el('div', 'stack');
    body.appendChild(ui.el('p', 'modal-text', 'Modo apresentação: desafios sempre iguais, sem relógio e com gabarito na tecla G. O progresso real não é alterado. Escolha onde começar.'));
    for (let room = 1; room <= G.config.totalRooms; room++) {
      (function (number) {
        const text = number === 1 ? 'Sala 1 (jogo completo)' : 'Começar na sala ' + number;
        body.appendChild(ui.button(text, 'btn menu-btn', function () {
          start(number);
        }));
      })(room);
    }
    ui.openModal('Modo apresentação', body);
  }

  function init() {
    const button = byId('btn-answers');
    if (button) {
      button.addEventListener('click', openAnswers);
    }
    root.document.addEventListener('keydown', function (event) {
      if (event.code !== 'KeyG' || !state.active || !G.view3d || !G.view3d.isRunning()) {
        return;
      }
      if (!byId('modal').classList.contains('hidden') || !byId('pause').classList.contains('hidden')) {
        return;
      }
      openAnswers();
    });
  }

  G.demo = {
    isActive: function () {
      return state.active;
    },
    end: function () {
      setActive(false);
    },
    openMenu: openMenu,
    openAnswers: openAnswers
  };

  init();
})(typeof window !== 'undefined' ? window : globalThis);
