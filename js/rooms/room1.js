(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const E = G.evaluator;
  const ui = G.ui;
  const state = G.state;

  const P = E.v('P');
  const Q = E.v('Q');
  const formula = E.and(E.or(P, E.not(Q)), P);
  const formulaText = 'F = ' + E.render(formula);
  const wallText = 'Para reativar a energia, o circuito precisa de um sinal V (Verdadeiro).';

  function openWallNote() {
    const body = ui.el('div', 'stack');
    body.appendChild(ui.el('p', 'modal-text', wallText));
    G.main.collect('r1-wall', 1, 'Bilhete na parede', wallText);
    ui.openModal('Bilhete na parede', body);
  }

  function connectiveTable(title, node, names) {
    const rows = E.allAssignments(names).map(function (env) {
      return names.map(function (name) {
        return E.label(env[name]);
      }).concat(E.label(E.evaluate(node, env)));
    });
    const wrap = ui.el('div', 'connective');
    ui.append(
      wrap,
      ui.el('h3', '', title),
      ui.table(names.concat(E.render(node)), rows, 'compact')
    );
    return wrap;
  }

  function openBoard() {
    const body = ui.el('div', 'stack');
    const grid = ui.el('div', 'connectives');
    ui.append(
      grid,
      connectiveTable('Negação', E.not(P), ['P']),
      connectiveTable('Conjunção (E)', E.and(P, Q), ['P', 'Q']),
      connectiveTable('Disjunção (OU)', E.or(P, Q), ['P', 'Q']),
      connectiveTable('Implicação (SE... ENTÃO)', E.imp(P, Q), ['P', 'Q'])
    );
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Quadro de conectivos fixado na parede do laboratório.'),
      grid
    );
    G.main.collect(
      'r1-board',
      1,
      'Quadro de conectivos',
      'Negação inverte o valor. P ∧ Q só é V se os dois forem V. P ∨ Q só é F se os dois forem F. P → Q só é F quando P é V e Q é F.'
    );
    ui.openModal('Quadro de conectivos', body);
  }

  function openPanel() {
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', wallText),
      ui.el('p', 'formula', formulaText)
    );

    if (state.isSolved('r1power')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Energia restabelecida. O terminal no centro da sala já responde.'));
      ui.openModal('Painel de energia', body);
      return;
    }

    body.appendChild(ui.el('p', 'modal-text', 'Ajuste os interruptores P e Q e aplique o sinal ao circuito.'));
    const switchP = ui.createToggle('P', false);
    const switchQ = ui.createToggle('Q', false);
    const switches = ui.el('div', 'switches');
    ui.append(switches, switchP.node, switchQ.node);
    const result = ui.feedback();
    const apply = ui.button('Aplicar sinal', 'btn primary', function () {
      state.addAttempt();
      const env = { P: switchP.get(), Q: switchQ.get() };
      if (E.evaluate(formula, env)) {
        state.markSolved('r1power');
        ui.closeModal();
        ui.toast('Energia restabelecida!', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(
        result,
        'Com P = ' + E.label(env.P) + ' e Q = ' + E.label(env.Q) + ', F resulta em F. O circuito continua sem energia.',
        'bad'
      );
    });
    ui.append(body, switches, result, apply);
    ui.openModal('Painel de energia', body);
  }

  function openTerminal() {
    if (!state.isSolved('r1power')) {
      ui.toast('O terminal está sem energia.', 'bad');
      return;
    }

    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Terminal religado. Para registrar o comportamento do circuito, complete a tabela-verdade de F.'),
      ui.el('p', 'formula', formulaText)
    );

    if (state.isSolved('r1table')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Tabela registrada. A porta para o nível 2 está liberada.'));
      ui.openModal('Terminal de energia', body);
      return;
    }

    const rows = E.truthTable(formula);
    const cells = rows.map(function () {
      return ui.createToggle('', null);
    });
    const tableNode = ui.table(
      ['P', 'Q', 'F'],
      rows.map(function (row, index) {
        return [E.label(row.env.P), E.label(row.env.Q), cells[index].node];
      })
    );
    const result = ui.feedback();
    const validate = ui.button('Validar tabela', 'btn primary', function () {
      if (cells.some(function (cell) { return cell.get() === null; })) {
        ui.setFeedback(result, 'Preencha todas as linhas da coluna F.', 'bad');
        return;
      }
      state.addAttempt();
      const wrong = rows.filter(function (row, index) {
        return cells[index].get() !== row.value;
      }).length;
      if (wrong === 0) {
        state.markSolved('r1table');
        ui.closeModal();
        ui.toast('Tabela validada. A porta foi liberada.', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(
        result,
        wrong + ' linha(s) incorreta(s). Calcule primeiro ¬Q, depois P ∨ ¬Q e por fim o ∧ com P.',
        'bad'
      );
    });
    ui.append(body, tableNode, result, validate);
    ui.openModal('Terminal de energia', body);
  }

  function openDoor() {
    if (!state.isSolved('r1table')) {
      ui.toast('A porta está trancada. Restabeleça a energia e valide o terminal.', 'bad');
      return;
    }
    G.main.goToRoom(2);
  }

  function build(scene) {
    if (state.isSolved('r1power')) {
      scene.classList.add('powered');
    }
    ui.append(
      scene,
      ui.hotspot({
        cls: 'hs-note',
        label: 'Bilhete',
        glyph: '✉',
        onClick: openWallNote
      }),
      ui.hotspot({
        cls: 'hs-board',
        label: 'Quadro de conectivos',
        glyph: '▦',
        onClick: openBoard
      }),
      ui.hotspot({
        cls: 'hs-panel',
        label: 'Painel de energia',
        glyph: '⚡',
        status: state.isSolved('r1power') ? 'done' : null,
        onClick: openPanel
      }),
      ui.hotspot({
        cls: 'hs-terminal',
        label: 'Terminal',
        glyph: '⌨',
        status: state.isSolved('r1table') ? 'done' : (state.isSolved('r1power') ? null : 'locked'),
        onClick: openTerminal
      }),
      ui.hotspot({
        cls: 'hs-door',
        label: 'Porta',
        glyph: '⇥',
        status: state.isSolved('r1table') ? 'done' : 'locked',
        onClick: openDoor
      })
    );
  }

  function hints() {
    if (!state.isSolved('r1power')) {
      return {
        stage: 'r1-power',
        list: [
          'Observe o operador principal da fórmula do painel. Ele é uma conjunção (∧).',
          'Uma conjunção só é verdadeira quando os dois lados são verdadeiros. O que isso exige de P?',
          'P precisa estar em V. Depois teste Q em V e em F e veja se muda alguma coisa.'
        ]
      };
    }
    if (!state.isSolved('r1table')) {
      return {
        stage: 'r1-table',
        list: [
          'As linhas da tabela cobrem as quatro combinações de P e Q. Calcule ¬Q primeiro.',
          'Em cada linha, resolva o parêntese P ∨ ¬Q e depois faça o ∧ com P.',
          'Se P é F, a conjunção inteira é F. Se P é V, o parêntese também é V.'
        ]
      };
    }
    return {
      stage: 'r1-done',
      list: ['Tudo resolvido aqui. A porta leva ao nível 2.']
    };
  }

  G.rooms[1] = {
    title: 'Terminal de Energia',
    build: build,
    hints: hints
  };
})(typeof window !== 'undefined' ? window : globalThis);
