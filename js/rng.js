(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});

  function create(seed) {
    let a = seed >>> 0;
    function next() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      next: next,
      int: function (min, max) {
        return min + Math.floor(next() * (max - min + 1));
      },
      pick: function (list) {
        return list[Math.floor(next() * list.length)];
      },
      chance: function (p) {
        return next() < p;
      },
      shuffle: function (list) {
        const out = list.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          const tmp = out[i];
          out[i] = out[j];
          out[j] = tmp;
        }
        return out;
      }
    };
  }

  function newSeed() {
    if (root.crypto && root.crypto.getRandomValues) {
      const buffer = new Uint32Array(1);
      root.crypto.getRandomValues(buffer);
      return buffer[0];
    }
    return Math.floor(Math.random() * 4294967296) >>> 0;
  }

  G.rng = { create: create, newSeed: newSeed };
})(typeof window !== 'undefined' ? window : globalThis);
