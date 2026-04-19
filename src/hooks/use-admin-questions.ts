"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
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
      apiPost<QuestionMutationPayload, AdminQuestion>(
        `/api/exams/${examId}/questions`,
        mapQuestionPayload(payload),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY(examId) });
    },
  });
}

function mapQuestionPayload(payload: CreateQuestionInput) {
  return {
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
  };
}

type QuestionMutationPayload = ReturnType<typeof mapQuestionPayload>;

export function useUpdateQuestion(examId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { questionId: string; values: CreateQuestionInput }) =>
      apiPatch<QuestionMutationPayload, AdminQuestion>(
        `/api/exams/${examId}/questions/${payload.questionId}`,
        mapQuestionPayload(payload.values),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY(examId) });
    },
  });
}

export function useDeleteQuestion(examId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) =>
      apiDelete<{ success: boolean }>(`/api/exams/${examId}/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY(examId) });
    },
  });
}

export function useResetExamQuestions(examId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiDelete<{ success: boolean; deletedQuestions: number; deletedResults: number }>(
        `/api/exams/${examId}/questions`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTIONS_KEY(examId) });
    },
  });
}

