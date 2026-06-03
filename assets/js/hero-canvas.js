/**
 * Hero Canvas — DNSSight-inspired Telemetry Network
 *
 * Visual layers (back → front):
 *  -2  Background radial glow   (teal halo, matches DNSSight Ellipse AVIF)
 *  -1  Dot-matrix mesh          (sensor grid, matches DNSSight background texture)
 *   0  Scan-line sweep          (radar / SIEM sweep)
 *   1  Edge connections         (gradient, mouse-boosted)
 *   2  Data-packet travellers   (flux lines)
 *   3  Node dots                (hub / relay / leaf, pulsing)
 *   4  Node labels              (hub nodes only, subtle)
 *   5  Mouse halo + beams
 *   6  HUD corner brackets
 *
 * Engine: Canvas 2D · No dependencies · 60 FPS · Responsive
 * Colors mirror portfolio CSS vars: --accent:#00d4ff  --accent2:#7c3aed
 */
(function () {
  'use strict';

  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // ── PALETTE (matches portfolio design tokens) ──────────────────
  const PAL = {
    cyan:   [0,   212, 255],   // --accent
    violet: [124,  58, 237],   // --accent2
    green:  [16,  185, 129],   // --green
    teal:   [0,   220, 200],   // DNSSight-inspired teal (for glow halo)
  };

  // ── CONFIG ──────────────────────────────────────────────────────
  const CFG = {
    // Nodes
    countDesktop: 110,
    countMobile:  45,
    hubCount:     4,
    relayCount:   18,

    // Physics
    baseSpeed:  0.28,
    damping:    0.983,

    // Network
    maxDist:    160,
    mouseDist:  230,

    // Data packets
    maxPackets:  18,

    // Dot matrix (sensor grid)
    gridSpacing: 55,   // px between dots
    gridDotR:    0.9,  // dot radius

    // Scan
    scanEvery:    11000,
    scanDuration:  1900,

    // Labels on hub nodes
    labelFont: "500 11px 'JetBrains Mono', monospace",
  };

  // ── STATE ───────────────────────────────────────────────────────
  let W = 0, H = 0, DPR = 1;
  let nodes   = [];
  let packets = [];
  let mouse   = { x: null, y: null };
  let scan    = { active: false, startT: 0 };
  let lastT   = 0;

  // Hub node display names for the labels
  const HUB_LABELS = ['DNS:53', 'SIEM', 'EDR', 'SOC'];

  // ── RESIZE ──────────────────────────────────────────────────────
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const host = canvas.parentElement || document.body;
    W = host.offsetWidth;
    H = host.offsetHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(DPR, DPR);
    buildNodes();
  }

  let resizeTid = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTid);
    resizeTid = setTimeout(resize, 160);
  }, { passive: true });

  // ── MOUSE ───────────────────────────────────────────────────────
  window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  }, { passive: true });

  // ── NODE CLASS ──────────────────────────────────────────────────
  function Node(tier, idx) {
    this.tier   = tier;
    this.idx    = idx;
    this.x      = Math.random() * W;
    this.y      = Math.random() * H;
    const angle = Math.random() * Math.PI * 2;
    const spd   = CFG.baseSpeed * (0.5 + Math.random() * 0.8);
    this.vx     = Math.cos(angle) * spd;
    this.vy     = Math.sin(angle) * spd;
    this.pulseT = Math.random() * Math.PI * 2;
    this.ringT  = Math.random() * Math.PI * 2;

    if (tier === 'hub') {
      this.baseR = 3.2 + Math.random() * 0.8;
      this.color = PAL.cyan;
      this.label = HUB_LABELS[idx] || 'NODE';
    } else if (tier === 'relay') {
      this.baseR = 1.6 + Math.random() * 0.5;
      this.color = idx % 3 === 0 ? PAL.violet : PAL.cyan;
    } else {
      this.baseR = 0.8 + Math.random() * 0.5;
      this.color = PAL.cyan;
    }
    this.r = this.baseR;
  }

  Node.prototype.update = function () {
    this.pulseT += 0.022;
    this.ringT  += 0.011;

    // Bounce walls
    if (this.x < 0)   { this.x =  0; this.vx =  Math.abs(this.vx); }
    if (this.x > W)   { this.x =  W; this.vx = -Math.abs(this.vx); }
    if (this.y < 0)   { this.y =  0; this.vy =  Math.abs(this.vy); }
    if (this.y > H)   { this.y =  H; this.vy = -Math.abs(this.vy); }

    // Mouse repulsion
    let targetR = this.baseR;
    if (mouse.x !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      const md = CFG.mouseDist;
      if (d2 < md * md) {
        const d     = Math.sqrt(d2);
        const force = (md - d) / md;
        this.vx  += (dx / d) * force * 0.55;
        this.vy  += (dy / d) * force * 0.55;
        targetR   = this.baseR + force * 3.2;
      }
    }
    this.r += (targetR - this.r) * 0.12;

    // Damping + drift restore
    this.vx *= CFG.damping;
    this.vy *= CFG.damping;
    const spd = Math.hypot(this.vx, this.vy);
    if (spd < CFG.baseSpeed * 0.25 && Math.random() < 0.05) {
      const a = Math.random() * Math.PI * 2;
      this.vx += Math.cos(a) * 0.04;
      this.vy += Math.sin(a) * 0.04;
    }

    this.x += this.vx;
    this.y += this.vy;
  };

  Node.prototype.draw = function () {
    const [r, g, b] = this.color;
    const pulse = 0.55 + 0.45 * Math.sin(this.pulseT);

    if (this.tier === 'hub') {
      // Outer pulsing ring 1
      const r1 = this.r * 5.5 + 2 * Math.sin(this.ringT);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.14 * pulse})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Outer pulsing ring 2
      const r2 = this.r * 11 + 3 * Math.sin(this.ringT * 0.65);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.05 * pulse})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Radial glow bloom
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 7);
      grd.addColorStop(0, `rgba(${r},${g},${b},0.24)`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 7, 0, Math.PI * 2);
      ctx.fill();

      // Core (white-hot)
      ctx.shadowBlur  = 16;
      ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.92 * pulse})`;
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (this.tier === 'relay') {
      // Small glow
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
      grd.addColorStop(0, `rgba(${r},${g},${b},0.15)`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur  = 6;
      ctx.shadowColor = `rgba(${r},${g},${b},0.7)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.75 * pulse})`;
      ctx.fill();
      ctx.shadowBlur = 0;

    } else {
      // Leaf — minimal
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.5 * pulse})`;
      ctx.fill();
    }
  };

  // ── NODE LABELS (hub only) ───────────────────────────────────────
  // Subtle telemetry label below hub node, like a DNS/SIEM address tag
  Node.prototype.drawLabel = function () {
    if (this.tier !== 'hub') return;
    const [r, g, b] = this.color;
    const pulse = 0.4 + 0.3 * Math.sin(this.pulseT * 0.7);
    const alpha = 0.55 * pulse;

    ctx.font = CFG.labelFont;
    ctx.textAlign = 'center';
    const labelY = this.y + this.r * 12 + 4;

    // Background pill
    const tw = ctx.measureText(this.label).width;
    const ph = 13, pw = tw + 12, px = this.x - pw / 2, py = labelY - ph + 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(px, py, pw, ph, 3) : ctx.rect(px, py, pw, ph);
    ctx.fillStyle = `rgba(0,0,0,${0.5 * alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.8})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Text
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 1.4})`;
    ctx.fillText(this.label, this.x, labelY);
    ctx.textAlign = 'left';
  };

  // ── PACKET CLASS ────────────────────────────────────────────────
  function Packet(nodeA, nodeB) {
    this.na = nodeA;
    this.nb = nodeB;
    this.t     = 0;
    this.spd   = 1.1 + Math.random() * 1.5;
    this.color = Math.random() < 0.55 ? PAL.cyan : PAL.violet;
    this.r     = 1.8 + Math.random() * 0.7;
    this._recalc();
  }

  Packet.prototype._recalc = function () {
    this.dist  = Math.hypot(this.nb.x - this.na.x, this.nb.y - this.na.y);
    this.total = Math.max(1, this.dist / this.spd);
  };

  Packet.prototype.update = function () {
    // Follow node positions in real-time
    this._recalc();
    this.t++;
    return this.t < this.total;
  };

  Packet.prototype.draw = function () {
    const p = Math.min(this.t / this.total, 1);
    const x = this.na.x + (this.nb.x - this.na.x) * p;
    const y = this.na.y + (this.nb.y - this.na.y) * p;
    const [r, g, b] = this.color;

    const edge  = Math.min(p, 1 - p) * 5;
    const alpha = Math.min(1, edge) * 0.88;

    // Glow halo
    const grd = ctx.createRadialGradient(x, y, 0, x, y, this.r * 4.5);
    grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.7})`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, this.r * 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.shadowBlur  = 10;
    ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  // ── BUILD NODES ─────────────────────────────────────────────────
  function buildNodes() {
    const count = W < 768 ? CFG.countMobile : CFG.countDesktop;
    nodes   = [];
    packets = [];

    for (let i = 0; i < count; i++) {
      let tier;
      if      (i < CFG.hubCount)                    tier = 'hub';
      else if (i < CFG.hubCount + CFG.relayCount)   tier = 'relay';
      else                                           tier = 'leaf';
      nodes.push(new Node(tier, i));
    }
  }

  // ── SPAWN PACKETS ───────────────────────────────────────────────
  function spawnPacket() {
    if (packets.length >= CFG.maxPackets) return;
    // Pick a hub or relay as source
    const pool = nodes.filter(n => n.tier === 'hub' || n.tier === 'relay');
    if (pool.length < 2) return;
    const a = pool[Math.floor(Math.random() * pool.length)];
    const candidates = nodes.filter(n => {
      if (n === a) return false;
      return Math.hypot(n.x - a.x, n.y - a.y) < CFG.maxDist;
    });
    if (!candidates.length) return;
    const b = candidates[Math.floor(Math.random() * candidates.length)];
    packets.push(new Packet(a, b));
  }

  // ── LAYER: BACKGROUND RADIAL GLOW ───────────────────────────────
  // Replicates DNSSight's Ellipse AVIF — a soft teal/violet halo at center
  function drawBgGlow() {
    const cx = W * 0.5, cy = H * 0.48;

    // Primary teal glow
    const [tr, tg, tb] = PAL.teal;
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.65);
    g1.addColorStop(0,    `rgba(${tr},${tg},${tb},0.07)`);
    g1.addColorStop(0.4,  `rgba(${tr},${tg},${tb},0.03)`);
    g1.addColorStop(1,    `rgba(${tr},${tg},${tb},0)`);
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    // Secondary violet glow (offset, like DNSSight ellipse)
    const [vr, vg, vb] = PAL.violet;
    const g2 = ctx.createRadialGradient(W * 0.72, H * 0.32, 0, W * 0.72, H * 0.32, W * 0.45);
    g2.addColorStop(0, `rgba(${vr},${vg},${vb},0.07)`);
    g2.addColorStop(1, `rgba(${vr},${vg},${vb},0)`);
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  }

  // ── LAYER: DOT-MATRIX MESH ──────────────────────────────────────
  // Replicates DNSSight's background sensor-grid texture
  function drawDotGrid() {
    const sp = CFG.gridSpacing;
    const dr = CFG.gridDotR;
    const [r, g, b] = PAL.cyan;

    // Offset grid slightly so it shifts with mouse (parallax feel)
    const ox = mouse.x !== null ? (mouse.x / W - 0.5) * 4 : 0;
    const oy = mouse.y !== null ? (mouse.y / H - 0.5) * 4 : 0;

    ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;

    const startX = (ox % sp) - sp;
    const startY = (oy % sp) - sp;

    for (let x = startX; x < W + sp; x += sp) {
      for (let y = startY; y < H + sp; y += sp) {
        // Distance from center for radial fade
        const dcx = (x - W * 0.5) / W;
        const dcy = (y - H * 0.5) / H;
        const d2  = dcx * dcx + dcy * dcy;
        const a   = Math.max(0, 0.09 - d2 * 0.18);

        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, dr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── LAYER: SCAN LINE ─────────────────────────────────────────────
  function drawScan(now) {
    if (!scan.active) return;
    const elapsed = now - scan.startT;
    if (elapsed >= CFG.scanDuration) { scan.active = false; return; }

    const p  = elapsed / CFG.scanDuration;
    const sy = p * H;
    const [r, g, b] = PAL.cyan;

    // Trailing wake
    const wake = ctx.createLinearGradient(0, sy - 90, 0, sy + 2);
    wake.addColorStop(0, `rgba(${r},${g},${b},0)`);
    wake.addColorStop(0.65, `rgba(${r},${g},${b},0.025)`);
    wake.addColorStop(1, `rgba(${r},${g},${b},0.13)`);
    ctx.fillStyle = wake;
    ctx.fillRect(0, Math.max(0, sy - 90), W, 92);

    // Bright leading edge
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(W, sy);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.lineWidth   = 0.9;
    ctx.stroke();

    // Illuminate dots on scan plane
    const band = 28;
    for (const n of nodes) {
      const dist = Math.abs(n.y - sy);
      if (dist > band) continue;
      const a = (1 - dist / band) * 0.7;
      const [nr, ng, nb2] = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (2.5 + a * 3), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${nr},${ng},${nb2},${a * 0.35})`;
      ctx.fill();
    }
  }

  // ── LAYER: EDGES ─────────────────────────────────────────────────
  function drawEdges() {
    const mx = mouse.x, my = mouse.y;
    const md = CFG.mouseDist;

    for (let a = 0; a < nodes.length; a++) {
      const na = nodes[a];
      for (let b = a + 1; b < nodes.length; b++) {
        const nb   = nodes[b];
        const dx   = na.x - nb.x;
        const dy   = na.y - nb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > CFG.maxDist) continue;

        const ratio  = 1 - dist / CFG.maxDist;
        const isHub  = na.tier === 'hub' || nb.tier === 'hub';

        let mBoost = 0;
        if (mx !== null) {
          const midX = (na.x + nb.x) * 0.5;
          const midY = (na.y + nb.y) * 0.5;
          mBoost = Math.max(0, 1 - Math.hypot(midX - mx, midY - my) / md);
        }

        const alpha  = ratio * (0.2 + mBoost * 0.5);

        if (isHub || mBoost > 0.07) {
          const grd = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
          const [ar, ag, ab2] = na.color;
          const [br, bg, bb2] = nb.color;
          grd.addColorStop(0, `rgba(${ar},${ag},${ab2},${alpha})`);
          grd.addColorStop(1, `rgba(${br},${bg},${bb2},${alpha})`);
          ctx.strokeStyle = grd;
          ctx.lineWidth   = isHub ? 0.9 : 0.7;
        } else {
          const [r, g, b] = PAL.cyan;
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.55})`;
          ctx.lineWidth   = 0.5;
        }

        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }
    }
  }

  // ── LAYER: MOUSE HALO ────────────────────────────────────────────
  function drawMouseHalo() {
    if (mouse.x === null) return;
    const [r, g, b] = PAL.cyan;
    const mx = mouse.x, my = mouse.y;

    // Soft halo fill
    const grd = ctx.createRadialGradient(mx, my, 0, mx, my, CFG.mouseDist * 0.52);
    grd.addColorStop(0, `rgba(${r},${g},${b},0.06)`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(mx, my, CFG.mouseDist * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Beams to nearby nodes
    for (const n of nodes) {
      const dx = n.x - mx, dy = n.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 > CFG.mouseDist * CFG.mouseDist) continue;
      const d     = Math.sqrt(d2);
      const alpha = (1 - d / CFG.mouseDist) * 0.52;
      const [nr, ng, nb2] = n.color;
      const grd2  = ctx.createLinearGradient(n.x, n.y, mx, my);
      grd2.addColorStop(0, `rgba(${nr},${ng},${nb2},${alpha})`);
      grd2.addColorStop(1, `rgba(${r},${g},${b},${alpha * 1.7})`);
      ctx.strokeStyle = grd2;
      ctx.lineWidth   = 0.65;
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(mx, my);
      ctx.stroke();
    }

    // Cursor dot
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},0.82)`;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── LAYER: HUD CORNERS ───────────────────────────────────────────
  function drawHUD() {
    const [r, g, b] = PAL.cyan;
    ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
    ctx.lineWidth   = 1.1;
    const sz = 20, pad = 20;

    function bracket(x, y, sx, sy) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * sz);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * sz, y);
      ctx.stroke();
    }
    bracket(pad,     pad,     1,  1);
    bracket(W - pad, pad,    -1,  1);
    bracket(pad,     H - pad, 1, -1);
    bracket(W - pad, H - pad,-1, -1);

    // Subtle status text (bottom right corner, like a HUD readout)
    const [mr, mg, mb] = PAL.cyan;
    ctx.font = `400 9px 'JetBrains Mono', monospace`;
    ctx.fillStyle = `rgba(${mr},${mg},${mb},0.18)`;
    ctx.textAlign = 'right';
    ctx.fillText('NET//TELEMETRY', W - pad - 2, H - pad + 12);
    ctx.textAlign = 'left';
  }

  // ── SCAN TRIGGER ─────────────────────────────────────────────────
  setInterval(() => {
    scan.active = true;
    scan.startT = performance.now();
  }, CFG.scanEvery);

  // First scan shortly after load for immediate visual impact
  setTimeout(() => {
    scan.active = true;
    scan.startT = performance.now();
  }, 2400);

  // ── MAIN LOOP ────────────────────────────────────────────────────
  let isHeroVisible = true;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!isHeroVisible) return;
    ctx.clearRect(0, 0, W, H);

    // -2  Background glow (DNSSight-inspired ellipse)
    drawBgGlow();

    // -1  Dot-matrix sensor grid
    drawDotGrid();

    //  0  Scan line
    drawScan(now);

    //  1  Edges
    drawEdges();

    //  2  Packets (flux lines)
    if (Math.random() < 0.08) spawnPacket();
    packets = packets.filter(p => {
      const alive = p.update();
      if (alive) p.draw();
      return alive;
    });

    //  3  Nodes
    for (const n of nodes) {
      n.update();
      n.draw();
    }

    //  4  Node labels
    for (const n of nodes) {
      n.drawLabel();
    }

    //  5  Mouse halo
    drawMouseHalo();

    //  6  HUD corners
    drawHUD();

    lastT = now;
  }

  // ── INIT ─────────────────────────────────────────────────────────
  canvas.style.background = 'transparent';
  resize();

  const heroSection = document.getElementById('hero');
  if (heroSection) {
    const observerHero = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        isHeroVisible = e.isIntersecting;
      });
    }, { threshold: 0 });
    observerHero.observe(heroSection);
  }

  requestAnimationFrame(loop);

})();
