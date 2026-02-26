"use client";

import { useEffect, useCallback, useRef, useState } from "react";

/** Request + send browser Notification API alerts. */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const sentRef = useRef<Set<string>>(new Set()); // dedup within session

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied" as const;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions & { dedupeKey?: string }) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      // Dedup: don't fire the same notification twice in one session
      const key = options?.dedupeKey ?? title;
      if (sentRef.current.has(key)) return;
      sentRef.current.add(key);
      // Allow re-fire after 5 minutes
      setTimeout(() => sentRef.current.delete(key), 5 * 60 * 1000);

      try {
        const n = new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
        // Auto-close after 6s
        setTimeout(() => n.close(), 6000);
      } catch {
        // Ignore — some browsers block the constructor
      }
    },
    []
  );

  return { permission, requestPermission, notify };
}

/**
 * Play a short notification sound.
 * Falls back silently if the audio file doesn't exist.
 */
export function playSound(src = "/sounds/bell.mp3") {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}
