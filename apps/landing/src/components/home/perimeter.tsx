"use client";

import { cn } from "@rallly/ui";
import * as React from "react";

// Geometry in units of half the canvas height. The parent fades the canvas
// to transparent at its own edges, so the drawing dissolves top and bottom
// rather than being cut where the box ends.
const BOUNDARY = 0.82;
const OUTER_RINGS: Array<[radius: number, alpha: number, dots: number]> = [
  [0.96, 0.55, 190],
  [1.08, 0.45, 170],
];
const SPAWN_RADIUS = 1.2;
const BOUNDARY_DOTS = 220;
const GRID_STEP = 1 / 18;
const MAX_PARTICLES = 14;
const SPAWN_MIN_MS = 260;
const SPAWN_JITTER_MS = 500;
const STOP_MS = 900;
const HEARTBEAT_MS = 4200;
const HEARTBEAT_SHARE = 0.7;

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  stoppedAt: number;
};

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

// Computed colours arrive in whatever space Tailwind used (lab, oklch), so
// let the canvas resolve the text colour to sRGB rather than parsing it.
function readInk(element: HTMLElement) {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) {
    return "63, 63, 70";
  }
  probe.fillStyle = getComputedStyle(element).color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `${r}, ${g}, ${b}`;
}

/**
 * Decorative perimeter: a dotted boundary around a quiet grid, with particles
 * that approach from outside and stop at the edge. Drawn in the element's
 * text colour so the page owns the shade. Reduced motion renders a single
 * still frame; rendering pauses while off screen or in a hidden tab.
 */
export function Perimeter({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const ink = readInk(canvas);
    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = false;
    let lastTick = 0;
    let nextSpawnAt = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const circle = (x: number, y: number, r: number) => {
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
    };

    const draw = (now: number, dt: number, animate: boolean) => {
      // A hidden canvas measures 0x0, which would make the grid step 0 and
      // the loops below never terminate.
      if (width <= 0 || height <= 0) {
        return;
      }
      const radius = height / 2;
      const cx = width / 2;
      const cy = height / 2;
      const boundary = radius * BOUNDARY;

      context.clearRect(0, 0, width, height);

      // Protected interior: a quiet dot grid clipped to the boundary.
      context.save();
      circle(cx, cy, boundary - 6);
      context.clip();
      const step = radius * GRID_STEP;
      context.fillStyle = `rgba(${ink}, 0.38)`;
      for (let y = cy - boundary; y <= cy + boundary; y += step) {
        for (let x = cx - boundary; x <= cx + boundary; x += step) {
          circle(x, y, 1.1);
          context.fill();
        }
      }
      context.restore();

      // The boundary as a dotted ring, with fainter rings outside it.
      const rings: Array<[number, number, number, number]> = [
        [boundary, 0.6, BOUNDARY_DOTS, 1.5],
        ...OUTER_RINGS.map(
          ([r, alpha, dots]): [number, number, number, number] => [
            radius * r,
            alpha,
            dots,
            1,
          ],
        ),
      ];
      for (const [r, alpha, dots, size] of rings) {
        context.fillStyle = `rgba(${ink}, ${alpha})`;
        for (let i = 0; i < dots; i++) {
          const t = (i / dots) * Math.PI * 2;
          circle(cx + Math.cos(t) * r, cy + Math.sin(t) * r, size);
          context.fill();
        }
      }

      if (!animate) {
        return;
      }

      if (now >= nextSpawnAt && particles.length < MAX_PARTICLES) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          radius: radius * SPAWN_RADIUS,
          speed: (radius * (0.12 + Math.random() * 0.08)) / 1000,
          stoppedAt: 0,
        });
        nextSpawnAt = now + SPAWN_MIN_MS + Math.random() * SPAWN_JITTER_MS;
      }

      context.lineCap = "round";
      context.lineWidth = 1;
      particles = particles.filter((p) => {
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        if (p.stoppedAt) {
          const t = (now - p.stoppedAt) / STOP_MS;
          if (t > 1) {
            return false;
          }
          context.strokeStyle = `rgba(${ink}, ${0.7 * (1 - t)})`;
          circle(x, y, 3 + t * radius * 0.05);
          context.stroke();
          context.fillStyle = `rgba(${ink}, ${0.9 * (1 - t)})`;
          circle(x, y, 2);
          context.fill();
          return true;
        }
        p.radius -= p.speed * dt;
        if (p.radius <= boundary) {
          p.radius = boundary;
          p.stoppedAt = now;
        }
        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius;
        const tail = Math.min(
          radius * 0.06,
          p.radius - boundary + radius * 0.06,
        );
        context.strokeStyle = `rgba(${ink}, 0.35)`;
        context.beginPath();
        context.moveTo(
          cx + Math.cos(p.angle) * (p.radius + tail),
          cy + Math.sin(p.angle) * (p.radius + tail),
        );
        context.lineTo(px, py);
        context.stroke();
        context.fillStyle = `rgba(${ink}, 0.8)`;
        circle(px, py, 1.8);
        context.fill();
        return true;
      });

      // A slow heartbeat from the centre reaching the boundary.
      const beat = (now % HEARTBEAT_MS) / HEARTBEAT_MS;
      if (beat < HEARTBEAT_SHARE) {
        const t = easeInOut(beat / HEARTBEAT_SHARE);
        context.strokeStyle = `rgba(${ink}, ${0.25 * (1 - t)})`;
        circle(cx, cy, t * (boundary - 8));
        context.stroke();
      }
    };

    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || reduceMotionQuery.matches) {
        return;
      }
      const dt = lastTick ? Math.min(64, now - lastTick) : 16;
      lastTick = now;
      draw(now, dt, true);
      frame = requestAnimationFrame(tick);
    };

    const render = () => {
      if (frame) {
        return;
      }
      if (reduceMotionQuery.matches) {
        draw(0, 0, false);
        return;
      }
      lastTick = 0;
      frame = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotionQuery.matches) {
        draw(0, 0, false);
      }
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) {
        render();
      }
    });
    intersectionObserver.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden) {
        render();
      }
    };
    const onMotionChange = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      particles = [];
      render();
    };
    document.addEventListener("visibilitychange", onVisibility);
    reduceMotionQuery.addEventListener("change", onMotionChange);

    resize();
    render();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={cn("block size-full", className)} />
  );
}
