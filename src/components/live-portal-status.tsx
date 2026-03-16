"use client";

import { useEffect, useState } from "react";

export function LivePortalStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(window.navigator.onLine);
      setLastCheckedAt(Date.now());
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    const timer = window.setInterval(updateStatus, 15_000);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return (
    <div className="space-y-3 rounded-xl border bg-card/60 p-4 text-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Live portal status</p>
          <p className="text-xs text-muted-foreground">
            Browser connectivity and client status checks.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
            isOnline
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Status details
        </p>
        <p className="text-xs text-muted-foreground">
          {isOnline
            ? "The browser reports an active network connection."
            : "The browser reports that the device is offline."}
        </p>
        <p className="text-xs text-muted-foreground">
          Last checked: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString() : "Pending"}
        </p>
      </div>
    </div>
  );
}
