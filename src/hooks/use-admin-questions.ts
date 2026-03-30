"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { CreateQuestionInput } from "@/lib/admin-schemas";

export type AdminQuestion = {
  id: string;
  questionType: "text" | "image";
  answerType: "objective" | "theory";
  questionText: string;
  questionImageUrl?: string;
  options: string[];
  correctAnswer?: number;
  theoryKeywords: string[];
  theorySampleAnswer?: string;
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
          questionType: "text" | "image";
          answerType: "objective" | "theory";
          questionText: string;
          questionImageUrl?: string;
          options: string[];
          correctAnswer?: number;
          theoryKeywords: string[];
          theorySampleAnswer?: string;
          marks: number;
        },
        AdminQuestion
      >(`/api/exams/${examId}/questions`, {
        questionType: payload.questionType,
        answerType: payload.answerType,
        questionText: payload.questionText,
        questionImageUrl: payload.questionImageUrl?.trim() || undefined,
        options: [
          payload.optionA,
          payload.optionB,
          ...(payload.optionC ? [payload.optionC] : []),
          ...(payload.optionD ? [payload.optionD] : []),
          ...(payload.optionE ? [payload.optionE] : []),
        ],
        correctAnswer:
          payload.answerType === "objective" && payload.correctAnswer !== undefined
            ? Number(payload.correctAnswer)
            : undefined,
        theoryKeywords: payload.theoryKeywords
          .split(/[\n,]+/)
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        theorySampleAnswer: payload.theorySampleAnswer.trim() || undefined,
        marks: payload.marks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY(examId) });
    },
  });
}

