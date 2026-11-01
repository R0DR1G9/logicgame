import * as THREE from '../../vendor/three.module.min.js';

let glowMap = null;
let shadeMap = null;
let blobMap = null;

function radial(size, stops) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d');
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(function (stop) {
    g.addColorStop(stop[0], stop[1]);
  });
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowTexture() {
  if (!glowMap) {
    glowMap = radial(128, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.45)'], [0.6, 'rgba(255,255,255,0.1)'], [1, 'rgba(255,255,255,0)']]);
  }
  return glowMap;
}

function blobTexture() {
  if (!blobMap) {
    blobMap = radial(128, [[0, 'rgba(0,0,0,0.75)'], [0.55, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]);
  }
  return blobMap;
}

function shadeTexture() {
  if (!shadeMap) {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 128;
    const c = canvas.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.7)');
    c.fillStyle = g;
    c.fillRect(0, 0, 8, 128);
    shadeMap = new THREE.CanvasTexture(canvas);
    shadeMap.colorSpace = THREE.SRGBColorSpace;
  }
  return shadeMap;
}

export function addGlow(scene, color, x, y, z, size, opacity) {
  const material = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: color,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: opacity
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, z);
  sprite.scale.set(size, size, 1);
  scene.add(sprite);
  return sprite;
}

export function addBlob(scene, x, z, width, depth, opacity) {
  const material = new THREE.MeshBasicMaterial({
    map: blobTexture(),
    transparent: true,
    depthWrite: false,
    opacity: opacity
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.006, z);
  scene.add(mesh);
  return mesh;
}

export function addEdgeShade(scene, x, y, z, width, height, rotationY, flip) {
  const material = new THREE.MeshBasicMaterial({
    map: shadeTexture(),
    transparent: true,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  if (flip) {
    mesh.rotation.z = Math.PI;
  }
  scene.add(mesh);
  return mesh;
}

export function createDust(scene, box, count) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = box.x0 + Math.random() * (box.x1 - box.x0);
    positions[i * 3 + 1] = box.y0 + Math.random() * (box.y1 - box.y0);
    positions[i * 3 + 2] = box.z0 + Math.random() * (box.z1 - box.z0);
    seeds[i * 3] = Math.random() * 6.28;
    seeds[i * 3 + 1] = 0.03 + Math.random() * 0.05;
    seeds[i * 3 + 2] = Math.random() * 6.28;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: glowTexture(),
    color: 0xbfd8ff,
    size: 0.07,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  function update(time, dt) {
    const attribute = geometry.getAttribute('position');
    for (let i = 0; i < count; i++) {
      const a = seeds[i * 3];
      const speed = seeds[i * 3 + 1];
      const b = seeds[i * 3 + 2];
      let y = attribute.getY(i) + speed * dt * 0.6;
      if (y > box.y1) {
        y = box.y0;
      }
      attribute.setXYZ(
        i,
        attribute.getX(i) + Math.sin(time * 0.3 + a) * dt * 0.06,
        y,
        attribute.getZ(i) + Math.cos(time * 0.25 + b) * dt * 0.06
      );
    }
    attribute.needsUpdate = true;
  }

  return {
    points: points,
    update: update,
    setOpacity: function (value) {
      material.opacity = value;
    }
  };
}
