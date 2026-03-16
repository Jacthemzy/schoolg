import { Suspense } from "react";
import { AdminOverview } from "@/components/admin/overview";

export default function AdminHomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading overview…</p>}>
      <AdminOverview />
    </Suspense>
  );
}

