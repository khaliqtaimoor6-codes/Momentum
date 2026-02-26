"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "@/components/PageWrapper";
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  CheckIcon,
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
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  isFriend: boolean;
  isPending: boolean;
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
  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentUsernames, setSentUsernames] = useState<Set<string>>(new Set());
  const [sendLoadingId, setSendLoadingId] = useState<string | null>(null);
  const [sendMsg, setSendMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending requests (client-side for optimistic accept)
  const [pending, setPending] = useState<PendingRequest[]>(initialPending);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const router = useRouter();

  // Live autocomplete search with debounce
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data.users) {
        setSuggestions(data.users);
        setShowDropdown(data.users.length > 0);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSendMsg(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value.trim());
    }, 300);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setSendMsg(null);
  };

  // Send friend request
  const handleSend = async (user: SearchResult) => {
    const targetQuery = user.username ?? user.name ?? "";
    setSendLoadingId(user.id);
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
        setSendMsg({ text: `Request sent to ${data.to}!`, ok: true });
        setSentUsernames((prev) => new Set(prev).add(user.id));
        // Update the suggestion to show pending status
        setSuggestions((prev) =>
          prev.map((s) => (s.id === user.id ? { ...s, isPending: true } : s))
        );
      }
    } catch {
      setSendMsg({ text: "Something went wrong", ok: false });
    } finally {
      setSendLoadingId(null);
    }
  };

  // Accept incoming request
  const handleAccept = async (requestId: string) => {
    setAcceptLoading(requestId);
    setPending((prev) => prev.filter((r) => r.id !== requestId));

    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      startTransition(() => router.refresh());
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

      {/* Find & Send Request */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6 rounded-2xl bg-white p-6 shadow-md"
      >
        <h2 className="text-sm font-semibold text-stone-700">Find a Friend</h2>
        <p className="mt-0.5 text-xs text-stone-400">
          Start typing a name, @username, or email to find people
        </p>

        {/* Search bar with autocomplete */}
        <div className="relative mt-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="Search by name, @username, or email..."
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
            {searchLoading && (
              <span className="absolute right-9 top-1/2 -translate-y-1/2">
                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </span>
            )}
          </div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-lg"
              >
                {suggestions.map((user) => {
                  const alreadySent = sentUsernames.has(user.id) || user.isPending;
                  const isFriend = user.isFriend;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-stone-50 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={user} size={36} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-900 truncate">
                            {user.name ?? user.username ?? "User"}
                          </p>
                          {user.username && (
                            <p className="text-xs font-medium text-accent truncate">
                              @{user.username}
                            </p>
                          )}
                          {user.bio && (
                            <p className="mt-0.5 text-xs text-stone-400 truncate">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="flex-shrink-0">
                        {isFriend ? (
                          <span className="flex items-center gap-1 rounded-2xl bg-success-light px-3 py-1.5 text-xs font-medium text-success whitespace-nowrap">
                            <CheckIcon className="h-3.5 w-3.5" /> Friends
                          </span>
                        ) : alreadySent ? (
                          <span className="flex items-center gap-1 rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 whitespace-nowrap">
                            <CheckIcon className="h-3.5 w-3.5" /> Pending
                          </span>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleSend(user)}
                            disabled={sendLoadingId === user.id}
                            className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-50 whitespace-nowrap"
                          >
                            <PaperAirplaneIcon className="h-3.5 w-3.5" />
                            {sendLoadingId === user.id ? "Sending..." : "Add Friend"}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results message */}
          {!showDropdown && query.trim().length >= 1 && !searchLoading && suggestions.length === 0 && (
            <p className="mt-2 text-xs text-stone-400">
              No users found matching &quot;{query.trim()}&quot;
            </p>
          )}
        </div>

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

      {/* Pending Incoming Requests */}
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

      {/* Friends List */}
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
            No friends yet — search for someone above to get started.
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
