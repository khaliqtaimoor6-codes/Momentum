"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrophyIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface LastWeekData {
  winner: { name: string; tasksCompleted: number; focusMinutes: number; isCurrentUser: boolean } | null;
  yourStats: { tasksCompleted: number; focusMinutes: number };
}

// ─── Confetti particle system ─────────────────────────────
interface Confetto {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  drift: number;
}

const CONFETTI_COLORS = [
  "#6C8EBF", "#7BAE7F", "#E59866", "#D97C7C", "#A78BFA",
  "#F59E0B", "#EC4899", "#14B8A6", "#FFD700", "#FF6B6B",
];

function generateConfetti(count: number): Confetto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // vw%
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 8 + 4,
    delay: Math.random() * 2,
    drift: (Math.random() - 0.5) * 40,
  }));
}

// ─── Firework bursts ──────────────────────────────────────
interface Spark {
  id: number;
  cx: number;
  cy: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  delay: number;
}

function generateFireworks(burstCount: number, sparksPerBurst: number): Spark[] {
  const sparks: Spark[] = [];
  let id = 0;
  for (let b = 0; b < burstCount; b++) {
    const cx = 15 + Math.random() * 70; // vw
    const cy = 15 + Math.random() * 40; // vh
    const burstDelay = b * 0.6;
    const burstColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    for (let s = 0; s < sparksPerBurst; s++) {
      sparks.push({
        id: id++,
        cx,
        cy,
        angle: (s / sparksPerBurst) * 360,
        distance: 30 + Math.random() * 60,
        color: burstColor,
        size: Math.random() * 4 + 2,
        delay: burstDelay + Math.random() * 0.3,
      });
    }
  }
  return sparks;
}

interface Props {
  lastWeekData: LastWeekData | null;
}

export default function WeeklyResetCelebration({ lastWeekData }: Props) {
  const [show, setShow] = useState(false);
  const [confetti] = useState(() => generateConfetti(80));
  const [fireworks] = useState(() => generateFireworks(5, 12));
  const hasShownRef = useRef(false);

  const dismiss = useCallback(() => {
    setShow(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("momentum-last-celebration", new Date().toISOString());
    }
  }, []);

  useEffect(() => {
    if (!lastWeekData || hasShownRef.current) return;

    // Check if we already showed celebration this week
    const lastCelebration = localStorage.getItem("momentum-last-celebration");
    if (lastCelebration) {
      const celebDate = new Date(lastCelebration);
      const now = new Date();
      // If celebrated within last 6 days, skip
      const msIn6Days = 6 * 24 * 60 * 60 * 1000;
      if (now.getTime() - celebDate.getTime() < msIn6Days) return;
    }

    // Only show if there was meaningful activity last week
    const { yourStats } = lastWeekData;
    if (yourStats.tasksCompleted === 0 && yourStats.focusMinutes === 0) return;

    hasShownRef.current = true;
    // Small delay for dramatic effect
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, [lastWeekData]);

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(dismiss, 12000);
    return () => clearTimeout(t);
  }, [show, dismiss]);

  if (!lastWeekData) return null;
  const { winner, yourStats } = lastWeekData;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* ── Confetti rain ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                className="absolute rounded-sm"
                style={{
                  left: `${c.x}%`,
                  width: c.size,
                  height: c.size * 1.5,
                  backgroundColor: c.color,
                }}
                initial={{ y: `${c.y}vh`, rotate: 0, opacity: 1 }}
                animate={{
                  y: "110vh",
                  rotate: c.rotation + 720,
                  x: c.drift,
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: c.delay,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>

          {/* ── Firework bursts ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {fireworks.map((s) => (
              <motion.div
                key={s.id}
                className="absolute rounded-full"
                style={{
                  left: `${s.cx}%`,
                  top: `${s.cy}%`,
                  width: s.size,
                  height: s.size,
                  backgroundColor: s.color,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: Math.cos((s.angle * Math.PI) / 180) * s.distance,
                  y: Math.sin((s.angle * Math.PI) / 180) * s.distance,
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.2,
                  delay: s.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* ── Main card ── */}
          <motion.div
            className="relative z-10 mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-[#1a1a2e]"
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.2 }}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Trophy */}
            <motion.div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.5 }}
            >
              <TrophyIcon className="h-10 w-10 text-white" />
            </motion.div>

            <motion.h2
              className="mt-5 text-center text-xl font-bold text-stone-900 dark:text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              🎉 New Week, Fresh Start!
            </motion.h2>

            <motion.p
              className="mt-2 text-center text-sm text-stone-500 dark:text-stone-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
            >
              Here&apos;s how last week went:
            </motion.p>

            {/* Stats */}
            <motion.div
              className="mt-5 grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="rounded-2xl bg-accent-light p-4 text-center dark:bg-accent-light">
                <p className="text-2xl font-bold text-accent-dark">{yourStats.tasksCompleted}</p>
                <p className="text-xs text-muted">Tasks Done</p>
              </div>
              <div className="rounded-2xl bg-success-light p-4 text-center dark:bg-success-light">
                <p className="text-2xl font-bold text-success">{yourStats.focusMinutes}</p>
                <p className="text-xs text-muted">Focus Mins</p>
              </div>
            </motion.div>

            {/* Winner */}
            {winner && (
              <motion.div
                className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-700/30 dark:bg-amber-900/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  🏆 Last Week&apos;s Winner
                </p>
                <p className="mt-1 text-lg font-bold text-stone-900 dark:text-white">
                  {winner.isCurrentUser ? "You! 🎉" : winner.name}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {winner.tasksCompleted} tasks · {winner.focusMinutes} focus mins
                </p>
              </motion.div>
            )}

            <motion.button
              onClick={dismiss}
              className="mt-6 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Let&apos;s crush this week! 💪
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
