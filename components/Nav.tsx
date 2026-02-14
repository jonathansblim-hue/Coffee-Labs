"use client";

import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-[var(--card)] bg-[var(--card)]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-semibold text-[var(--accent)]">
          NYC Coffee
        </Link>
        <div className="flex gap-6">
          <Link
            href="/"
            className="text-sm text-neutral-300 hover:text-white transition"
          >
            Order
          </Link>
          <Link
            href="/barista"
            className="text-sm text-neutral-300 hover:text-white transition"
          >
            Barista
          </Link>
          <Link
            href="/owner"
            className="text-sm text-neutral-300 hover:text-white transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
