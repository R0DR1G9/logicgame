(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});
  const KEY = 'logicgame.save.v1';

  function read() {
    try {
      const raw = root.localStorage.getItem(KEY);
      if (!raw) {
        return null;
      }
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || !data.state || typeof data.state !== 'object') {
        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  }

  function write() {
    if (!G.view3d || !G.view3d.isRunning()) {
      return false;
    }
    try {
      root.localStorage.setItem(KEY, JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        state: G.state.serialize(),
        pose: G.view3d.pose()
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clear() {
    try {
      root.localStorage.removeItem(KEY);
    } catch (error) {
      return;
    }
  }

  function exists() {
    return read() !== null;
  }

  G.save = { read: read, write: write, clear: clear, exists: exists };
})(typeof window !== 'undefined' ? window : globalThis);
