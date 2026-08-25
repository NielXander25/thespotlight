"use client";

import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-beam">Settings</h1>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-line bg-surface/60 p-5">
          <h2 className="font-medium text-beam">Admin password</h2>
          <p className="mt-1 text-sm text-mist">
            The dashboard password is set via the <code className="rounded bg-surface2 px-1.5 py-0.5 text-xs">ADMIN_PASSWORD</code>{" "}
            environment variable. Change it in your hosting provider&rsquo;s environment
            settings, then redeploy — there&rsquo;s no in-app editor by design, so it can never
            be changed by anyone who only has dashboard access.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface/60 p-5">
          <h2 className="font-medium text-beam">Export all data</h2>
          <p className="mt-1 text-sm text-mist">
            Download every submission — including hidden ones — as a CSV file.
          </p>
          <a
            href="/api/admin/export"
            className="mt-3 inline-block rounded-xl border border-line bg-surface2 px-4 py-2 text-sm font-medium text-beam"
          >
            Export CSV
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-surface/60 p-5">
          <h2 className="font-medium text-beam">Session</h2>
          <p className="mt-1 text-sm text-mist">
            Sessions last 8 hours. Sign out to end this session immediately.
          </p>
          <button
            onClick={handleLogout}
            className="mt-3 rounded-xl border border-line bg-surface2 px-4 py-2 text-sm font-medium text-beam"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
