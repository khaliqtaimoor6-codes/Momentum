"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayIcon, PauseIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTimer, TimerMode, MiniTask } from "@/context/TimerContext";

export interface FocusTask {
  id: string;
  title: string;
}

interface FocusTimerProps {
  tasks: FocusTask[];
}

const UI_CONFIG: Record<TimerMode, { label: string; color: string; ring: string; bg: string }> = {
  focus: {
    label: "Focus",
    color: "#6C8EBF",
    ring: "rgba(108,142,191,0.2)",
    bg: "from-[#e8eef7] to-[#dce7f4]",
  },
  break: {
    label: "Break",
    color: "#7BAE7F",
    ring: "rgba(123,174,127,0.2)",
    bg: "from-[#edf6ee] to-[#ddf0de]",
  },
  miniTask: {
    label: "Mini Task",
    color: "#E59866",
    ring: "rgba(229,152,102,0.2)",
    bg: "from-[#fdf2e9] to-[#fae5d3]",
  },
};

const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function FocusTimer({ tasks }: FocusTimerProps) {
  const { 
    timeLeft, 
    initialTime, 
    isActive, 
    mode, 
    miniTask, 
    sessionsCompleted, 
    progress,
    startTimer, 
    pauseTimer, 
    resetTimer, 
    setMode, 
    startMiniTask 
  } = useTimer();

  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [showMiniTaskModal, setShowMiniTaskModal] = useState(false);
  const [miniTaskTitle, setMiniTaskTitle] = useState("");
  const [miniTaskDuration, setMiniTaskDuration] = useState(15);

  const phaseConfig = UI_CONFIG[mode];
  const strokeOffset = CIRCUMFERENCE * (1 - progress);

  const handleStartPause = () => {
    if (isActive) pauseTimer();
    else startTimer();
  };

  const handlePhaseSwitch = (p: TimerMode) => {
    if (p === "miniTask") {
      setShowMiniTaskModal(true);
    } else {
      setMode(p);
    }
  };

  const createMiniTask = () => {
    if (!miniTaskTitle.trim() || miniTaskDuration <= 0) return;
    
    startMiniTask({
        id: crypto.randomUUID(),
        title: miniTaskTitle,
        duration: miniTaskDuration
    });
    setShowMiniTaskModal(false);
    setMiniTaskTitle("");
    setMiniTaskDuration(15);
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-gradient-to-br ${phaseConfig.bg} px-4 transition-all duration-1000`}
    >
      {/* Mini Task Modal */}
      <AnimatePresence>
        {showMiniTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
             >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-stone-800">New Mini Task</h3>
                    <button onClick={() => setShowMiniTaskModal(false)} className="text-stone-400 hover:text-stone-600">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500">Task Title</label>
                        <input 
                           type="text" 
                           value={miniTaskTitle}
                           onChange={e => setMiniTaskTitle(e.target.value)}
                           className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                           placeholder="e.g. Quick email response"
                           autoFocus
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500">Duration (minutes)</label>
                        <input 
                           type="number" 
                           value={miniTaskDuration}
                           onChange={e => setMiniTaskDuration(Number(e.target.value))}
                           min={1}
                           max={120}
                           className="w-full rounded-xl border border-stone-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                        />
                    </div>
                    <button 
                        onClick={createMiniTask}
                        className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
                    >
                        Start Task
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phase switcher */}
      <div className="mb-10 flex gap-2 rounded-2xl bg-white/70 p-1.5 shadow-md backdrop-blur-sm">
        {(["focus", "break", "miniTask"] as TimerMode[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePhaseSwitch(p)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              mode === p
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-400 hover:text-stone-700"
            }`}
          >
            {UI_CONFIG[p].label}
          </button>
        ))}
      </div>
      
      {/* ── Circular timer ────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        {/* Glowing ambient ring */}
        <motion.div
          animate={
            isActive
              ? { scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }
              : { scale: 1, opacity: 0.4 }
          }
          transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            background: phaseConfig.ring,
            filter: "blur(24px)",
          }}
        />

        {/* SVG ring */}
        <svg width="280" height="280" viewBox="0 0 280 280" className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx="140"
            cy="140"
            r={RADIUS}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <motion.circle
            cx="140"
            cy="140"
            r={RADIUS}
            fill="none"
            stroke={phaseConfig.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            style={{ transition: isActive ? "stroke-dashoffset 1s linear" : "none" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center gap-1">
          {/* Time display */}
          <motion.div
            key={isActive ? timeLeft : "static"}
            initial={isActive ? { scale: 1.04 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="font-mono text-6xl font-bold tracking-tighter text-stone-900"
          >
            {formatTime(timeLeft)}
          </motion.div>

          {/* Phase label */}
          <span className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: phaseConfig.color }}>
            {mode === 'miniTask' && miniTask ? truncate(miniTask.title, 20) : phaseConfig.label}
          </span>
        </div>
      </div>

      {/* Sessions counter */}
      {sessionsCompleted > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 flex items-center gap-1.5 text-sm text-stone-500"
        >
          <CheckCircleIcon className="h-4 w-4 text-accent" />
          {sessionsCompleted} session{sessionsCompleted !== 1 ? "s" : ""} completed
        </motion.div>
      )}

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-4">
        {/* Reset */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={resetTimer}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-stone-400 shadow-md backdrop-blur-sm transition hover:text-stone-700"
          title="Reset"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </motion.button>

        {/* Start / Pause — primary */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleStartPause}
          className="flex h-20 w-20 items-center justify-center rounded-full shadow-xl transition"
          style={{ backgroundColor: phaseConfig.color }}
          title={isActive ? "Pause" : "Start"}
        >
          {isActive ? (
            <PauseIcon className="h-8 w-8 text-white" />
          ) : (
            <PlayIcon className="h-8 w-8 translate-x-0.5 text-white" />
          )}
        </motion.button>

        {/* Spacer to keep layout symmetric */}
        <div className="h-12 w-12" />
      </div>

      {/* ── Task selector (Only for Focus mode) ─────────────────────────────────────────────────── */}
      {mode === 'focus' && tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 w-full max-w-xs"
        >
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-stone-400">
            Focusing on
          </p>
          <div className="relative">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-stone-200 bg-white/80 px-5 py-3 pr-10 text-sm font-medium text-stone-700 shadow-sm backdrop-blur-sm transition focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:outline-none"
            >
              <option value="">— No task selected —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
              ▾
            </span>
          </div>
        </motion.div>
      )}

      {/* Minimal mode hint */}
      <p className="mt-12 text-xs text-stone-400/60 select-none">
        Close other tabs for a distraction-free session
      </p>
    </div>
  );
}

function truncate(str: string, n: number) {
  return (str.length > n) ? str.slice(0, n-1) + '...' : str;
}

