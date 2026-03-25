"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import type { ReportCardRow } from "@/lib/report-card";

export type AdminReportCard = {
  id: string;
  studentId: string;
  studentName: string;
  studentDmsNumber: string;
  className: string;
  term: string;
  sessionLabel: string;
  attendanceDays?: number;
  nextTermBegins?: string;
  subjects: ReportCardRow[];
  subjectCount: number;
  totalObtained: number;
  totalPossible: number;
  average: number;
  teacherComment: string;
  principalComment: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveReportCardInput = {
  studentId: string;
  className: string;
  term: string;
  sessionLabel: string;
  attendanceDays?: number | string;
  nextTermBegins?: string;
  subjects: ReportCardRow[];
  teacherComment?: string;
  principalComment?: string;
};

export function useAdminReportCards(params?: {
  studentId?: string;
  className?: string;
  term?: string;
  sessionLabel?: string;
}) {
  const search = new URLSearchParams();
  if (params?.studentId) search.set("studentId", params.studentId);
  if (params?.className) search.set("className", params.className);
  if (params?.term) search.set("term", params.term);
  if (params?.sessionLabel) search.set("sessionLabel", params.sessionLabel);

  return useQuery({
    queryKey: ["admin-report-cards", params],
    queryFn: () =>
      apiGet<AdminReportCard[]>(
        `/api/report-cards${search.toString() ? `?${search.toString()}` : ""}`,
      ),
  });
}

export function usePrefillReportSubjects(studentId?: string) {
  return useQuery({
    queryKey: ["report-card-prefill", studentId],
    queryFn: () =>
      apiGet<ReportCardRow[]>(
        `/api/report-cards?prefill=results&studentId=${encodeURIComponent(studentId ?? "")}`,
      ),
    enabled: Boolean(studentId),
  });
}

export function useSaveReportCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveReportCardInput) =>
      apiPost<SaveReportCardInput, AdminReportCard>("/api/report-cards", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report-cards"] });
    },
  });
}
