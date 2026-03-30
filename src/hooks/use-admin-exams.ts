"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
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
const EXAM_KEY = (examId: string) => ["admin-exam", examId];

export function useAdminExams() {
  return useQuery({
    queryKey: EXAMS_KEY,
    queryFn: () => apiGet<AdminExam[]>("/api/exams"),
  });
}

export function useAdminExam(examId: string) {
  return useQuery({
    queryKey: EXAM_KEY(examId),
    queryFn: () => apiGet<AdminExam>(`/api/exams/${examId}`),
    enabled: Boolean(examId),
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

export function useUpdateExamStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { examId: string; isActive: boolean }) =>
      apiPatch<{ isActive: boolean }, AdminExam>(`/api/exams/${payload.examId}`, {
        isActive: payload.isActive,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
      queryClient.invalidateQueries({ queryKey: EXAM_KEY(data.id) });
    },
  });
}

