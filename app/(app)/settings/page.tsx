"use client";

import { useTheme } from "@/context/ThemeContext";
import PageWrapper from "@/components/PageWrapper";
import { motion } from "framer-motion";
import {
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage your account preferences.</p>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6 rounded-2xl bg-card border border-card-border p-6 shadow-md"
      >
        <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        <p className="mt-0.5 text-xs text-muted">Choose your preferred color scheme.</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? (
              <MoonIcon className="h-5 w-5 text-accent" />
            ) : (
              <SunIcon className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDark ? "Dark Mode" : "Light Mode"}
              </p>
              <p className="text-xs text-muted">
                {isDark
                  ? "Easy on the eyes in low-light environments"
                  : "Classic bright interface for daytime use"}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-background ${
              isDark ? "bg-accent" : "bg-muted-light/40"
            }`}
            role="switch"
            aria-checked={isDark}
          >
            <span className="sr-only">Toggle dark mode</span>
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg ring-0 ${
                isDark ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Theme preview cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => !isDark || toggleTheme()}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              !isDark
                ? "border-accent bg-accent-light/50 shadow-sm"
                : "border-card-border hover:border-muted-light/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <SunIcon className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-foreground">Light</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-[#f8f6f1]" />
              <div className="h-2 w-3/4 rounded-full bg-[#e8eef7]" />
              <div className="h-2 w-1/2 rounded-full bg-[#6C8EBF]" />
            </div>
          </button>

          <button
            onClick={() => isDark || toggleTheme()}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              isDark
                ? "border-accent bg-accent-light/50 shadow-sm"
                : "border-card-border hover:border-muted-light/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MoonIcon className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-foreground">Dark</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-[#0f0e17]" />
              <div className="h-2 w-3/4 rounded-full bg-[#1a1a2e]" />
              <div className="h-2 w-1/2 rounded-full bg-[#6C8EBF]" />
            </div>
          </button>
        </div>
      </motion.div>

      {/* More settings placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mt-4 rounded-2xl bg-card border border-card-border p-6 shadow-md"
      >
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        <p className="mt-0.5 text-xs text-muted">Coming soon — timer alerts, friend activity, and more.</p>
      </motion.div>
    </PageWrapper>
  );
}
