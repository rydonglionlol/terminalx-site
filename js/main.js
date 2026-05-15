/* ============================================
   TerminalX Landing Page — JavaScript
   ============================================ */

(function () {
  'use strict';

  // --- Lenis Smooth Scroll ---
  if (typeof Lenis !== 'undefined') {
    var lenis = new Lenis({
      duration: 0.8,
      easing: function(t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.2,
      infinite: false
    });
    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);
  }

  // --- Particle Intro ---
  (function() {
    var intro = document.getElementById('particle-intro');
    var canvas = document.getElementById('particle-canvas');
    if (!intro || !canvas) return;
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var particles = [];
    var pixelSteps = 4;
    var wordsQueue = ['WELCOME TO', 'TERMINALX'];
    var wordIndex = 0;
    var frameCount = 0;
    var introComplete = false;

    function Particle() {
      this.pos = { x: 0, y: 0 };
      this.vel = { x: 0, y: 0 };
      this.acc = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      this.closeEnoughTarget = 100;
      this.maxSpeed = 1;
      this.maxForce = 0.1;
      this.isKilled = false;
      this.startColor = { r: 0, g: 0, b: 0 };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;
      this.colorBlendRate = 0.01;
    }

    Particle.prototype.move = function() {
      var proximityMult = 1;
      var dx = this.pos.x - this.target.x;
      var dy = this.pos.y - this.target.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.closeEnoughTarget) proximityMult = distance / this.closeEnoughTarget;

      var tx = this.target.x - this.pos.x;
      var ty = this.target.y - this.pos.y;
      var mag = Math.sqrt(tx * tx + ty * ty);
      if (mag > 0) { tx = (tx / mag) * this.maxSpeed * proximityMult; ty = (ty / mag) * this.maxSpeed * proximityMult; }

      var sx = tx - this.vel.x;
      var sy = ty - this.vel.y;
      var sm = Math.sqrt(sx * sx + sy * sy);
      if (sm > 0) { sx = (sx / sm) * this.maxForce; sy = (sy / sm) * this.maxForce; }

      this.acc.x += sx; this.acc.y += sy;
      this.vel.x += this.acc.x; this.vel.y += this.acc.y;
      this.pos.x += this.vel.x; this.pos.y += this.vel.y;
      this.acc.x = 0; this.acc.y = 0;
    };

    Particle.prototype.draw = function() {
      if (this.colorWeight < 1) this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1);
      var r = Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight);
      var g = Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight);
      var b = Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
    };

    Particle.prototype.kill = function() {
      if (!this.isKilled) {
        var angle = Math.random() * Math.PI * 2;
        var dist = (canvas.width + canvas.height) / 2;
        this.target.x = canvas.width / 2 + Math.cos(angle) * dist;
        this.target.y = canvas.height / 2 + Math.sin(angle) * dist;
        this.startColor = {
          r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
          g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
          b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight
        };
        this.targetColor = { r: 0, g: 0, b: 0 };
        this.colorWeight = 0;
        this.isKilled = true;
      }
    };

    function nextWord(word) {
      var offCanvas = document.createElement('canvas');
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      var offCtx = offCanvas.getContext('2d');
      offCtx.fillStyle = 'white';
      var fontSize = Math.min(canvas.width / (word.length * 0.6), 160);
      offCtx.font = 'bold ' + fontSize + 'px Inter, Arial, sans-serif';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(word, canvas.width / 2, canvas.height / 2);

      var imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
      var pixels = imageData.data;

      // Blue-tinted color for TerminalX brand
      var newColor = { r: 91 + Math.random() * 40, g: 141 + Math.random() * 40, b: 239 };

      var coordsIndexes = [];
      for (var i = 0; i < pixels.length; i += pixelSteps * 4) coordsIndexes.push(i);
      for (var i = coordsIndexes.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = coordsIndexes[i]; coordsIndexes[i] = coordsIndexes[j]; coordsIndexes[j] = tmp;
      }

      var pIdx = 0;
      for (var c = 0; c < coordsIndexes.length; c++) {
        var ci = coordsIndexes[c];
        if (pixels[ci + 3] > 0) {
          var x = (ci / 4) % canvas.width;
          var y = Math.floor(ci / 4 / canvas.width);
          var p;
          if (pIdx < particles.length) {
            p = particles[pIdx];
            p.isKilled = false;
            pIdx++;
          } else {
            p = new Particle();
            var angle = Math.random() * Math.PI * 2;
            var dist = (canvas.width + canvas.height) / 2;
            p.pos.x = canvas.width / 2 + Math.cos(angle) * dist;
            p.pos.y = canvas.height / 2 + Math.sin(angle) * dist;
            p.maxSpeed = Math.random() * 6 + 4;
            p.maxForce = p.maxSpeed * 0.05;
            p.colorBlendRate = Math.random() * 0.0275 + 0.0025;
            particles.push(p);
          }
          p.startColor = {
            r: p.startColor.r + (p.targetColor.r - p.startColor.r) * p.colorWeight,
            g: p.startColor.g + (p.targetColor.g - p.startColor.g) * p.colorWeight,
            b: p.startColor.b + (p.targetColor.b - p.startColor.b) * p.colorWeight
          };
          p.targetColor = newColor;
          p.colorWeight = 0;
          p.target.x = x;
          p.target.y = y;
        }
      }
      for (var i = pIdx; i < particles.length; i++) particles[i].kill();
    }

    function animate() {
      if (introComplete) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (var i = particles.length - 1; i >= 0; i--) {
        particles[i].move();
        particles[i].draw();
        if (particles[i].isKilled) {
          if (particles[i].pos.x < -50 || particles[i].pos.x > canvas.width + 50 ||
              particles[i].pos.y < -50 || particles[i].pos.y > canvas.height + 50) {
            particles.splice(i, 1);
          }
        }
      }

      frameCount++;
      if (frameCount === 300 && wordIndex === 0) {
        wordIndex = 1;
        nextWord(wordsQueue[1]);
      }
      if (frameCount === 600) {
        introComplete = true;
        intro.classList.add('fade-out');
        setTimeout(function() { intro.style.display = 'none'; }, 800);
        return;
      }
      requestAnimationFrame(animate);
    }

    nextWord(wordsQueue[0]);
    animate();
  })();

  // --- Hero Mesh Gradient (WebGL) ---
  (function() {
    var c = document.getElementById('hero-gradient');
    if (!c) return;
    var gl = c.getContext('webgl');
    if (!gl) return;

    function resize() {
      c.width = c.clientWidth * (window.devicePixelRatio || 1);
      c.height = c.clientHeight * (window.devicePixelRatio || 1);
      gl.viewport(0, 0, c.width, c.height);
    }
    resize();
    window.addEventListener('resize', resize);

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}';
    var fs = [
      'precision mediump float;',
      'uniform float t;',
      'uniform vec2 r;',
      'void main(){',
      '  vec2 uv=gl_FragCoord.xy/r;',
      '  float n=0.0;',
      '  n+=sin(uv.x*3.0+t*0.4)*cos(uv.y*4.0+t*0.3)*0.5;',
      '  n+=sin(uv.x*5.0-t*0.6+uv.y*3.0)*0.3;',
      '  n+=cos(uv.y*6.0+t*0.5+uv.x*2.0)*0.2;',
      '  n+=sin(length(uv-0.5)*8.0-t)*0.15;',
      '  vec3 c1=vec3(0.0,0.0,0.02);',
      '  vec3 c2=vec3(0.04,0.06,0.12);',
      '  vec3 c3=vec3(0.1,0.15,0.25);',
      '  vec3 c4=vec3(0.36,0.55,0.94);',
      '  vec3 col=c1;',
      '  col=mix(col,c2,smoothstep(-0.5,0.0,n));',
      '  col=mix(col,c3,smoothstep(0.0,0.3,n));',
      '  col=mix(col,c4,smoothstep(0.3,0.8,n)*0.15);',
      '  float v=1.0-length(uv-vec2(0.5,0.5))*0.8;',
      '  col*=v;',
      '  gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');

    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    var pLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    var tLoc = gl.getUniformLocation(prog, 't');
    var rLoc = gl.getUniformLocation(prog, 'r');

    function draw(now) {
      gl.uniform1f(tLoc, now * 0.001);
      gl.uniform2f(rLoc, c.width, c.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  // --- Navigation Scroll Effect ---
  const nav = document.getElementById('nav');
  function updateNav() {
    if (window.scrollY > 50) nav.classList.add('nav--scrolled');
    else nav.classList.remove('nav--scrolled');
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // --- Mobile Menu ---
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('nav__toggle--active');
      mobileMenu.classList.toggle('mobile-menu--open');
      document.body.style.overflow = mobileMenu.classList.contains('mobile-menu--open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('nav__toggle--active');
        mobileMenu.classList.remove('mobile-menu--open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Scroll Reveal ---
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('reveal--visible');
        else entry.target.classList.remove('reveal--visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('reveal--visible'));
  }

  // --- Counter Animation ---
  const counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) animateCounter(entry.target);
        else entry.target.textContent = '0';
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1800;
    const startTime = performance.now();
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = String(Math.round(easeOutQuart(progress) * target));
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // --- Lamp expand on scroll ---
  (function() {
    var lamp = document.querySelector('.lamp');
    if (!lamp) return;
    if ('IntersectionObserver' in window) {
      var lampObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) lamp.classList.add('lamp--active');
          else lamp.classList.remove('lamp--active');
        });
      }, { threshold: 0.3 });
      lampObs.observe(lamp);
    }
  })();

  // --- Section Blur on Scroll ---
  (function() {
    var blurSections = document.querySelectorAll('.about, .wheel, .lamp, .section--pricing, .section--team, .section--cta, footer');
    blurSections.forEach(function(el) { el.classList.add('section-blur'); });
    if ('IntersectionObserver' in window) {
      var blurObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
          else entry.target.classList.remove('in-view');
        });
      }, { threshold: 0.15 });
      blurSections.forEach(function(el) { blurObs.observe(el); });
    } else {
      blurSections.forEach(function(el) { el.classList.add('in-view'); });
    }
  })();

  // --- Feature Wheel ---
  const wheelSection = document.getElementById('wheel');
  const wheelNames = document.querySelectorAll('.wheel__name');
  const wheelInfo = document.getElementById('wheel-info');
  const wheelProgressFill = document.querySelector('.wheel__progress-fill');

  const wheelData = [
    { title: 'Scan', desc: 'Point the glasses at any boarding pass. Flight, gate, seat, and boarding time appear in your view instantly.' },
    { title: 'Navigate', desc: '3D green holographic arrows on the ground guide you step-by-step. They curve around corners and change with each step.' },
    { title: 'Ask', desc: '"Hey Aero, where\'s the nearest coffee shop?" Get instant spoken answers about bathrooms, restaurants, WiFi, and lounges.' },
    { title: 'Explore', desc: 'A live mini-map in the corner of your vision. Real-time GPS positioning shows everything around you in the terminal.' },
    { title: 'Arrive', desc: 'Chime when navigation starts, success sound when you arrive. Turn-by-turn voice directions at every step.' },
    { title: 'Return', desc: 'Drop the glasses at any return desk. They get cleaned, charged, and recycled for the next traveler. Bon voyage!' },
  ];

  let lastWheelIndex = -1;

  function updateWheel() {
    if (!wheelSection || wheelNames.length === 0) return;
    const rect = wheelSection.getBoundingClientRect();
    const sectionHeight = wheelSection.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));

    if (wheelProgressFill) wheelProgressFill.style.height = (progress * 100) + '%';

    const count = wheelNames.length;
    const activeIndex = Math.min(count - 1, Math.floor(progress * count));

    var R = 90;
    var cx = -55;
    var cy = 50;
    var spacing = 20;
    var focal = progress * (count - 1);
    var scrollAngle = focal * spacing;

    wheelNames.forEach((name, i) => {
      var angle = (i * spacing) - scrollAngle;
      var angleRad = angle * Math.PI / 180;

      var x = cx + Math.cos(angleRad) * R;
      var y = cy + Math.sin(angleRad) * R * (100 / window.innerWidth * window.innerHeight / 100);

      var distance = Math.abs(i - focal);
      var brightness = Math.max(0.12, 1 - distance * 0.5);
      var glow = distance < 0.6;

      name.style.left = x + 'vw';
      name.style.top = y + 'vh';
      name.style.transform = 'translate(-50%, -50%) rotate(' + angle + 'deg)';
      name.style.color = glow
        ? 'rgba(255, 252, 240, ' + Math.min(1, 1.2 - distance) + ')'
        : 'rgba(250, 248, 240, ' + brightness + ')';
      name.style.textShadow = glow ? '0 0 60px rgba(91,141,239,0.5), 0 0 120px rgba(91,141,239,0.2)' : 'none';
    });

    if (wheelInfo && activeIndex !== lastWheelIndex) {
      lastWheelIndex = activeIndex;
      wheelInfo.classList.remove('visible');
      setTimeout(() => {
        const titleEl = wheelInfo.querySelector('.wheel__info-title');
        const descEl = wheelInfo.querySelector('.wheel__info-desc');
        if (titleEl) titleEl.textContent = wheelData[activeIndex].title;
        if (descEl) descEl.textContent = wheelData[activeIndex].desc;
        wheelInfo.classList.add('visible');
      }, 150);
    }
  }

  window.addEventListener('scroll', updateWheel, { passive: true });
  updateWheel();

  // --- About — Container Scroll Animation ---
  (function() {
    var section = document.getElementById('about-scroll');
    var card = document.getElementById('about-card');
    var header = document.getElementById('about-header');
    if (!section || !card || !header) return;

    var isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', function() { isMobile = window.innerWidth <= 768; });

    function updateAboutScroll() {
      var rect = section.getBoundingClientRect();
      var sectionH = section.offsetHeight;
      var scrolled = -rect.top;
      var progress = Math.max(0, Math.min(1, scrolled / (sectionH - window.innerHeight)));

      var rotate = 45 - progress * 45;
      var scaleFrom = isMobile ? 0.5 : 0.6;
      var scaleTo = isMobile ? 0.95 : 1.02;
      var scale = scaleFrom + (scaleTo - scaleFrom) * progress;
      var translateZ = (1 - progress) * -200;
      card.style.transform = 'perspective(800px) rotateX(' + rotate + 'deg) scale(' + scale + ') translateZ(' + translateZ + 'px)';
      card.style.opacity = Math.min(1, progress * 2);

      var headerY = -progress * 200;
      var headerOpacity = Math.max(0, 1 - progress * 1.5);
      header.style.transform = 'translateX(-50%) translateY(' + headerY + 'px) scale(' + (1 + progress * 0.1) + ')';
      header.style.opacity = headerOpacity;
    }

    window.addEventListener('scroll', updateAboutScroll, { passive: true });
    updateAboutScroll();
  })();

  // --- Features Timeline ---
  const tlSection = document.getElementById('timeline-section');
  const tlNum = document.getElementById('tl-num');
  const tlTitle = document.getElementById('tl-title');
  const tlDesc = document.getElementById('tl-desc');
  const tlTrack = document.getElementById('tl-track');
  const tlWraps = tlTrack ? tlTrack.querySelectorAll('.timeline__image-wrap') : [];
  let tlData = [];
  try { tlData = JSON.parse(document.getElementById('timeline-data').textContent); } catch(e) {}

  let lastTlIndex = -1;
  const tlFixedEls = [tlNum, document.getElementById('tl-text')];

  function updateTimeline() {
    if (!tlSection || tlData.length === 0 || !tlTrack) return;
    const rect = tlSection.getBoundingClientRect();
    const sectionH = tlSection.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / sectionH));
    const count = tlData.length;
    const activeIndex = Math.min(count - 1, Math.floor(progress * count));

    const inView = rect.top < window.innerHeight * 0.3 && rect.bottom > window.innerHeight * 0.5;
    tlFixedEls.forEach(el => { if (el) el.style.opacity = inView ? '1' : '0'; });

    const imgW = 580, imgH = 380;
    const cx = window.innerWidth / 2 - imgW / 2;
    const cy = window.innerHeight / 2 - imgH / 2;
    const stepX = imgW + 80;
    const stepY = imgH + 40;
    var focal = progress * (count - 1);
    tlWraps.forEach(function(wrap, i) {
      var offsetX = (i - focal) * stepX;
      var offsetY = (i - focal) * stepY;
      wrap.style.transform = 'translate(' + (cx + offsetX) + 'px, ' + (cy + offsetY) + 'px)';
    });

    tlWraps.forEach((wrap, i) => {
      if (i === activeIndex) {
        wrap.classList.remove('blurred');
        wrap.classList.add('focused');
      } else {
        wrap.classList.remove('focused');
        wrap.classList.add('blurred');
      }
    });

    if (inView && activeIndex !== lastTlIndex) {
      lastTlIndex = activeIndex;
      const d = tlData[activeIndex];

      if (tlTitle) { tlTitle.style.opacity = '0'; tlTitle.style.transform = 'translateY(-8px)'; }
      if (tlDesc) { tlDesc.style.opacity = '0'; }
      if (tlNum) { tlNum.style.opacity = '0'; }

      setTimeout(() => {
        if (tlNum) { tlNum.textContent = d.num; tlNum.style.opacity = '1'; }
        if (tlTitle) { tlTitle.textContent = d.title; tlTitle.style.opacity = '1'; tlTitle.style.transform = 'translateY(0)'; }
        if (tlDesc) { tlDesc.textContent = d.desc; tlDesc.style.opacity = '1'; }
      }, 200);
    }
  }

  window.addEventListener('scroll', updateTimeline, { passive: true });
  updateTimeline();

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const offsetTop = targetEl.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    });
  });

  // --- Custom Cursor ---
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      cursorRing.style.width = '64px';
      cursorRing.style.height = '64px';
      cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    });
    el.addEventListener('mouseleave', function() {
      cursorRing.style.width = '48px';
      cursorRing.style.height = '48px';
      cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    });
  });
})();
