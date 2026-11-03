(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const E = G.evaluator;
  const ui = G.ui;
  const state = G.state;
  const LOCK_SECONDS = 10;

  function puzzle() {
    return G.puzzle.r4;
  }

  const laws = [
    ['De Morgan', '¬(P ∧ Q) ≡ ¬P ∨ ¬Q', '¬(P ∨ Q) ≡ ¬P ∧ ¬Q'],
    ['Contrapositiva', 'P → Q ≡ ¬Q → ¬P'],
    ['Implicação material', 'P → Q ≡ ¬P ∨ Q', '¬(P → Q) ≡ P ∧ ¬Q'],
    ['Bicondicional', 'P ↔ Q ≡ (P → Q) ∧ (Q → P)', 'P ↔ Q ≡ (P ∧ Q) ∨ (¬P ∧ ¬Q)'],
    ['Dupla negação', '¬¬P ≡ P'],
    ['Comutatividade', 'P ∧ Q ≡ Q ∧ P', 'P ∨ Q ≡ Q ∨ P', 'P ↔ Q ≡ Q ↔ P']
  ];

  function lockLeft() {
    return Math.max(0, Math.ceil((puzzle().lockUntil - Date.now()) / 1000));
  }

  function guardButton(button, label) {
    function paint() {
      const left = lockLeft();
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

  function penalize(button, label) {
    puzzle().lockUntil = Date.now() + LOCK_SECONDS * 1000;
    guardButton(button, label);
  }

  function premiseList() {
    const list = ui.el('ol', 'premises');
    puzzle().valves.premises.forEach(function (premise) {
      const item = ui.el('li');
      ui.append(
        item,
        ui.el('span', 'sym', premise.formal),
        ui.el('span', '', ' - ' + premise.text)
      );
      list.appendChild(item);
    });
    return list;
  }

  function openLaws() {
    const body = ui.el('div', 'stack');
    const lines = [];
    laws.forEach(function (law) {
      const card = ui.el('div', 'rule');
      card.appendChild(ui.el('h3', '', law[0]));
      law.slice(1).forEach(function (line) {
        card.appendChild(ui.el('div', 'rule-line', line));
        lines.push(line);
      });
      body.appendChild(card);
    });
    G.main.collect('r4-laws', 4, 'Leis de equivalência', laws.map(function (law) {
      return law[0] + ': ' + law.slice(1).join(' ; ');
    }).join('\n'));
    ui.openModal('Leis de equivalência', body);
  }

  function openPremises() {
    const body = ui.el('div', 'stack');
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Registro do reator. Cada letra é uma válvula: V significa aberta e F significa fechada. Todas as premissas abaixo são verdadeiras ao mesmo tempo.'),
      premiseList()
    );
    G.main.collect(
      'r4-premises',
      4,
      'Registro do reator',
      puzzle().valves.premises.map(function (premise, index) {
        return (index + 1) + '. ' + premise.formal + ' - ' + premise.text;
      }).join('\n')
    );
    ui.openModal('Registro do reator', body);
  }

  function openValves() {
    const body = ui.el('div', 'stack');
    if (state.isSolved('r4valves')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Válvulas ajustadas. O reator está estável e o oráculo recebeu energia.'));
      ui.openModal('Painel de válvulas', body);
      return;
    }
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Descubra o estado de cada válvula (V aberta, F fechada) a partir do registro do reator. Cada erro trava o painel por ' + LOCK_SECONDS + ' segundos.'),
      premiseList()
    );
    const names = puzzle().valves.names;
    const toggles = names.map(function (name) {
      return ui.createToggle(name, false);
    });
    const switches = ui.el('div', 'switches');
    toggles.forEach(function (toggle) {
      switches.appendChild(toggle.node);
    });
    const result = ui.feedback();
    const apply = ui.button('Aplicar configuração', 'btn primary', function () {
      if (lockLeft() > 0) {
        return;
      }
      state.addAttempt();
      const solution = puzzle().valves.solution;
      const wrong = names.filter(function (name, index) {
        return toggles[index].get() !== solution[name];
      }).length;
      if (wrong === 0) {
        state.markSolved('r4valves');
        ui.closeModal();
        ui.toast('Reator estabilizado. O oráculo ligou.', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(result, 'Configuração incorreta. O painel travou por ' + LOCK_SECONDS + ' segundos.', 'bad');
      penalize(apply, 'Aplicar configuração');
    });
    ui.append(body, switches, result, apply);
    ui.openModal('Painel de válvulas', body);
    guardButton(apply, 'Aplicar configuração');
  }

  function openOracle() {
    if (!state.isSolved('r4valves')) {
      ui.toast('O oráculo está sem energia. Ajuste as válvulas do reator.', 'bad');
      return;
    }
    const body = ui.el('div', 'stack');
    const data = puzzle().equiv;
    ui.append(
      body,
      ui.el('p', 'modal-text', 'O oráculo exige uma fórmula logicamente equivalente à fórmula-alvo para liberar a porta.'),
      ui.el('p', 'formula', 'F = ' + data.target.text)
    );
    if (state.isSolved('r4equiv')) {
      body.appendChild(ui.el('p', 'feedback ok', 'Equivalência confirmada. A porta de saída está liberada.'));
      ui.openModal('Oráculo', body);
      return;
    }
    let chosen = -1;
    const list = ui.el('div', 'options');
    const buttons = data.options.map(function (option, index) {
      const button = ui.button(String.fromCharCode(65 + index) + ') ' + option.text, 'btn option', function () {
        chosen = index;
        buttons.forEach(function (other, i) {
          other.classList.toggle('is-selected', i === index);
        });
      });
      list.appendChild(button);
      return button;
    });
    const result = ui.feedback();
    const confirm = ui.button('Confirmar equivalência', 'btn primary', function () {
      if (lockLeft() > 0) {
        return;
      }
      if (chosen < 0) {
        ui.setFeedback(result, 'Escolha uma das opções.', 'bad');
        return;
      }
      state.addAttempt();
      if (chosen === data.answerIndex) {
        state.markSolved('r4equiv');
        ui.closeModal();
        ui.toast('Equivalência confirmada. Porta liberada.', 'ok');
        G.main.render();
        return;
      }
      ui.setFeedback(result, 'Essa fórmula não é equivalente. O oráculo travou por ' + LOCK_SECONDS + ' segundos.', 'bad');
      penalize(confirm, 'Confirmar equivalência');
    });
    ui.append(body, list, result, confirm);
    ui.openModal('Oráculo', body);
    guardButton(confirm, 'Confirmar equivalência');
  }

  function hints() {
    if (!state.isSolved('r4valves')) {
      return {
        stage: 'r4-valves',
        list: [
          'Procure uma premissa que determine uma válvula sozinha ou que force um valor quando combinada com outra.',
          'Suponha que uma válvula está aberta e veja se alguma premissa vira contradição. Se virar, ela está fechada.',
          'Cada erro trava o painel por alguns segundos, então deduza antes de testar.'
        ]
      };
    }
    if (!state.isSolved('r4equiv')) {
      return {
        stage: 'r4-equiv',
        list: [
          'Use as leis do quadro: De Morgan, contrapositiva e implicação material.',
          'Descarte opções em que um E virou OU, ou em que a implicação foi invertida, sem justificativa.',
          'Em caso de dúvida, compare a tabela-verdade das 8 linhas da fórmula-alvo com a da opção.'
        ]
      };
    }
    return {
      stage: 'r4-done',
      list: ['Tudo resolvido. A porta de saída está aberta.']
    };
  }

  G.rooms[4] = {
    title: 'Núcleo do Reator',
    hints: hints,
    actions: {
      laws: openLaws,
      premises: openPremises,
      valves: openValves,
      oracle: openOracle
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
