"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { Task } from "@/components/TaskList";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "medium", label: "Medium", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "high", label: "High", color: "text-red-600 bg-red-50 border-red-200" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "medium", label: "Medium", color: "text-violet-600 bg-violet-50 border-violet-200" },
  { value: "hard", label: "Hard", color: "text-rose-600 bg-rose-50 border-rose-200" },
] as const;

export default function TaskModal({ open, onClose, onCreated }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setDeadline("");
    setPriority("medium");
    setDifficulty("medium");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          difficulty,
          deadline: deadline || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create task"); return; }

      onCreated(data.task);
      handleClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-stone-900">
                  New Task
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    placeholder="What needs to be done?"
                    autoFocus
                    className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 transition focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Deadline{" "}
                    <span className="text-stone-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 transition focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:outline-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Priority
                  </label>
                  <div className="mt-2 flex gap-2">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                          priority === opt.value
                            ? opt.color + " ring-2 ring-offset-1 ring-accent/40"
                            : "border-stone-200 bg-white text-stone-400 hover:bg-stone-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    Difficulty
                  </label>
                  <div className="mt-2 flex gap-2">
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDifficulty(opt.value)}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                          difficulty === opt.value
                            ? opt.color + " ring-2 ring-offset-1 ring-accent/40"
                            : "border-stone-200 bg-white text-stone-400 hover:bg-stone-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-2xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-accent py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
                  >
                    {loading ? "Creating…" : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
