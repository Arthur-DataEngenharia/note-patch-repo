import { useEffect, useRef, useCallback } from 'react';

interface Star {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const starsRef = useRef<Star[]>([]);
  const shootingRef = useRef<ShootingStar[]>([]);
  const timeRef = useRef(0);
  const rafRef = useRef<number>();

  const initStars = useCallback((width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const count = 2500;
    const stars: Star[] = [];

    for (let i = 0; i < count; i++) {
      // Spiral arm distribution
      const armCount = 4;
      const arm = Math.floor(Math.random() * armCount);
      const armAngle = (arm * Math.PI * 2) / armCount;
      const armTightness = 0.15;
      const radius = Math.pow(Math.random(), 0.7) * maxR * 1.2;
      const spread = (Math.random() - 0.5) * 0.5;
      const angle = armAngle + armTightness * (radius / 200) + spread + Math.random() * Math.PI * 2;

      const layer = radius < maxR * 0.3 ? 0 : radius < maxR * 0.6 ? 1 : 2;

      stars.push({
        angle,
        radius,
        speed: (0.05 + Math.random() * 0.15) / (layer + 1),
        size: layer === 0 ? Math.random() * 2.2 + 0.8 : layer === 1 ? Math.random() * 1.4 + 0.4 : Math.random() * 1 + 0.2,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        layer,
      });
    }
    starsRef.current = stars;
  }, []);

  const spawnShootingStar = useCallback((width: number, height: number) => {
    const startX = Math.random() * width;
    const startY = Math.random() * height * 0.3;
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.6;
    const speed = 4 + Math.random() * 5;
    shootingRef.current.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 40 + Math.random() * 30,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Spawn shooting stars periodically
    const shootingInterval = setInterval(() => {
      if (Math.random() < 0.4) {
        spawnShootingStar(canvas.width, canvas.height);
      }
    }, 1500);

    const animate = () => {
      if (!ctx || !canvas) return;
      const { width, height } = canvas;
      const cx = width / 2;
      const cy = height / 2;
      timeRef.current += 0.002;
      const time = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      // ─── Nebulae ───
      // Deep red nebula clouds
      const nebulaColors = [
        { x: cx * 0.6, y: cy * 0.5, r: Math.max(width, height) * 0.5, r255: 80, g: 10, b: 30, a: 0.025 },
        { x: cx * 1.3, y: cy * 0.7, r: Math.max(width, height) * 0.4, r255: 100, g: 20, b: 40, a: 0.02 },
        { x: cx * 0.8, y: cy * 1.3, r: Math.max(width, height) * 0.35, r255: 120, g: 15, b: 50, a: 0.018 },
      ];
      for (const n of nebulaColors) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        grad.addColorStop(0, `rgba(${n.r255},${n.g},${n.b},${n.a})`);
        grad.addColorStop(0.5, `rgba(${n.r255},${n.g},${n.b},${n.a * 0.5})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // ─── Central Galaxy Core ───
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
      coreGrad.addColorStop(0, 'rgba(255,100,120,0.15)');
      coreGrad.addColorStop(0.15, 'rgba(225,50,70,0.08)');
      coreGrad.addColorStop(0.4, 'rgba(180,30,50,0.03)');
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, width, height);

      // ─── Stars ───
      const mouse = mouseRef.current;
      const stars = starsRef.current;

      for (const s of stars) {
        // Rotate around center (galactic rotation)
        s.angle += s.speed * 0.003;

        const x = cx + Math.cos(s.angle) * s.radius;
        const y = cy + Math.sin(s.angle) * s.radius;

        // Mouse parallax / warp
        let drawX = x;
        let drawY = y;
        if (mouse.x > -1000) {
          const mdx = mouse.x - cx;
          const mdy = mouse.y - cy;
          const parallax = (s.layer + 1) * 0.02;
          drawX -= mdx * parallax;
          drawY -= mdy * parallax;

          // Subtle gravitational lens near mouse
          const starMouseDx = mouse.x - drawX;
          const starMouseDy = mouse.y - drawY;
          const starMouseDist = Math.sqrt(starMouseDx * starMouseDx + starMouseDy * starMouseDy);
          if (starMouseDist < 200) {
            const lens = (1 - starMouseDist / 200) * 3;
            drawX -= (starMouseDx / starMouseDist) * lens;
            drawY -= (starMouseDy / starMouseDist) * lens;
          }
        }

        // Wrap around screen
        if (drawX < -50) drawX += width + 100;
        if (drawX > width + 50) drawX -= width + 100;
        if (drawY < -50) drawY += height + 100;
        if (drawY > height + 50) drawY -= height + 100;

        // Twinkle
        s.twinklePhase += s.twinkleSpeed;
        const twinkle = 0.6 + 0.4 * Math.sin(s.twinklePhase);
        const alpha = s.opacity * twinkle;

        // Color by layer
        const r = s.layer === 0 ? 255 : s.layer === 1 ? 230 : 200;
        const g = s.layer === 0 ? 180 : s.layer === 1 ? 140 : 100;
        const b = s.layer === 0 ? 150 : s.layer === 1 ? 130 : 120;

        // Glow for bright stars
        if (s.size > 1.5 && alpha > 0.5) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, s.size * 3, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, s.size * 3);
          glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.4})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      // ─── Shooting Stars ───
      const shooting = shootingRef.current;
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;

        const progress = s.life / s.maxLife;
        const alpha = progress < 0.15 ? progress / 0.15 : 1 - ((progress - 0.15) / 0.85);

        if (progress >= 1) {
          shooting.splice(i, 1);
          continue;
        }

        // Draw tail
        const tailLen = 30 + s.vx * 3;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - tailLen, s.y - tailLen * 0.4);
        grad.addColorStop(0, `rgba(255,220,220,${alpha})`);
        grad.addColorStop(0.3, `rgba(255,150,150,${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(225,29,72,0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - tailLen, s.y - tailLen * 0.4);
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,240,240,${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(shootingInterval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [initStars, spawnShootingStar]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
