(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});

  const controls = [
    ['W A S D ou setas', 'andar e virar'],
    ['Mouse', 'olhar ao redor'],
    ['Shift', 'correr'],
    ['E ou clique', 'interagir com o objeto mirado'],
    ['C', 'abrir o caderno de pistas'],
    ['H', 'pedir uma dica'],
    ['Esc', 'pausar']
  ];

  const rooms = [
    ['Nível 1', 'Tabela-verdade e conectivos: restabeleça a energia e valide a fórmula.'],
    ['Nível 2', 'Dedução com premissas: descubra quem é culpado e abra o cofre.'],
    ['Nível 3', 'Quantificadores sobre os números naturais: ∀ e ∃ decidem a verdade das afirmações.'],
    ['Nível 4', 'Sistema de premissas e equivalências: De Morgan, contrapositiva e implicação material.'],
    ['Nível 5', 'Cavaleiros e mentirosos, quantificadores sobre uma relação e validade de argumentos.']
  ];

  function open() {
    const ui = G.ui;
    const body = ui.el('div', 'stack');
    const minutes = Math.round(G.config.timeLimitSeconds / 60);
    ui.append(
      body,
      ui.el('p', 'modal-text', 'Objetivo: atravessar as ' + G.config.totalRooms + ' salas e sair antes do tempo acabar. Cada porta só abre quando você resolve o desafio de lógica da sala.'),
      ui.el('p', 'modal-text', 'Você tem ' + minutes + ' minutos para a partida inteira. O relógio nunca para e, se zerar, você perde e recomeça.'),
      ui.el('p', 'modal-text', 'Os desafios são sorteados a cada partida, então decorar respostas não funciona. Nas salas 4 e 5, uma resposta errada trava o painel por alguns segundos.')
    );
    const keys = ui.el('div', 'rule');
    keys.appendChild(ui.el('h3', '', 'Controles'));
    controls.forEach(function (item) {
      keys.appendChild(ui.el('div', 'rule-line', item[0] + ' - ' + item[1]));
    });
    body.appendChild(keys);
    const list = ui.el('div', 'rule');
    list.appendChild(ui.el('h3', '', 'A lógica em cada sala'));
    rooms.forEach(function (item) {
      list.appendChild(ui.el('div', 'rule-line', item[0] + ': ' + item[1]));
    });
    body.appendChild(list);
    ui.openModal('Como jogar', body);
  }

  G.help = { open: open };
})(typeof window !== 'undefined' ? window : globalThis);
