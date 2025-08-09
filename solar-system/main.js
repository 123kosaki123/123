import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';

const scene = new THREE.Scene();

// Renderer (WebGL)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// Renderer for CSS2D labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '5';
document.body.appendChild(labelRenderer.domElement);

// Camera & Controls
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 80, 200);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 40;
controls.maxDistance = 900;
controls.target.set(0, 0, 0);

// Lights
const ambientLight = new THREE.AmbientLight(0x90a0c0, 0.08);
scene.add(ambientLight);

// Sun as light source
const sunLight = new THREE.PointLight(0xffe9aa, 4.0, 0, 2);
sunLight.castShadow = false;
scene.add(sunLight);

// Sun mesh (emissive)
const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffd057 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.name = 'Sun';
scene.add(sunMesh);

// Subtle glow with sprite
const createSunGlow = () => {
  const texSize = 128;
  const canvas = document.createElement('canvas');
  canvas.width = texSize; canvas.height = texSize;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(texSize/2, texSize/2, 10, texSize/2, texSize/2, texSize/2);
  gradient.addColorStop(0, 'rgba(255,220,120,0.9)');
  gradient.addColorStop(0.35, 'rgba(255,160,60,0.55)');
  gradient.addColorStop(1, 'rgba(255,130,30,0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,texSize,texSize);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(120, 120, 1);
  return sprite;
};

sunMesh.add(createSunGlow());

// Star field (background points)
const createStarField = (count = 3000, radius = 2000) => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.6 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ size: 1.6, color: 0xffffff, transparent: true, opacity: 0.9, sizeAttenuation: true });
  const points = new THREE.Points(geometry, material);
  points.matrixAutoUpdate = false;
  points.updateMatrix();
  return points;
};

scene.add(createStarField());

// Utility: Orbit ring
function createOrbitRing(radius, segments = 256, color = 0x4e5585) {
  const positions = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(t) * radius, 0, Math.sin(t) * radius);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color, opacity: 0.5, transparent: true });
  const line = new THREE.Line(geometry, material);
  line.rotation.x = -Math.PI / 2; // XZ plane
  line.renderOrder = -1;
  return line;
}

// Planet factory
function createPlanet({ name, radius, distance, color, orbitSpeed, rotationSpeed, tiltDeg, hasRing }) {
  const pivot = new THREE.Object3D();
  pivot.name = `${name}-Orbit`;

  const sphereGeometry = new THREE.SphereGeometry(radius, 48, 48);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 1.0, metalness: 0.0 });
  const mesh = new THREE.Mesh(sphereGeometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.position.set(distance, 0, 0);
  mesh.rotation.z = THREE.MathUtils.degToRad(tiltDeg || 0);
  mesh.name = name;

  // Label
  const div = document.createElement('div');
  div.className = 'label';
  div.textContent = name;
  const label = new CSS2DObject(div);
  label.position.set(0, radius + 1.2, 0);
  mesh.add(label);

  // Optional rings (e.g., Saturn)
  if (hasRing) {
    const ringInner = radius * 1.6;
    const ringOuter = radius * 2.5;
    const ringGeometry = new THREE.RingGeometry(ringInner, ringOuter, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xb9b7ad, side: THREE.DoubleSide, roughness: 0.9, metalness: 0.0, transparent: true, opacity: 0.7 });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = -Math.PI / 2.2;
    mesh.add(ringMesh);
  }

  // Store motion parameters
  mesh.userData = { orbitSpeed, rotationSpeed, distance, radius };

  // Orbit ring visual
  const orbitRing = createOrbitRing(distance);
  pivot.add(orbitRing);

  pivot.add(mesh);
  return { pivot, mesh, label, orbitRing };
}

// Scaled, non-realistic but relative-ish values for visibility
const planetsSpec = [
  { name: 'Mercury', color: 0x9e9a97, radius: 1, distance: 16, orbitSpeed: 4.15, rotationSpeed: 0.02, tiltDeg: 0.01 },
  { name: 'Venus', color: 0xd7c8a8, radius: 1.9, distance: 22, orbitSpeed: 1.62, rotationSpeed: -0.004, tiltDeg: 177.4 },
  { name: 'Earth', color: 0x4ea0ff, radius: 2, distance: 28, orbitSpeed: 1.0, rotationSpeed: 0.05, tiltDeg: 23.5 },
  { name: 'Mars', color: 0xc3583b, radius: 1.2, distance: 34, orbitSpeed: 0.53, rotationSpeed: 0.05, tiltDeg: 25 },
  { name: 'Jupiter', color: 0xd2b48c, radius: 6.5, distance: 48, orbitSpeed: 0.084, rotationSpeed: 0.16, tiltDeg: 3 },
  { name: 'Saturn', color: 0xe6d3a3, radius: 5.6, distance: 64, orbitSpeed: 0.034, rotationSpeed: 0.15, tiltDeg: 26.7, hasRing: true },
  { name: 'Uranus', color: 0x9ad6d6, radius: 4.0, distance: 80, orbitSpeed: 0.012, rotationSpeed: -0.1, tiltDeg: 97.8 },
  { name: 'Neptune', color: 0x4169e1, radius: 3.9, distance: 94, orbitSpeed: 0.006, rotationSpeed: 0.10, tiltDeg: 28 }
];

// Create planets
const planetEntries = planetsSpec.map(spec => {
  const { pivot, mesh, label, orbitRing } = createPlanet(spec);
  scene.add(pivot);
  return { pivot, mesh, label, orbitRing, name: spec.name };
});

// Simple moon for Earth
function createMoon(planetMesh, { radius = 0.55, distance = 4.2, orbitSpeed = 4.0, color = 0xbdbdbd }) {
  const moonPivot = new THREE.Object3D();
  moonPivot.position.copy(planetMesh.position);

  const geo = new THREE.SphereGeometry(radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1.0, metalness: 0.0 });
  const moon = new THREE.Mesh(geo, mat);
  moon.position.set(distance, 0, 0);
  moon.receiveShadow = false;
  moon.castShadow = false;

  moon.userData = { orbitSpeed };

  planetMesh.parent.add(moonPivot);
  moonPivot.add(moon);

  return { moonPivot, moon };
}

const earthEntry = planetEntries.find(p => p.name === 'Earth');
let moonEntry = null;
if (earthEntry) {
  moonEntry = createMoon(earthEntry.mesh, {});
}

// GUI controls
const options = {
  timeScale: 1.0,
  showOrbits: true,
  showLabels: true,
  focus: 'None',
  autoRotate: false
};

const gui = new GUI({ title: '控制面板' });

gui.add(options, 'timeScale', 0.01, 10, 0.01).name('时间倍率');

gui.add(options, 'showOrbits').name('显示轨道').onChange(value => {
  planetEntries.forEach(e => e.orbitRing.visible = value);
});

const focusChoices = ['None', 'Sun', ...planetsSpec.map(p => p.name)];

gui.add(options, 'focus', focusChoices).name('聚焦天体').onChange(name => {
  const target = name === 'Sun' ? sunMesh : planetEntries.find(p => p.name === name)?.mesh;
  if (!target) {
    controls.target.set(0, 0, 0);
  } else {
    controls.target.copy(target.getWorldPosition(new THREE.Vector3()));
  }
});

gui.add(options, 'showLabels').name('显示标签').onChange(val => {
  planetEntries.forEach(e => e.label.element.style.display = val ? '' : 'none');
});

const autoRotateCtrl = gui.add(options, 'autoRotate').name('自动旋转视角');
autoRotateCtrl.onChange(val => {
  controls.autoRotate = val;
  controls.autoRotateSpeed = 0.6;
});

// Responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  const t = delta * options.timeScale;

  // Sun slow rotation
  sunMesh.rotation.y += 0.01 * t;

  // Update planets
  for (const entry of planetEntries) {
    const { pivot, mesh } = entry;
    const { orbitSpeed, rotationSpeed, distance } = mesh.userData;

    // Orbit around Sun
    pivot.rotation.y += orbitSpeed * 0.05 * t; // scale down for scene pacing

    // Self rotation
    mesh.rotation.y += rotationSpeed * 1.5 * t;

    // Keep sun light centered
    sunLight.position.set(0, 0, 0);
  }

  // Moon orbit
  if (moonEntry) {
    moonEntry.moonPivot.rotation.y += moonEntry.moon.userData.orbitSpeed * 0.15 * t;
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();