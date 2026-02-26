"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  CheckIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface FriendUser {
  name: string | null;
  username: string | null;
  image: string | null;
}

interface PendingRequest {
  id: string;
  sender: FriendUser;
}

interface SearchResult {
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
}

interface FriendsClientProps {
  friends: FriendUser[];
  pendingRequests: PendingRequest[];
}

function Avatar({ user, size = 36 }: { user: FriendUser | SearchResult; size?: number }) {
  const initial = (user.name ?? user.username ?? "?")[0].toUpperCase();
  return user.image ? (
    <Image
      src={user.image}
      alt={user.name ?? "User"}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full bg-accent-light text-xs font-bold text-accent-dark"
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}

export default function FriendsClient({
  friends,
  pendingRequests: initialPending,
}: FriendsClientProps) {
  // â”€â”€ Search state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sentUsernames, setSentUsernames] = useState<Set<string>>(new Set());
  const [sendLoading, setSendLoading] = useState(false);
  const [sendMsg, setSendMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // â”€â”€ Pending requests (client-side for accept optimistic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [pending, setPending] = useState<PendingRequest[]>(initialPending);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const router = useRouter();

  // â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) { setSearchError("Enter at least 2 characters"); return; }

    setSearchError("");
    setSearchResult(null);
    setSendMsg(null);
    setSearchLoading(true);

    try {
      const res = await fetch(`/api/users/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setSearchError(data.error ?? "Search failed"); return; }

      const users: SearchResult[] = data.users;
      if (users.length === 0) {
        setSearchError("No user found with that username or email.");
      } else {
        setSearchResult(users[0]); // show the top match
      }
    } catch {
      setSearchError("Something went wrong");
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResult(null);
    setSearchError("");
    setSendMsg(null);
  };

  // â”€â”€ Send request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSend = async (targetQuery: string) => {
    setSendLoading(true);
    setSendMsg(null);

    try {
      const res = await fetch("/api/friends/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSendMsg({ text: data.error ?? "Failed to send", ok: false });
      } else {
        setSendMsg({ text: `Request sent to ${data.to}! ðŸŽ‰`, ok: true });
        setSentUsernames((prev) => new Set(prev).add(targetQuery.toLowerCase()));
      }
    } catch {
      setSendMsg({ text: "Something went wrong", ok: false });
    } finally {
      setSendLoading(false);
    }
  };

  // â”€â”€ Accept request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAccept = async (requestId: string) => {
    setAcceptLoading(requestId);

    // Optimistic removal
    setPending((prev) => prev.filter((r) => r.id !== requestId));

    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (!res.ok) {
        // Revert â€” just refresh so the real state is shown
        startTransition(() => router.refresh());
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      startTransition(() => router.refresh());
    } finally {
      setAcceptLoading(null);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Friends</h1>
      <p className="mt-1 text-sm text-stone-500">
        Add friends and compete on the weekly leaderboard.
      </p>

      {/* â”€â”€ Find & Send Request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6 rounded-2xl bg-white p-6 shadow-md"
      >
        <h2 className="text-sm font-semibold text-stone-700">Find a Friend</h2>
        <p className="mt-0.5 text-xs text-stone-400">
          Search by @username or email address
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchError(""); }}
              placeholder="@username or email"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-9 text-sm text-stone-800 placeholder:text-stone-400 transition focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={searchLoading || query.trim().length < 2}
            className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-40"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            {searchLoading ? "Searchingâ€¦" : "Search"}
          </motion.button>
        </form>

        {/* Search error */}
        <AnimatePresence>
          {searchError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-xs text-red-500"
            >
              {searchError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Search result card */}
        <AnimatePresence>
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="mt-4 flex items-center justify-between rounded-2xl border border-accent/20 bg-accent-light/40 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar user={searchResult} size={40} />
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {searchResult.name ?? searchResult.username ?? "User"}
                  </p>
                  {searchResult.username && (
                    <p className="text-xs font-medium text-accent">
                      @{searchResult.username}
                    </p>
                  )}
                  {searchResult.bio && (
                    <p className="mt-0.5 text-xs text-stone-400 line-clamp-1">
                      {searchResult.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Send button */}
              {sentUsernames.has((searchResult.username ?? "").toLowerCase()) ? (
                <span className="flex items-center gap-1 rounded-2xl bg-success-light px-3 py-1.5 text-xs font-medium text-success">
                  <CheckIcon className="h-3.5 w-3.5" /> Sent
                </span>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    handleSend(searchResult.username ?? searchResult.name ?? "")
                  }
                  disabled={sendLoading}
                  className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                  {sendLoading ? "Sendingâ€¦" : "Send Request"}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send feedback */}
        <AnimatePresence>
          {sendMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-2 text-xs font-medium ${sendMsg.ok ? "text-emerald-600" : "text-red-500"}`}
            >
              {sendMsg.text}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* â”€â”€ Pending Incoming Requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mt-6 rounded-2xl bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-700">
                Pending Requests
              </h2>
              <span className="rounded-full bg-danger-light px-2 py-0.5 text-xs font-bold text-danger">
                {pending.length}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {pending.map((req) => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar user={req.sender} size={36} />
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {req.sender.name ?? req.sender.username ?? "Unknown"}
                        </p>
                        {req.sender.username && (
                          <p className="text-xs font-medium text-accent">
                            @{req.sender.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={acceptLoading === req.id}
                      className="flex items-center gap-1.5 rounded-2xl bg-success-light px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/20 transition disabled:opacity-50"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Accept
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Friends List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mt-6 rounded-2xl bg-white p-6 shadow-md"
      >
        <h2 className="text-sm font-semibold text-stone-700">
          Your Friends{" "}
          <span className="font-normal text-stone-400">({friends.length})</span>
        </h2>

        {friends.length === 0 ? (
          <p className="mt-3 text-sm italic text-stone-400">
            No friends yet â€” search for someone above to get started.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {friends.map((friend) => (
              <motion.div
                key={friend.username ?? friend.name ?? Math.random().toString()}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 rounded-xl border border-stone-100 px-4 py-3 transition hover:shadow-md"
              >
                <Avatar user={friend} size={36} />
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {friend.name ?? friend.username ?? "Unknown"}
                  </p>
                  {friend.username && (
                    <p className="text-xs font-medium text-accent">
                      @{friend.username}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
