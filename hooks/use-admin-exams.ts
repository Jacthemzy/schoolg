"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { CreateExamInput } from "@/lib/admin-schemas";

export type AdminExam = {
  id: string;
  title: string;
  subject: string;
  classTarget: string;
  readingTime: number;
  duration: number;
  totalMarks: number;
  isActive: boolean;
  createdAt: string;
};

const EXAMS_KEY = ["admin-exams"];

export function useAdminExams() {
  return useQuery({
    queryKey: EXAMS_KEY,
    queryFn: () => apiGet<AdminExam[]>("/api/exams"),
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExamInput) =>
      apiPost<CreateExamInput, AdminExam>("/api/exams", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
    },
  });
}

