"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVITIES = ["sleep", "study", "gym", "skills", "none"] as const;
type Activity = (typeof ACTIVITIES)[number];

const ACTIVITY_CONFIG: Record<Activity, { label: string; emoji: string; bg: string; text: string; ring: string }> = {
  sleep:  { label: "Sleep",  emoji: "🌙", bg: "bg-indigo-100 dark:bg-indigo-900/40",  text: "text-indigo-700 dark:text-indigo-300",  ring: "ring-indigo-300 dark:ring-indigo-600" },
  study:  { label: "Study",  emoji: "📚", bg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-700 dark:text-amber-300",    ring: "ring-amber-300 dark:ring-amber-600" },
  gym:    { label: "Gym",    emoji: "💪", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-300 dark:ring-emerald-600" },
  skills: { label: "Skills", emoji: "🎯", bg: "bg-rose-100 dark:bg-rose-900/40",      text: "text-rose-700 dark:text-rose-300",      ring: "ring-rose-300 dark:ring-rose-600" },
  none:   { label: "—",      emoji: "",   bg: "bg-stone-50 dark:bg-white/5",           text: "text-stone-400 dark:text-stone-500",    ring: "ring-transparent" },
};

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export default function TimetableClient() {
  // grid[day][hour] = activity
  const [grid, setGrid] = useState<Activity[][]>(() =>
    Array.from({ length: 7 }, () => Array(24).fill("none") as Activity[])
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weekLabel, setWeekLabel] = useState("");

  // Fetch existing timetable
  useEffect(() => {
    fetch("/api/timetable")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const ws = new Date(data.weekStart);
        const we = new Date(ws);
        we.setDate(we.getDate() + 6);
        setWeekLabel(
          `${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${we.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        );
        if (data.entries) {
          setGrid((prev) => {
            const copy = prev.map((row) => [...row]);
            for (const [key, val] of Object.entries(data.entries)) {
              const [d, h] = key.split("-").map(Number);
              if (d >= 0 && d <= 6 && h >= 0 && h <= 23) {
                copy[d][h] = val as Activity;
              }
            }
            return copy;
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Cycle activity on click
  const cycle = useCallback((day: number, hour: number) => {
    setGrid((prev) => {
      const copy = prev.map((row) => [...row]);
      const cur = copy[day][hour];
      const idx = ACTIVITIES.indexOf(cur);
      copy[day][hour] = ACTIVITIES[(idx + 1) % ACTIVITIES.length];
      return copy;
    });
    setSaved(false);
  }, []);

  // Save
  const save = async () => {
    setSaving(true);
    const entries: { day: number; hour: number; activity: string }[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        entries.push({ day: d, hour: h, activity: grid[d][h] });
      }
    }
    try {
      const res = await fetch("/api/timetable", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Weekly Timetable
          </h1>
          {weekLabel && (
            <p className="mt-1 text-sm text-muted">{weekLabel}</p>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : saved ? (
            "✓ Saved"
          ) : (
            "Save Timetable"
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ACTIVITIES.filter((a) => a !== "none").map((a) => {
          const c = ACTIVITY_CONFIG[a];
          return (
            <span
              key={a}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${c.bg} ${c.text}`}
            >
              {c.emoji} {c.label}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-stone-500">
          Click cell to cycle
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-sm">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card border-b border-r border-card-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                Hour
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="border-b border-card-border px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, hour) => (
              <tr key={hour} className="group">
                <td className="sticky left-0 z-10 bg-card border-r border-card-border px-3 py-0 text-xs font-mono text-muted whitespace-nowrap w-[72px]">
                  {formatHour(hour)}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const activity = grid[dayIdx][hour];
                  const conf = ACTIVITY_CONFIG[activity];
                  return (
                    <td
                      key={dayIdx}
                      className="border-b border-card-border/50 p-0.5"
                    >
                      <button
                        onClick={() => cycle(dayIdx, hour)}
                        className={`w-full rounded-lg px-1 py-1.5 text-center text-xs font-medium transition-all duration-150 ring-1 ${conf.bg} ${conf.text} ${conf.ring} hover:scale-105 hover:shadow-sm active:scale-95`}
                        title={`${DAYS[dayIdx]} ${formatHour(hour)} — ${conf.label}`}
                      >
                        {activity === "none" ? (
                          <span className="opacity-30">—</span>
                        ) : (
                          <span>
                            {conf.emoji}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-xs text-muted-light">
        Timetable resets every Monday · Click any cell to cycle through activities
      </p>
    </motion.div>
  );
}
