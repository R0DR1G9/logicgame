const path = require('path').join(__dirname, '..', 'js') + '/';
require(path + 'config.js');
require(path + 'logic/evaluator.js');
require(path + 'rng.js');
const gen = require(path + 'logic/generator.js');
const assert = require('assert');
const E = globalThis.LogicGame.evaluator;
const N = Number(process.argv[2] || 3000);
const PEOPLE_NAME = ['Ana', 'Bruno', 'Carla', 'Davi', 'Eva', 'Fábio'];
const seen = { f: new Set(), c: new Set(), g: new Set(), all: new Set() };
let fail = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };
const t0 = Date.now();
for (let seed = 1; seed <= N; seed++) {
  const p = gen.generate(seed * 2654435761 % 4294967296);
  if (!p.r1) { fail.r1++; continue; }
  if (!p.r2) { fail.r2++; continue; }
  if (!p.r3) { fail.r3++; continue; }
  if (!p.r4) { fail.r4++; continue; }
  if (!p.r5) { fail.r5++; continue; }
  const is = p.r5.islands;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cons = is.statements.map((st) => E.iff(E.v(letters[st.speaker]), st.node));
  assert.strictEqual(E.models(cons, letters).length, 1, 'ilha unica');
  const tb = p.r5.tableau;
  assert.strictEqual(tb.sets.length, 3);
  const sc = tb.sets.filter((x) => x.sat).length;
  assert.ok(sc >= 1 && sc <= 2);
  tb.sets.forEach((x) => assert.strictEqual(E.models(x.formulas.map((f) => f.node), tb.names).length > 0, x.sat));
  const ar = p.r5.args;
  assert.strictEqual(ar.items.length, 3);
  ar.items.forEach((it) => assert.strictEqual(it.valid, E.entails(it.premises.map((x) => x.node), it.conclusion.node, ar.names)));
  const v = p.r4.valves;
  assert.ok(v.premises.length >= 6 && v.premises.length <= 8, 'premissas r4');
  assert.strictEqual(E.models(v.premises.map((x) => x.node), v.names).length, 1, 'valvulas unicas');
  assert.ok(v.premises.every((x) => E.evaluate(x.node, v.solution)));
  const q = p.r4.equiv;
  assert.strictEqual(q.options.length, 4);
  assert.strictEqual(q.options.filter((o) => gen.equivalent(q.target.node, o.node, q.names)).length, 1, 'uma equivalente');
  assert.ok(gen.equivalent(q.target.node, q.options[q.answerIndex].node, q.names));
  assert.strictEqual(new Set(q.options.map((o) => o.text)).size, 4);
  const t = E.truthTable(p.r1.formula);
  assert.ok(t.some((r) => r.value) && t.some((r) => !r.value));
  assert.strictEqual(p.r2.premises.length, 5);
  const nodes = p.r2.premises.map((x) => x.node);
  const f = E.forcedValues(nodes, p.r2.names);
  assert.ok(p.r2.names.every((n) => f[n] !== null), 'unico');
  assert.strictEqual(p.r2.code.length, 4);
  assert.strictEqual(new Set(p.r2.code.split('')).size, 4);
  const f3 = p.r3.formulas;
  assert.strictEqual(f3.length, 6);
  assert.strictEqual(new Set(f3.map((x) => x.text)).size, 6);
  [0, 1, 2].forEach((k) => assert.strictEqual(f3.filter((x) => x.kind === k).length, 2));
  f3.forEach((x) => {
    const values = E.truthTable(x.node).map((r) => r.value);
    const kind = values.every(Boolean) ? 0 : values.some(Boolean) ? 2 : 1;
    assert.strictEqual(kind, x.kind);
  });
  const im = p.r3.implications;
  assert.strictEqual(im.length, 5);
  const iv = im.filter((x) => x.valid).length;
  assert.ok(iv >= 2 && iv <= 3);
  im.forEach((x) => assert.strictEqual(x.valid, E.entails([x.left.node], x.right.node, E.variablesOf(E.and(x.left.node, x.right.node)))));
  seen.f.add(p.r1.text);
  seen.c.add(p.r2.code + '|' + p.r2.premises.map((x) => x.text).join(''));
  seen.g.add(f3.map((x) => x.text).join(',') + im.map((x) => x.left.text + x.right.text).join(','));
  seen.all.add(JSON.stringify([p.r1.text, p.r2.premises.map((x) => x.text), f3.map((x) => x.text), im.map((x) => x.left.text + x.right.text)]));
}
console.log('falhas', JSON.stringify(fail), 'ms', Date.now() - t0);
console.log('distintos r1', seen.f.size, 'r2', seen.c.size, 'r3', seen.g.size, 'partidas', seen.all.size, 'de', N);
const s = gen.generate(12345);
console.log(s.r5.islands.statements.map((x) => PEOPLE_NAME[x.speaker] + ': ' + x.text).join(' | '), '->', s.r5.islands.solution.map((b) => (b ? 'C' : 'M')).join(''));
console.log(s.r5.tableau.sets.map((x) => '{' + x.formulas.map((f) => f.text).join(', ') + '} ' + x.sat).join(' ; '));
console.log(s.r5.args.items.map((it) => it.premises.map((x) => x.text).join(', ') + ' => ' + it.conclusion.text + ' ' + it.valid).join(' || '));
console.log(s.r1.label, '|', s.r2.key, '|', s.r2.premises.map((x) => x.text).join(' / '), '|', s.r2.code, '|', s.r3.formulas.map((x) => x.text + '=' + s.r3.kinds[x.kind]).join(' ; '), '|', s.r3.implications.map((x) => x.left.text + ' => ' + x.right.text + ' ' + x.valid).join(' ; '));
console.log(s.r4.valves.premises.map((x) => x.formal).join(' | '), '||', s.r4.equiv.target.text, '=>', s.r4.equiv.options.map((o, i) => (i === s.r4.equiv.answerIndex ? '*' : '') + o.text).join(' ; '));
