(function() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false }); // Opaque canvas is slightly faster if we draw our own background, but let's use transparent so it blends with the dark theme. Wait, if alpha: false, we must fill background. 
  // Let's use alpha: true to blend with existing CSS backgrounds.
  
  let width, height;
  let particles = [];
  
  // Configuration
  const config = {
    particleCount: 120, // Ajustable selon la densité souhaitée
    maxDistance: 150, // Distance max pour lier deux particules
    mouseDistance: 200, // Distance d'interaction souris
    baseColor: '0, 212, 255', // Cyan/Bleu électrique
    particleRadius: 1.5,
    speed: 0.5
  };

  // État de la souris
  let mouse = {
    x: null,
    y: null,
    radius: config.mouseDistance
  };

  // Ajustement de la taille du canvas
  function resize() {
    width = canvas.parentElement.offsetWidth;
    height = canvas.parentElement.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    initParticles();
  }

  // Throttle resize event
  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 200);
  });

  // Track mouse position
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
      this.radius = Math.random() * config.particleRadius + 0.5;
    }

    update() {
      // Rebond sur les bords
      if (this.x > width || this.x < 0) this.vx = -this.vx;
      if (this.y > height || this.y < 0) this.vy = -this.vy;

      // Interaction souris (répulsion douce)
      if (mouse.x != null && mouse.y != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouse.radius;
          const force = (maxDistance - distance) / maxDistance;
          const directionX = forceDirectionX * force * 1.5;
          const directionY = forceDirectionY * force * 1.5;
          
          this.x -= directionX;
          this.y -= directionY;
        }
      }

      // Mouvement naturel
      this.x += this.vx;
      this.y += this.vy;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${config.baseColor}, 0.8)`;
      ctx.fill();
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
    let opacityValue = 1;
    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        let dx = particles[a].x - particles[b].x;
        let dy = particles[a].y - particles[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.maxDistance) {
          opacityValue = 1 - (distance / config.maxDistance);
          ctx.strokeStyle = `rgba(${config.baseColor}, ${opacityValue * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
      
      // Connexion avec la souris
      if (mouse.x != null && mouse.y != null) {
        let dxMouse = particles[a].x - mouse.x;
        let dyMouse = particles[a].y - mouse.y;
        let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distanceMouse < config.mouseDistance) {
          opacityValue = 1 - (distanceMouse / config.mouseDistance);
          ctx.strokeStyle = `rgba(${config.baseColor}, ${opacityValue * 0.8})`;
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
    
    // Si on voulait un fond opaque, on le dessinerait ici. 
    // On laisse le canvas transparent pour hériter du CSS.
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    connect();
    
    requestAnimationFrame(animate);
  }

  // Initialisation
  // Assurons-nous que le canvas reprend sa transparence si nécessaire
  const gl = canvas.getContext('2d');
  gl.canvas.style.backgroundColor = 'transparent';

  resize();
  animate();
})();
