"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, LineItem } from "@/lib/types";

function useOrders() {
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
  }, [fetchOrders]);
  return { orders, loading, refetch: fetchOrders };
}

export default function OwnerPage() {
  const { orders, loading, refetch } = useOrders();
  const [exporting, setExporting] = useState(false);

  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const completedToday = ordersToday.filter((o) => o.status === "completed");
  const revenueToday = completedToday.reduce((s, o) => s + Number(o.total), 0);

  const allItems = orders.flatMap((o) => (o.items as LineItem[]).map((i) => ({ ...i, orderId: o.id, createdAt: o.created_at })));
  const itemCounts: Record<string, number> = {};
  allItems.forEach((i) => {
    const key = i.name + (i.size ? ` (${i.size})` : "");
    itemCounts[key] = (itemCounts[key] || 0) + i.quantity;
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const byHour: Record<number, number> = {};
  orders.forEach((o) => {
    const h = new Date(o.created_at).getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  });
  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const rows = [
        ["id", "status", "total", "created_at", "completed_at", "items_json"],
        ...orders.map((o) => [
          o.id,
          o.status,
          o.total,
          o.created_at,
          o.completed_at ?? "",
          JSON.stringify(o.items),
        ]),
      ];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [orders]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[var(--accent)] mb-2">
        Owner dashboard
      </h1>
      <p className="text-neutral-400 text-sm mb-6">
        Daily pulse and order history. Export CSV for records.
      </p>

      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="bg-[var(--card)] border border-white/10 rounded-xl p-4">
              <div className="text-neutral-500 text-sm">Orders today</div>
              <div className="text-2xl font-semibold text-[var(--accent)] mt-1">
                {ordersToday.length}
              </div>
            </div>
            <div className="bg-[var(--card)] border border-white/10 rounded-xl p-4">
              <div className="text-neutral-500 text-sm">Completed today</div>
              <div className="text-2xl font-semibold text-green-400 mt-1">
                {completedToday.length}
              </div>
            </div>
            <div className="bg-[var(--card)] border border-white/10 rounded-xl p-4">
              <div className="text-neutral-500 text-sm">Revenue today</div>
              <div className="text-2xl font-semibold text-[var(--accent)] mt-1">
                ${revenueToday.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div className="bg-[var(--card)] border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-medium text-neutral-400 mb-3">
                Top items (all time)
              </h2>
              <ul className="space-y-2 text-sm">
                {topItems.map(([name, qty]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="text-[var(--accent)]">{qty}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[var(--card)] border border-white/10 rounded-xl p-4">
              <h2 className="text-sm font-medium text-neutral-400 mb-3">
                Peak hour (all time)
              </h2>
              <p className="text-[var(--accent)] font-medium">
                {peakHour
                  ? `${peakHour[0].padStart(2, "0")}:00 — ${peakHour[1]} orders`
                  : "No data yet"}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Order history</h2>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting || orders.length === 0}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black text-sm font-medium disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Export orders.csv"}
            </button>
          </div>
          <div className="bg-[var(--card)] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--card)] border-b border-white/10">
                  <tr className="text-left text-neutral-500">
                    <th className="p-3">ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-white/5">
                      <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                      <td className="p-3">{o.status}</td>
                      <td className="p-3 text-[var(--accent)]">${Number(o.total).toFixed(2)}</td>
                      <td className="p-3 text-neutral-400">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
