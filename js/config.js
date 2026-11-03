(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});

  G.config = {
    totalRooms: 5,
    timeLimitSeconds: 600
  };

  G.rooms = G.rooms || {};
})(typeof window !== 'undefined' ? window : globalThis);
