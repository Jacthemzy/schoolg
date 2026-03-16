"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export type AdminResult = {
  id: string;
  studentId: string;
  studentName: string;
  dmsNumber: string;
  className: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  status: string;
  submittedAt?: string;
  createdAt: string;
};

export function useAdminResults(params?: { examId?: string; className?: string }) {
  const search = new URLSearchParams();
  if (params?.examId) search.set("examId", params.examId);
  if (params?.className) search.set("className", params.className);

  const url = `/api/results${search.toString() ? `?${search.toString()}` : ""}`;

  return useQuery({
    queryKey: ["admin-results", params],
    queryFn: () => apiGet<AdminResult[]>(url),
  });
}

