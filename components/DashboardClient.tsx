"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import StatsCard from "@/components/StatsCard";
import Leaderboard, { LeaderboardEntry } from "@/components/Leaderboard";
import TaskList, { type Task } from "@/components/TaskList";
import WeeklyResetCelebration from "@/components/WeeklyResetCelebration";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

interface DashboardClientProps {
  userName: string;
  userUsername: string | null;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  totalPlannedTasks: number;
  leaderboard: LeaderboardEntry[];
  tasks: Task[];
}

export default function DashboardClient({
  userName,
  userUsername,
  totalTasksCompleted,
  totalFocusMinutes,
  totalPlannedTasks,
  leaderboard,
  tasks,
}: DashboardClientProps) {
  const completionPercent =
    totalPlannedTasks > 0
      ? Math.round((totalTasksCompleted / totalPlannedTasks) * 100)
      : 0;

  // Fetch last week recap for celebration
  const [lastWeekData, setLastWeekData] = useState<{
    winner: { name: string; tasksCompleted: number; focusMinutes: number; isCurrentUser: boolean } | null;
    yourStats: { tasksCompleted: number; focusMinutes: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/weekly-recap")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setLastWeekData({ winner: data.winner, yourStats: data.yourStats });
      })
      .catch(() => {});
  }, []);

  return (
    <PageWrapper>
      {/* Weekly Reset Celebration */}
      <WeeklyResetCelebration lastWeekData={lastWeekData} />
      {/* Top Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(108,142,191,0.15)]"
        >
          <p className="text-sm font-medium text-stone-400">Good to see you</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            Hello, {userName} 👋
          </h2>
          {userUsername && (
            <p className="mt-0.5 text-sm font-medium text-accent">@{userUsername}</p>
          )}
          <p className="mt-2 text-sm text-stone-500">
            Stay consistent — small steps compound into big results.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex items-center rounded-2xl border border-stone-100 bg-stone-50 px-4 py-2 text-xs font-medium text-stone-500 transition hover:bg-accent-light hover:border-accent/30 hover:text-accent-dark"
          >
            View Profile →
          </Link>
        </motion.div>

        {/* Weekly Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(108,142,191,0.15)]"
        >
          <p className="text-sm font-medium text-stone-400">Weekly Progress</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
            {completionPercent}%
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(completionPercent, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-400">
            {totalTasksCompleted} of {totalPlannedTasks} tasks completed this week
          </p>
        </motion.div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Tasks Completed"
          value={totalTasksCompleted}
          icon={<CheckCircleIcon className="h-5 w-5" />}
          progress={completionPercent}
          delay={0.15}
        />
        <StatsCard
          title="Focus Minutes"
          value={totalFocusMinutes}
          icon={<ClockIcon className="h-5 w-5" />}
          delay={0.25}
        />
        <StatsCard
          title="Planned Tasks"
          value={totalPlannedTasks}
          icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
          delay={0.35}
        />
      </div>

      {/* Leaderboard */}
      <div className="mt-6">
        <Leaderboard entries={leaderboard} />
      </div>

      {/* Tasks */}
      <div className="mt-6">
        <TaskList initialTasks={tasks} />
      </div>
    </PageWrapper>
  );
}
