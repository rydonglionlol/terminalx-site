import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

(function() {
  var canvas = document.getElementById('horizon-canvas');
  var section = document.getElementById('horizon');
  if (!canvas || !section) return;

  // === SCENE ===
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000005);

  var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  var composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  var bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8, 0.3, 0.85
  );
  composer.addPass(bloom);

  // === STARFIELD ===
  var starGeo = new THREE.BufferGeometry();
  var starCount = 15000;
  var starPos = new Float32Array(starCount * 3);
  var starColors = new Float32Array(starCount * 3);
  var starSizes = new Float32Array(starCount);

  for (var i = 0; i < starCount; i++) {
    var angle = Math.random() * Math.PI * 2;
    var radius = 30 + Math.random() * 250;
    starPos[i*3]     = Math.cos(angle) * radius;
    starPos[i*3 + 1] = Math.sin(angle) * radius;
    starPos[i*3 + 2] = -Math.random() * 2500;

    // Blue-tinted stars for TerminalX brand
    var temp = Math.random();
    if (temp < 0.5) { starColors[i*3] = 0.8; starColors[i*3+1] = 0.9; starColors[i*3+2] = 1; }
    else if (temp < 0.75) { starColors[i*3] = 0.36; starColors[i*3+1] = 0.55; starColors[i*3+2] = 0.94; }
    else if (temp < 0.9) { starColors[i*3] = 1; starColors[i*3+1] = 1; starColors[i*3+2] = 1; }
    else { starColors[i*3] = 0.2; starColors[i*3+1] = 0.83; starColors[i*3+2] = 0.6; }

    starSizes[i] = Math.random() * 2.5 + 0.5;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

  var starMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: [
      'attribute float size;',
      'attribute vec3 color;',
      'varying vec3 vColor;',
      'varying float vAlpha;',
      'uniform float time;',
      'void main() {',
      '  vColor = color;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = size * (150.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '  vAlpha = 0.5 + 0.5 * sin(time * 1.5 + position.x * 0.05 + position.y * 0.05);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vColor;',
      'varying float vAlpha;',
      'void main() {',
      '  float d = length(gl_PointCoord - vec2(0.5));',
      '  if (d > 0.5) discard;',
      '  float glow = 1.0 - smoothstep(0.0, 0.5, d);',
      '  gl_FragColor = vec4(vColor, glow * vAlpha);',
      '}'
    ].join('\n'),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  var stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // === MINI GALAXIES ===
  var galaxies = [];
  for (var g = 0; g < 6; g++) {
    var gCount = 800;
    var gGeo = new THREE.BufferGeometry();
    var gPos = new Float32Array(gCount * 3);
    var gCol = new Float32Array(gCount * 3);
    // Blue-purple tint for TerminalX brand
    var tint = new THREE.Color().setHSL(0.6 + Math.random() * 0.15, 0.7, 0.65);
    for (var p = 0; p < gCount; p++) {
      var arm = Math.floor(Math.random() * 3);
      var dist = Math.random() * 20;
      var spin = dist * 0.4 + arm * (Math.PI * 2 / 3);
      var scatter = (1 - dist / 20) * 3;
      gPos[p*3]     = Math.cos(spin) * dist + (Math.random() - 0.5) * scatter;
      gPos[p*3 + 1] = (Math.random() - 0.5) * scatter * 0.3;
      gPos[p*3 + 2] = Math.sin(spin) * dist + (Math.random() - 0.5) * scatter;
      var bright = 1 - dist / 25;
      gCol[p*3]     = tint.r * bright;
      gCol[p*3 + 1] = tint.g * bright;
      gCol[p*3 + 2] = tint.b * bright;
    }
    gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
    var gMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });
    var galaxy = new THREE.Points(gGeo, gMat);
    galaxy.position.set(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 80,
      -300 - g * 300
    );
    galaxy.rotation.x = Math.random() * Math.PI;
    galaxy.rotation.y = Math.random() * Math.PI;
    galaxy.userData.spinSpeed = 0.05 + Math.random() * 0.1;
    scene.add(galaxy);
    galaxies.push(galaxy);
  }

  // === CENTRAL LIGHT ===
  var light = new THREE.Mesh(
    new THREE.SphereGeometry(5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x5b8def })
  );
  light.position.set(0, 0, -2200);
  scene.add(light);

  // === SCROLL ===
  var scrollProgress = 0;

  var textTimings = [
    { start: 0.0,  peak: 0.15, end: 0.40 },
    { start: 0.38, peak: 0.55, end: 0.72 },
    { start: 0.70, peak: 0.85, end: 1.0  }
  ];

  function onScroll() {
    var rect = section.getBoundingClientRect();
    var sH = section.offsetHeight - window.innerHeight;
    scrollProgress = Math.max(0, Math.min(1, -rect.top / sH));

    camera.position.z = -scrollProgress * 2000;
    camera.position.y = Math.sin(scrollProgress * Math.PI) * 10;
    camera.position.x = Math.sin(scrollProgress * Math.PI * 2) * 5;

    camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, camera.position.z - 200);

    scene.background.setRGB(0, 0, 0);

    bloom.strength = 0.8 + scrollProgress * 1.5;

    var lightScale = 1 + scrollProgress * scrollProgress * 15;
    light.scale.set(lightScale, lightScale, lightScale);

    var textEls = document.querySelectorAll('.horizon__section');
    textEls.forEach(function(el, i) {
      var t = textTimings[i];
      if (!t) return;
      var op = 0;
      if (scrollProgress >= t.start && scrollProgress <= t.end) {
        op = scrollProgress < t.peak
          ? (scrollProgress - t.start) / (t.peak - t.start)
          : 1 - (scrollProgress - t.peak) / (t.end - t.peak);
      }
      el.style.opacity = Math.max(0, Math.min(1, op));
      el.style.transform = 'translateY(' + ((scrollProgress - t.peak) * -300) + 'px)';
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // === ANIMATE ===
  function animate() {
    requestAnimationFrame(animate);
    var time = performance.now() * 0.001;

    starMat.uniforms.time.value = time;

    galaxies.forEach(function(gal) {
      gal.rotation.y += gal.userData.spinSpeed * 0.01;
    });

    camera.position.x += Math.sin(time * 0.3) * 0.02;
    camera.position.y += Math.cos(time * 0.25) * 0.015;

    composer.render();
  }
  animate();

  // === RESIZE ===
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
})();
