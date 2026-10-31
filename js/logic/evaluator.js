(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});

  const SYMBOLS = {
    not: '¬',
    and: '∧',
    or: '∨',
    imp: '→',
    iff: '↔'
  };

  function v(name) {
    return { type: 'var', name: name };
  }

  function not(a) {
    return { type: 'not', args: [a] };
  }

  function and(a, b) {
    return { type: 'and', args: [a, b] };
  }

  function or(a, b) {
    return { type: 'or', args: [a, b] };
  }

  function imp(a, b) {
    return { type: 'imp', args: [a, b] };
  }

  function iff(a, b) {
    return { type: 'iff', args: [a, b] };
  }

  function evaluate(node, env) {
    switch (node.type) {
      case 'var':
        if (!Object.prototype.hasOwnProperty.call(env, node.name)) {
          throw new Error('Variavel sem valor: ' + node.name);
        }
        return env[node.name] === true;
      case 'not':
        return !evaluate(node.args[0], env);
      case 'and':
        return evaluate(node.args[0], env) && evaluate(node.args[1], env);
      case 'or':
        return evaluate(node.args[0], env) || evaluate(node.args[1], env);
      case 'imp':
        return !evaluate(node.args[0], env) || evaluate(node.args[1], env);
      case 'iff':
        return evaluate(node.args[0], env) === evaluate(node.args[1], env);
      default:
        throw new Error('Operador desconhecido: ' + node.type);
    }
  }

  function render(node, nested) {
    if (node.type === 'var') {
      return node.name;
    }
    if (node.type === 'not') {
      return SYMBOLS.not + render(node.args[0], true);
    }
    const text = render(node.args[0], true) + ' ' + SYMBOLS[node.type] + ' ' + render(node.args[1], true);
    return nested ? '(' + text + ')' : text;
  }

  function variablesOf(node, found) {
    const names = found || new Set();
    if (node.type === 'var') {
      names.add(node.name);
    } else {
      node.args.forEach(function (child) {
        variablesOf(child, names);
      });
    }
    return Array.from(names).sort();
  }

  function allAssignments(names) {
    const total = Math.pow(2, names.length);
    const rows = [];
    for (let i = 0; i < total; i++) {
      const env = {};
      for (let j = 0; j < names.length; j++) {
        const bit = (i >> (names.length - 1 - j)) & 1;
        env[names[j]] = bit === 0;
      }
      rows.push(env);
    }
    return rows;
  }

  function truthTable(node) {
    const names = variablesOf(node);
    return allAssignments(names).map(function (env) {
      return { env: env, value: evaluate(node, env) };
    });
  }

  function models(premises, names) {
    return allAssignments(names).filter(function (env) {
      return premises.every(function (premise) {
        return evaluate(premise, env);
      });
    });
  }

  function entails(premises, conclusion, names) {
    const found = models(premises, names);
    return found.length > 0 && found.every(function (env) {
      return evaluate(conclusion, env);
    });
  }

  function forcedValues(premises, names) {
    const found = models(premises, names);
    const result = {};
    names.forEach(function (name) {
      if (found.length === 0) {
        result[name] = null;
      } else if (found.every(function (env) { return env[name] === true; })) {
        result[name] = true;
      } else if (found.every(function (env) { return env[name] === false; })) {
        result[name] = false;
      } else {
        result[name] = null;
      }
    });
    return result;
  }

  function range(from, to) {
    const list = [];
    for (let i = from; i <= to; i++) {
      list.push(i);
    }
    return list;
  }

  function exists(domain, predicate) {
    return domain.some(predicate);
  }

  function forall(domain, predicate) {
    return domain.every(predicate);
  }

  function label(value) {
    return value ? 'V' : 'F';
  }

  const api = {
    v: v,
    not: not,
    and: and,
    or: or,
    imp: imp,
    iff: iff,
    evaluate: evaluate,
    render: render,
    variablesOf: variablesOf,
    allAssignments: allAssignments,
    truthTable: truthTable,
    models: models,
    entails: entails,
    forcedValues: forcedValues,
    range: range,
    exists: exists,
    forall: forall,
    label: label
  };

  G.evaluator = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
