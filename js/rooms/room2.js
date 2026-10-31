(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const E = G.evaluator;
  const ui = G.ui;
  const state = G.state;

  const names = ['A', 'B', 'C', 'D'];
  const A = E.v('A');
  const B = E.v('B');
  const C = E.v('C');
  const D = E.v('D');

  const premises = [
    { node: E.imp(A, B), text: 'Se A é culpado, então B (cúmplice) também é culpado.' },
    { node: E.or(B, C), text: 'B é culpado ou C é culpado.' },
    { node: E.not(C), text: 'C não é culpado.' },
    { node: A, text: 'A é culpado.' },
    { node: E.imp(D, C), text: 'Se D é culpado, então C é culpado.' }
  ];

  const codeRule = 'A senha tem 4 dígitos: primeiro os números dos inocentes em ordem crescente, depois os números dos culpados em ordem crescente.';
  const suspectKey = 'A = 1, B = 2, C = 3, D = 4';

  function computeCode() {
    const forced = E.forcedValues(
      premises.map(function (premise) {
        return premise.node;
      }),
      names
    );
    const innocents = names.filter(function (name) {
      return forced[name] === false;
    });
    const culprits = names.filter(function (name) {
      return forced[name] === true;
    });
    return innocents.concat(culprits).map(function (name) {
      return String(names.indexOf(name) + 1);
    }).join('');
  }

  const CODE = computeCode();

  function premiseList(items, offset) {
    const list = ui.el('ol', 'premises');
    list.start = offset + 1;
    items.forEach(function (premise) {
      const item = ui.el('li');
      ui.append(
        item,
        ui.el('span', 'sym', E.render(premise.node)),
        ui.el('span', '', ' - ' + premise.text)
      );
      list.appendChild(item);
    });
    return list;
  }

  function openDiary() {
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Diário do investigador. Sejam A, B, C e D as proposições "o suspeito é culpado". Cada suspeito tem um número: ' + suspectKey + '.'),
      premiseList(premises.slice(0, 4), 0),
      ui.el('p', 'modal-text', codeRule),
      ui.el('p', 'modal-text', 'A página 5 foi arrancada do diário. Talvez esteja guardada em algum lugar da mesa.')
    );
    G.main.collect(
      'r2-diary',
      2,
      'Diário do investigador',
      'Suspeitos: ' + suspectKey + '.\n' +
        premises.slice(0, 4).map(function (premise, index) {
          return (index + 1) + '. ' + E.render(premise.node) + ' - ' + premise.text;
        }).join('\n') + '\n' + codeRule
    );
    ui.openModal('Diário do investigador', body);
  }

  function openDrawer() {
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Você encontrou a página 5 do diário:'),
      premiseList(premises.slice(4), 4)
    );
    G.main.collect(
      'r2-drawer',
      2,
      'Página 5 do diário',
      '5. ' + E.render(premises[4].node) + ' - ' + premises[4].text
    );
    ui.openModal('Gaveta da mesa', body);
  }

  function ruleCard(title, lines, conclusion) {
    const card = ui.el('div', 'rule');
    card.appendChild(ui.el('h3', '', title));
    lines.forEach(function (line) {
      card.appendChild(ui.el('div', 'rule-line', line));
    });
    card.appendChild(ui.el('div', 'rule-line conclusion', '∴ ' + conclusion));
    return card;
  }

  function openRules() {
    const p = E.v('P');
    const q = E.v('Q');
    const body = ui.el('div', 'stack');
    const rules = ui.el('div', 'rules');
    ui.append(
      rules,
      ruleCard('Modus Ponens', [E.render(E.imp(p, q)), E.render(p)], E.render(q)),
      ruleCard('Modus Tollens', [E.render(E.imp(p, q)), E.render(E.not(q))], E.render(E.not(p))),
      ruleCard('Silogismo Disjuntivo', [E.render(E.or(p, q)), E.render(E.not(p))], E.render(q))
    );
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Quadro de regras de inferência. As linhas de cima são as premissas e a última é a conclusão.'),
      rules
    );
    G.main.collect(
      'r2-rules',
      2,
      'Regras de inferência',
      'Modus Ponens: de P → Q e P, conclui-se Q.\nModus Tollens: de P → Q e ¬Q, conclui-se ¬P.\nSilogismo Disjuntivo: de P ∨ Q e ¬P, conclui-se Q.'
    );
    ui.openModal('Quadro de regras', body);
  }

  function openSafe() {
    const body = ui.el('div', 'stack');

    if (state.isSolved('r2safe')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Cofre aberto. A chave da porta está com você.'));
      ui.openModal('Cofre', body);
      return;
    }

    body.appendChild(ui.el('p', 'modal-text', 'Cofre com senha de 4 dígitos. Deduza quem é culpado e quem é inocente para descobrir o código.'));
    const display = ui.el('div', 'safe-display');
    const result = ui.feedback();
    let entered = '';

    function paint() {
      display.textContent = (entered + '----').slice(0, 4);
    }

    function press(digit) {
      if (entered.length < 4) {
        entered += digit;
        paint();
      }
    }

    function submit() {
      if (entered.length < 4) {
        ui.setFeedback(result, 'Digite os 4 dígitos.', 'bad');
        return;
      }
      state.addAttempt();
      if (entered === CODE) {
        state.markSolved('r2safe');
        ui.closeModal();
        ui.toast('Cofre aberto!', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(result, 'Senha incorreta. Reveja as deduções.', 'bad');
      ui.shake(display);
      entered = '';
      paint();
    }

    const keypad = ui.el('div', 'keypad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(function (digit) {
      keypad.appendChild(ui.button(digit, 'key', function () {
        press(digit);
      }));
    });
    ui.append(
      keypad,
      ui.button('C', 'key', function () {
        entered = '';
        paint();
      }),
      ui.button('0', 'key', function () {
        press('0');
      }),
      ui.button('OK', 'key confirm', submit)
    );

    paint();
    ui.append(body, display, keypad, result);
    ui.openModal('Cofre', body);
  }

  function openDoor() {
    if (!state.isSolved('r2safe')) {
      ui.toast('A porta está trancada. A chave está dentro do cofre.', 'bad');
      return;
    }
    G.main.goToRoom(3);
  }

  function build(scene) {
    ui.append(
      scene,
      ui.hotspot({
        cls: 'hs-diary',
        label: 'Diário',
        glyph: '✎',
        onClick: openDiary
      }),
      ui.hotspot({
        cls: 'hs-drawer',
        label: 'Gaveta',
        glyph: '▭',
        onClick: openDrawer
      }),
      ui.hotspot({
        cls: 'hs-rules',
        label: 'Quadro de regras',
        glyph: '∴',
        onClick: openRules
      }),
      ui.hotspot({
        cls: 'hs-safe',
        label: 'Cofre',
        glyph: '⚿',
        status: state.isSolved('r2safe') ? 'done' : null,
        onClick: openSafe
      }),
      ui.hotspot({
        cls: 'hs-door',
        label: 'Porta',
        glyph: '⇥',
        status: state.isSolved('r2safe') ? 'done' : 'locked',
        onClick: openDoor
      })
    );
  }

  function hints() {
    if (!state.hasNote('r2-drawer')) {
      return {
        stage: 'r2-search',
        list: [
          'Leia o diário com atenção. Ele menciona uma página que falta.',
          'Procure a página que falta nos móveis da mesa. Ela traz a premissa 5.'
        ]
      };
    }
    if (!state.isSolved('r2safe')) {
      return {
        stage: 'r2-deduce',
        list: [
          'Comece com Modus Ponens usando as premissas 1 e 4.',
          'Com as premissas 2 e 3, o Silogismo Disjuntivo confirma uma das conclusões anteriores.',
          'Com as premissas 5 e 3, use Modus Tollens para saber se D é culpado.',
          'Releia a regra de montagem da senha no diário: inocentes primeiro, depois culpados, cada grupo em ordem crescente.'
        ]
      };
    }
    return {
      stage: 'r2-done',
      list: ['Cofre aberto. Use a porta para ir ao nível 3.']
    };
  }

  G.rooms[2] = {
    title: 'Cofre do Enigma',
    build: build,
    hints: hints
  };
})(typeof window !== 'undefined' ? window : globalThis);
