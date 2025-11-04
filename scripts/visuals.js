// Lightweight particle/line background for a tech look
// - Respects prefers-reduced-motion and small screens (will not run there)
// - Canvas covers entire viewport and is non-interactive (pointer-events:none)
// - Toggle button with id "toggle-visuals" will enable/disable animation

(function(){
  const canvas = document.getElementById('tech-bg');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, particles = [], animationId = null;
  const mouse = {x: null, y: null, radius: 90};
  const settings = {
    baseCount: 50, // base particle count per area factor
    maxDistance: 120,
    speed: 0.3
  };

  function shouldRun(){
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if(window.innerWidth <= 640) return false;
    if(document.body && document.body.dataset && document.body.dataset.visuals === 'off') return false;
    return true;
  }

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    w = canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    h = canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // recompute particle count based on area
    const area = window.innerWidth * window.innerHeight;
    const target = Math.max(30, Math.min(120, Math.floor(area / 16000)));
    // if more particles needed, push new ones
    while(particles.length < target){ particles.push(createParticle()); }
    // if too many, trim
    while(particles.length > target){ particles.pop(); }
  }

  function createParticle(){
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * settings.speed * 2,
      vy: (Math.random() - 0.5) * settings.speed * 2,
      r: Math.random() * 1.8 + 0.6
    };
  }

  function step(){
    if(!shouldRun()){
      cancelAnimationFrame(animationId);
      animationId = null;
      clearCanvas();
      return;
    }

    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

    // move and draw particles
    for(let p of particles){
      p.x += p.vx;
      p.y += p.vy;

      // wrap around
      if(p.x < -10) p.x = window.innerWidth + 10;
      if(p.x > window.innerWidth + 10) p.x = -10;
      if(p.y < -10) p.y = window.innerHeight + 10;
      if(p.y > window.innerHeight + 10) p.y = -10;

      // mouse repulsion
      if(mouse.x !== null){
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < mouse.radius){
          const force = (mouse.radius - dist) / mouse.radius;
          p.vx += (dx / dist) * 0.6 * force;
          p.vy += (dy / dist) * 0.6 * force;
        }
      }

      // draw point
      ctx.beginPath();
      ctx.fillStyle = 'rgba(160,180,255,0.9)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }

    // draw lines between close particles
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < settings.maxDistance){
          const alpha = 0.12 * (1 - dist / settings.maxDistance);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(130,150,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(step);
  }

  function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  // input handlers
  function onMove(e){
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    mouse.y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
  }
  function onLeave(){ mouse.x = null; mouse.y = null; }

  // toggle control
  function initToggle(){
    // toggle removed: visuals default to body data-visuals attribute
  }

  // visibility handling to save CPU
  function onVisibility(){
    if(document.hidden){
      if(animationId) cancelAnimationFrame(animationId);
      animationId = null;
    } else {
      if(!animationId && shouldRun()) animationId = requestAnimationFrame(step);
    }
  }

  // init
  function init(){
    // default to on (unless explicitly off)
    if(!document.body.dataset.visuals) document.body.dataset.visuals = 'on';

    // skip if reduced motion or small screen
    if(!shouldRun()) return;

    resize();
    // initial particles
    const area = window.innerWidth * window.innerHeight;
    const target = Math.max(30, Math.min(120, Math.floor(area / 16000)));
    for(let i=0;i<target;i++) particles.push(createParticle());

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, {passive:true});
    window.addEventListener('mouseout', onLeave);
    window.addEventListener('touchend', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    initToggle();

    animationId = requestAnimationFrame(step);
  }

  // Defer init until DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else init();

})();
