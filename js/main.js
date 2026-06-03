/* ── PARTICLES BACKGROUND (tsParticles) ──────────────── */
tsParticles.load("particles-js", {
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
      resize: true
    },
    modes: {
      grab: { distance: 140, links: { opacity: 0.5 } }
    }
  },
  particles: {
    color: { value: "#1a6cf5" },
    links: { color: "#1a6cf5", distance: 150, enable: true, opacity: 0.2, width: 1 },
    move: { enable: true, speed: 1, direction: "none", random: false, straight: false, outModes: "out" },
    number: { density: { enable: true, area: 800 }, value: 60 },
    opacity: { value: 0.3 },
    shape: { type: "circle" },
    size: { value: { min: 1, max: 3 } }
  },
  detectRetina: true
});

/* ── VANILLA TILT 3D ─────────────────────────────────── */
VanillaTilt.init(document.querySelectorAll(".hero-card, .project-card, .cert-card, .edu-card"), {
  max: 6,
  speed: 400,
  glare: true,
  "max-glare": 0.15,
});

/* ── GSAP SCROLL ANIMATIONS ──────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

// Hero Text Animation
gsap.from(".hero-name, .hero-tagline, .hero-ctas", {
  y: 40, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.2
});

// Section Titles
gsap.utils.toArray('.section-title').forEach(title => {
  gsap.from(title, {
    scrollTrigger: { trigger: title, start: "top 85%" },
    y: 30, opacity: 0, duration: 0.8, ease: "power2.out"
  });
});

// Cards Stagger (Projects, Certs, Education)
gsap.utils.toArray('.projects-grid, .certs-grid, .edu-grid').forEach(grid => {
  const cards = grid.children;
  gsap.from(cards, {
    scrollTrigger: { trigger: grid, start: "top 85%" },
    y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out"
  });
});

/* ── THEME TOGGLE ─────────────────────────────────────── */
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const label = document.getElementById('themeLabel');
const icon = document.getElementById('themeIcon');

const sunIcon = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    label.textContent = 'Clair';
    icon.innerHTML = moonIcon;
  } else {
    label.textContent = 'Sombre';
    icon.innerHTML = sunIcon;
  }
  localStorage.setItem('theme', theme);
}

toggle.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// Init from saved pref
const saved = localStorage.getItem('theme');
if (saved) setTheme(saved);

/* ── SCROLL REVEAL ────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.tl-item, .reveal, .skill-item').forEach(el => revealObs.observe(el));

/* ── IFRAME FALLBACK ──────────────────────────────────── */
document.querySelectorAll('.project-preview iframe').forEach(iframe => {
  iframe.addEventListener('error', () => {
    const wrapper = iframe.closest('.project-preview');
    const url = iframe.src;
    wrapper.innerHTML = `
      <div class="preview-fallback">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="14" rx="2"/>
          <path d="M3 7h18M7 3v4M17 3v4"/>
        </svg>
        <span>${new URL(url).hostname}</span>
      </div>`;
  });

  // Some iframes block embedding — detect blank load
  iframe.addEventListener('load', () => {
    try {
      const doc = iframe.contentDocument;
      if (!doc || doc.body.innerHTML.trim() === '') throw new Error('empty');
    } catch (e) {
      // cross-origin or blocked — show nice fallback
    }
  });
});

/* ── 3D SKILLS CANVAS ────────────────────────────────────
   Pure Canvas 2D with perspective projection — floating
   language "chips" drifting in 3D space, no dependencies.
   ────────────────────────────────────────────────────── */
(function () {
  const wrapper = document.getElementById('skills-3d-wrapper');
  const canvas = document.getElementById('skills-3d-canvas');
  if (!wrapper || !canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, raf;

  const SKILLS = [
    { label: 'Python', color: '#3776ab' },
    { label: 'Bash', color: '#4eaa25' },
    { label: 'PowerShell', color: '#5391fe' },
    { label: 'C++', color: '#0078d4' },
    { label: 'SQL', color: '#00758f' },
    { label: 'Java', color: '#f89820' },
    { label: 'Go', color: '#00adb5' },
    { label: 'JavaScript', color: '#c9a800' },
    { label: 'HTML / CSS', color: '#e34f26' },
    { label: 'Linux', color: '#1a6cf5' },
    { label: 'Windows', color: '#00adef' },
    { label: 'Pentesting', color: '#e02424' },
    { label: 'SIEM / EDR', color: '#e84d1c' },
    { label: 'ISO 27001', color: '#0e9f6e' },
    { label: 'Réseaux', color: '#7c3aed' },
    { label: 'Gestion crise', color: '#9d174d' },
  ];

  // Build particles on a sphere shell
  const phi = Math.PI * (3 - Math.sqrt(5));
  const particles = SKILLS.map((s, i) => {
    const y = 1 - (i / (SKILLS.length - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = phi * i;
    return {
      label: s.label,
      color: s.color,
      x3: Math.cos(th) * r,
      y3: y,
      z3: Math.sin(th) * r,
      hover: false,
    };
  });

  let rotX = 0.2, rotY = 0;
  let targetRotX = 0.2, targetRotY = 0;
  let mouseX = 0, mouseY = 0;
  let isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  function resize() {
    W = canvas.width = wrapper.clientWidth;
    H = canvas.height = wrapper.clientHeight;
  }

  function getThemeColors() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      bg: dark ? '#1c1c1c' : '#ffffff',
      text: dark ? '#f2ede6' : '#1a1916',
      muted: dark ? '#888078' : '#76726a',
      border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    };
  }

  function project(x3, y3, z3, rx, ry) {
    // Rotate around Y
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    let x1 = x3 * cosY - z3 * sinY;
    let z1 = x3 * sinY + z3 * cosY;
    let y1 = y3;
    // Rotate around X
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;
    // Perspective
    const fov = W * 0.9;
    const dist = 3.2;
    const scale = fov / (dist - z2);
    return {
      sx: W / 2 + x1 * scale,
      sy: H / 2 + y2 * scale,
      scale: scale,
      z: z2,
    };
  }

  function drawRoundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  let hoveredIdx = -1;

  function draw() {
    const tc = getThemeColors();
    ctx.clearRect(0, 0, W, H);

    // Smooth rotation
    rotY += (targetRotY - rotY) * 0.04;
    rotX += (targetRotX - rotX) * 0.04;

    // Gentle auto-rotate
    targetRotY += 0.004;

    // Project all
    const projected = particles.map((p, i) => {
      const proj = project(p.x3, p.y3, p.z3, rotX, rotY);
      return { ...proj, p, i };
    });

    // Sort back-to-front
    projected.sort((a, b) => a.z - b.z);

    // Draw connectors for nearby pairs (behind cards)
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const a = projected[i], b = projected[j];
        const dx = a.sx - b.sx, dy = a.sy - b.sy;
        const dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < 130) {
          const alpha = (1 - dd / 130) * 0.12;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.strokeStyle = `rgba(26,108,245,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw cards
    projected.forEach(({ sx, sy, scale, z, p, i }) => {
      const baseScale = Math.max(0.5, Math.min(1.4, scale / (W * 0.28)));
      const isHovered = i === hoveredIdx;
      const s = baseScale * (isHovered ? 1.18 : 1);

      // Card dimensions
      const padX = 12 * s, padY = 6 * s;
      const fontSize = Math.round(11 * s);
      ctx.font = `500 ${fontSize}px 'DM Mono', monospace`;
      const tw = ctx.measureText(p.label).width;
      const cw = tw + padX * 2;
      const ch = fontSize + padY * 2;
      const cx = sx - cw / 2, cy = sy - ch / 2;
      const rad = 5 * s;

      // Depth-based alpha
      const alpha = 0.4 + (z + 1) * 0.3;

      // Background
      const bgAlpha = isHovered ? 0.97 : 0.88;
      const bg = tc.bg === '#ffffff'
        ? `rgba(255,255,255,${bgAlpha})`
        : `rgba(15,15,20,${bgAlpha})`;

      // Shadow
      if (isHovered || z > 0.4) {
        ctx.shadowColor = p.color + '44';
        ctx.shadowBlur = isHovered ? 20 * s : 8 * s;
      }

      // Card fill
      drawRoundRect(cx, cy, cw, ch, rad, bg, null);
      ctx.shadowBlur = 0;

      // Border: colored on hover, subtle otherwise
      ctx.lineWidth = isHovered ? 1.5 * s : 1 * s;
      drawRoundRect(cx, cy, cw, ch, rad, null,
        isHovered ? p.color : tc.border);

      // Left color accent bar
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(cx + rad, cy);
      ctx.lineTo(cx + 4 * s, cy);
      ctx.lineTo(cx + 4 * s, cy + ch);
      ctx.lineTo(cx + rad, cy + ch);
      ctx.quadraticCurveTo(cx, cy + ch, cx, cy + ch - rad);
      ctx.lineTo(cx, cy + rad);
      ctx.quadraticCurveTo(cx, cy, cx + rad, cy);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label text
      ctx.fillStyle = isHovered ? p.color : tc.text;
      ctx.globalAlpha = Math.min(1, alpha + 0.2);
      ctx.font = `${isHovered ? 600 : 500} ${fontSize}px 'DM Mono', monospace`;
      ctx.fillText(p.label, cx + padX + 2 * s, cy + padY + fontSize * 0.82);
      ctx.globalAlpha = 1;
    });

    raf = requestAnimationFrame(draw);
  }

  // Mouse interaction
  wrapper.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Influence rotation gently
    targetRotX = 0.2 + (my / H - 0.5) * 0.5;
    targetRotY += (mx / W - 0.5) * 0.015;

    // Hit test
    const projected = particles.map((p, i) => {
      const proj = project(p.x3, p.y3, p.z3, rotX, rotY);
      const s = Math.max(0.5, Math.min(1.4, proj.scale / (W * 0.28)));
      const padX = 12 * s, padY = 6 * s;
      canvas.getContext('2d').font = `500 ${Math.round(11 * s)}px DM Mono`;
      const tw = canvas.getContext('2d').measureText(p.label).width;
      const cw = tw + padX * 2, ch = Math.round(11 * s) + padY * 2;
      return { i, sx: proj.sx, sy: proj.sy, cw, ch };
    });

    hoveredIdx = -1;
    projected.forEach(({ i, sx, sy, cw, ch }) => {
      if (mx >= sx - cw / 2 && mx <= sx + cw / 2 && my >= sy - ch / 2 && my <= sy + ch / 2) {
        hoveredIdx = i;
      }
    });
    canvas.style.cursor = hoveredIdx >= 0 ? 'pointer' : 'default';
  });

  wrapper.addEventListener('mouseleave', () => {
    hoveredIdx = -1;
    canvas.style.cursor = 'default';
  });

  // Watch theme changes
  new MutationObserver(() => { }).observe(document.documentElement, { attributes: true });

  resize();
  window.addEventListener('resize', resize);
  draw();

  // Page Visibility API - Optimisation des performances
  document.addEventListener('visibilitychange', () => {
    const p = window.tsParticles ? window.tsParticles.domItem(0) : null;
    if (document.hidden) {
      cancelAnimationFrame(raf);
      if (p) p.pause();
    } else {
      draw();
      if (p) p.play();
    }
  });

  // Hacker Mode (Konami Code)
  const secretCode = ['h', 'a', 'c', 'k'];
  let secretPos = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === secretCode[secretPos]) {
      secretPos++;
      if (secretPos === secretCode.length) {
        document.body.classList.toggle('hacker-mode');
        secretPos = 0;
      }
    } else {
      secretPos = 0;
    }
  });

  // Close Modals (Red Cross)
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.target.closest('.cv-modal-overlay, .search-modal-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  });

  // Nav Bar Search Logic
  const navSearchInput = document.getElementById('nav-search-input');
  if (navSearchInput) {
    navSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = navSearchInput.value.trim();
        if (val) {
          window.find(val);
        }
      }
    });
  }

  // CV Download Animation
  const btnCv = document.getElementById('btn-download-cv');
  const cvModal = document.getElementById('cv-modal');
  const cvModalBody = document.getElementById('cv-modal-body');
  
  if (btnCv && cvModal && cvModalBody) {
    btnCv.addEventListener('click', (e) => {
      e.preventDefault();
      cvModal.classList.add('active');
      cvModalBody.innerHTML = '';
      
      const lines = [
        "> Analyse du fichier en cours...",
        "> 0 malware détecté.",
        "> Fichier déchiffré.",
        "> Début du téléchargement..."
      ];
      
      let delay = 0;
      lines.forEach((line) => {
        setTimeout(() => {
          cvModalBody.innerHTML += `<div>${line}</div>`;
        }, delay);
        delay += 600;
      });
      
      setTimeout(() => {
        cvModal.classList.remove('active');
        const a = document.createElement('a');
        a.href = "assets/CV_Mathis_Ducarois.pdf"; 
        a.download = "CV_Mathis_Ducarois.pdf";
        a.click();
      }, delay + 800);
    });
  }

  // Terminal Search Modal (Ctrl+K)
  const searchModal = document.getElementById('search-modal');
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');

  if (searchModal && terminalInput && terminalOutput) {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchModal.classList.add('active');
        setTimeout(() => terminalInput.focus(), 100);
      }
      if (e.key === 'Escape' && searchModal.classList.contains('active')) {
        searchModal.classList.remove('active');
        terminalInput.value = '';
        terminalOutput.innerHTML = '';
      }
    });
    
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        searchModal.classList.remove('active');
      }
    });

    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = terminalInput.value.trim();
        terminalOutput.innerHTML = '';
        
        if (val === 'cd /skills') {
          searchModal.classList.remove('active');
          const section = document.getElementById('skills');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (val === 'cat contact.txt') {
          searchModal.classList.remove('active');
          const section = document.getElementById('contact');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (val === 'help') {
          terminalOutput.innerHTML = `Commandes disponibles :\n  cd /skills      - Aller à la section Compétences\n  cat contact.txt - Aller à la section Contact\n  clear           - Effacer le terminal\n  exit            - Quitter le terminal\n  sudo            - [ACCÈS REFUSÉ]\n  [mot]           - Recherche textuelle`;
        } else if (val === 'clear') {
          terminalOutput.innerHTML = '';
        } else if (val === 'exit' || val === 'quit') {
          searchModal.classList.remove('active');
          terminalInput.value = '';
        } else if (val.startsWith('sudo')) {
          terminalOutput.innerHTML = 'ERREUR: Cet incident sera signalé.';
        } else if (val) {
          // Native search equivalent
          searchModal.classList.remove('active');
          setTimeout(() => {
            window.find(val);
          }, 300);
        }
        
        if (!val.startsWith('sudo') && val !== 'help' && val !== 'clear') {
          terminalInput.value = '';
        }
      }
    });
  }
})();