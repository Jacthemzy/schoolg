"use client";

import { useItems } from "@/hooks/use-items";

export function ItemsSection() {
  const { data, isLoading, isError } = useItems();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading items…</p>;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load items.</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No items yet. Create your first one.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border bg-card">
      {data.map((item) => (
        <li key={item._id} className="flex flex-col gap-1 p-4">
          <p className="text-sm font-medium">{item.title}</p>
          {item.description ? (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

