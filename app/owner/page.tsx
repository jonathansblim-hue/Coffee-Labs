"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Order, LineItem } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

/* ---------- hooks ---------- */

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

/* ---------- helpers ---------- */

type DateRange = "today" | "7d" | "30d" | "all";

function filterByRange(orders: Order[], range: DateRange): Order[] {
  if (range === "all") return orders;
  const now = new Date();
  const cutoff = new Date();
  if (range === "today") {
    cutoff.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    cutoff.setDate(now.getDate() - 7);
  } else {
    cutoff.setDate(now.getDate() - 30);
  }
  return orders.filter((o) => new Date(o.created_at) >= cutoff);
}

const CHART_COLORS = ["#c4a35a", "#e8d5a0", "#9a8242", "#6b5a2e", "#4a3f20", "#d4b96c", "#b89344", "#f0e6c8"];
const PIE_COLORS = ["#c4a35a", "#4ade80", "#f59e0b", "#818cf8", "#f472b6", "#22d3ee", "#a78bfa", "#fb923c"];

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <div className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${color || "text-[var(--accent)]"}`}>
        {value}
      </div>
      {sub && <div className="text-neutral-600 text-xs mt-1">{sub}</div>}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e1e] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-neutral-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[var(--accent)] font-medium">
          {p.name}: {typeof p.value === "number" && p.name.toLowerCase().includes("revenue") ? `$${p.value.toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------- page ---------- */

export default function OwnerPage() {
  const { orders, loading } = useOrders();
  const [range, setRange] = useState<DateRange>("today");
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => filterByRange(orders, range), [orders, range]);
  const completed = useMemo(() => filtered.filter((o) => o.status === "completed"), [filtered]);

  /* Metrics */
  const totalOrders = filtered.length;
  const completedCount = completed.length;
  const totalRevenue = completed.reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;
  const pendingCount = filtered.filter((o) => o.status === "pending").length;
  const inProgressCount = filtered.filter((o) => o.status === "in_progress").length;

  /* Avg fulfillment time */
  const fulfillmentTimes = completed
    .filter((o) => o.completed_at)
    .map((o) => (new Date(o.completed_at!).getTime() - new Date(o.created_at).getTime()) / 60000);
  const avgFulfillment = fulfillmentTimes.length > 0
    ? fulfillmentTimes.reduce((a, b) => a + b, 0) / fulfillmentTimes.length
    : 0;

  /* Items analysis */
  const allItems = useMemo(
    () => filtered.flatMap((o) => (o.items as LineItem[])),
    [filtered]
  );

  /* Top items */
  const topItems = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((i) => {
      const key = i.name;
      counts[key] = (counts[key] || 0) + i.quantity;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.length > 16 ? name.slice(0, 15) + "…" : name, count }));
  }, [allItems]);

  /* Orders by hour */
  const hourlyData = useMemo(() => {
    const byHour: Record<number, number> = {};
    filtered.forEach((o) => {
      const h = new Date(o.created_at).getHours();
      byHour[h] = (byHour[h] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      orders: byHour[i] || 0,
    })).filter((d) => d.orders > 0 || (d.hour >= "06:00" && d.hour <= "22:00"));
  }, [filtered]);

  /* Category split */
  const categorySplit = useMemo(() => {
    let drinks = 0;
    let pastries = 0;
    allItems.forEach((i) => {
      if (i.category === "pastry") pastries += i.quantity;
      else drinks += i.quantity;
    });
    if (drinks + pastries === 0) return [];
    return [
      { name: "Drinks", value: drinks },
      { name: "Pastries", value: pastries },
    ];
  }, [allItems]);

  /* Milk preferences */
  const milkData = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((i) => {
      if (i.milk) {
        const key = i.milk.charAt(0).toUpperCase() + i.milk.slice(1);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [allItems]);

  /* Hot vs iced */
  const tempData = useMemo(() => {
    let hot = 0;
    let iced = 0;
    allItems.forEach((i) => {
      if (i.temperature === "hot") hot++;
      else if (i.temperature === "iced") iced++;
    });
    if (hot + iced === 0) return [];
    return [
      { name: "Hot", value: hot },
      { name: "Iced", value: iced },
    ];
  }, [allItems]);

  /* Daily revenue trend (last 7 days when range allows) */
  const dailyRevenue = useMemo(() => {
    const byDay: Record<string, number> = {};
    completed.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay[day] = (byDay[day] || 0) + Number(o.total);
    });
    return Object.entries(byDay).map(([day, revenue]) => ({
      day,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }, [completed]);

  /* Export CSV */
  const exportCsv = useCallback(() => {
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
      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
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

  const ranges: { key: DateRange; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "all", label: "All Time" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-neutral-500 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Business performance at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range picker */}
          <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-lg p-0.5">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  range === r.key
                    ? "bg-[var(--accent)] text-black"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || orders.length === 0}
            className="px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-neutral-300 hover:text-white hover:border-[var(--border-light)] text-xs font-medium disabled:opacity-50 transition-all"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Completed" value={completedCount} color="text-green-400" />
        <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard
          label="Avg Order"
          value={`$${avgOrderValue.toFixed(2)}`}
          sub={completedCount > 0 ? `from ${completedCount} orders` : undefined}
        />
        <StatCard
          label="Avg Fulfillment"
          value={avgFulfillment > 0 ? `${avgFulfillment.toFixed(1)}m` : "—"}
          sub="order to done"
        />
        <StatCard
          label="In Queue"
          value={pendingCount + inProgressCount}
          color={pendingCount + inProgressCount > 0 ? "text-amber-400" : "text-neutral-600"}
          sub={pendingCount + inProgressCount > 0 ? `${pendingCount} pending, ${inProgressCount} making` : "all clear"}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Orders by hour */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Orders by Hour</h2>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="orders" name="Orders" fill="#c4a35a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-neutral-600 text-sm">
              No data for this period
            </div>
          )}
        </div>

        {/* Daily revenue trend */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Revenue Trend</h2>
          {dailyRevenue.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#c4a35a"
                  strokeWidth={2}
                  dot={{ fill: "#c4a35a", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : dailyRevenue.length === 1 ? (
            <div className="flex items-center justify-center h-[220px]">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent)]">${dailyRevenue[0].revenue.toFixed(2)}</div>
                <div className="text-neutral-500 text-xs mt-1">{dailyRevenue[0].day}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-neutral-600 text-sm">
              No revenue data yet
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Top items */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Top Sellers</h2>
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topItems} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Sold" fill="#c4a35a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-neutral-600 text-sm">
              No items sold yet
            </div>
          )}
        </div>

        {/* Category split + Hot vs Iced */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Category Split</h2>
          {categorySplit.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categorySplit}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {categorySplit.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-neutral-600 text-sm">
              No data
            </div>
          )}
        </div>

        {/* Milk & Temp preferences */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Customer Preferences</h2>
          <div className="space-y-5">
            {/* Hot vs Iced */}
            {tempData.length > 0 && (
              <div>
                <h3 className="text-xs text-neutral-500 mb-2">Temperature</h3>
                <div className="flex gap-2">
                  {tempData.map((d) => {
                    const total = tempData.reduce((s, t) => s + t.value, 0);
                    const pct = Math.round((d.value / total) * 100);
                    return (
                      <div
                        key={d.name}
                        className="flex-1 bg-white/[0.04] rounded-lg p-3 text-center"
                      >
                        <div className="text-lg font-bold text-[var(--accent)]">{pct}%</div>
                        <div className="text-xs text-neutral-500">{d.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Milk */}
            {milkData.length > 0 && (
              <div>
                <h3 className="text-xs text-neutral-500 mb-2">Milk Choice</h3>
                <div className="space-y-1.5">
                  {milkData.slice(0, 4).map((d) => {
                    const maxVal = milkData[0].value;
                    const pct = (d.value / maxVal) * 100;
                    return (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-neutral-400 truncate">{d.name}</span>
                        <div className="flex-1 bg-white/[0.04] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent)] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-neutral-500 tabular-nums w-6 text-right">{d.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {tempData.length === 0 && milkData.length === 0 && (
              <div className="flex items-center justify-center h-[180px] text-neutral-600 text-sm">
                No preference data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order history table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-400">
            Order History ({filtered.length})
          </h2>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)]">
              <tr className="text-left text-neutral-500 text-xs uppercase tracking-wider">
                <th className="p-3 pl-5">Order</th>
                <th className="p-3">Items</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total</th>
                <th className="p-3 pr-5">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-600 text-sm">
                    No orders in this period
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const items = o.items as LineItem[];
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                    >
                      <td className="p-3 pl-5 font-mono text-xs text-neutral-400">
                        #{o.id.slice(0, 8)}
                      </td>
                      <td className="p-3 text-neutral-300 text-xs max-w-[200px] truncate">
                        {items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            o.status === "completed"
                              ? "bg-green-500/15 text-green-400"
                              : o.status === "in_progress"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-white/8 text-neutral-400"
                          }`}
                        >
                          {o.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--accent)] font-medium tabular-nums">
                        ${Number(o.total).toFixed(2)}
                      </td>
                      <td className="p-3 pr-5 text-neutral-500 text-xs">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
