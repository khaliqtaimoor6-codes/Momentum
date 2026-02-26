"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import TaskModal from "@/components/TaskModal";

export interface Task {
  id: string;
  title: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  difficulty: "easy" | "medium" | "hard";
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface TaskListProps {
  initialTasks: Task[];
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  low:    "text-success-hover bg-success-light border-success/40",
  medium: "text-accent-dark bg-accent-light border-accent/30",
  high:   "text-danger-hover bg-danger-light border-danger/40",
};

const DIFFICULTY_STYLES: Record<Task["difficulty"], string> = {
  easy:   "text-sky-700 bg-sky-50 border-sky-200",
  medium: "text-violet-700 bg-violet-50 border-violet-200",
  hard:   "text-danger-hover bg-danger-light border-danger/30",
};

function formatDeadline(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff}d`;
}

export default function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleComplete = async (task: Task) => {
    if (task.status === "completed") return;
    setLoadingId(task.id);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: "completed", completedAt: new Date().toISOString() } : t,
      ),
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) {
        // Revert on failure
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? task : t)),
        );
      }
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    const prev = tasks;

    // Optimistic removal
    setTasks((t) => t.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) setTasks(prev); // Revert
    } catch {
      setTasks(prev);
    } finally {
      setLoadingId(null);
    }
  };

  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");

  return (
    <>
      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <div className="rounded-2xl bg-white p-6 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-stone-900">
              My Tasks
            </h3>
            <p className="mt-0.5 text-xs text-stone-400">
              {pending.length} pending · {completed.length} completed
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
          >
            <PlusIcon className="h-4 w-4" />
            New Task
          </motion.button>
        </div>

        {/* Task list */}
        <div className="mt-5 space-y-2">
          <AnimatePresence initial={false}>
            {tasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center"
              >
                <CheckCircleIcon className="mx-auto h-10 w-10 text-stone-200" />
                <p className="mt-2 text-sm text-stone-400">
                  No tasks yet. Create one to get started!
                </p>
              </motion.div>
            )}

            {tasks.map((task) => {
              const isCompleted = task.status === "completed";
              const isLoading = loadingId === task.id;
              const isOverdue =
                !isCompleted &&
                task.deadline &&
                new Date(task.deadline) < new Date();

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.005 }}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition ${
                    isCompleted
                      ? "border-stone-100 bg-stone-50 opacity-60"
                      : "border-stone-100 bg-white hover:border-accent/30 hover:shadow-sm"
                  }`}
                >
                  {/* Complete button */}
                  <button
                    onClick={() => handleComplete(task)}
                    disabled={isCompleted || isLoading}
                    className="mt-0.5 flex-shrink-0 text-stone-300 transition hover:text-accent disabled:cursor-default"
                    title={isCompleted ? "Completed" : "Mark complete"}
                  >
                    {isCompleted ? (
                      <CheckCircleSolid className="h-5 w-5 text-accent" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5" />
                    )}
                  </button>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        isCompleted
                          ? "line-through text-stone-400"
                          : "text-stone-800"
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {/* Priority badge */}
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[task.priority]}`}
                      >
                        {task.priority}
                      </span>

                      {/* Difficulty badge */}
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${DIFFICULTY_STYLES[task.difficulty]}`}
                      >
                        {task.difficulty}
                      </span>

                      {/* Deadline */}
                      {task.deadline && (
                        <span
                          className={`flex items-center gap-0.5 text-[10px] font-medium ${
                            isOverdue ? "text-red-500" : "text-stone-400"
                          }`}
                        >
                          <ClockIcon className="h-3 w-3" />
                          {formatDeadline(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={isLoading}
                    className="flex-shrink-0 mt-0.5 rounded-lg p-1 text-stone-300 transition hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
                    title="Delete task"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
