(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});

  G.config = {
    naturalsStart: 0,
    totalRooms: 5,
    searchLimit: 20,
    timeLimitSeconds: 900
  };

  G.rooms = G.rooms || {};
})(typeof window !== 'undefined' ? window : globalThis);
