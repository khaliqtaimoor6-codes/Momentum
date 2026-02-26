"use client";

import { useState, useTransition } from "react";
import PageWrapper from "@/components/PageWrapper";
import { motion } from "framer-motion";
import {
  UserCircleIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface WeeklyStats {
  totalTasksCompleted: number;
  totalPlannedTasks: number;
  totalFocusMinutes: number;
}

interface ProfileClientProps {
  name: string | null;
  username: string | null;
  email: string | null;
  bio: string | null;
  image: string | null;
  createdAt: string;
  weeklyStats: WeeklyStats | null;
  isOwnProfile: boolean;
}

export default function ProfileClient({
  name,
  username,
  email,
  bio: initialBio,
  image,
  createdAt,
  weeklyStats,
  isOwnProfile,
}: ProfileClientProps) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const completionPct =
    weeklyStats && weeklyStats.totalPlannedTasks > 0
      ? Math.round(
          (weeklyStats.totalTasksCompleted / weeklyStats.totalPlannedTasks) * 100,
        )
      : 0;

  const handleSaveBio = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bio: draft }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Failed to save");
          return;
        }
        setBio(draft);
        setEditing(false);
      } catch {
        setError("Something went wrong");
      }
    });
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {image ? (
              <img
                src={image}
                alt={name ?? "User"}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-accent/30"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light ring-2 ring-accent/30">
                <UserCircleIcon className="h-12 w-12 text-accent" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                {name ?? "Unnamed User"}
              </h1>
              {username && (
                <p className="text-sm font-medium text-accent">@{username}</p>
              )}
              {isOwnProfile && email && (
                <p className="mt-1 text-sm text-stone-400">{email}</p>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                <span>Member since {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                Bio
              </p>
              {isOwnProfile && !editing && (
                <button
                  onClick={() => { setDraft(bio); setEditing(true); }}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                >
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Write something about yourself…"
                  className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">{draft.length}/300</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 transition hover:bg-stone-100"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveBio}
                      disabled={isPending}
                      className="flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      {isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-600">
                {bio.trim() ? bio : (
                  <span className="italic text-stone-400">
                    {isOwnProfile ? "No bio yet — click Edit to add one." : "No bio."}
                  </span>
                )}
              </p>
            )}
          </div>
        </motion.div>

        {/* Weekly Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            This Week
          </p>

          {weeklyStats ? (
            <>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700">Task Completion</span>
                  <span className="font-bold text-stone-900">{completionPct}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(completionPct, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>

              {/* Stat pills */}
              <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Completed", value: weeklyStats.totalTasksCompleted },
                  { label: "Planned", value: weeklyStats.totalPlannedTasks },
                  { label: "Focus min", value: weeklyStats.totalFocusMinutes },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-accent-light/50 py-4">
                    <p className="text-2xl font-bold text-stone-900">{s.value}</p>
                    <p className="mt-0.5 text-xs text-stone-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-stone-400 italic">No activity this week yet.</p>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
