(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const ui = G.ui;
  const state = G.state;
  const LOCK_SECONDS = 15;

  function puzzle() {
    return G.puzzle.r5;
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

  function togglePanel(labels, texts) {
    const toggles = labels.map(function (label) {
      return ui.createToggle(label, false);
    });
    const wrap = ui.el('div', 'stack');
    toggles.forEach(function (toggle, i) {
      const row = ui.el('div', 'toggle-row');
      ui.append(row, toggle.node);
      if (texts && texts[i]) {
        row.appendChild(ui.el('div', 'modal-text', texts[i]));
      }
      wrap.appendChild(row);
    });
    return { toggles: toggles, node: wrap };
  }

  function submitStage(config) {
    const body = ui.el('div', 'stack');
    if (state.isSolved(config.key)) {
      body.appendChild(ui.el('p', 'feedback ok', config.doneText));
      ui.openModal(config.title, body);
      return;
    }
    ui.append(body, ui.el('p', 'modal-text', config.intro));
    if (config.extra) {
      body.appendChild(config.extra);
    }
    const panel = togglePanel(config.labels, config.texts);
    const result = ui.feedback();
    const apply = ui.button(config.action, 'btn primary', function () {
      if (lockLeft(config.stage) > 0) {
        return;
      }
      state.addAttempt();
      const wrong = panel.toggles.filter(function (toggle, i) {
        return toggle.get() !== config.answer[i];
      }).length;
      if (wrong === 0) {
        state.markSolved(config.key);
        ui.closeModal();
        ui.toast(config.okToast, 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(result, 'Resposta incorreta. O terminal travou por ' + LOCK_SECONDS + ' segundos.', 'bad');
      penalize(config.stage, apply, config.action);
    });
    ui.append(body, panel.node, result, apply);
    ui.openModal(config.title, body);
    guardButton(config.stage, apply, config.action);
  }

  function openIslands() {
    const data = puzzle().islands;
    const list = ui.el('ol', 'premises');
    data.statements.forEach(function (item) {
      const row = ui.el('li');
      ui.append(row, ui.el('span', 'sym', data.names[item.speaker]), ui.el('span', '', ' diz: "' + item.text + '"'));
      list.appendChild(row);
    });
    submitStage({
      key: 'r5islands',
      stage: 'islands',
      title: 'Ilha dos Cavaleiros',
      intro: 'Cada habitante é cavaleiro (sempre diz a verdade) ou mentiroso (sempre mente). Marque V para cavaleiro e F para mentiroso.',
      extra: list,
      labels: data.names,
      answer: data.solution,
      action: 'Confirmar identidades',
      doneText: 'Identidades confirmadas. O primeiro selo se abriu.',
      okToast: 'Primeiro selo aberto.'
    });
  }

  const TABLEAU_RULES = [
    ['¬¬A', 'A'],
    ['A ∧ B', 'A e B no mesmo ramo'],
    ['¬(A ∧ B)', 'ramo com ¬A e ramo com ¬B'],
    ['A ∨ B', 'ramo com A e ramo com B'],
    ['¬(A ∨ B)', '¬A e ¬B no mesmo ramo'],
    ['A → B', 'ramo com ¬A e ramo com B'],
    ['¬(A → B)', 'A e ¬B no mesmo ramo'],
    ['A ↔ B', 'ramo com A e B e ramo com ¬A e ¬B'],
    ['¬(A ↔ B)', 'ramo com A e ¬B e ramo com ¬A e B']
  ];

  function rulesCard() {
    const card = ui.el('div', 'rule');
    card.appendChild(ui.el('h3', '', 'Regras do tableau'));
    TABLEAU_RULES.forEach(function (rule) {
      card.appendChild(ui.el('div', 'rule-line', rule[0] + '  →  ' + rule[1]));
    });
    card.appendChild(ui.el('div', 'rule-line', 'Um ramo fecha ao conter X e ¬X. Se algum ramo completo fica aberto, o conjunto é satisfatível.'));
    return card;
  }

  function openTableau() {
    const data = puzzle().tableau;
    const extra = ui.el('div', 'stack');
    const list = ui.el('ol', 'premises');
    data.sets.forEach(function (set) {
      const row = ui.el('li');
      row.appendChild(ui.el('span', 'sym', '{ ' + set.formulas.map(function (item) { return item.text; }).join(' ,  ') + ' }'));
      list.appendChild(row);
    });
    ui.append(extra, rulesCard(), list);
    G.main.collect(
      'r5-tableau',
      5,
      'Regras do tableau',
      TABLEAU_RULES.map(function (rule) { return rule[0] + ' -> ' + rule[1]; }).join('\n') + '\nRamo fecha com X e ¬X. Ramo aberto completo = satisfatível.'
    );
    submitStage({
      key: 'r5tableau',
      stage: 'tableau',
      title: 'Árvore de Refutação',
      intro: 'Para cada conjunto, monte o tableau com as regras abaixo. Marque V se o conjunto é satisfatível (existe ramo aberto) e F se todos os ramos fecham.',
      extra: extra,
      labels: data.sets.map(function (item, i) { return String(i + 1); }),
      answer: data.sets.map(function (item) { return item.sat; }),
      action: 'Validar tableaux',
      doneText: 'Tableaux validados. O segundo selo se abriu.',
      okToast: 'Segundo selo aberto.'
    });
  }

  function openArgs() {
    const data = puzzle().args;
    const extra = ui.el('div', 'stack');
    data.items.forEach(function (item, i) {
      const card = ui.el('div', 'rule');
      card.appendChild(ui.el('h3', '', 'Argumento ' + (i + 1)));
      item.premises.forEach(function (premise) {
        card.appendChild(ui.el('div', 'rule-line', premise.text));
      });
      card.appendChild(ui.el('div', 'rule-line', '∴ ' + item.conclusion.text));
      extra.appendChild(card);
    });
    submitStage({
      key: 'r5args',
      stage: 'args',
      title: 'Terminal de Argumentos',
      intro: 'Um argumento é válido quando a conclusão é verdadeira em toda situação em que todas as premissas são verdadeiras. Marque V nos válidos e F nos inválidos.',
      extra: extra,
      labels: data.items.map(function (item, i) { return String(i + 1); }),
      answer: data.items.map(function (item) { return item.valid; }),
      action: 'Julgar argumentos',
      doneText: 'Argumentos julgados. O terceiro selo se abriu.',
      okToast: 'Terceiro selo aberto.'
    });
  }

  function hints() {
    if (!state.isSolved('r5islands')) {
      return {
        stage: 'r5-islands',
        list: [
          'Um cavaleiro diz algo verdadeiro e um mentiroso diz algo falso: cada fala equivale a "pessoa ↔ afirmação".',
          'Escolha uma pessoa, suponha que é cavaleiro e propague. Se houver contradição, ela é mentirosa.',
          'Cada erro trava o terminal por alguns segundos, então confira antes de enviar.'
        ]
      };
    }
    if (!state.isSolved('r5tableau')) {
      return {
        stage: 'r5-tableau',
        list: [
          'Comece pelas regras que não abrem ramos (∧, ¬∨, ¬→, ¬¬) e deixe as que bifurcam para depois.',
          'Um ramo fecha quando contém uma fórmula e a sua negação. Basta um ramo aberto e completo para o conjunto ser satisfatível.',
          'Se todos os ramos fecham, o conjunto é insatisfatível: nenhuma linha da tabela-verdade torna todas as fórmulas verdadeiras.'
        ]
      };
    }
    if (!state.isSolved('r5args')) {
      return {
        stage: 'r5-args',
        list: [
          'Para refutar um argumento, procure uma atribuição que torne todas as premissas verdadeiras e a conclusão falsa.',
          'Afirmar o consequente e negar o antecedente são falácias clássicas.',
          'Modus ponens, modus tollens, silogismo hipotético e silogismo disjuntivo são válidos.'
        ]
      };
    }
    return { stage: 'r5-done', list: ['Tudo resolvido. A saída está aberta.'] };
  }

  G.rooms[5] = {
    title: 'Câmara Final',
    hints: hints,
    actions: {
      islands: openIslands,
      tableau: openTableau,
      args: openArgs
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
