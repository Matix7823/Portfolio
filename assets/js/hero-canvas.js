(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  
  let width, height;
  let particles = [];
  
  // Configuration plus poussée pour un effet "télémétrie/DNS"
  const config = {
    particleCount: 150,
    maxDistance: 180, 
    mouseDistance: 250, 
    baseColor: '0, 212, 255', // Cyan
    accentColor: '124, 58, 237', // Violet profond
    particleRadius: 1.5,
    speed: 0.3
  };

  let mouse = {
    x: null,
    y: null,
    radius: config.mouseDistance
  };

  function resize() {
    width = canvas.parentElement.offsetWidth;
    height = canvas.parentElement.offsetHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    initParticles();
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 200);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * config.speed;
      this.vy = (Math.random() - 0.5) * config.speed;
      this.baseRadius = Math.random() * config.particleRadius + 0.5;
      this.radius = this.baseRadius;
      // Certaines particules sont des "nœuds principaux" (télémétrie)
      this.isMainNode = Math.random() > 0.95;
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      if (this.x > width || this.x < 0) this.vx = -this.vx;
      if (this.y > height || this.y < 0) this.vy = -this.vy;

      if (mouse.x != null && mouse.y != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          
          // Attraction légère
          this.x += forceDirectionX * force * 0.5;
          this.y += forceDirectionY * force * 0.5;
          
          // Effet de lueur au survol
          this.radius = this.baseRadius + (force * 3);
        } else {
          this.radius = this.baseRadius;
        }
      } else {
        this.radius = this.baseRadius;
      }

      this.x += this.vx;
      this.y += this.vy;
      this.angle += 0.02;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      if (this.isMainNode) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(${config.baseColor}, 0.8)`;
        ctx.fillStyle = '#fff';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${config.baseColor}, 0.6)`;
      }
      
      ctx.fill();
      
      // Esthétique Télémétrie : petits cercles pulsants autour des nœuds principaux
      if (this.isMainNode) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 4 + Math.sin(this.angle) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${config.accentColor}, 0.4)`;
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // reset
    }
  }

  function initParticles() {
    particles = [];
    const count = window.innerWidth < 768 ? config.particleCount / 2 : config.particleCount;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function connect() {
    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        let dx = particles[a].x - particles[b].x;
        let dy = particles[a].y - particles[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.maxDistance) {
          let opacityValue = 1 - (distance / config.maxDistance);
          
          // Si l'un des nœuds est principal, la ligne est plus brillante
          if (particles[a].isMainNode || particles[b].isMainNode) {
            ctx.strokeStyle = `rgba(${config.accentColor}, ${opacityValue * 0.6})`;
            ctx.lineWidth = 1.2;
          } else {
            ctx.strokeStyle = `rgba(${config.baseColor}, ${opacityValue * 0.3})`;
            ctx.lineWidth = 0.8;
          }
          
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
      
      if (mouse.x != null && mouse.y != null) {
        let dxMouse = particles[a].x - mouse.x;
        let dyMouse = particles[a].y - mouse.y;
        let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distanceMouse < config.mouseDistance) {
          let opacityValue = 1 - (distanceMouse / config.mouseDistance);
          
          // Gradient pour les lignes connectées à la souris
          let grad = ctx.createLinearGradient(particles[a].x, particles[a].y, mouse.x, mouse.y);
          grad.addColorStop(0, `rgba(${config.baseColor}, ${opacityValue})`);
          grad.addColorStop(1, `rgba(${config.accentColor}, ${opacityValue})`);
          
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    connect();
    
    requestAnimationFrame(animate);
  }

  // Support des écrans Retina
  canvas.style.backgroundColor = 'transparent';
  resize();
  animate();
})();
