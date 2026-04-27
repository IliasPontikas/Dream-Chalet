/**
 * three-particles.js — Rotating 3D point-cloud background (Three.js)
 *
 * Renders a configurable particle field on a <canvas> element.
 * Automatically pauses when off-screen (IntersectionObserver).
 * Skips on low-end devices (navigator.hardwareConcurrency < minCores).
 *
 * Dependencies: Three.js (r150+)
 *
 * HTML:
 *   <canvas id="three-canvas"></canvas>
 *
 * Usage:
 *   initThreeParticles();
 *   initThreeParticles({
 *     canvasId:  'three-canvas',
 *     count:     2000,
 *     color:     0xc9a96e,
 *     size:      0.035,
 *     opacity:   0.65,
 *     spread:    10,
 *     speedY:    0.04,
 *     speedX:    0.015,
 *     minCores:  4,
 *   });
 */
function initThreeParticles(opts = {}) {
  'use strict';

  const o = {
    canvasId: 'three-canvas',
    count:    2000,
    color:    0xc9a96e,
    size:     0.035,
    opacity:  0.65,
    spread:   10,    // ± units in each axis
    speedY:   0.04,
    speedX:   0.015,
    minCores: 4,     // skip on devices with fewer CPU cores
    ...opts,
  };

  if (navigator.hardwareConcurrency < o.minCores) return;

  const canvas = document.getElementById(o.canvasId);
  if (!canvas || typeof THREE === 'undefined') return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const positions = new Float32Array(o.count * 3);
  for (let i = 0; i < o.count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * o.spread * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * o.spread * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * o.spread * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: o.color,
    size:  o.size,
    transparent: true,
    opacity: o.opacity,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let isVisible = false;
  const observer = new IntersectionObserver(
    (entries) => { isVisible = entries[0].isIntersecting; },
    { threshold: 0.1 }
  );
  observer.observe(canvas);

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;
    const t = clock.getElapsedTime();
    points.rotation.y = t * o.speedY;
    points.rotation.x = t * o.speedX;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
