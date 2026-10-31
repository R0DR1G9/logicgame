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
export const ROOM_COUNT = 3;

export function roomBounds(index) {
  const zMax = (1 - index) * (DEPTH + WALL);
  return { index: index, xMin: -HALF, xMax: HALF, zMax: zMax, zMin: zMax - DEPTH };
}

export const rooms = [1, 2, 3].map(roomBounds);

export const spawn = { x: 0, z: -1.2, yaw: 0, pitch: 0 };

export const unlockKeys = ['r1table', 'r2safe', 'r3lock'];

export const lockedMessages = [
  'A porta está trancada. Restabeleça a energia e valide o terminal.',
  'A porta está trancada. A chave está dentro do cofre.',
  'A porta de escape está trancada.'
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
  racks: [
    { x: 3.55, z: -5.4, w: 0.8, d: 0.8, h: 2.0 },
    { x: 3.55, z: -6.3, w: 0.8, d: 0.8, h: 2.0 }
  ]
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
  room1.racks.forEach(function (rack, i) {
    list.push(centered(rack.x, rack.z, rack.w, rack.d, 'rack' + i));
  });

  return list;
}

export function roomIndexAt(z) {
  if (z > rooms[0].zMin - WALL / 2) {
    return 1;
  }
  if (z > rooms[1].zMin - WALL / 2) {
    return 2;
  }
  return 3;
}
