(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const E = G.evaluator;

  const SALT = [0, 0x9e3779b1, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f, 0x165667b1];

  function rngFor(seed, room) {
    return G.rng.create((seed ^ SALT[room]) >>> 0);
  }

  function isPrime(n) {
    if (n < 2) {
      return false;
    }
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) {
        return false;
      }
    }
    return true;
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

  const PROPERTIES = [
    { id: 'even', text: function () { return 'x é par'; }, fn: function (x) { return x % 2 === 0; } },
    { id: 'odd', text: function () { return 'x é ímpar'; }, fn: function (x) { return Math.abs(x % 2) === 1; } },
    { id: 'mult3', text: function () { return 'x é múltiplo de 3'; }, fn: function (x) { return x % 3 === 0; } },
    { id: 'mult5', text: function () { return 'x é múltiplo de 5'; }, fn: function (x) { return x % 5 === 0; } },
    { id: 'prime', text: function () { return 'x é primo'; }, fn: function (x) { return isPrime(x); } }
  ];

  function boundFor(rng) {
    const kind = rng.pick(['square', 'greater', 'less']);
    if (kind === 'square') {
      const k = rng.pick([20, 30, 40, 50, 60, 80, 100]);
      return { text: 'x² < ' + k, fn: function (x) { return x * x < k; } };
    }
    if (kind === 'greater') {
      const c = rng.int(1, 6);
      return { text: 'x > ' + c, fn: function (x) { return x > c; } };
    }
    const c = rng.int(5, 10);
    return { text: 'x < ' + c, fn: function (x) { return x < c; } };
  }

  function room3(seed, start, limit) {
    const rng = rngFor(seed, 3);
    const naturalsStart = start === undefined ? 0 : start;
    const searchLimit = limit === undefined ? 20 : limit;
    for (let tries = 0; tries < 600; tries++) {
      const first = rng.pick(PROPERTIES);
      const bound = boundFor(rng);
      const satisfies = function (x) {
        return Number.isInteger(x) && x >= naturalsStart && first.fn(x) && bound.fn(x);
      };
      const pure = function (x) {
        return first.fn(x) && bound.fn(x);
      };
      const candidates = [];
      for (let n = -6; n <= 13; n++) {
        candidates.push(n);
      }
      const yes = candidates.filter(satisfies);
      const traps = candidates.filter(function (n) { return n < naturalsStart && pure(n); });
      const no = candidates.filter(function (n) { return !pure(n); });
      if (yes.length < 3 || traps.length < 1 || no.length < 4) {
        continue;
      }
      const chosenYes = rng.shuffle(yes).slice(0, Math.min(yes.length, rng.int(3, 4)));
      const chosenTraps = rng.shuffle(traps).slice(0, Math.min(traps.length, 2));
      const rest = 12 - chosenYes.length - chosenTraps.length;
      const chosenNo = rng.shuffle(no).slice(0, rest);
      if (chosenNo.length < rest) {
        continue;
      }
      const grid = chosenYes.concat(chosenTraps).concat(chosenNo).sort(function (a, b) { return a - b; });
      const condition = '∃x (x ∈ ℕ ∧ ' + first.text() + ' ∧ ' + bound.text + ')';
      const statements = buildStatements(rng, 3, searchLimit);
      return {
        grid: grid,
        condition: condition,
        answer: grid.filter(satisfies),
        satisfies: satisfies,
        statements: statements
      };
    }
    return null;
  }

  function buildStatements(rng, count, searchLimit) {
    const forallTrue = [
      { text: '∀x ∈ ℕ (x ≥ 0)' },
      { text: '∀x ∈ ℕ (x² ≥ x)' },
      { text: '∀x ∈ ℕ (x + 1 > x)' },
      { text: '∀x ∈ ℕ (x é par ∨ x é ímpar)' }
    ];
    const existsFalse = [
      { text: '∃x ∈ ℕ (x < 0)' },
      { text: '∃x ∈ ℕ (x² < 0)' },
      { text: '∃x ∈ ℕ (x é par ∧ x é ímpar)' },
      { text: '∃x ∈ ℕ (x + 1 < x)' }
    ];
    function forallFalse() {
      const kind = rng.pick(['square', 'even', 'less', 'mult']);
      if (kind === 'square') {
        const k = rng.int(30, 300);
        return { text: '∀x ∈ ℕ (x² < ' + k + ')', truth: false };
      }
      if (kind === 'even') {
        return { text: '∀x ∈ ℕ (x é par)', truth: false };
      }
      if (kind === 'less') {
        const c = rng.int(3, 15);
        return { text: '∀x ∈ ℕ (x < ' + c + ')', truth: false };
      }
      const m = rng.pick([2, 3, 4, 5]);
      return { text: '∀x ∈ ℕ (x é múltiplo de ' + m + ')', truth: false };
    }
    function existsTrue() {
      const kind = rng.pick(['oddsq', 'mult', 'square', 'evengt']);
      if (kind === 'oddsq') {
        const k = rng.int(10, 80);
        return { text: '∃x ∈ ℕ (x é ímpar ∧ x² < ' + k + ')', truth: true };
      }
      if (kind === 'mult') {
        const m = rng.pick([3, 4, 5, 7]);
        const c = rng.int(2, 9);
        return { text: '∃x ∈ ℕ (x é múltiplo de ' + m + ' ∧ x > ' + c + ')', truth: true };
      }
      if (kind === 'square') {
        const n = rng.pick([16, 25, 36, 49, 64, 81]);
        return { text: '∃x ∈ ℕ (x² = ' + n + ')', truth: true };
      }
      const c = rng.int(3, 12);
      return { text: '∃x ∈ ℕ (x é par ∧ x > ' + c + ')', truth: true };
    }
    const makers = [
      function () { const item = rng.pick(forallTrue); return { text: item.text, truth: true }; },
      function () { const item = rng.pick(existsFalse); return { text: item.text, truth: false }; },
      forallFalse,
      existsTrue
    ];
    let list = [];
    for (let tries = 0; tries < 100; tries++) {
      list = [];
      const used = new Set();
      const order = rng.shuffle([0, 1, 2, 3]).slice(0, count);
      order.forEach(function (index) {
        const item = makers[index]();
        if (!used.has(item.text)) {
          used.add(item.text);
          list.push(item);
        }
      });
      const trues = list.filter(function (item) { return item.truth; }).length;
      if (list.length === count && trues >= 1 && trues < count) {
        break;
      }
    }
    return list;
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

  function generate(seed) {
    const cfg = G.config || {};
    return {
      seed: seed,
      r1: room1(seed),
      r2: room2(seed),
      r3: room3(seed, cfg.naturalsStart, cfg.searchLimit),
      r4: room4(seed)
    };
  }

  const api = { generate: generate, room1: room1, room2: room2, room3: room3, room4: room4, describe: describe, equivalent: equivalent };
  G.generator = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
