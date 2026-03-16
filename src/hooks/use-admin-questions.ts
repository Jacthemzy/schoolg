"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { CreateQuestionInput } from "@/lib/admin-schemas";

export type AdminQuestion = {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  questionNumber: number;
  createdAt: string;
};

const QUESTIONS_KEY = (examId: string) => ["admin-questions", examId];

export function useAdminQuestions(examId: string) {
  return useQuery({
    queryKey: QUESTIONS_KEY(examId),
    queryFn: () => apiGet<AdminQuestion[]>(`/api/exams/${examId}/questions`),
    enabled: !!examId,
  });
}

export function useCreateQuestion(examId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuestionInput) =>
      apiPost<
        {
          questionText: string;
          options: string[];
          correctAnswer: number;
          marks: number;
        },
        AdminQuestion
      >(`/api/exams/${examId}/questions`, {
        questionText: payload.questionText,
        options: [
          payload.optionA,
          payload.optionB,
          ...(payload.optionC ? [payload.optionC] : []),
          ...(payload.optionD ? [payload.optionD] : []),
        ],
        correctAnswer: Number(payload.correctAnswer),
        marks: payload.marks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY(examId) });
    },
  });
}

