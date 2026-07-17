"use client";

import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/lib/types";
import { EmptyState, Feedback, LoadingBlock, PageIntro } from "@/components/ui";

export function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ notifications: Notification[] }>("/candidate/notifications")
      .then((response) => setItems(response.notifications))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    try {
      const response = await api<{ notification: Notification }>(
        `/candidate/notifications/${id}/read`,
        { method: "PATCH" },
      );
      setItems((current) => current.map((item) => item.id === id ? response.notification : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Update failed");
    }
  }

  if (loading) return <LoadingBlock label="Loading notifications" />;

  return (
    <>
      <PageIntro title="Notifications" body="Application, interview, and account updates from Pravaron Technologies Careers." />
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {items.length ? (
        <div className="notification-list">
          {items.map((item) => (
            <article className={item.read_at ? "read" : "unread"} key={item.id}>
              <MailCheck size={21} />
              <div>
                <strong>{item.subject}</strong>
                <p>{item.message}</p>
                <small>{formatDate(item.created_at, true)} | {item.channel}</small>
              </div>
              {!item.read_at ? (
                <button className="button button-ghost button-small" onClick={() => void markRead(item.id)}>
                  Mark read
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : <EmptyState title="No notifications" body="New hiring updates will appear here." />}
    </>
  );
}
