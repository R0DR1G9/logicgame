(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});

  G.config = {
    naturalsStart: 0,
    totalRooms: 3,
    searchLimit: 20
  };

  G.rooms = G.rooms || {};
})(typeof window !== 'undefined' ? window : globalThis);
