"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, LineItem } from "@/lib/types";

function Ticket({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: Order["status"]) => void;
}) {
  const items = order.items as LineItem[];
  return (
    <div className="bg-[var(--card)] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500 font-mono">
          #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleTimeString()}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            order.status === "completed"
              ? "bg-green-500/20 text-green-400"
              : order.status === "in_progress"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/10 text-neutral-400"
          }`}
        >
          {order.status.replace("_", " ")}
        </span>
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span>
              {item.quantity}x {item.name}
              {item.size && ` (${item.size})`}
              {item.temperature && ` ${item.temperature}`}
              {item.milk && `, ${item.milk}`}
              {item.modifiers?.length ? ` — ${item.modifiers.join(", ")}` : ""}
              {item.sweetness && ` · ${item.sweetness}`}
              {item.ice && ` · ${item.ice}`}
            </span>
            <span className="text-[var(--accent)] tabular-nums">${item.lineTotal.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
        <span className="font-medium">Total</span>
        <span className="text-[var(--accent)] font-semibold">${order.total.toFixed(2)}</span>
      </div>
      {order.status !== "completed" && (
        <div className="mt-3 flex gap-2">
          {order.status === "pending" && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "in_progress")}
              className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium"
            >
              In progress
            </button>
          )}
          {(order.status === "pending" || order.status === "in_progress") && (
            <button
              type="button"
              onClick={() => onStatusChange(order.id, "completed")}
              className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium"
            >
              Completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BaristaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 5000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const handleStatusChange = async (id: string, status: Order["status"]) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch {
      // keep UI state
    }
  };

  const pending = orders.filter((o) => o.status === "pending");
  const inProgress = orders.filter((o) => o.status === "in_progress");
  const completed = orders.filter((o) => o.status === "completed");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-[var(--accent)] mb-2">
        Order tickets
      </h1>
      <p className="text-neutral-400 text-sm mb-6">
        Mark tickets as in progress or completed. List refreshes every 5 seconds.
      </p>

      {loading ? (
        <p className="text-neutral-500">Loading orders...</p>
      ) : (
        <div className="space-y-6">
          {(pending.length > 0 || inProgress.length > 0) && (
            <section>
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Pending & in progress
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {pending.map((o) => (
                  <Ticket
                    key={o.id}
                    order={o}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {inProgress.map((o) => (
                  <Ticket
                    key={o.id}
                    order={o}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Completed
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {completed.slice(0, 10).map((o) => (
                  <Ticket
                    key={o.id}
                    order={o}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
              {completed.length > 10 && (
                <p className="text-neutral-500 text-sm mt-2">
                  +{completed.length - 10} older completed
                </p>
              )}
            </section>
          )}
          {orders.length === 0 && (
            <p className="text-neutral-500">No orders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
