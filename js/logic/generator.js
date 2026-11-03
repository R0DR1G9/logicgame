(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const E = G.evaluator;

  const SALT = [0, 0x9e3779b1, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f, 0x165667b1];

  function rngFor(seed, room) {
    return G.rng.create((seed ^ SALT[room]) >>> 0);
  }

  function randomFormula(rng, names, depth) {
    const ops = ['and', 'or', 'imp', 'imp', 'or', 'and', 'iff'];
    function leaf() {
      const node = E.v(rng.pick(names));
      return rng.chance(0.4) ? E.not(node) : node;
    }
    function build(level) {
      if (level === 0 || (level < depth && rng.chance(0.25))) {
        return leaf();
      }
      const op = rng.pick(ops);
      const left = build(level - 1);
      const right = build(level - 1);
      return { type: op, args: [left, right] };
    }
    return build(depth);
  }

  const STYLES = {
    suspect: {
      yes: function (name) { return name + ' é culpado'; },
      no: function (name) { return name + ' não é culpado'; }
    },
    valve: {
      yes: function (name) { return 'a válvula ' + name + ' está aberta'; },
      no: function (name) { return 'a válvula ' + name + ' está fechada'; }
    }
  };

  function textOf(node, style) {
    if (node.type === 'var') {
      return style.yes(node.name);
    }
    if (node.type === 'not') {
      const inner = node.args[0];
      if (inner.type === 'var') {
        return style.no(inner.name);
      }
      return 'não é verdade que ' + textOf(inner, style);
    }
    const left = textOf(node.args[0], style);
    const right = textOf(node.args[1], style);
    if (node.type === 'and') {
      return left + ' e ' + right;
    }
    if (node.type === 'or') {
      return left + ' ou ' + right;
    }
    if (node.type === 'imp') {
      return 'se ' + left + ', então ' + right;
    }
    return left + ' se, e somente se, ' + right;
  }

  function describe(node, styleName) {
    const text = textOf(node, STYLES[styleName || 'suspect']);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function redundant(node) {
    if (node.type === 'var') {
      return false;
    }
    if (node.args.length === 2 && E.render(node.args[0]) === E.render(node.args[1])) {
      return true;
    }
    return node.args.some(redundant);
  }

  function room1(seed) {
    const rng = rngFor(seed, 1);
    const names = ['P', 'Q'];
    for (let tries = 0; tries < 500; tries++) {
      const formula = randomFormula(rng, names, 2 + (tries % 2));
      const used = E.variablesOf(formula);
      if (used.length !== 2 || redundant(formula)) {
        continue;
      }
      const table = E.truthTable(formula);
      const trues = table.filter(function (row) {
        return row.value;
      }).length;
      if (trues < 1 || trues > 3) {
        continue;
      }
      const text = E.render(formula);
      if (text.length < 7 || text.length > 22) {
        continue;
      }
      return { formula: formula, text: text, label: 'F = ' + text };
    }
    const fallback = E.and(E.or(E.v('P'), E.not(E.v('Q'))), E.v('P'));
    return { formula: fallback, text: E.render(fallback), label: 'F = ' + E.render(fallback) };
  }

  function room2(seed) {
    const rng = rngFor(seed, 2);
    const names = ['A', 'B', 'C', 'D'];
    const numbers = rng.shuffle([1, 2, 3, 4]);
    const numberOf = {};
    names.forEach(function (name, i) {
      numberOf[name] = numbers[i];
    });

    for (let tries = 0; tries < 800; tries++) {
      const env = {};
      let guilty = 0;
      names.forEach(function (name) {
        env[name] = rng.chance(0.5);
        guilty += env[name] ? 1 : 0;
      });
      if (guilty < 1 || guilty > 3) {
        continue;
      }
      const pool = [];
      names.forEach(function (x) {
        pool.push({ node: E.v(x), literal: true });
        pool.push({ node: E.not(E.v(x)), literal: true });
        names.forEach(function (y) {
          if (x === y) {
            return;
          }
          const a = E.v(x);
          const b = E.v(y);
          [E.imp(a, b), E.or(a, b), E.iff(a, b), E.not(E.and(a, b)), E.imp(E.not(a), b), E.or(a, E.not(b)), E.and(a, E.not(b))].forEach(function (node) {
            pool.push({ node: node, literal: false });
          });
        });
      });
      const valid = pool.filter(function (item) {
        return E.evaluate(item.node, env);
      });
      const picked = rng.shuffle(valid).slice(0, 5);
      if (picked.length < 5 || picked.filter(function (item) { return item.literal; }).length > 2) {
        continue;
      }
      const nodes = picked.map(function (item) {
        return item.node;
      });
      const all = E.forcedValues(nodes, names);
      if (names.some(function (name) { return all[name] === null; })) {
        continue;
      }
      const partial = E.forcedValues(nodes.slice(0, 4), names);
      if (names.every(function (name) { return partial[name] !== null; })) {
        continue;
      }
      const innocents = names.filter(function (name) { return all[name] === false; });
      const culprits = names.filter(function (name) { return all[name] === true; });
      const ordered = innocents.map(function (name) { return numberOf[name]; }).sort(function (a, b) { return a - b; })
        .concat(culprits.map(function (name) { return numberOf[name]; }).sort(function (a, b) { return a - b; }));
      return {
        names: names,
        numberOf: numberOf,
        key: names.map(function (name) { return name + ' = ' + numberOf[name]; }).join(', '),
        premises: picked.map(function (item) {
          return { node: item.node, text: describe(item.node) + '.' };
        }),
        code: ordered.join(''),
        forced: all
      };
    }
    return null;
  }

  const PRECEDENCE = { not: 5, and: 4, or: 3, imp: 2, iff: 1 };
  const OPERATOR = { and: '∧', or: '∨', imp: '→', iff: '↔' };

  function renderPrecedence(node) {
    if (node.type === 'var') {
      return node.name;
    }
    if (node.type === 'not') {
      const child = node.args[0];
      const inner = renderPrecedence(child);
      return '¬' + (child.type === 'var' || child.type === 'not' ? inner : '(' + inner + ')');
    }
    const parts = node.args.map(function (child) {
      const text = renderPrecedence(child);
      const tighter = child.type === 'var' || child.type === 'not' || PRECEDENCE[child.type] > PRECEDENCE[node.type];
      return tighter ? text : '(' + text + ')';
    });
    return parts[0] + ' ' + OPERATOR[node.type] + ' ' + parts[1];
  }

  const TAUTOLOGIES = [
    'P ∨ ¬P', 'P → P', '(P ∧ Q) → P', 'P → (P ∨ Q)', '((P → Q) ∧ P) → Q', '¬(P ∧ Q) ↔ (¬P ∨ ¬Q)',
    '(P → Q) ↔ (¬Q → ¬P)', '((P → Q) ∧ (Q → R)) → (P → R)', 'P ↔ ¬¬P', '((P ∨ Q) ∧ ¬P) → Q',
    '¬(P ∨ Q) ↔ (¬P ∧ ¬Q)', '(P ∧ Q) ↔ (Q ∧ P)', 'P ∧ Q → Q ∨ R', '(P → Q) ∨ (Q → P)', 'P → (Q → P)'
  ];

  const CONTRADICTIONS = [
    'P ∧ ¬P', '¬(P → P)', 'P ↔ ¬P', '(P → Q) ∧ P ∧ ¬Q', '¬(P ∨ ¬P)', '(P ∨ Q) ∧ ¬P ∧ ¬Q',
    '¬((P → Q) ↔ (¬P ∨ Q))', '(P ∧ Q) ∧ ¬(P ∨ Q)', '¬(P → (Q → P))', '(P ↔ Q) ∧ (P ∧ ¬Q)',
    '¬(P ∨ Q) ∧ (P ∨ R) ∧ ¬R', 'P ∧ (P → Q) ∧ ¬(P ∧ Q)'
  ];

  const CONTINGENCIES = [
    'P → Q', 'P ∧ Q', 'P ∨ Q', '(P → Q) → (Q → P)', 'P ↔ Q', '¬P ∨ (Q ∧ R)', '(P ∨ Q) → (P ∧ Q)',
    '(P → Q) ∧ (Q → R)', '¬(P ∧ Q) → R', 'P ∧ ¬Q', '(P ∧ Q) → (P ↔ R)', '(P ∨ Q) ∧ (¬P ∨ R)',
    '¬P → (Q ∨ R)', '(P → Q) ↔ (Q → R)'
  ];

  const IMPLICATIONS = [
    ['P ∧ Q', 'P'], ['P', 'P ∨ Q'], ['(P → Q) ∧ P', 'Q'], ['(P → Q) ∧ ¬Q', '¬P'], ['(P ∨ Q) ∧ ¬P', 'Q'],
    ['(P → Q) ∧ (Q → R)', 'P → R'], ['P', 'P'], ['P ∧ Q', 'P ↔ Q'], ['¬(P ∨ Q)', '¬P'], ['P ↔ Q', 'P → Q'],
    ['Q', 'P ∧ Q'], ['P ∨ Q', 'P'], ['(P → Q) ∧ Q', 'P'], ['(P → Q) ∧ ¬P', '¬Q'], ['P → Q', 'Q → P'],
    ['P', 'P ∧ Q'], ['¬(P ∧ Q)', '¬P'], ['P ↔ Q', 'P ∧ Q'], ['P ∨ Q', 'P ↔ Q'], ['(P → R) ∧ (Q → R)', 'P → Q']
  ];

  function renameMap(rng, symbols) {
    const letters = rng.shuffle(['P', 'Q', 'R', 'S']);
    const map = {};
    symbols.forEach(function (symbol, i) {
      map[symbol] = E.v(letters[i]);
    });
    return map;
  }

  function classify(node) {
    const values = E.truthTable(node).map(function (row) { return row.value; });
    if (values.every(Boolean)) {
      return 0;
    }
    if (values.every(function (value) { return !value; })) {
      return 1;
    }
    return 2;
  }

  function pickClassified(rng, pool, kind, count, taken) {
    const picked = [];
    const order = rng.shuffle(pool.slice());
    for (let i = 0; i < order.length && picked.length < count; i++) {
      const map = renameMap(rng, ['P', 'Q', 'R']);
      const node = substitute(parseSimple(order[i]), map);
      const text = renderPrecedence(node);
      if (classify(node) !== kind || taken.has(text)) {
        continue;
      }
      taken.add(text);
      picked.push({ text: text, node: node, kind: kind });
    }
    return picked;
  }

  function implicationsStage(rng) {
    for (let tries = 0; tries < 400; tries++) {
      const order = rng.shuffle(IMPLICATIONS.slice()).slice(0, 5);
      const items = order.map(function (pair) {
        const map = renameMap(rng, ['P', 'Q', 'R']);
        const left = substitute(parseSimple(pair[0]), map);
        const right = substitute(parseSimple(pair[1]), map);
        const names = E.variablesOf(E.and(left, right));
        return {
          left: { text: renderPrecedence(left), node: left },
          right: { text: renderPrecedence(right), node: right },
          valid: E.entails([left], right, names)
        };
      });
      const valid = items.filter(function (item) { return item.valid; }).length;
      if (valid >= 2 && valid <= 3) {
        return items;
      }
    }
    return null;
  }

  function room3(seed) {
    const rng = rngFor(seed, 3);
    const taken = new Set();
    const formulas = pickClassified(rng, TAUTOLOGIES, 0, 2, taken)
      .concat(pickClassified(rng, CONTRADICTIONS, 1, 2, taken))
      .concat(pickClassified(rng, CONTINGENCIES, 2, 2, taken));
    const implications = implicationsStage(rng);
    if (formulas.length !== 6 || !implications) {
      return null;
    }
    return {
      kinds: ['Tautologia', 'Contradição', 'Contingência'],
      formulas: rng.shuffle(formulas),
      implications: implications,
      lockUntil: { files: 0, lock: 0 }
    };
  }

  function pickTemplates(rng, names) {
    const distinct = function (count) {
      return rng.shuffle(names).slice(0, count).map(function (name) { return E.v(name); });
    };
    const makers = [
      function () { const v = distinct(1); return { node: v[0], literal: true }; },
      function () { const v = distinct(1); return { node: E.not(v[0]), literal: true }; },
      function () { const v = distinct(2); return { node: E.imp(v[0], v[1]) }; },
      function () { const v = distinct(2); return { node: E.imp(v[0], E.not(v[1])) }; },
      function () { const v = distinct(2); return { node: E.or(v[0], v[1]) }; },
      function () { const v = distinct(2); return { node: E.or(E.not(v[0]), v[1]) }; },
      function () { const v = distinct(2); return { node: E.iff(v[0], v[1]) }; },
      function () { const v = distinct(2); return { node: E.not(E.iff(v[0], v[1])) }; },
      function () { const v = distinct(2); return { node: E.not(E.and(v[0], v[1])) }; },
      function () { const v = distinct(3); return { node: E.imp(E.and(v[0], v[1]), v[2]) }; },
      function () { const v = distinct(3); return { node: E.imp(E.or(v[0], v[1]), v[2]) }; },
      function () { const v = distinct(3); return { node: E.imp(v[0], E.and(v[1], v[2])) }; },
      function () { const v = distinct(3); return { node: E.imp(v[0], E.or(v[1], v[2])) }; },
      function () { const v = distinct(3); return { node: E.or(E.and(v[0], v[1]), v[2]) }; },
      function () { const v = distinct(3); return { node: E.iff(v[0], E.and(v[1], v[2])) }; },
      function () { const v = distinct(3); return { node: E.iff(v[0], E.or(v[1], v[2])) }; },
      function () { const v = distinct(3); return { node: E.imp(E.not(v[0]), E.or(v[1], v[2])) }; }
    ];
    return makers[rng.int(0, makers.length - 1)]();
  }

  function valvesStage(rng) {
    const names = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let tries = 0; tries < 2000; tries++) {
      const env = {};
      let open = 0;
      names.forEach(function (name) {
        env[name] = rng.chance(0.5);
        open += env[name] ? 1 : 0;
      });
      if (open < 2 || open > 4) {
        continue;
      }
      const seenText = new Set();
      let list = [];
      for (let k = 0; k < 400 && list.length < 40; k++) {
        const item = pickTemplates(rng, names);
        const text = E.render(item.node);
        if (seenText.has(text) || !E.evaluate(item.node, env)) {
          continue;
        }
        seenText.add(text);
        list.push(item);
      }
      if (E.models(list.map(function (item) { return item.node; }), names).length !== 1) {
        continue;
      }
      const order = rng.shuffle(list).sort(function (a, b) {
        return (b.literal ? 1 : 0) - (a.literal ? 1 : 0);
      });
      order.forEach(function (item) {
        if (list.length <= 6) {
          return;
        }
        const rest = list.filter(function (other) { return other !== item; });
        if (E.models(rest.map(function (other) { return other.node; }), names).length === 1) {
          list = rest;
        }
      });
      if (list.length > 8 || list.filter(function (item) { return item.literal; }).length > 1) {
        continue;
      }
      const premises = rng.shuffle(list).map(function (item) {
        return { node: item.node, formal: E.render(item.node), text: describe(item.node, 'valve') + '.' };
      });
      return { names: names, premises: premises, solution: env };
    }
    return null;
  }

  function subPaths(node, path, out) {
    out.push(path);
    if (node.type !== 'var') {
      node.args.forEach(function (child, i) {
        subPaths(child, path.concat(i), out);
      });
    }
    return out;
  }

  function getAt(node, path) {
    return path.reduce(function (current, i) { return current.args[i]; }, node);
  }

  function setAt(node, path, replacement) {
    if (path.length === 0) {
      return replacement;
    }
    const args = node.args.slice();
    args[path[0]] = setAt(node.args[path[0]], path.slice(1), replacement);
    return { type: node.type, args: args };
  }

  function simplify(node) {
    if (node.type === 'var') {
      return node;
    }
    const args = node.args.map(simplify);
    if (node.type === 'not' && args[0].type === 'not') {
      return args[0].args[0];
    }
    return { type: node.type, args: args };
  }

  function equivalents(node) {
    const a = node.args && node.args[0];
    const b = node.args && node.args[1];
    switch (node.type) {
      case 'imp':
        return [E.or(E.not(a), b), E.imp(E.not(b), E.not(a)), E.not(E.and(a, E.not(b)))];
      case 'and':
        return [E.and(b, a), E.not(E.or(E.not(a), E.not(b)))];
      case 'or':
        return [E.or(b, a), E.not(E.and(E.not(a), E.not(b))), E.imp(E.not(a), b)];
      case 'iff':
        return [E.iff(b, a), E.and(E.imp(a, b), E.imp(b, a)), E.or(E.and(a, b), E.and(E.not(a), E.not(b)))];
      case 'not':
        if (a.type === 'and') {
          return [E.or(E.not(a.args[0]), E.not(a.args[1])), E.imp(a.args[0], E.not(a.args[1]))];
        }
        if (a.type === 'or') {
          return [E.and(E.not(a.args[0]), E.not(a.args[1]))];
        }
        if (a.type === 'imp') {
          return [E.and(a.args[0], E.not(a.args[1]))];
        }
        if (a.type === 'iff') {
          return [E.iff(a.args[0], E.not(a.args[1])), E.iff(E.not(a.args[0]), a.args[1])];
        }
        return [];
      default:
        return [];
    }
  }

  function rewrite(node, rng, steps) {
    let current = node;
    for (let i = 0; i < steps; i++) {
      const paths = rng.shuffle(subPaths(current, [], []));
      for (let k = 0; k < paths.length; k++) {
        const options = equivalents(getAt(current, paths[k]));
        if (options.length > 0) {
          current = simplify(setAt(current, paths[k], rng.pick(options)));
          break;
        }
      }
    }
    return current;
  }

  function corrupt(node, rng, names) {
    const paths = rng.shuffle(subPaths(node, [], []));
    for (let k = 0; k < paths.length; k++) {
      const at = getAt(node, paths[k]);
      let replacement = null;
      if (at.type === 'and') {
        replacement = E.or(at.args[0], at.args[1]);
      } else if (at.type === 'or') {
        replacement = E.and(at.args[0], at.args[1]);
      } else if (at.type === 'imp') {
        replacement = rng.chance(0.5) ? E.imp(at.args[1], at.args[0]) : E.and(at.args[0], at.args[1]);
      } else if (at.type === 'iff') {
        replacement = E.imp(at.args[0], at.args[1]);
      } else if (at.type === 'var') {
        replacement = rng.chance(0.5) ? E.not(at) : E.v(rng.pick(names));
      } else if (at.type === 'not' && rng.chance(0.5)) {
        replacement = at.args[0];
      }
      if (replacement) {
        return simplify(setAt(node, paths[k], replacement));
      }
    }
    return node;
  }

  function equivalent(a, b, names) {
    return E.allAssignments(names).every(function (env) {
      return E.evaluate(a, env) === E.evaluate(b, env);
    });
  }

  function equivalenceStage(rng) {
    const names = ['P', 'Q', 'R'];
    for (let tries = 0; tries < 2000; tries++) {
      const target = randomFormula(rng, names, 3);
      const used = E.variablesOf(target);
      const text = E.render(target);
      const table = E.truthTable(target);
      const trues = table.filter(function (row) { return row.value; }).length;
      if (used.length < 3 || redundant(target) || trues === 0 || trues === table.length || text.length < 12 || text.length > 30) {
        continue;
      }
      const seen = new Set([text]);
      const correct = rewrite(target, rng, rng.int(2, 3));
      const correctText = E.render(correct);
      if (seen.has(correctText) || correctText.length > 42 || !equivalent(target, correct, names)) {
        continue;
      }
      seen.add(correctText);
      const options = [{ text: correctText, node: correct, right: true }];
      for (let k = 0; k < 60 && options.length < 4; k++) {
        const base = rng.chance(0.7) ? rewrite(target, rng, rng.int(1, 2)) : target;
        const bad = corrupt(base, rng, names);
        const badText = E.render(bad);
        if (seen.has(badText) || badText.length > 42 || equivalent(target, bad, names)) {
          continue;
        }
        seen.add(badText);
        options.push({ text: badText, node: bad, right: false });
      }
      if (options.length < 4) {
        continue;
      }
      const shuffled = rng.shuffle(options);
      return {
        names: names,
        target: { node: target, text: text },
        options: shuffled.map(function (item) { return { text: item.text, node: item.node }; }),
        answerIndex: shuffled.findIndex(function (item) { return item.right; })
      };
    }
    return null;
  }

  function room4(seed) {
    const rng = rngFor(seed, 4);
    const valves = valvesStage(rng);
    const equiv = equivalenceStage(rng);
    if (!valves || !equiv) {
      return null;
    }
    return { valves: valves, equiv: equiv, lockUntil: 0 };
  }

  const PEOPLE = ['Ana', 'Bruno', 'Carla', 'Davi', 'Eva', 'Fábio'];
  const PEOPLE_VARS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function islandStatement(rng, speaker) {
    const others = PEOPLE_VARS.map(function (name, i) { return i; }).filter(function (i) { return i !== speaker; });
    const pick = rng.shuffle(others);
    const x = pick[0];
    const y = pick[1];
    const z = pick[2];
    const vx = E.v(PEOPLE_VARS[x]);
    const vy = E.v(PEOPLE_VARS[y]);
    const vz = E.v(PEOPLE_VARS[z]);
    const nx = PEOPLE[x];
    const ny = PEOPLE[y];
    const nz = PEOPLE[z];
    const kinds = [
      function () { return { node: vx, text: nx + ' é cavaleiro' }; },
      function () { return { node: E.not(vx), text: nx + ' é mentiroso' }; },
      function () { return { node: E.iff(vx, vy), text: nx + ' e ' + ny + ' são do mesmo tipo' }; },
      function () { return { node: E.not(E.iff(vx, vy)), text: nx + ' e ' + ny + ' são de tipos diferentes' }; },
      function () { return { node: E.or(vx, vy), text: 'Pelo menos um entre ' + nx + ' e ' + ny + ' é cavaleiro' }; },
      function () { return { node: E.not(E.and(vx, vy)), text: nx + ' e ' + ny + ' não são ambos cavaleiros' }; },
      function () { return { node: E.imp(vx, vy), text: 'Se ' + nx + ' é cavaleiro, então ' + ny + ' é cavaleiro' }; },
      function () { return { node: E.and(vx, E.not(vy)), text: nx + ' é cavaleiro e ' + ny + ' é mentiroso' }; },
      function () {
        return {
          node: E.or(E.or(E.and(vx, E.and(E.not(vy), E.not(vz))), E.and(E.not(vx), E.and(vy, E.not(vz)))), E.and(E.not(vx), E.and(E.not(vy), vz))),
          text: 'Exatamente um entre ' + nx + ', ' + ny + ' e ' + nz + ' é cavaleiro'
        };
      },
      function () {
        return {
          node: E.or(E.or(E.and(vx, vy), E.and(vx, vz)), E.and(vy, vz)),
          text: 'Pelo menos dois entre ' + nx + ', ' + ny + ' e ' + nz + ' são cavaleiros'
        };
      }
    ];
    return rng.pick(kinds)();
  }

  function islandsStage(rng) {
    for (let tries = 0; tries < 6000; tries++) {
      const statements = PEOPLE.map(function (name, i) {
        const item = islandStatement(rng, i);
        return { speaker: i, text: item.text, node: item.node };
      });
      const constraints = statements.map(function (item) {
        return E.iff(E.v(PEOPLE_VARS[item.speaker]), item.node);
      });
      const found = E.models(constraints, PEOPLE_VARS);
      if (found.length !== 1) {
        continue;
      }
      const knights = PEOPLE_VARS.filter(function (name) { return found[0][name]; }).length;
      if (knights < 2 || knights > 4) {
        continue;
      }
      return {
        names: PEOPLE.slice(),
        statements: statements,
        solution: PEOPLE_VARS.map(function (name) { return found[0][name]; })
      };
    }
    return null;
  }

  const RELATION_STATEMENTS = [
    { text: '∀x ∃y R(x,y)', fn: function (m, n) { return all(n, function (x) { return some(n, function (y) { return m[x][y]; }); }); } },
    { text: '∃y ∀x R(x,y)', fn: function (m, n) { return some(n, function (y) { return all(n, function (x) { return m[x][y]; }); }); } },
    { text: '∃x ∀y ¬R(x,y)', fn: function (m, n) { return some(n, function (x) { return all(n, function (y) { return !m[x][y]; }); }); } },
    { text: '∀x ∀y (R(x,y) → R(y,x))', fn: function (m, n) { return all(n, function (x) { return all(n, function (y) { return !m[x][y] || m[y][x]; }); }); } },
    { text: '∀x ¬R(x,x)', fn: function (m, n) { return all(n, function (x) { return !m[x][x]; }); } },
    { text: '∃x ∃y ∃z (R(x,y) ∧ R(y,z) ∧ ¬R(x,z))', fn: function (m, n) { return some(n, function (x) { return some(n, function (y) { return some(n, function (z) { return m[x][y] && m[y][z] && !m[x][z]; }); }); }); } },
    { text: '∀x ∀y ∀z ((R(x,y) ∧ R(y,z)) → R(x,z))', fn: function (m, n) { return all(n, function (x) { return all(n, function (y) { return all(n, function (z) { return !(m[x][y] && m[y][z]) || m[x][z]; }); }); }); } },
    { text: '∃x ∀y (R(x,y) ∨ R(y,x))', fn: function (m, n) { return some(n, function (x) { return all(n, function (y) { return m[x][y] || m[y][x]; }); }); } },
    { text: '∀x ∃y (R(x,y) ∧ R(y,x))', fn: function (m, n) { return all(n, function (x) { return some(n, function (y) { return m[x][y] && m[y][x]; }); }); } },
    { text: '∃x ∃y (x ≠ y ∧ R(x,y) ∧ R(y,x))', fn: function (m, n) { return some(n, function (x) { return some(n, function (y) { return x !== y && m[x][y] && m[y][x]; }); }); } }
  ];

  function all(n, fn) {
    for (let i = 1; i <= n; i++) {
      if (!fn(i - 1)) {
        return false;
      }
    }
    return true;
  }

  function some(n, fn) {
    for (let i = 1; i <= n; i++) {
      if (fn(i - 1)) {
        return true;
      }
    }
    return false;
  }

  function relationsStage(rng) {
    const n = 5;
    for (let tries = 0; tries < 4000; tries++) {
      const density = 0.25 + rng.next() * 0.35;
      const matrix = [];
      for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
          row.push(rng.chance(density));
        }
        matrix.push(row);
      }
      const chosen = rng.shuffle(RELATION_STATEMENTS).slice(0, 6);
      const truths = chosen.map(function (item) { return item.fn(matrix, n); });
      const trues = truths.filter(Boolean).length;
      if (trues < 2 || trues > 4) {
        continue;
      }
      return {
        size: n,
        matrix: matrix,
        statements: chosen.map(function (item, i) { return { text: item.text, truth: truths[i] }; })
      };
    }
    return null;
  }

  const ARGUMENT_FORMS = [
    { premises: ['P → Q', 'P'], conclusion: 'Q' },
    { premises: ['P → Q', '¬Q'], conclusion: '¬P' },
    { premises: ['P → Q', 'Q → R'], conclusion: 'P → R' },
    { premises: ['P ∨ Q', '¬P'], conclusion: 'Q' },
    { premises: ['P → Q', 'R → S', 'P ∨ R'], conclusion: 'Q ∨ S' },
    { premises: ['P ∨ Q', '¬P ∨ R'], conclusion: 'Q ∨ R' },
    { premises: ['¬(P ∧ Q)', 'P'], conclusion: '¬Q' },
    { premises: ['P → Q', 'Q'], conclusion: 'P' },
    { premises: ['P → Q', '¬P'], conclusion: '¬Q' },
    { premises: ['P → Q', 'R → Q'], conclusion: 'P → R' },
    { premises: ['P ∨ Q', 'P'], conclusion: '¬Q' },
    { premises: ['P → (Q ∨ R)', 'Q'], conclusion: 'P' },
    { premises: ['P ↔ Q', '¬P'], conclusion: '¬Q' },
    { premises: ['P → Q'], conclusion: '¬P ∨ Q' },
    { premises: ['P ∧ Q → R', 'P'], conclusion: 'Q → R' },
    { premises: ['P → R', 'Q → R'], conclusion: 'P ∨ Q → R' }
  ];

  function parseSimple(text) {
    const tokens = text.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/¬/g, ' ¬ ').split(/\s+/).filter(Boolean);
    let pos = 0;
    function atom() {
      const t = tokens[pos++];
      if (t === '¬') {
        return E.not(atom());
      }
      if (t === '(') {
        const inner = expr();
        pos++;
        return inner;
      }
      return E.v(t);
    }
    function conj() {
      let left = atom();
      while (tokens[pos] === '∧') {
        pos++;
        left = E.and(left, atom());
      }
      return left;
    }
    function disj() {
      let left = conj();
      while (tokens[pos] === '∨') {
        pos++;
        left = E.or(left, conj());
      }
      return left;
    }
    function expr() {
      let left = disj();
      while (tokens[pos] === '→' || tokens[pos] === '↔') {
        const op = tokens[pos++];
        const right = disj();
        left = op === '→' ? E.imp(left, right) : E.iff(left, right);
      }
      return left;
    }
    return expr();
  }

  function substitute(node, map) {
    if (node.type === 'var') {
      return map[node.name] || node;
    }
    return { type: node.type, args: node.args.map(function (child) { return substitute(child, map); }) };
  }

  function argumentsStage(rng) {
    const names = ['A', 'B', 'C', 'D'];
    for (let tries = 0; tries < 3000; tries++) {
      const forms = rng.shuffle(ARGUMENT_FORMS).slice(0, 5);
      const items = [];
      for (let i = 0; i < forms.length; i++) {
        const map = {};
        ['P', 'Q', 'R', 'S'].forEach(function (symbol) {
          const a = E.v(rng.pick(names));
          const b = E.v(rng.pick(names.filter(function (n) { return n !== a.name; })));
          const roll = rng.next();
          if (roll < 0.5) {
            map[symbol] = a;
          } else if (roll < 0.7) {
            map[symbol] = E.not(a);
          } else if (roll < 0.85) {
            map[symbol] = E.and(a, b);
          } else {
            map[symbol] = E.or(a, b);
          }
        });
        const premises = forms[i].premises.map(function (text) { return substitute(parseSimple(text), map); });
        const conclusion = substitute(parseSimple(forms[i].conclusion), map);
        const texts = premises.concat([conclusion]).map(function (node) { return E.render(node); });
        if (texts.some(function (text) { return text.length > 30; })) {
          break;
        }
        items.push({
          premises: premises.map(function (node) { return { node: node, text: E.render(node) }; }),
          conclusion: { node: conclusion, text: E.render(conclusion) },
          valid: E.entails(premises, conclusion, names)
        });
      }
      if (items.length < 5) {
        continue;
      }
      const valid = items.filter(function (item) { return item.valid; }).length;
      const uniqueTexts = new Set(items.map(function (item) { return item.conclusion.text + item.premises.map(function (p) { return p.text; }).join(); }));
      if (valid < 2 || valid > 3 || uniqueTexts.size < 5) {
        continue;
      }
      return { names: names, items: items };
    }
    return null;
  }

  function room5(seed) {
    const rng = rngFor(seed, 5);
    const islands = islandsStage(rng);
    const relations = relationsStage(rng);
    const args = argumentsStage(rng);
    if (!islands || !relations || !args) {
      return null;
    }
    return { islands: islands, relations: relations, args: args, lockUntil: { islands: 0, relations: 0, args: 0 } };
  }

  function generate(seed) {
    return {
      seed: seed,
      r1: room1(seed),
      r2: room2(seed),
      r3: room3(seed),
      r4: room4(seed),
      r5: room5(seed)
    };
  }

  const api = { generate: generate, room1: room1, room2: room2, room3: room3, room4: room4, room5: room5, describe: describe, equivalent: equivalent };
  G.generator = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
