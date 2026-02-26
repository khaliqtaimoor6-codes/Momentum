"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TrophyIcon } from "@heroicons/react/24/solid";

export interface LeaderboardEntry {
  id: string;
  name: string;
  image?: string | null;
  tasksCompleted: number;
  focusMinutes: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

function getInitial(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  const sorted = [...entries].sort((a, b) => {
    if (b.tasksCompleted !== a.tasksCompleted) return b.tasksCompleted - a.tasksCompleted;
    return b.focusMinutes - a.focusMinutes;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
    >
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Leaderboard</h2>

      {sorted.length === 0 && (
        <p className="text-sm text-stone-400">No friends yet — add some to compete!</p>
      )}

      {sorted.length > 0 && (
        <>
          {/* Table header */}
          <div className="mb-2 grid grid-cols-[2rem_1fr_4rem_4rem] items-center gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-stone-400">
            <span>#</span>
            <span>Name</span>
            <span className="text-right">Tasks</span>
            <span className="text-right">Mins</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {sorted.map((entry, i) => {
              const isFirst = i === 0;
              const isMe = entry.isCurrentUser;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className={`grid grid-cols-[2rem_1fr_4rem_4rem] items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                    isFirst
                      ? "border border-accent/30 bg-gradient-to-r from-accent-light to-[#dce7f4] shadow-[0_0_18px_rgba(108,142,191,0.2)]"
                      : isMe
                      ? "border border-accent/20 bg-accent-light/50"
                      : "hover:bg-stone-50"
                  }`}
                >
                  {/* Rank badge */}
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isFirst
                        ? "bg-gradient-to-br from-accent to-accent-hover text-white shadow-sm"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {isFirst ? <TrophyIcon className="h-4 w-4" /> : i + 1}
                  </span>

                  {/* Avatar + Name */}
                  <div className="flex min-w-0 items-center gap-2.5">
                    {entry.image ? (
                      <Image
                        src={entry.image}
                        alt={entry.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
                        {getInitial(entry.name || "?")}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-800">
                        {entry.name || "Unknown"}
                        {isMe && (
                          <span className="ml-1.5 rounded-full bg-accent-light px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                            you
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Tasks */}
                  <p className={`text-right text-sm font-semibold ${
                    isFirst ? "text-accent-dark" : "text-stone-700"
                  }`}>
                    {entry.tasksCompleted}
                  </p>

                  {/* Minutes */}
                  <p className="text-right text-sm text-stone-400">
                    {entry.focusMinutes}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
