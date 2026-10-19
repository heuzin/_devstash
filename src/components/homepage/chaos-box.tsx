"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { CHAOS_ICONS } from "@/components/homepage/chaos-icons";
import { useInView } from "@/lib/hooks/use-in-view";

const ICON_SIZE = 52;
const MAX_SPEED = 1.6;
const REPEL_RADIUS = 110;
const REPEL_FORCE = 0.9;

interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  phase: number;
  cruise: number;
}

interface Bounds {
  width: number;
  height: number;
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function createIconState(bounds: Bounds): IconState {
  const angle = rand(0, Math.PI * 2);
  const speed = rand(0.4, 0.9);
  return {
    x: rand(0, Math.max(0, bounds.width - ICON_SIZE)),
    y: rand(0, Math.max(0, bounds.height - ICON_SIZE)),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rotation: rand(-20, 20),
    spin: rand(-0.3, 0.3),
    phase: rand(0, Math.PI * 2),
    cruise: speed,
  };
}

function stepIcon(icon: IconState, bounds: Bounds, mouse: { x: number; y: number } | null) {
  if (mouse) {
    const dx = icon.x + ICON_SIZE / 2 - mouse.x;
    const dy = icon.y + ICON_SIZE / 2 - mouse.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < REPEL_RADIUS) {
      const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
      icon.vx += (dx / dist) * force;
      icon.vy += (dy / dist) * force;
    }
  }

  // Ease back toward cruising speed after being pushed
  const speed = Math.hypot(icon.vx, icon.vy) || 1;
  const target = Math.min(speed, MAX_SPEED) * 0.97 + icon.cruise * 0.03;
  icon.vx = (icon.vx / speed) * target;
  icon.vy = (icon.vy / speed) * target;

  icon.x += icon.vx;
  icon.y += icon.vy;
  icon.rotation += icon.spin;

  const maxX = bounds.width - ICON_SIZE;
  const maxY = bounds.height - ICON_SIZE;
  if (icon.x <= 0 || icon.x >= maxX) {
    icon.x = Math.min(Math.max(icon.x, 0), maxX);
    icon.vx *= -1;
    icon.spin *= -1;
  }
  if (icon.y <= 0 || icon.y >= maxY) {
    icon.y = Math.min(Math.max(icon.y, 0), maxY);
    icon.vy *= -1;
  }
}

function renderIcon(element: HTMLElement | null, icon: IconState, time: number) {
  if (!element) return;
  const scale = 1 + Math.sin(time / 900 + icon.phase) * 0.06;
  element.style.transform = `translate(${icon.x}px, ${icon.y}px) rotate(${icon.rotation}deg) scale(${scale})`;
}

export function ChaosBox() {
  const { ref: boxRef, inView } = useInView<HTMLDivElement>({ once: false });
  const iconElements = useRef<(HTMLDivElement | null)[]>([]);
  const icons = useRef<IconState[]>([]);
  const bounds = useRef<Bounds>({ width: 0, height: 0 });
  const mouse = useRef<{ x: number; y: number } | null>(null);

  // Scatter icons once and keep bounds in sync with the box size
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    bounds.current = { width: box.clientWidth, height: box.clientHeight };
    icons.current = CHAOS_ICONS.map(() => createIconState(bounds.current));
    icons.current.forEach((icon, i) => renderIcon(iconElements.current[i], icon, 0));

    const resizeObserver = new ResizeObserver(() => {
      bounds.current = { width: box.clientWidth, height: box.clientHeight };
    });
    resizeObserver.observe(box);
    return () => resizeObserver.disconnect();
  }, [boxRef]);

  // Animate only while on screen and when motion is allowed
  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const tick = (time: number) => {
      icons.current.forEach((icon, i) => {
        stepIcon(icon, bounds.current, mouse.current);
        renderIcon(iconElements.current[i], icon, time);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView]);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouse.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  return (
    <div
      ref={boxRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => (mouse.current = null)}
      className="relative h-70 overflow-hidden rounded-xl border border-border bg-card bg-[radial-gradient(circle_at_30%_20%,rgb(239_68_68/0.07),transparent_60%)] md:h-80"
    >
      {CHAOS_ICONS.map(({ title, icon }, i) => (
        <div
          key={title}
          ref={(element) => {
            iconElements.current[i] = element;
          }}
          title={title}
          className="absolute top-0 left-0 grid size-13 place-items-center rounded-xl border border-border bg-secondary shadow-[0_8px_24px_-10px_rgb(0_0_0/0.8)] will-change-transform [&_svg]:size-6.5"
        >
          {icon}
        </div>
      ))}
    </div>
  );
}
