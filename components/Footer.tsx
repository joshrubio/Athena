"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Hidden on /login (auth gate) and on / (the mission canvas needs the full
// viewport height for the map) — shown everywhere else, same discipline as
// the other satellites' hide-on-/login, just with one more exception.
export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/") return null;

  return (
    <footer className="shrink-0 border-t px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
      <p>athena — a client-side mission planner, simulated telemetry, no real aircraft.</p>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/joshrubio/Athena"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Source
        </a>
        <Link href="/docs" className="hover:text-foreground transition-colors">
          Docs
        </Link>
      </div>
    </footer>
  );
}
