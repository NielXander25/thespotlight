"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { MESSAGE_RETENTION_DAYS, daysUntilExpiry } from "@/lib/messages";
import type { Message, MessageChannel } from "@/lib/types";

type ChannelFilter = "all" | MessageChannel;

const FILTERS: { value: ChannelFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "founder", label: "Talk to the Founder" },
  { value: "anonymous", label: "Anonymous" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageCard({
  message,
  onToggleRead,
  onDelete,
}: {
  message: Message;
  onToggleRead: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const daysLeft = daysUntilExpiry(message.expires_at);
  const isFounder = message.channel === "founder";

  return (
    <div
      className={`rounded-2xl border bg-surface/60 p-5 ${
        message.is_read ? "border-line/50" : "border-brand/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-beam">
            {isFounder ? message.sender_name || "No name given" : "Anonymous"}
          </p>
          {isFounder && message.sender_contact && (
            <p className="truncate text-xs text-mist">{message.sender_contact}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!message.is_read && (
            <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
              New
            </span>
          )}
          <span className="rounded-full bg-surface2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-mist">
            {isFounder ? "Founder" : "Anonymous"}
          </span>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-beam/90">
        {message.body}
      </p>

      <div className="mt-4 flex items-center justify-between text-[11px]">
        <span className="text-mist/70">{formatDate(message.created_at)}</span>
        <span className={daysLeft <= 3 ? "text-amber-300" : "text-mist/70"}>
          {daysLeft === 0 ? "Deletes today" : `Deletes in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line/60 pt-3">
        <button
          onClick={onToggleRead}
          className="rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-beam transition-colors hover:bg-brand/20"
        >
          {message.is_read ? "Mark unread" : "Mark read"}
        </button>
        {confirmingDelete ? (
          <>
            <button
              onClick={onDelete}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-mist"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-mist hover:text-red-300"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFounder, setIsFounder] = useState(false);
  const [filter, setFilter] = useState<ChannelFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      if (!res.ok) throw new Error("failed to fetch messages");
      const body = await res.json();
      setMessages(body.messages);
      setIsFounder(body.account === "founder");
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function toggleRead(message: Message) {
    const isRead = !message.is_read;
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, is_read: isRead } : m)));
    const res = await fetch(`/api/admin/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: isRead }),
    });
    if (!res.ok) fetchMessages();
  }

  async function deleteMessage(id: string) {
    const prev = messages;
    setMessages((current) => current.filter((m) => m.id !== id));
    const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    if (!res.ok) setMessages(prev);
  }

  const visible = filter === "all" ? messages : messages.filter((m) => m.channel === filter);
  const unread = messages.filter((m) => !m.is_read).length;
  const founderCount = messages.filter((m) => m.channel === "founder").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-beam">Messages</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist">
        Every message stays here for {MESSAGE_RETENTION_DAYS} days from when it was sent,
        then is permanently deleted. Deleting one yourself removes it immediately.
        {!isFounder && " Talk to the Founder messages are only visible when signed in as the founder."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Messages" value={messages.length} />
        <StatCard label="Unread" value={unread} />
        <StatCard label="To the founder" value={isFounder ? founderCount : "—"} />
      </div>

      <div className={`mt-6 flex-wrap gap-2 ${isFounder ? "flex" : "hidden"}`}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === f.value ? "bg-brand/15 text-brand-light" : "bg-surface/60 text-mist hover:text-beam"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && messages.length === 0 && <p className="text-sm text-mist">Loading messages…</p>}
        {loadError && (
          <p className="text-sm text-red-300">
            Couldn&rsquo;t load messages. Has the messages migration been run?
          </p>
        )}
        {!loading && !loadError && visible.length === 0 && (
          <p className="text-sm text-mist">No messages yet.</p>
        )}
        {visible.map((m) => (
          <MessageCard
            key={m.id}
            message={m}
            onToggleRead={() => toggleRead(m)}
            onDelete={() => deleteMessage(m.id)}
          />
        ))}
      </div>
    </div>
  );
}
