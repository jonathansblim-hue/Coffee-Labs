"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Order, LineItem } from "@/lib/types";

/* ---------- helpers ---------- */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

type Filter = "active" | "completed";

/* ---------- ticket component ---------- */

function Ticket({
  order,
  orderNumber,
  onStatusChange,
  now,
}: {
  order: Order;
  orderNumber: number;
  onStatusChange: (id: string, status: Order["status"]) => void;
  now: number;
}) {
  const items = order.items as LineItem[];
  const isUrgent =
    order.status === "pending" && now - new Date(order.created_at).getTime() > 5 * 60 * 1000;

  return (
    <div
      className={`bg-[var(--card)] border rounded-xl p-4 transition-all animate-fade-in ${
        isUrgent
          ? "border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.08)]"
          : order.status === "in_progress"
            ? "border-amber-500/20"
            : order.status === "completed"
              ? "border-green-500/15 opacity-75"
              : "border-[var(--border-light)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[var(--foreground)] tabular-nums">
            #{orderNumber}
          </span>
          {isUrgent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium uppercase tracking-wider">
              Waiting
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{timeAgo(order.created_at)}</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              order.status === "completed"
                ? "bg-green-500/15 text-green-400"
                : order.status === "in_progress"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-white/8 text-neutral-400"
            }`}
          >
            {order.status === "in_progress" ? "making" : order.status}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-2 mb-3">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="font-medium text-neutral-200">
                  {item.quantity > 1 && `${item.quantity}x `}
                  {item.name}
                </span>
                {(item.size || item.temperature) && (
                  <span className="text-neutral-500 ml-1">
                    {[item.size, item.temperature].filter(Boolean).join(", ")}
                  </span>
                )}
                {/* Customizations on new line */}
                <div className="text-xs text-neutral-500 mt-0.5 space-x-1">
                  {item.milk && <span className="inline-block">{item.milk} milk</span>}
                  {item.modifiers?.map((mod, j) => (
                    <span key={j} className="inline-block">· {mod}</span>
                  ))}
                  {item.sweetness && <span className="inline-block">· {item.sweetness}</span>}
                  {item.ice && <span className="inline-block">· {item.ice}</span>}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Total */}
      <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
        <span className="text-neutral-500">{items.length} item{items.length > 1 ? "s" : ""}</span>
        <span className="text-[var(--accent)] font-semibold">${order.total.toFixed(2)}</span>
      </div>

      {/* Actions */}
      {order.status !== "completed" && (
        <div className="mt-3 flex gap-2">
          {order.status === "pending" && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "in_progress")}
              className="flex-1 py-2.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-sm font-medium transition-all active:scale-[0.98]"
            >
              Start Making
            </button>
          )}
          <button
            type="button"
            onClick={() => onStatusChange(order.id, "completed")}
            className="flex-1 py-2.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 text-sm font-medium transition-all active:scale-[0.98]"
          >
            Done ✓
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function BaristaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("active");
  const [now, setNow] = useState(Date.now());
  const prevCountRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      // Play sound on new order
      const activeCount = list.filter(
        (o: Order) => o.status === "pending" || o.status === "in_progress"
      ).length;
      if (prevCountRef.current > 0 && activeCount > prevCountRef.current) {
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdGOBgoJ3cXJ7h4+Pk4uBd3Bwc3h7fHp3dXV3fIKGh4WAenNtbW91ent7enl4eHx/goSFhIF8d3RycXJzdXd5e3x8fH5/gYKCgYB+fHp5eHh5ent8fX5+f4CBgYGAf359fHt7e3x9fn9/gICAgH9+fn19fX1+fn9/f39/f39/f39+fn5+fn5+f39/f39/f39/f35+fn5+fn5+fn9/f39/f39/f39+fn5+");
          audio.volume = 0.3;
          await audio.play();
        } catch {
          // audio not available
        }
      }
      prevCountRef.current = activeCount;
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 4000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  // Update "time ago" every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const handleStatusChange = async (id: string, status: Order["status"]) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status, completed_at: status === "completed" ? new Date().toISOString() : o.completed_at }
          : o
      )
    );
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      fetchOrders(); // revert on failure
    }
  };

  const pending = orders.filter((o) => o.status === "pending");
  const inProgress = orders.filter((o) => o.status === "in_progress");
  const completed = orders.filter((o) => o.status === "completed");
  const activeOrders = [...pending, ...inProgress];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Order Queue
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Auto-refreshes every 4 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live count badges */}
          <div className="flex gap-2 text-xs">
            {pending.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-white/8 text-neutral-400">
                {pending.length} pending
              </span>
            )}
            {inProgress.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-amber-500/15 text-amber-400">
                {inProgress.length} making
              </span>
            )}
          </div>
          {/* Filter tabs */}
          <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === "active"
                  ? "bg-[var(--accent)] text-black"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Active ({activeOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === "completed"
                  ? "bg-green-500/20 text-green-400"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Done ({completed.length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-neutral-500 text-sm">Loading orders...</div>
        </div>
      ) : (
        <>
          {filter === "active" && (
            <>
              {activeOrders.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeOrders.map((o, idx) => (
                    <Ticket
                      key={o.id}
                      order={o}
                      orderNumber={orders.length - orders.indexOf(o)}
                      onStatusChange={handleStatusChange}
                      now={now}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-4xl mb-3">✨</span>
                  <p className="text-neutral-400 font-medium">All caught up!</p>
                  <p className="text-neutral-600 text-sm mt-1">
                    No pending orders. New ones will appear here automatically.
                  </p>
                </div>
              )}
            </>
          )}

          {filter === "completed" && (
            <>
              {completed.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {completed.slice(0, 20).map((o) => (
                    <Ticket
                      key={o.id}
                      order={o}
                      orderNumber={orders.length - orders.indexOf(o)}
                      onStatusChange={handleStatusChange}
                      now={now}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-neutral-500 text-sm">No completed orders yet today.</p>
                </div>
              )}
              {completed.length > 20 && (
                <p className="text-neutral-600 text-sm mt-4 text-center">
                  Showing 20 of {completed.length} completed orders
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
