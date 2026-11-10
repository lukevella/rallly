"use client";

import * as React from "react";

const spacing = 36;
const ink = "24, 24, 27";
const root2 = Math.SQRT2;

// Streaks run along two perpendicular families of lines. A point is described
// by (u, v) in the lattice's own axes: "down" streaks hold u fixed and move
// along v, "up" streaks hold v fixed and move along u. Diagonal rotates those
// axes 45°; grid maps them straight onto x and y.
type Streak = {
  id: number;
  axis: "down" | "up";
  fixed: number;
  head: number;
  dir: 1 | -1;
  speed: number;
  length: number;
  traveled: number;
  range: number;
  // Ids of the "up" streaks this "down" streak has already pulsed with. It is
  // dropped with the streak, so it never outgrows the streaks on screen.
  crossed: Set<number>;
};

type Pulse = { x: number; y: number; start: number };

type Orientation = "diagonal" | "grid";

const geometry = {
  diagonal: {
    toX: (u: number, v: number) => (u + v) / root2,
    toY: (u: number, v: number) => (v - u) / root2,
    toU: (x: number, y: number) => (x - y) / root2,
    toV: (x: number, y: number) => (x + y) / root2,
  },
  grid: {
    toX: (u: number, _v: number) => u,
    toY: (_u: number, v: number) => v,
    toU: (x: number, _y: number) => x,
    toV: (_x: number, y: number) => y,
  },
};

function covers(streak: Streak, point: number) {
  const tail = streak.head - streak.dir * streak.length;
  return (
    point >= Math.min(tail, streak.head) && point <= Math.max(tail, streak.head)
  );
}

// The mask clears an ellipse behind the header's Login and Create a poll
// buttons, positioned from the rendered buttons so it follows the mobile menu
// and longer translations. Until measured, it falls back to the desktop layout.
const actionsFallbackX =
  "calc(100% - max((100vw - 72rem) / 2, 0px) - 24px - 93px)";

function useHeaderActionsHole(
  frameRef: React.RefObject<HTMLDivElement | null>,
) {
  React.useEffect(() => {
    const frame = frameRef.current;
    const actions = document.querySelector<HTMLElement>(
      "[data-header-actions]",
    );
    const header = actions?.closest("header");
    if (!frame || !actions || !header) {
      return;
    }
    const measure = () => {
      const frameRect = frame.getBoundingClientRect();
      const actionsRect = actions.getBoundingClientRect();
      // The header is in flow at the page top, so its offset from the
      // actions holds whether or not it is currently stuck.
      const headerRect = header.getBoundingClientRect();
      frame.style.setProperty(
        "--actions-x",
        `${actionsRect.left + actionsRect.width / 2 - frameRect.left}px`,
      );
      frame.style.setProperty(
        "--actions-y",
        `${actionsRect.top - headerRect.top + actionsRect.height / 2}px`,
      );
      frame.style.setProperty(
        "--actions-rx",
        `${actionsRect.width / 2 + 77}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(actions);
    observer.observe(frame);
    // At wide viewports neither element changes size while the container
    // recentres, so also remeasure on viewport resize.
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [frameRef]);
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(reducedMotionQuery);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

export function HeroBackdrop({
  orientation = "diagonal",
}: {
  orientation?: Orientation;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  useHeaderActionsHole(frameRef);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    const { toX, toY, toU, toV } = geometry[orientation];

    let width = 0;
    let height = 0;
    let streaks: Streak[] = [];
    let pulses: Pulse[] = [];
    let nextId = 0;
    let sinceSpawn = Number.POSITIVE_INFINITY;
    let frame = 0;
    let last = 0;
    let visible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawLattice = () => {
      ctx.strokeStyle = `rgba(${ink}, 0.05)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const reach = width + height;
      if (orientation === "grid") {
        for (let c = 0.5; c <= reach; c += spacing) {
          ctx.moveTo(c, 0);
          ctx.lineTo(c, height);
          ctx.moveTo(0, c);
          ctx.lineTo(width, c);
        }
      } else {
        const step = spacing * root2;
        for (let c = -Math.ceil(reach / step) * step; c <= reach; c += step) {
          ctx.moveTo(c, 0);
          ctx.lineTo(c + reach, reach);
          ctx.moveTo(c, 0);
          ctx.lineTo(c - reach, reach);
        }
      }
      ctx.stroke();
    };

    // Pick a lattice node in the visible top-right band, then launch one
    // streak along each diagonal through it, timed to arrive together.
    const spawnPair = () => {
      const x = width * (0.3 + Math.random() * 0.7);
      const y = height * (0.12 + Math.random() * 0.5);
      const nodeU = Math.round(toU(x, y) / spacing) * spacing;
      const nodeV = Math.round(toV(x, y) / spacing) * spacing;
      const time = 1400 + Math.random() * 1400;
      const range = width + height;
      for (const axis of ["down", "up"] as const) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const speed = 0.12 + Math.random() * 0.16;
        const target = axis === "down" ? nodeV : nodeU;
        streaks.push({
          id: nextId++,
          axis,
          fixed: axis === "down" ? nodeU : nodeV,
          head: target - dir * speed * time,
          dir,
          speed,
          length: 70 + Math.random() * 90,
          traveled: 0,
          range,
          crossed: new Set(),
        });
      }
    };

    const drawStreak = (streak: Streak) => {
      const tail = streak.head - streak.dir * streak.length;
      const [hx, hy, tx, ty] =
        streak.axis === "down"
          ? [
              toX(streak.fixed, streak.head),
              toY(streak.fixed, streak.head),
              toX(streak.fixed, tail),
              toY(streak.fixed, tail),
            ]
          : [
              toX(streak.head, streak.fixed),
              toY(streak.head, streak.fixed),
              toX(tail, streak.fixed),
              toY(tail, streak.fixed),
            ];
      const gradient = ctx.createLinearGradient(tx, ty, hx, hy);
      gradient.addColorStop(0, `rgba(${ink}, 0)`);
      gradient.addColorStop(1, `rgba(${ink}, 0.25)`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    };

    const drawPulse = (pulse: Pulse, now: number) => {
      const age = now - pulse.start;
      const ring = Math.min(age / 1400, 1);
      if (ring < 1) {
        ctx.strokeStyle = `rgba(${ink}, ${0.35 * (1 - ring)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, 3 + ring * 26, 0, Math.PI * 2);
        ctx.stroke();
      }
      const dot = Math.min(age / 3200, 1);
      ctx.fillStyle = `rgba(${ink}, ${0.55 * (1 - dot)})`;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;

      sinceSpawn += dt;
      if (sinceSpawn > 1100) {
        sinceSpawn = 0;
        spawnPair();
      }

      for (const streak of streaks) {
        const step = streak.speed * dt;
        streak.head += streak.dir * step;
        streak.traveled += step;
      }
      streaks = streaks.filter((s) => s.traveled < s.range);

      for (const down of streaks) {
        if (down.axis !== "down") {
          continue;
        }
        for (const up of streaks) {
          if (up.axis !== "up") {
            continue;
          }
          if (
            !down.crossed.has(up.id) &&
            covers(down, up.fixed) &&
            covers(up, down.fixed)
          ) {
            down.crossed.add(up.id);
            pulses.push({
              x: toX(down.fixed, up.fixed),
              y: toY(down.fixed, up.fixed),
              start: now,
            });
          }
        }
      }
      pulses = pulses.filter((p) => now - p.start < 3200);

      ctx.clearRect(0, 0, width, height);
      drawLattice();
      for (const streak of streaks) {
        drawStreak(streak);
      }
      for (const pulse of pulses) {
        drawPulse(pulse, now);
      }

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame && visible && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    resize();

    if (reducedMotion) {
      // The canvas starts at zero size below md, so redraw the static grid
      // whenever it is resized into view.
      const staticObserver = new ResizeObserver(() => {
        resize();
        drawLattice();
      });
      staticObserver.observe(canvas);
      return () => staticObserver.disconnect();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        start();
      } else {
        stop();
      }
    });
    intersectionObserver.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [orientation, reducedMotion]);

  return (
    <div
      ref={frameRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-[calc(-1*(var(--site-header-height,61px)+1rem))] right-[calc(50%-50vw)] -z-10 hidden h-[680px] w-[min(1000px,75vw)] md:block"
      style={{
        maskImage: [
          "linear-gradient(220deg, black 35%, transparent 72%)",
          // Fade out at the viewport's right edge and the page's top edge.
          "linear-gradient(to left, transparent, black 140px)",
          "linear-gradient(to bottom, transparent, black 117px)",
          // Clear the area behind the header's Login and Create a poll buttons.
          `radial-gradient(ellipse var(--actions-rx, 170px) 60px at var(--actions-x, ${actionsFallbackX}) var(--actions-y, 46px), transparent 45%, black 100%)`,
        ].join(", "),
        maskComposite: "intersect",
      }}
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
