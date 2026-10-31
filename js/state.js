(function (root) {
  const G = (root.LogicGame = root.LogicGame || {});

  function fresh() {
    return {
      room: 1,
      solved: {},
      notes: [],
      hintIndex: {},
      hintsUsed: 0,
      attempts: 0,
      startedAt: Date.now(),
      finishedAt: null
    };
  }

  let current = fresh();

  G.state = {
    get: function () {
      return current;
    },
    reset: function () {
      current = fresh();
    },
    setRoom: function (number) {
      current.room = number;
    },
    isSolved: function (key) {
      return current.solved[key] === true;
    },
    markSolved: function (key) {
      current.solved[key] = true;
    },
    hasNote: function (id) {
      return current.notes.some(function (note) {
        return note.id === id;
      });
    },
    addNote: function (id, roomId, title, text) {
      if (this.hasNote(id)) {
        return false;
      }
      current.notes.push({ id: id, room: roomId, title: title, text: text });
      return true;
    },
    addAttempt: function () {
      current.attempts += 1;
    },
    nextHint: function (stage, list) {
      const index = current.hintIndex[stage] || 0;
      const text = list[Math.min(index, list.length - 1)];
      if (index < list.length) {
        current.hintIndex[stage] = index + 1;
        current.hintsUsed += 1;
      }
      return text;
    },
    finish: function () {
      current.finishedAt = Date.now();
    },
    elapsedSeconds: function () {
      const end = current.finishedAt || Date.now();
      return Math.round((end - current.startedAt) / 1000);
    },
    serialize: function () {
      return {
        room: current.room,
        solved: current.solved,
        notes: current.notes,
        hintIndex: current.hintIndex,
        hintsUsed: current.hintsUsed,
        attempts: current.attempts,
        elapsed: this.elapsedSeconds()
      };
    },
    load: function (data) {
      const next = fresh();
      next.room = Number(data.room) >= 1 && Number(data.room) <= 3 ? Number(data.room) : 1;
      next.solved = data.solved && typeof data.solved === 'object' ? data.solved : {};
      next.notes = Array.isArray(data.notes) ? data.notes : [];
      next.hintIndex = data.hintIndex && typeof data.hintIndex === 'object' ? data.hintIndex : {};
      next.hintsUsed = Number(data.hintsUsed) || 0;
      next.attempts = Number(data.attempts) || 0;
      next.startedAt = Date.now() - (Number(data.elapsed) || 0) * 1000;
      current = next;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
