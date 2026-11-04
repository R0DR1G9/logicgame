export const WALL = 0.4;
export const HEIGHT = 3.2;
export const WIDTH = 8;
export const DEPTH = 8;
export const HALF = WIDTH / 2;
export const DOOR_W = 1.6;
export const DOOR_H = 2.4;
export const RADIUS = 0.3;
export const EYE = 1.65;
export const REACH = 3.2;
export const SPEED = 3.2;
export const SPRINT = 5;
export const ROOM_COUNT = 5;

export function roomBounds(index) {
  const zMax = (1 - index) * (DEPTH + WALL);
  return { index: index, xMin: -HALF, xMax: HALF, zMax: zMax, zMin: zMax - DEPTH };
}

export const rooms = Array.from({ length: ROOM_COUNT }, function (unused, i) {
  return roomBounds(i + 1);
});

export const spawn = { x: 0, z: -1.2, yaw: 0, pitch: 0 };

export const unlockKeys = ['r1table', 'r2safe', 'r3lock', 'r4equiv', 'r5args'];

export const lockedMessages = [
  'A porta está trancada. Restabeleça a energia e valide o terminal.',
  'A porta está trancada. A chave está dentro do cofre.',
  'A porta está trancada. O cadeado final ainda está fechado.',
  'A porta está trancada. O oráculo ainda não foi satisfeito.',
  'A porta de escape está trancada. Abra os três selos.'
];

export const doors = rooms.map(function (room, i) {
  return {
    id: 'door' + room.index,
    room: room.index,
    unlockKey: unlockKeys[i],
    zNear: room.zMin,
    zFar: room.zMin - WALL
  };
});

export const room1 = {
  note: { x: -HALF + 0.02, y: 1.6, z: -2.4, w: 0.5, h: 0.65 },
  board: { x: -HALF + 0.02, y: 1.85, z: -5.2, w: 2.4, h: 1.4 },
  panel: { x: HALF - 0.15, y: 1.5, z: -3.2, d: 0.3, w: 1.1, h: 1.5 },
  desk: { x: 2.4, z: -7.5, w: 1.8, d: 0.8, h: 0.8 },
  chair: { x: 2.35, z: -6.35, w: 0.5, d: 0.5 },
  racks: [
    { x: 3.55, z: -5.4, w: 0.8, d: 0.8, h: 2.0 },
    { x: 3.55, z: -6.3, w: 0.8, d: 0.8, h: 2.0 }
  ]
};

export const room2 = {
  board: { x: -HALF + 0.02, y: 1.85, z: -10.8, w: 2.4, h: 1.4 },
  suspects: { x: HALF - 0.02, y: 1.85, z: -10.8, w: 2.4, h: 1.4 },
  desk: { x: -3.45, z: -14.2, w: 0.8, d: 1.8, h: 0.8 },
  chair: { x: -2.45, z: -14.2, w: 0.5, d: 0.5 },
  safe: { x: 3.7, z: -13.4, w: 0.6, d: 1.0, h: 1.4 },
  cabinet: { x: 3.55, z: -9.5, w: 0.8, d: 0.9, h: 1.6 },
  crate: { x: 3.3, z: -15.7, w: 0.9, d: 0.9, h: 0.9 }
};

export const room3 = {
  screen: { x: HALF - 0.02, y: 1.85, z: -18.9, w: 2.4, h: 1.4 },
  racks: [-18.2, -19.05, -19.9, -20.75, -21.6].map(function (z) {
    return { x: -3.55, z: z, w: 0.8, d: 0.8, h: 2.0 };
  }),
  lectern: { x: -3.3, z: -23.4, w: 0.7, d: 0.6, h: 1.0 },
  desk: { x: 2.4, z: -24.3, w: 1.8, d: 0.8, h: 0.8 },
  chair: { x: 2.4, z: -23.2, w: 0.5, d: 0.5 },
  lock: { y: 1.4, z: -22.2 }
};

export const room4 = {
  laws: { x: -HALF + 0.02, y: 1.85, z: -27.6, w: 2.4, h: 1.4 },
  premises: { x: HALF - 0.02, y: 1.85, z: -27.6, w: 2.4, h: 1.4 },
  valves: { x: 3.7, z: -31.0, w: 0.6, d: 1.8, h: 1.6 },
  core: { x: 1.9, z: -29.4, w: 1.1, d: 1.1 },
  desk: { x: -2.9, z: -32.7, w: 1.8, d: 0.8, h: 0.8 },
  chair: { x: -2.9, z: -31.6, w: 0.5, d: 0.5 }
};

export const room5 = {
  islands: { x: -HALF + 0.02, y: 1.85, z: -37.2, w: 2.4, h: 1.4 },
  tableau: { x: HALF - 0.02, y: 1.85, z: -37.2, w: 2.4, h: 1.4 },
  desk: { x: 2.4, z: -40.5, w: 1.8, d: 0.8, h: 0.8 },
  chair: { x: 2.4, z: -39.4, w: 0.5, d: 0.5 },
  seals: { x: -2.4, y: 1.7, w: 1.6, h: 0.7 },
  pedestal: { x: -2.2, z: -39.2, r: 0.5 }
};

function box(xMin, xMax, zMin, zMax, id) {
  return { id: id, xMin: xMin, xMax: xMax, zMin: zMin, zMax: zMax, disabled: false };
}

function centered(cx, cz, w, d, id) {
  return box(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, id);
}

export function buildColliders() {
  const list = [];
  const full = HALF + WALL;
  const zTop = rooms[0].zMax + WALL;
  const zBottom = rooms[ROOM_COUNT - 1].zMin - WALL;

  list.push(box(-full, -HALF, zBottom, zTop, 'wall-left'));
  list.push(box(HALF, full, zBottom, zTop, 'wall-right'));
  list.push(box(-full, full, rooms[0].zMax, zTop, 'wall-near'));

  doors.forEach(function (door) {
    list.push(box(-full, -DOOR_W / 2, door.zFar, door.zNear, door.id + '-wall-left'));
    list.push(box(DOOR_W / 2, full, door.zFar, door.zNear, door.id + '-wall-right'));
    list.push(box(-DOOR_W / 2, DOOR_W / 2, door.zFar, door.zNear, door.id));
  });

  const p = room1.panel;
  list.push(centered(p.x, p.z, p.d, p.w, 'panel'));
  const d = room1.desk;
  list.push(centered(d.x, d.z, d.w, d.d, 'desk'));
  const chair = room1.chair;
  list.push(centered(chair.x, chair.z, chair.w, chair.d, 'chair'));
  room1.racks.forEach(function (rack, i) {
    list.push(centered(rack.x, rack.z, rack.w, rack.d, 'rack' + i));
  });

  list.push(centered(room2.desk.x, room2.desk.z, room2.desk.w, room2.desk.d, 'desk2'));
  list.push(centered(room2.chair.x, room2.chair.z, room2.chair.w, room2.chair.d, 'chair2'));
  list.push(centered(3.5, room2.safe.z, 1.0, 1.1, 'safe'));
  list.push(centered(room2.cabinet.x, room2.cabinet.z, room2.cabinet.w, room2.cabinet.d, 'cabinet'));
  list.push(centered(room2.crate.x, room2.crate.z, room2.crate.w, room2.crate.d, 'crate'));

  room3.racks.forEach(function (rack, i) {
    list.push(centered(rack.x, rack.z, rack.w, rack.d, 'rack3-' + i));
  });
  list.push(centered(room3.lectern.x, room3.lectern.z, room3.lectern.w, room3.lectern.d, 'lectern'));
  list.push(centered(room3.desk.x, room3.desk.z, room3.desk.w, room3.desk.d, 'desk3'));
  list.push(centered(room3.chair.x, room3.chair.z, room3.chair.w, room3.chair.d, 'chair3'));

  list.push(centered(room4.valves.x, room4.valves.z, room4.valves.w, room4.valves.d, 'valves'));
  list.push(centered(room4.core.x, room4.core.z, room4.core.w, room4.core.d, 'core'));
  list.push(centered(room4.desk.x, room4.desk.z, room4.desk.w, room4.desk.d, 'desk4'));
  list.push(centered(room4.chair.x, room4.chair.z, room4.chair.w, room4.chair.d, 'chair4'));

  list.push(centered(room5.desk.x, room5.desk.z, room5.desk.w, room5.desk.d, 'desk5'));
  list.push(centered(room5.chair.x, room5.chair.z, room5.chair.w, room5.chair.d, 'chair5'));
  list.push(centered(room5.pedestal.x, room5.pedestal.z, room5.pedestal.r * 2, room5.pedestal.r * 2, 'pedestal5'));

  return list;
}

export function roomIndexAt(z) {
  for (let i = 0; i < ROOM_COUNT - 1; i++) {
    if (z > rooms[i].zMin - WALL / 2) {
      return i + 1;
    }
  }
  return ROOM_COUNT;
}
