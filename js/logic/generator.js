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

  function describe(node) {
    if (node.type === 'var') {
      return node.name + ' é culpado';
    }
    if (node.type === 'not') {
      const inner = node.args[0];
      if (inner.type === 'var') {
        return inner.name + ' não é culpado';
      }
      return 'Não é verdade que ' + describe(inner);
    }
    const left = describe(node.args[0]);
    const right = describe(node.args[1]);
    if (node.type === 'and') {
      return left + ' e ' + right;
    }
    if (node.type === 'or') {
      return left + ' ou ' + right;
    }
    if (node.type === 'imp') {
      return 'Se ' + left + ', então ' + right;
    }
    return left + ' se, e somente se, ' + right;
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

  function generate(seed) {
    const cfg = G.config || {};
    return {
      seed: seed,
      r1: room1(seed),
      r2: room2(seed),
      r3: room3(seed, cfg.naturalsStart, cfg.searchLimit)
    };
  }

  const api = { generate: generate, room1: room1, room2: room2, room3: room3, describe: describe };
  G.generator = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
