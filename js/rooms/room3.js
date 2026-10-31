(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const E = G.evaluator;
  const ui = G.ui;
  const state = G.state;

  const gridNumbers = [-4, -2, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10];
  const conditionText = '∃x (x ∈ ℕ ∧ x é par ∧ x² < 50)';

  function isNatural(x) {
    return Number.isInteger(x) && x >= G.config.naturalsStart;
  }

  function isEven(x) {
    return x % 2 === 0;
  }

  function satisfies(x) {
    return isNatural(x) && isEven(x) && x * x < 50;
  }

  function domain() {
    return E.range(G.config.naturalsStart, G.config.searchLimit);
  }

  const statements = [
    {
      text: '∀x ∈ ℕ (x² < 50)',
      truth: function () {
        return E.forall(domain(), function (x) {
          return x * x < 50;
        });
      }
    },
    {
      text: '∃x ∈ ℕ (x é ímpar ∧ x² < 50)',
      truth: function () {
        return E.exists(domain(), function (x) {
          return x % 2 === 1 && x * x < 50;
        });
      }
    }
  ];

  function openScreen() {
    const reading = 'Leitura: existe x tal que x pertence aos naturais, x é par e x ao quadrado é menor que 50. Cada arquivo só pode ser deletado se satisfizer as três condições ao mesmo tempo.';
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Apenas os arquivos que satisfazem a condição abaixo podem ser deletados.'),
      ui.el('p', 'formula', conditionText),
      ui.el('p', 'modal-text', reading)
    );
    G.main.collect(
      'r3-screen',
      3,
      'Condição de exclusão',
      conditionText + '\n' + reading
    );
    ui.openModal('Tela do servidor', body);
  }

  function openManual() {
    const start = G.config.naturalsStart;
    const convention = 'Neste sistema, ℕ começa em ' + start + '.';
    const text =
      '∃x P(x): basta que um elemento do domínio satisfaça P.\n' +
      '∀x P(x): todos os elementos do domínio precisam satisfazer P. Um único contraexemplo já torna a afirmação falsa.\n' +
      '¬∀x P(x) equivale a ∃x ¬P(x).\n' +
      convention;
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Manual de quantificadores do servidor.'),
      ui.el('p', 'modal-text', text)
    );
    G.main.collect('r3-manual', 3, 'Manual de quantificadores', text);
    ui.openModal('Manual', body);
  }

  function openFiles() {
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Selecione apenas os arquivos que satisfazem a condição de exclusão e execute.'),
      ui.el('p', 'formula', conditionText)
    );

    if (state.isSolved('r3files')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Arquivos corretos deletados. O cadeado final foi exposto.'));
      ui.openModal('Terminal de arquivos', body);
      return;
    }

    const selected = new Set();
    const grid = ui.el('div', 'file-grid');
    gridNumbers.forEach(function (number) {
      const cell = ui.el('button', 'file-cell');
      cell.type = 'button';
      cell.appendChild(document.createTextNode(String(number)));
      cell.appendChild(ui.el('small', '', '.dat'));
      cell.addEventListener('click', function () {
        if (selected.has(number)) {
          selected.delete(number);
        } else {
          selected.add(number);
        }
        cell.classList.toggle('is-selected', selected.has(number));
      });
      grid.appendChild(cell);
    });

    const result = ui.feedback();
    const run = ui.button('Executar exclusão', 'btn primary', function () {
      const correct = gridNumbers.filter(satisfies);
      const missing = correct.filter(function (number) {
        return !selected.has(number);
      });
      const extra = Array.from(selected).filter(function (number) {
        return correct.indexOf(number) === -1;
      });
      state.addAttempt();
      if (missing.length === 0 && extra.length === 0) {
        state.markSolved('r3files');
        ui.closeModal();
        ui.toast('Exclusão concluída.', 'ok');
        G.main.render();
        return;
      }
      if (missing.length > 0 && extra.length > 0) {
        ui.setFeedback(result, 'Há arquivos selecionados que não satisfazem a condição e outros que ainda faltam.', 'bad');
      } else if (extra.length > 0) {
        ui.setFeedback(result, 'Algum arquivo selecionado não satisfaz as três condições ao mesmo tempo.', 'bad');
      } else {
        ui.setFeedback(result, 'Ainda existem arquivos que satisfazem a condição e não foram selecionados.', 'bad');
      }
    });
    ui.append(body, grid, result, run);
    ui.openModal('Terminal de arquivos', body);
  }

  function openLock() {
    if (!state.isSolved('r3files')) {
      ui.toast('O cadeado está coberto por um painel. Delete os arquivos primeiro.', 'bad');
      return;
    }

    const body = ui.el('div', 'stack');
    body.appendChild(ui.el('p', 'modal-text', 'Cadeado final. Marque cada afirmação como V ou F, considerando o domínio dos naturais.'));

    if (state.isSolved('r3lock')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Cadeado aberto. A porta de escape está liberada.'));
      ui.openModal('Cadeado final', body);
      return;
    }

    const toggles = statements.map(function () {
      return ui.createToggle('', null);
    });
    statements.forEach(function (statement, index) {
      const row = ui.el('div', 'statement');
      ui.append(row, ui.el('span', 'statement-text', statement.text), toggles[index].node);
      body.appendChild(row);
    });

    const result = ui.feedback();
    const unlock = ui.button('Destravar', 'btn primary', function () {
      if (toggles.some(function (toggle) { return toggle.get() === null; })) {
        ui.setFeedback(result, 'Responda as duas afirmações.', 'bad');
        return;
      }
      state.addAttempt();
      const wrong = statements.filter(function (statement, index) {
        return toggles[index].get() !== statement.truth();
      }).length;
      if (wrong === 0) {
        state.markSolved('r3lock');
        ui.closeModal();
        ui.toast('Cadeado aberto!', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(result, wrong + ' afirmação(ões) incorreta(s). Procure um contraexemplo ou um elemento que sirva de testemunha.', 'bad');
    });
    ui.append(body, result, unlock);
    ui.openModal('Cadeado final', body);
  }

  function openDoor() {
    if (!state.isSolved('r3lock')) {
      ui.toast('A porta de escape está trancada.', 'bad');
      return;
    }
    G.main.win();
  }

  function build(scene) {
    ui.append(
      scene,
      ui.hotspot({
        cls: 'hs-screen',
        label: 'Tela do servidor',
        glyph: '▣',
        onClick: openScreen
      }),
      ui.hotspot({
        cls: 'hs-manual',
        label: 'Manual',
        glyph: '∀',
        onClick: openManual
      }),
      ui.hotspot({
        cls: 'hs-files',
        label: 'Terminal de arquivos',
        glyph: '⌗',
        status: state.isSolved('r3files') ? 'done' : null,
        onClick: openFiles
      }),
      ui.hotspot({
        cls: 'hs-lock',
        label: 'Cadeado final',
        glyph: '⚿',
        status: state.isSolved('r3lock') ? 'done' : (state.isSolved('r3files') ? null : 'locked'),
        onClick: openLock
      }),
      ui.hotspot({
        cls: 'hs-door',
        label: 'Porta de escape',
        glyph: '⇥',
        status: state.isSolved('r3lock') ? 'done' : 'locked',
        onClick: openDoor
      })
    );
  }

  function hints() {
    if (!state.isSolved('r3files')) {
      return {
        stage: 'r3-files',
        list: [
          'Teste cada número da grade contra as três partes da condição: pertencer a ℕ, ser par e ter quadrado menor que 50.',
          'Números negativos não pertencem a ℕ. Confira a convenção no manual.',
          'x² < 50 vale só até x = 7. Entre os números que sobram, fique apenas com os pares.'
        ]
      };
    }
    if (!state.isSolved('r3lock')) {
      return {
        stage: 'r3-lock',
        list: [
          'Para "para todo" ser verdadeiro, todos os elementos precisam satisfazer. Basta um contraexemplo para derrubar.',
          'Para "existe" ser verdadeiro, basta encontrar um elemento que sirva de testemunha.'
        ]
      };
    }
    return {
      stage: 'r3-done',
      list: ['Tudo resolvido. A porta de escape está aberta.']
    };
  }

  G.rooms[3] = {
    title: 'Servidor Central',
    build: build,
    hints: hints,
    actions: {
      screen: openScreen,
      manual: openManual,
      files: openFiles,
      lock: openLock
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
