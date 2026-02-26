"use client";

import { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Point { x: number; y: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; hue: number; brightness: number }
interface FloatingOrb { x: number; y: number; baseY: number; radius: number; speed: number; phase: number; opacity: number; hue: number }

export default function SpiritDragon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<Point>({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);
  const { theme } = useTheme();

  const draw = useCallback((canvas: HTMLCanvasElement) => {
    const g = canvas.getContext("2d")!;
    if (!g) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const time = { t: 0 };
    const segments = 60;
    const particles: Particle[] = [];
    const orbs: FloatingOrb[] = [];

    for (let i = 0; i < 40; i++) {
      orbs.push({
        x: Math.random() * W, y: Math.random() * H, baseY: Math.random() * H,
        radius: Math.random() * 2.5 + 0.5, speed: Math.random() * 0.3 + 0.1,
        phase: Math.random() * Math.PI * 2, opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() * 40 + 200,
      });
    }

    function pt(i: number, t: number): Point {
      const p = i / segments;
      const a = t * 0.4 + p * Math.PI * 4;
      const m = mouseRef.current;
      const hi = Math.max(0, 1 - p * 3);
      const mx = (m.x - cx) * 0.08 * hi;
      const my = (m.y - cy) * 0.08 * hi;
      const rx = W * 0.18 + Math.sin(t * 0.2) * W * 0.04;
      const ry = H * 0.15 + Math.cos(t * 0.15) * H * 0.03;
      return {
        x: cx + Math.cos(a) * rx * (1 - p * 0.3) + mx,
        y: cy + Math.sin(a * 0.7) * ry * (1 - p * 0.2) + Math.sin(t * 0.3 + p * 2) * 20 + my,
      };
    }

    function spawn(x: number, y: number, intensity: number) {
      if (particles.length > 150) return;
      particles.push({
        x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 - 0.3,
        life: 1, maxLife: 60 + Math.random() * 40, size: Math.random() * 3 + 1,
        hue: 210 + Math.random() * 30, brightness: 70 + intensity * 30,
      });
    }

    function render() {
      time.t += 0.012;
      g.clearRect(0, 0, W, H);

      // Background gradient
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "rgba(15,14,30,0.02)");
      bg.addColorStop(1, "rgba(25,20,50,0.02)");
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);

      // Floating orbs
      const m = mouseRef.current;
      for (const o of orbs) {
        o.phase += o.speed * 0.02;
        o.y = o.baseY + Math.sin(o.phase) * 15;
        o.x += Math.sin(o.phase * 0.7) * 0.2;
        const dx = m.x - o.x, dy = m.y - o.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) {
          const f = (150 - d) / 150;
          o.x -= dx * f * 0.005; o.y -= dy * f * 0.005;
          o.opacity = Math.min(0.8, o.opacity + f * 0.02);
        } else { o.opacity += (0.2 - o.opacity) * 0.01; }
        if (o.x < -10) o.x = W + 10;
        if (o.x > W + 10) o.x = -10;

        g.beginPath(); g.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        const gl = g.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius * 3);
        gl.addColorStop(0, `hsla(${o.hue},70%,80%,${o.opacity})`);
        gl.addColorStop(1, `hsla(${o.hue},70%,80%,0)`);
        g.fillStyle = gl; g.fill();

        g.beginPath(); g.arc(o.x, o.y, o.radius * 0.5, 0, Math.PI * 2);
        g.fillStyle = `hsla(${o.hue},80%,90%,${o.opacity * 0.8})`; g.fill();
      }

      // Dragon body points
      const pts: Point[] = [];
      for (let i = 0; i <= segments; i++) pts.push(pt(i, time.t));

      // Glow trail
      for (let i = 1; i < pts.length; i++) {
        const p = i / pts.length;
        g.beginPath(); g.moveTo(pts[i - 1].x, pts[i - 1].y); g.lineTo(pts[i].x, pts[i].y);
        g.strokeStyle = `hsla(215,70%,75%,${(1 - p) * 0.15})`;
        g.lineWidth = (1 - p) * 12 + 10; g.lineCap = "round"; g.stroke();
      }

      // Smooth body curve
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        g.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      const bd = g.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
      bd.addColorStop(0, "hsla(210,60%,88%,0.9)");
      bd.addColorStop(0.3, "hsla(220,50%,82%,0.8)");
      bd.addColorStop(0.6, "hsla(230,45%,78%,0.6)");
      bd.addColorStop(1, "hsla(240,40%,75%,0.15)");
      g.strokeStyle = bd; g.lineWidth = 6; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
      g.strokeStyle = "hsla(210,80%,95%,0.4)"; g.lineWidth = 2; g.stroke();

      // Head
      const head = pts[0], neck = pts[2];
      const ha = Math.atan2(head.y - neck.y, head.x - neck.x);

      const hg = g.createRadialGradient(head.x, head.y, 0, head.x, head.y, 25);
      hg.addColorStop(0, "hsla(210,80%,90%,0.5)");
      hg.addColorStop(0.5, "hsla(220,70%,80%,0.15)");
      hg.addColorStop(1, "hsla(220,70%,80%,0)");
      g.beginPath(); g.arc(head.x, head.y, 25, 0, Math.PI * 2);
      g.fillStyle = hg; g.fill();

      g.beginPath(); g.ellipse(head.x, head.y, 10, 7, ha, 0, Math.PI * 2);
      g.fillStyle = "hsla(210,60%,90%,0.85)"; g.fill();
      g.strokeStyle = "hsla(210,50%,80%,0.5)"; g.lineWidth = 1; g.stroke();

      // Eyes
      const eo = 4;
      const eyes = [
        { x: head.x + Math.cos(ha + 0.6) * eo, y: head.y + Math.sin(ha + 0.6) * eo },
        { x: head.x + Math.cos(ha - 0.6) * eo, y: head.y + Math.sin(ha - 0.6) * eo },
      ];
      for (const e of eyes) {
        const eg = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, 6);
        eg.addColorStop(0, "hsla(200,100%,85%,0.9)");
        eg.addColorStop(0.4, "hsla(210,100%,70%,0.4)");
        eg.addColorStop(1, "hsla(210,100%,70%,0)");
        g.beginPath(); g.arc(e.x, e.y, 6, 0, Math.PI * 2); g.fillStyle = eg; g.fill();
        g.beginPath(); g.arc(e.x, e.y, 1.5, 0, Math.PI * 2);
        g.fillStyle = "hsla(200,100%,95%,1)"; g.fill();
      }

      // Whiskers
      for (let w = 0; w < 2; w++) {
        const s = w === 0 ? 1 : -1;
        const wb = { x: head.x + Math.cos(ha + s * 0.8) * 8, y: head.y + Math.sin(ha + s * 0.8) * 8 };
        const we = {
          x: wb.x + Math.cos(ha + s * 1.2 + Math.sin(time.t * 2) * 0.3) * 20,
          y: wb.y + Math.sin(ha + s * 1.2 + Math.sin(time.t * 2) * 0.3) * 20,
        };
        const wm = {
          x: (wb.x + we.x) / 2 + Math.sin(time.t * 3 + w) * 4 * s,
          y: (wb.y + we.y) / 2 + Math.cos(time.t * 3 + w) * 4,
        };
        g.beginPath(); g.moveTo(wb.x, wb.y); g.quadraticCurveTo(wm.x, wm.y, we.x, we.y);
        g.strokeStyle = `hsla(210,60%,85%,${0.4 + Math.sin(time.t * 2) * 0.1})`;
        g.lineWidth = 1; g.stroke();
      }

      // Spawn particles
      if (Math.random() < 0.6) {
        const idx = Math.floor(Math.random() * Math.min(15, pts.length));
        spawn(pts[idx].x, pts[idx].y, 1 - idx / 15);
      }
      const hd = Math.sqrt((m.x - head.x) ** 2 + (m.y - head.y) ** 2);
      if (hd < 200 && Math.random() < 0.3) {
        spawn(head.x + (Math.random() - 0.5) * 20, head.y + (Math.random() - 0.5) * 20, 1);
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy -= 0.005; p.life -= 1 / p.maxLife;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const a = p.life * 0.6;
        const pg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        pg.addColorStop(0, `hsla(${p.hue},70%,${p.brightness}%,${a})`);
        pg.addColorStop(1, `hsla(${p.hue},70%,${p.brightness}%,0)`);
        g.beginPath(); g.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2); g.fillStyle = pg; g.fill();
        g.beginPath(); g.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        g.fillStyle = `hsla(${p.hue},80%,95%,${a * 0.8})`; g.fill();
      }

      // Moonlight bloom
      const ml = g.createRadialGradient(W * 0.7, -H * 0.1, 0, W * 0.7, -H * 0.1, H * 0.6);
      ml.addColorStop(0, "hsla(220,30%,90%,0.04)");
      ml.addColorStop(0.5, "hsla(230,20%,80%,0.015)");
      ml.addColorStop(1, "hsla(230,20%,80%,0)");
      g.fillStyle = ml; g.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(render);
    }

    render();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    draw(canvas);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  if (theme !== "dark") return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-auto w-full h-full opacity-70"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
