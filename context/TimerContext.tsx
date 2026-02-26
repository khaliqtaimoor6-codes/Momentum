"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Types
export type TimerMode = "focus" | "break" | "miniTask";

export interface MiniTask {
  id: string; // unique ID for identifying task
  title: string;
  duration: number; // minutes
}

interface TimerContextType {
  timeLeft: number;
  initialTime: number;
  isActive: boolean;
  mode: TimerMode;
  miniTask: MiniTask | null;
  sessionsCompleted: number;
  progress: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: TimerMode) => void;
  startMiniTask: (task: MiniTask) => void;
  completeMiniTask: () => void;
  setTimeLeft: (time: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const PHASES = {
  focus: { minutes: 25 },
  break: { minutes: 5 },
};

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // State
  const [timeLeft, setTimeLeft] = useState(PHASES.focus.minutes * 60);
  const [initialTime, setInitialTime] = useState(PHASES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setModeState] = useState<TimerMode>("focus");
  const [miniTask, setMiniTaskState] = useState<MiniTask | null>(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Refs for interval and persistence
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedState = localStorage.getItem("momentum-timer");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        
        // Restore simple values
        setInitialTime(parsed.initialTime || PHASES.focus.minutes * 60);
        setModeState(parsed.mode || "focus");
        setMiniTaskState(parsed.miniTask || null);
        setSessionsCompleted(parsed.sessionsCompleted || 0);

        // Determine if we should be active
        if (parsed.isActive && parsed.endTime) {
           const now = Date.now();
           const remaining = Math.max(0, Math.ceil((parsed.endTime - now) / 1000));
           
           if (remaining > 0) {
             setTimeLeft(remaining);
             endTimeRef.current = parsed.endTime;
             setIsActive(true);
           } else {
             // Timer finished while we were away
             setTimeLeft(0);
             setIsActive(false);
             // handleComplete() // Maybe auto-complete?
           }
        } else {
           setTimeLeft(parsed.timeLeft || PHASES.focus.minutes * 60);
           setIsActive(false);
        }

      } catch (e) {
        console.error("Failed to parse timer state", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stateToSave = {
      timeLeft,
      initialTime,
      isActive,
      mode,
      miniTask,
      sessionsCompleted,
      endTime: endTimeRef.current,
    };
    localStorage.setItem("momentum-timer", JSON.stringify(stateToSave));
  }, [timeLeft, initialTime, isActive, mode, miniTask, sessionsCompleted]);


  // Timer Logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
        // If we don't have an end time (just started), set it
        if (!endTimeRef.current) {
            endTimeRef.current = Date.now() + timeLeft * 1000;
        }

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const end = endTimeRef.current || (now + timeLeft * 1000); // Fallback should ideally not happen if logic is sound
            const diff = Math.ceil((end - now) / 1000);
            
            if (diff <= 0) {
                setTimeLeft(0);
                if (intervalRef.current) clearInterval(intervalRef.current);
                handleComplete();
            } else {
                setTimeLeft(diff);
            }
        }, 1000);
    } else {
        // Paused or stopped
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (!isActive) {
            endTimeRef.current = null;
        }
    }

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]); 

  const handleComplete = async () => {
    setIsActive(false);
    endTimeRef.current = null;
    
    // Play notification sound & browser notification
    try {
        const audio = new Audio('/sounds/bell.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch {}
    try {
        if ("Notification" in window && Notification.permission === "granted") {
            const title = mode === 'focus' 
              ? "🎉 Focus session complete!" 
              : mode === 'miniTask' && miniTask 
                ? `✅ Mini task "${miniTask.title}" done!`
                : "⏰ Timer complete!";
            const body = mode === 'focus'
              ? `Great job! You completed ${PHASES.focus.minutes} minutes of focused work.`
              : mode === 'miniTask' && miniTask
                ? `You finished "${miniTask.title}" in ${miniTask.duration} minutes.`
                : "Time to take a break!";
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    } catch {}

    // Update stats
    let minutesToAdd = 0;
    if (mode === 'focus') {
        minutesToAdd = PHASES.focus.minutes;
        setSessionsCompleted(prev => prev + 1);
    } else if (mode === 'miniTask' && miniTask) {
        minutesToAdd = miniTask.duration;
        // Save mini task to DB
        try {
             await fetch("/api/minitasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    title: miniTask.title,
                    timeLimit: miniTask.duration,
                    isCompleted: true 
                }),
            });
        } catch (e) {
            console.error("Failed to save minitask", e);
        }
    }

    if (minutesToAdd > 0) {
        try {
            await fetch("/api/pomodoro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ minutes: minutesToAdd }),
            });
            router.refresh();
        } catch (e) {
            console.error("Failed to log session", e);
        }
    }

    // Auto switch logic
    if (mode === 'focus') {
        // Optional: Auto-switch to break?
    }
  };

  const startTimer = useCallback(() => {
    if (timeLeft > 0) setIsActive(true);
  }, [timeLeft]);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    endTimeRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (mode === "focus") {
        setTimeLeft(PHASES.focus.minutes * 60);
        setInitialTime(PHASES.focus.minutes * 60);
    } else if (mode === "break") {
        setTimeLeft(PHASES.break.minutes * 60);
        setInitialTime(PHASES.break.minutes * 60);
    } else if (mode === "miniTask" && miniTask) {
        setTimeLeft(miniTask.duration * 60);
        setInitialTime(miniTask.duration * 60);
    }
  }, [mode, miniTask]);

  const setMode = useCallback((newMode: TimerMode) => {
    setModeState(newMode);
    setIsActive(false);
    
    if (newMode === 'break') {
        setTimeLeft(PHASES.break.minutes * 60);
        setInitialTime(PHASES.break.minutes * 60);
        setMiniTaskState(null);
    } else if (newMode === 'focus') {
        setTimeLeft(PHASES.focus.minutes * 60);
        setInitialTime(PHASES.focus.minutes * 60);
        setMiniTaskState(null);
    }
  }, []);

  const startMiniTask = useCallback((task: MiniTask) => {
    setMiniTaskState(task);
    setModeState("miniTask");
    setTimeLeft(task.duration * 60);
    setInitialTime(task.duration * 60);
    setIsActive(false); // User must press play
    endTimeRef.current = null;
  }, []);
  
  const completeMiniTask = () => handleComplete();

  const progress = initialTime > 0 ? timeLeft / initialTime : 0;

  return (
    <TimerContext.Provider
      value={{
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
        startMiniTask,
        completeMiniTask,
        setTimeLeft
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
