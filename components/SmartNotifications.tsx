"use client";

import { useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVITY_LABELS: Record<string, string> = {
  sleep: "Sleep 🌙",
  study: "Study 📚",
  gym: "Gym 💪",
  skills: "Skills 🎯",
};

/**
 * Background component: polls timetable & stats APIs and fires
 * browser notifications for upcoming activities and nudges.
 * Renders nothing visible.
 */
export default function SmartNotifications() {
  const { permission, notify } = useNotifications();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimetableCheck = useRef<string>("");
  const lastNudge = useRef<string>("");

  useEffect(() => {
    if (permission !== "granted") return;

    // Check every 60 seconds
    const check = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      // Day index: Mon=0 ... Sun=6
      const jsDay = now.getDay(); // 0=Sun
      const dayIdx = jsDay === 0 ? 6 : jsDay - 1;

      // ─── Timetable reminder ───────────────────────────────
      // Notify 10 minutes before the hour about the next activity
      if (currentMinute >= 50 && currentMinute < 52) {
        const nextHour = (currentHour + 1) % 24;
        const timetableKey = `${dayIdx}-${nextHour}-${now.toDateString()}`;

        if (timetableKey !== lastTimetableCheck.current) {
          lastTimetableCheck.current = timetableKey;
          try {
            const res = await fetch("/api/timetable");
            if (res.ok) {
              const data = await res.json();
              const entry = data.entries?.[`${dayIdx}-${nextHour}`];
              if (entry && entry !== "none") {
                const label = ACTIVITY_LABELS[entry] || entry;
                const hourStr = nextHour === 0 ? "12 AM" : nextHour < 12 ? `${nextHour} AM` : nextHour === 12 ? "12 PM" : `${nextHour - 12} PM`;
                notify(`📅 You planned ${label} at ${hourStr}`, {
                  body: `${DAYS[dayIdx]} timetable reminder — ${label} is coming up in ~10 minutes.`,
                  dedupeKey: `timetable-${timetableKey}`,
                });
              }
            }
          } catch {
            // ignore
          }
        }
      }

      // ─── Focus nudge (once per day at 2 PM) ──────────────
      if (currentHour === 14 && currentMinute >= 0 && currentMinute < 2) {
        const nudgeKey = `focus-${now.toDateString()}`;
        if (nudgeKey !== lastNudge.current) {
          lastNudge.current = nudgeKey;
          try {
            const saved = localStorage.getItem("momentum-timer");
            if (saved) {
              const parsed = JSON.parse(saved);
              if ((parsed.sessionsCompleted || 0) === 0) {
                notify("🔥 You haven't focused today", {
                  body: "Start a focus session to keep your streak going!",
                  dedupeKey: nudgeKey,
                });
              }
            } else {
              notify("🔥 You haven't focused today", {
                body: "Start a focus session to keep your streak going!",
                dedupeKey: nudgeKey,
              });
            }
          } catch {
            // ignore
          }
        }
      }

      // ─── Streak warning (6 PM) ───────────────────────────
      if (currentHour === 18 && currentMinute >= 0 && currentMinute < 2) {
        const streakKey = `streak-${now.toDateString()}`;
        if (streakKey !== lastNudge.current) {
          try {
            const saved = localStorage.getItem("momentum-timer");
            if (saved) {
              const parsed = JSON.parse(saved);
              if ((parsed.sessionsCompleted || 0) === 0) {
                lastNudge.current = streakKey;
                notify("⏳ You're running out of time!", {
                  body: "You still have time to complete a focus session and keep your streak.",
                  dedupeKey: streakKey,
                });
              }
            }
          } catch {
            // ignore
          }
        }
      }
    };

    // Run immediately, then every 60 seconds
    check();
    intervalRef.current = setInterval(check, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [permission, notify]);

  return null; // invisible background component
}
