"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  progress?: number; // 0–100
  delay?: number;
}

export default function StatsCard({ title, value, icon, progress, delay = 0 }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const duration = 800;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(108,142,191,0.15)]"
    >
      <div className="flex items-center gap-3 text-stone-400">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-light text-accent">
          {icon}
        </span>
        <span className="text-sm font-medium text-stone-500">{title}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
        {displayValue}
      </p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
          />
        </div>
      )}
    </motion.div>
  );
}
