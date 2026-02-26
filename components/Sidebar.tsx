"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  UserGroupIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/focus", label: "Focus", icon: ClockIcon },
  { href: "/friends", label: "Friends", icon: UserGroupIcon },
  { href: "/profile", label: "Profile", icon: UserCircleIcon },
  { href: "/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch("/api/friends/requests")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setPendingCount(d.count); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const navContent = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <motion.div
            key={href}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
          >
            <Link
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-accent-light text-accent-dark shadow-sm"
                  : "text-stone-500 hover:bg-[#f0f4fa] hover:text-accent-dark"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? "text-accent" : ""}`} />
              {label}
              {href === "/friends" && pendingCount > 0 && (
                <span className="ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: NAV_ITEMS.length * 0.06 + 0.06, ease: "easeOut" }}
      >
        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-stone-400 transition-all duration-200 hover:bg-danger-light hover:text-danger"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </motion.div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <div className="flex grow flex-col gap-6 border-r border-stone-100 bg-white/90 px-5 py-8 backdrop-blur-md">
          <Link href="/dashboard" className="px-2">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h1 className="text-2xl font-bold tracking-tight text-accent-dark">
                Momentum
              </h1>
              <p className="mt-0.5 text-xs font-medium text-accent/70">Stay focused, stay sharp</p>
            </motion.div>
          </Link>
          {navContent}
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-2xl bg-white/90 p-2 shadow-md backdrop-blur-sm transition hover:shadow-lg hover:bg-accent-light"
        >
          <Bars3Icon className="h-6 w-6 text-accent-dark" />
        </button>
      </div>

      {/* Mobile overlay + sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 px-5 py-8 shadow-2xl backdrop-blur-md lg:hidden"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-2 mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-accent-dark">
                  Momentum
                </h1>
                <button onClick={() => setMobileOpen(false)}>
                  <XMarkIcon className="h-6 w-6 text-accent" />
                </button>
              </div>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
