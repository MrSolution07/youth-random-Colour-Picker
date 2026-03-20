import { useEffect, useMemo, useRef, useState } from "react";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type Props = {
  active: boolean;
  colors: string[];
  durationMs?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  lifeMs: number;
  bornAt: number;
  color: string;
};

export default function ConfettiBurst({
  active,
  colors,
  durationMs = 2400,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [runId, setRunId] = useState(0);

  const colorPool = useMemo(() => {
    const uniq = Array.from(new Set(colors)).filter(Boolean);
    return uniq.length ? uniq : ["#ffffff"];
  }, [colors]);

  useEffect(() => {
    if (!active) return;
    setRunId((v) => v + 1);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const originX = w * 0.5;
    const originY = h * 0.28;

    const now = performance.now();
    const particleCount = 160;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = rand(-Math.PI * 0.9, -Math.PI * 0.1);
      const speed = rand(4.5, 11.5);
      particles.push({
        x: originX + rand(-20, 20),
        y: originY + rand(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.25, 0.25),
        size: rand(6, 11),
        lifeMs: rand(durationMs * 0.65, durationMs * 1.1),
        bornAt: now,
        color: colorPool[Math.floor(Math.random() * colorPool.length)]!,
      });
    }

    particlesRef.current = particles;

    const gravity = 0.22;
    const drag = 0.99;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = t - now;

      // Soft fade towards the end.
      const alpha = elapsed > durationMs ? 0 : 1 - elapsed / (durationMs * 1.05);
      ctx.globalAlpha = Math.max(0, alpha);

      const cur = particlesRef.current;
      for (let i = 0; i < cur.length; i++) {
        const p = cur[i]!;
        const age = t - p.bornAt;
        if (age < 0) continue;

        // Update physics.
        p.vy += gravity * 0.25;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr * 0.9;

        // Life check.
        if (age > p.lifeMs) {
          // Move it offscreen so it doesn't paint.
          p.y = h + 1000;
          continue;
        }

        // Draw as a small rotated rectangle.
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.18, p.size, p.size * 0.32);
        ctx.restore();
      }

      ctx.globalAlpha = 1;

      if (elapsed < durationMs) {
        rafRef.current = window.requestAnimationFrame(draw);
      }
    };

    rafRef.current = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      particlesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, runId, colorPool, durationMs]);

  if (!active) return null;

  return (
    <canvas
      key={runId}
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 100,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}

