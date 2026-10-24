"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/guesses", label: "All Guesses" },
  { href: "/admin/featured", label: "Featured" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/share", label: "Share View" },
  { href: "/admin/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line/70 bg-surface/40 px-4 py-6 lg:flex">
        <div className="px-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-mist">
            The Spotlight
          </span>
          <p className="mt-1 font-display text-lg font-semibold text-beam">
            Admin
          </p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/15 text-brand-light"
                    : "text-mist hover:bg-surface2 hover:text-beam"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-mist transition-colors hover:bg-surface2 hover:text-beam"
        >
          Sign out
        </button>
      </aside>

      {/* Mobile top nav */}
      <div className="flex items-center justify-between border-b border-line/70 bg-surface/40 px-4 py-3 lg:hidden">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-mist">
            The Spotlight
          </span>
          <p className="font-display text-base font-semibold text-beam">Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mist"
        >
          Sign out
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-b border-line/70 bg-surface/20 px-3 py-2 lg:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                active ? "bg-brand/15 text-brand-light" : "text-mist"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
