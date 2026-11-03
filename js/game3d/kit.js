import * as THREE from '../../vendor/three.module.min.js';

export function createKit(scene, pickables) {
  function material(color, options) {
    const o = options || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.roughness === undefined ? 0.8 : o.roughness,
      metalness: o.metalness === undefined ? 0.1 : o.metalness,
      emissive: o.emissive === undefined ? 0x000000 : o.emissive,
      emissiveIntensity: o.emissiveIntensity === undefined ? 1 : o.emissiveIntensity
    });
  }

  function register(mesh, options) {
    const o = options || {};
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = o.receive !== false;
    if (o.pick !== false) {
      pickables.push(mesh);
    }
    return mesh;
  }

  function box(w, h, d, mat, x, y, z, parent, options) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    (parent || scene).add(mesh);
    return register(mesh, options);
  }

  function cylinder(rTop, rBottom, height, mat, x, y, z, options) {
    const o = options || {};
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, o.segments || 16), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    (o.parent || scene).add(mesh);
    return register(mesh, { cast: o.cast, receive: o.receive, pick: o.pick === undefined ? false : o.pick });
  }

  function tube(points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map(function (p) {
      return new THREE.Vector3(p[0], p[1], p[2]);
    }));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), mat);
    scene.add(mesh);
    mesh.receiveShadow = true;
    return mesh;
  }

  function decal(mat, w, h, x, y, z, rotationX, rotationY, parent) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotationX, rotationY, 0);
    mesh.receiveShadow = true;
    (parent || scene).add(mesh);
    return mesh;
  }

  function sign(map, w, h, x, y, z, rotationY, parent) {
    const mat = new THREE.MeshStandardMaterial({
      map: map,
      emissiveMap: map,
      emissive: 0xffffff,
      emissiveIntensity: 0.55,
      roughness: 0.7
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    (parent || scene).add(mesh);
    pickables.push(mesh);
    return mesh;
  }

  function chair(x, z, dirX, dirZ) {
    const mat = material(0x1a2338, { metalness: 0.3, roughness: 0.7 });
    const metal = material(0x3a4660, { metalness: 0.7, roughness: 0.4 });
    const o = { pick: false };
    box(0.46, 0.07, 0.46, mat, x, 0.48, z, undefined, o);
    if (dirZ !== 0) {
      box(0.44, 0.5, 0.06, mat, x, 0.8, z + dirZ * 0.22, undefined, o);
    } else {
      box(0.06, 0.5, 0.44, mat, x + dirX * 0.22, 0.8, z, undefined, o);
    }
    cylinder(0.035, 0.035, 0.4, metal, x, 0.25, z);
    for (let k = 0; k < 5; k++) {
      const leg = box(0.34, 0.03, 0.05, metal, x, 0.06, z, undefined, o);
      leg.rotation.y = k * (Math.PI * 2 / 5) + 0.3;
      leg.translateX(0.12);
    }
  }

  return {
    chair: chair,
    material: material,
    box: box,
    cylinder: cylinder,
    tube: tube,
    decal: decal,
    sign: sign
  };
}
