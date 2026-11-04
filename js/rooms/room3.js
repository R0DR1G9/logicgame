(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const ui = G.ui;
  const state = G.state;
  const LOCK_SECONDS = 15;

  function puzzle() {
    return G.puzzle.r3;
  }

  function lockLeft(stage) {
    return Math.max(0, Math.ceil((puzzle().lockUntil[stage] - Date.now()) / 1000));
  }

  function guardButton(stage, button, label) {
    function paint() {
      const left = lockLeft(stage);
      if (!root.document.body.contains(button)) {
        return true;
      }
      button.disabled = left > 0;
      button.textContent = left > 0 ? 'Aguarde ' + left + 's' : label;
      return left === 0;
    }
    if (paint()) {
      return;
    }
    const timer = root.setInterval(function () {
      if (paint()) {
        root.clearInterval(timer);
      }
    }, 250);
  }

  function penalize(stage, button, label) {
    puzzle().lockUntil[stage] = Date.now() + LOCK_SECONDS * 1000;
    guardButton(stage, button, label);
  }

  const MANUAL = [
    ['Tautologia', 'Fórmula que dá verdadeiro em todas as linhas da tabela-verdade.'],
    ['Contradição', 'Fórmula que dá falso em todas as linhas da tabela-verdade.'],
    ['Contingência', 'Fórmula que dá verdadeiro em algumas linhas e falso em outras.'],
    ['Precedência', 'Sem parênteses, resolva nesta ordem: ¬, ∧, ∨, →, ↔. Por exemplo, P ∨ Q ∧ R significa P ∨ (Q ∧ R).'],
    ['Implicação lógica', 'A ⇒ B vale quando A → B é tautologia, ou seja, nenhuma linha deixa A verdadeira e B falsa.'],
    ['Propriedades', 'A implicação é reflexiva (A ⇒ A) e transitiva (se A ⇒ B e B ⇒ C, então A ⇒ C).']
  ];

  function openScreen() {
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Fila de quarentena do servidor. Cada arquivo carrega uma fórmula que precisa ser classificada no terminal.')
    );
    const list = ui.el('ol', 'premises');
    puzzle().formulas.forEach(function (item) {
      const row = ui.el('li');
      row.appendChild(ui.el('span', 'sym', item.text));
      list.appendChild(row);
    });
    body.appendChild(list);
    G.main.collect(
      'r3-screen',
      3,
      'Fila de quarentena',
      puzzle().formulas.map(function (item, index) {
        return (index + 1) + '. ' + item.text;
      }).join('\n')
    );
    ui.openModal('Tela do servidor', body);
  }

  function openManual() {
    const body = ui.el('div', 'stack');
    const lines = [];
    MANUAL.forEach(function (item) {
      const card = ui.el('div', 'rule');
      card.appendChild(ui.el('h3', '', item[0]));
      card.appendChild(ui.el('div', 'rule-line', item[1]));
      body.appendChild(card);
      lines.push(item[0] + ': ' + item[1]);
    });
    G.main.collect('r3-manual', 3, 'Manual de classificação', lines.join('\n'));
    ui.openModal('Manual de classificação', body);
  }

  function openFiles() {
    const body = ui.el('div', 'stack');
    if (state.isSolved('r3files')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Todos os arquivos foram classificados. O cadeado final foi exposto.'));
      ui.openModal('Terminal de arquivos', body);
      return;
    }
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Clique em cada fórmula para escolher se ela é tautologia, contradição ou contingência. Um erro trava o terminal por ' + LOCK_SECONDS + ' segundos.')
    );
    const kinds = puzzle().kinds;
    const choices = puzzle().formulas.map(function () { return -1; });
    puzzle().formulas.forEach(function (item, index) {
      const row = ui.el('div', 'statement');
      const button = ui.button('?', 'btn option', function () {
        choices[index] = (choices[index] + 1) % kinds.length;
        button.textContent = kinds[choices[index]];
        button.classList.add('is-selected');
      });
      ui.append(row, ui.el('span', 'statement-text', item.text), button);
      body.appendChild(row);
    });
    const result = ui.feedback();
    const run = ui.button('Executar classificação', 'btn primary', function () {
      if (lockLeft('files') > 0) {
        return;
      }
      if (choices.some(function (choice) { return choice < 0; })) {
        ui.setFeedback(result, 'Classifique todas as fórmulas.', 'bad');
        return;
      }
      state.addAttempt();
      const wrong = puzzle().formulas.filter(function (item, index) {
        return item.kind !== choices[index];
      }).length;
      if (wrong === 0) {
        state.markSolved('r3files');
        ui.closeModal();
        ui.toast('Classificação concluída.', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(result, 'Classificação incorreta. O terminal travou por ' + LOCK_SECONDS + ' segundos.', 'bad');
      penalize('files', run, 'Executar classificação');
    });
    ui.append(body, result, run);
    ui.openModal('Terminal de arquivos', body);
    guardButton('files', run, 'Executar classificação');
  }

  function openLock() {
    if (!state.isSolved('r3files')) {
      ui.toast('O cadeado está coberto por um painel. Classifique os arquivos primeiro.', 'bad');
      return;
    }
    const body = ui.el('div', 'stack');
    if (state.isSolved('r3lock')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Cadeado aberto. A porta está liberada.'));
      ui.openModal('Cadeado final', body);
      return;
    }
    body.appendChild(ui.el('p', 'modal-text', 'Marque V quando a implicação lógica A ⇒ B vale e F quando não vale. Um erro trava o cadeado por ' + LOCK_SECONDS + ' segundos.'));
    const toggles = puzzle().implications.map(function () {
      return ui.createToggle('', null);
    });
    puzzle().implications.forEach(function (item, index) {
      const row = ui.el('div', 'statement');
      ui.append(row, ui.el('span', 'statement-text', item.left.text + '  ⇒  ' + item.right.text), toggles[index].node);
      body.appendChild(row);
    });
    const result = ui.feedback();
    const unlock = ui.button('Destravar', 'btn primary', function () {
      if (lockLeft('lock') > 0) {
        return;
      }
      if (toggles.some(function (toggle) { return toggle.get() === null; })) {
        ui.setFeedback(result, 'Responda todas as implicações.', 'bad');
        return;
      }
      state.addAttempt();
      const wrong = puzzle().implications.filter(function (item, index) {
        return toggles[index].get() !== item.valid;
      }).length;
      if (wrong === 0) {
        state.markSolved('r3lock');
        ui.closeModal();
        ui.toast('Cadeado aberto!', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(result, 'Resposta incorreta. O cadeado travou por ' + LOCK_SECONDS + ' segundos.', 'bad');
      penalize('lock', unlock, 'Destravar');
    });
    ui.append(body, result, unlock);
    ui.openModal('Cadeado final', body);
    guardButton('lock', unlock, 'Destravar');
  }

  function hints() {
    if (!state.isSolved('r3files')) {
      return {
        stage: 'r3-files',
        list: [
          'Monte a tabela-verdade: se todas as linhas dão V é tautologia, se todas dão F é contradição, senão é contingência.',
          'Respeite a precedência: ¬ primeiro, depois ∧, ∨, → e por último ↔.',
          'Procure uma única linha que dê V e outra que dê F. Se achar as duas, é contingência e você pode parar.'
        ]
      };
    }
    if (!state.isSolved('r3lock')) {
      return {
        stage: 'r3-lock',
        list: [
          'A ⇒ B só vale se não existir linha com A verdadeira e B falsa.',
          'Para derrubar uma implicação, procure uma atribuição que torne A verdadeira e B falsa.',
          'Modus ponens, modus tollens e silogismo disjuntivo aparecem aqui como implicações que valem.'
        ]
      };
    }
    return { stage: 'r3-done', list: ['Tudo resolvido. A porta está aberta.'] };
  }

  G.rooms[3] = {
    title: 'Servidor Central',
    hints: hints,
    actions: {
      screen: openScreen,
      manual: openManual,
      files: openFiles,
      lock: openLock
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
