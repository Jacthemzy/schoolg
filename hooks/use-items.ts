"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { ExampleItem } from "@/lib/validation";

const ITEMS_KEY = ["items"];

export function useItems() {
  const query = useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => apiGet<ExampleItem[]>("/api/items"),
  });

  return query;
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Pick<ExampleItem, "title" | "description">) =>
      apiPost<typeof payload, ExampleItem>("/api/items", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ success: boolean }>(`/api/items?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

