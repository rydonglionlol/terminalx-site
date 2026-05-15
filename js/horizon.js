import * as THREE from 'three';

(function() {
  var canvas = document.getElementById('horizon-canvas');
  var section = document.getElementById('horizon');
  if (!canvas || !section) return;

  // === SCENE ===
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.0008);

  var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // No bloom — keep clouds and sky natural
  var useComposer = false;

  // === PROCEDURAL CLOUD TEXTURE ===
  function createCloudTexture() {
    var size = 256;
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var ctx = c.getContext('2d');

    // Draw soft cloud puffs
    ctx.clearRect(0, 0, size, size);
    var puffs = 8 + Math.floor(Math.random() * 6);
    for (var i = 0; i < puffs; i++) {
      var x = size * 0.2 + Math.random() * size * 0.6;
      var y = size * 0.3 + Math.random() * size * 0.4;
      var r = 30 + Math.random() * 50;
      var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    var texture = new THREE.CanvasTexture(c);
    texture.needsUpdate = true;
    return texture;
  }

  // === CLOUDS ===
  var clouds = [];
  var cloudCount = 60;

  for (var i = 0; i < cloudCount; i++) {
    var cloudTex = createCloudTexture();
    var cloudMat = new THREE.SpriteMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.5 + Math.random() * 0.35,
      depthWrite: false,
      fog: true
    });
    var cloud = new THREE.Sprite(cloudMat);

    // Scale clouds to be large and flat
    var scaleX = 80 + Math.random() * 160;
    var scaleY = 30 + Math.random() * 50;
    cloud.scale.set(scaleX, scaleY, 1);

    // Distribute clouds in a wide cylinder around the flight path
    var angle = Math.random() * Math.PI * 2;
    var radius = 40 + Math.random() * 200;
    cloud.position.set(
      Math.cos(angle) * radius,
      -20 + Math.random() * 80,
      -Math.random() * 2500
    );

    // Slight random drift speed
    cloud.userData.driftX = (Math.random() - 0.5) * 0.02;
    cloud.userData.driftY = (Math.random() - 0.5) * 0.005;

    scene.add(cloud);
    clouds.push(cloud);
  }

  // === SMALLER WISPY CLOUDS (particles) ===
  var wispGeo = new THREE.BufferGeometry();
  var wispCount = 3000;
  var wispPos = new Float32Array(wispCount * 3);
  var wispSizes = new Float32Array(wispCount);
  var wispAlphas = new Float32Array(wispCount);

  for (var i = 0; i < wispCount; i++) {
    var angle = Math.random() * Math.PI * 2;
    var radius = 20 + Math.random() * 250;
    wispPos[i * 3]     = Math.cos(angle) * radius;
    wispPos[i * 3 + 1] = -30 + Math.random() * 100;
    wispPos[i * 3 + 2] = -Math.random() * 2500;
    wispSizes[i] = Math.random() * 8 + 2;
    wispAlphas[i] = Math.random() * 0.5 + 0.1;
  }

  wispGeo.setAttribute('position', new THREE.BufferAttribute(wispPos, 3));
  wispGeo.setAttribute('size', new THREE.BufferAttribute(wispSizes, 1));
  wispGeo.setAttribute('alpha', new THREE.BufferAttribute(wispAlphas, 1));

  var wispMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: [
      'attribute float size;',
      'attribute float alpha;',
      'varying float vAlpha;',
      'uniform float time;',
      'void main() {',
      '  vAlpha = alpha * (0.6 + 0.4 * sin(time * 0.3 + position.x * 0.01 + position.z * 0.01));',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = size * (200.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying float vAlpha;',
      'void main() {',
      '  float d = length(gl_PointCoord - vec2(0.5));',
      '  if (d > 0.5) discard;',
      '  float soft = 1.0 - smoothstep(0.0, 0.5, d);',
      '  gl_FragColor = vec4(1.0, 1.0, 1.0, soft * soft * vAlpha);',
      '}'
    ].join('\n'),
    transparent: true,
    depthWrite: false
  });

  var wisps = new THREE.Points(wispGeo, wispMat);
  scene.add(wisps);

  // === SUN ===
  // Bright golden sun at the end of the path
  var sunGeo = new THREE.SphereGeometry(8, 32, 32);
  var sunMat = new THREE.MeshBasicMaterial({ color: 0xFFDD44 });
  var sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(0, 40, -2200);
  scene.add(sun);

  // Sun glow (large transparent sprite)
  var glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  var glowCtx = glowCanvas.getContext('2d');
  var glowGrad = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  glowGrad.addColorStop(0, 'rgba(255, 230, 100, 1)');
  glowGrad.addColorStop(0.15, 'rgba(255, 220, 80, 0.8)');
  glowGrad.addColorStop(0.4, 'rgba(255, 200, 50, 0.3)');
  glowGrad.addColorStop(0.7, 'rgba(255, 180, 30, 0.08)');
  glowGrad.addColorStop(1, 'rgba(255, 160, 0, 0)');
  glowCtx.fillStyle = glowGrad;
  glowCtx.fillRect(0, 0, 256, 256);

  var glowTex = new THREE.CanvasTexture(glowCanvas);
  var glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var sunGlow = new THREE.Sprite(glowMat);
  sunGlow.scale.set(200, 200, 1);
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);

  // === AMBIENT LIGHT for slight scene illumination ===
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  var dirLight = new THREE.DirectionalLight(0xFFEECC, 1.0);
  dirLight.position.set(0, 40, -2200);
  scene.add(dirLight);

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

    // Camera flies forward along z
    camera.position.z = -scrollProgress * 2000;
    camera.position.y = 20 + Math.sin(scrollProgress * Math.PI) * 15;
    camera.position.x = Math.sin(scrollProgress * Math.PI * 2) * 8;

    camera.lookAt(camera.position.x * 0.3, camera.position.y * 0.8, camera.position.z - 200);

    // Sky color shifts from bright blue to golden near the sun
    var skyR = 0.53 + scrollProgress * 0.47;
    var skyG = 0.81 - scrollProgress * 0.15;
    var skyB = 0.92 - scrollProgress * 0.45;
    scene.background.setRGB(skyR, skyG, skyB);
    scene.fog.color.setRGB(skyR, skyG, skyB);

    // Sun grows as you approach
    var sunScale = 1 + scrollProgress * scrollProgress * 12;
    sun.scale.set(sunScale, sunScale, sunScale);
    sunGlow.scale.set(200 + scrollProgress * 400, 200 + scrollProgress * 400, 1);
    sunGlow.material.opacity = 0.5 + scrollProgress * 0.5;

    // Text overlay fading
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

    wispMat.uniforms.time.value = time;

    // Drift clouds slowly
    clouds.forEach(function(cloud) {
      cloud.position.x += cloud.userData.driftX;
      cloud.position.y += cloud.userData.driftY;
    });

    // Subtle camera sway
    camera.position.x += Math.sin(time * 0.2) * 0.015;
    camera.position.y += Math.cos(time * 0.15) * 0.01;

    renderer.render(scene, camera);
  }
  animate();

  // === RESIZE ===
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
