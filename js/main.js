// TerminalX Website — main.js

// --- Loader ---
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('loaded');
    document.body.classList.add('ready');
  }, 1800);
});

// --- Custom Cursor ---
const dot = document.getElementById('cursor-dot');
const follower = document.getElementById('cursor-follower');
let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
});

function animateCursor() {
  followerX += (mouseX - followerX) * 0.12;
  followerY += (mouseY - followerY) * 0.12;
  follower.style.transform = `translate(${followerX - 18}px, ${followerY - 18}px)`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Cursor hover states
document.querySelectorAll('a, button, .magnetic').forEach(el => {
  el.addEventListener('mouseenter', () => follower.classList.add('hover'));
  el.addEventListener('mouseleave', () => follower.classList.remove('hover'));
});

// Hide cursor on mobile
if ('ontouchstart' in window) {
  dot.style.display = 'none';
  follower.style.display = 'none';
}

// --- Magnetic Effect ---
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(0, 0)';
  });
});

// --- Menu Toggle ---
const menuBtn = document.getElementById('menu-btn');
const menuOverlay = document.getElementById('menu-overlay');
let menuOpen = false;

menuBtn.addEventListener('click', () => {
  menuOpen = !menuOpen;
  menuBtn.classList.toggle('active', menuOpen);
  menuOverlay.classList.toggle('active', menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
});

document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    menuBtn.classList.remove('active');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// --- Smooth Scroll ---
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      const top = target.offsetTop - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// --- Scroll Reveal ---
const revealElements = document.querySelectorAll('.reveal-up, .reveal-text');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay * 150);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// --- Word Reveal Animation ---
document.querySelectorAll('.reveal-text').forEach(el => {
  const words = el.innerHTML.split(/\s+/);
  el.innerHTML = words.map(w => `<span class="word-wrap"><span class="word">${w}</span></span>`).join(' ');
});

const wordObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const words = entry.target.querySelectorAll('.word');
      words.forEach((word, i) => {
        setTimeout(() => word.classList.add('visible'), i * 80);
      });
      wordObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.reveal-text').forEach(el => wordObserver.observe(el));

// --- Stat Counter Animation ---
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals) || 0;
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = current.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => statObserver.observe(el));

// --- Parallax Hero ---
const heroImg = document.querySelector('.hero-img');
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (heroImg && scrollY < 1200) {
    const scale = 1.1 - scrollY * 0.0001;
    heroImg.style.transform = `scale(${Math.max(scale, 1)}) translateY(${scrollY * 0.3}px)`;
  }
  // Nav background
  if (scrollY > 100) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// --- Hero Title Animation ---
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.title-word').forEach((word, i) => {
      setTimeout(() => word.classList.add('visible'), i * 200 + 2000);
    });
  }, 0);
});
