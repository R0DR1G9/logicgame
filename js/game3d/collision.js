export function collides(x, z, radius, boxes) {
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (b.disabled) {
      continue;
    }
    const cx = Math.max(b.xMin, Math.min(x, b.xMax));
    const cz = Math.max(b.zMin, Math.min(z, b.zMax));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < radius * radius) {
      return true;
    }
  }
  return false;
}

export function move(x, z, dx, dz, radius, boxes) {
  let nx = x + dx;
  if (collides(nx, z, radius, boxes)) {
    nx = x;
  }
  let nz = z + dz;
  if (collides(nx, nz, radius, boxes)) {
    nz = z;
  }
  return { x: nx, z: nz };
}
