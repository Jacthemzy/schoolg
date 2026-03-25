"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet } from "@/lib/api";

export type AdminStudent = {
  id: string;
  dmsNumber: string;
  fullName: string;
  className: string;
  createdAt: string;
};

export function useAdminStudents(params?: { query?: string; className?: string }) {
  const search = new URLSearchParams();
  if (params?.query) search.set("query", params.query);
  if (params?.className) search.set("className", params.className);

  return useQuery({
    queryKey: ["admin-students", params],
    queryFn: () =>
      apiGet<AdminStudent[]>(
        `/api/students${search.toString() ? `?${search.toString()}` : ""}`,
      ),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => apiDelete<{ success: boolean }>(`/api/students/${studentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
  });
}
