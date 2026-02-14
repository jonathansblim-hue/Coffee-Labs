"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Order", icon: "☕" },
  { href: "/barista", label: "Barista", icon: "🧑‍🍳" },
  { href: "/owner", label: "Dashboard", icon: "📊" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--accent)] hover:opacity-90 transition">
          <span className="text-lg">☕</span>
          <span className="hidden sm:inline">NYC Coffee</span>
        </Link>
        <div className="flex gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                }`}
              >
                <span className="sm:hidden">{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
