import type {
  IReportCard,
  IReportCardBehaviourRating,
  IReportCardSubject,
} from "@/models/ReportCard";

export type ReportCardRow = {
  subject: string;
  classWork: number;
  examScore: number;
  total: number;
  grade: string;
  remark: string;
};

export type BehaviourRating = {
  key: string;
  label: string;
  rating: string;
};

export type ReportCardView = {
  id: string;
  studentId: string;
  schoolName: string;
  studentName: string;
  studentDmsNumber: string;
  gender: string;
  className: string;
  term: string;
  sessionLabel: string;
  attendanceDays?: number;
  nextTermBegins?: string;
  resumptionDate?: string;
  teacherName: string;
  subjects: ReportCardRow[];
  subjectCount: number;
  totalObtained: number;
  totalPossible: number;
  average: number;
  behaviourRatings: BehaviourRating[];
  teacherComment: string;
  principalComment: string;
  teacherSignature?: string;
  principalSignature?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ReportCardLike = Omit<
  IReportCard,
  "studentId" | "_id" | "subjects" | "behaviourRatings"
> & {
  _id: { toString(): string } | string;
  studentId: { toString(): string } | string;
  subjects: Array<Partial<IReportCardSubject> & { subject?: string }>;
  behaviourRatings?: Array<
    Partial<IReportCardBehaviourRating> & { key?: string; label?: string }
  >;
};

const gradeScale = [
  { min: 75, grade: "A1", remark: "Excellent" },
  { min: 70, grade: "B2", remark: "Very Good" },
  { min: 65, grade: "B3", remark: "Good" },
  { min: 60, grade: "C4", remark: "Credit" },
  { min: 55, grade: "C5", remark: "Credit" },
  { min: 50, grade: "C6", remark: "Credit" },
  { min: 45, grade: "D7", remark: "Pass" },
  { min: 40, grade: "E8", remark: "Pass" },
  { min: 0, grade: "F9", remark: "Fail" },
];

export const defaultBehaviourRatings: BehaviourRating[] = [
  { key: "conduct", label: "Student Behaviour", rating: "" },
  { key: "punctuality", label: "Punctuality", rating: "" },
  { key: "neatness", label: "Neatness", rating: "" },
  { key: "leadership", label: "Leadership", rating: "" },
  { key: "sport", label: "Sport Behaviour", rating: "" },
];

export const behaviourRatingOptions = gradeScale.map((item) => item.grade);

const gradeColorMap: Record<string, { text: string; bg: string; border: string }> = {
  A1: { text: "#166534", bg: "#dcfce7", border: "#86efac" },
  B2: { text: "#0f766e", bg: "#ccfbf1", border: "#99f6e4" },
  B3: { text: "#0c4a6e", bg: "#e0f2fe", border: "#7dd3fc" },
  C4: { text: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  C5: { text: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  C6: { text: "#9333ea", bg: "#f3e8ff", border: "#d8b4fe" },
  D7: { text: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  E8: { text: "#c2410c", bg: "#ffedd5", border: "#fdba74" },
  F9: { text: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
};

export function getGradeDetails(total: number) {
  const safeTotal = clampScore(total);
  return (
    gradeScale.find((item) => safeTotal >= item.min) ?? {
      grade: "F9",
      remark: "Fail",
    }
  );
}

export function getGradePalette(grade: string) {
  return gradeColorMap[String(grade).toUpperCase()] ?? gradeColorMap.F9;
}

export function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export function normalizeReportSubject(
  subject: Partial<IReportCardSubject> & { subject?: string },
): ReportCardRow | null {
  const name = String(subject.subject ?? "").trim();
  if (!name) return null;

  const classWork = clampScore(Number(subject.classWork ?? 0));
  const examScore = clampScore(Number(subject.examScore ?? 0));
  const total = clampScore(
    subject.total === undefined ? classWork + examScore : Number(subject.total),
  );
  const gradeDetails = getGradeDetails(total);

  return {
    subject: name,
    classWork,
    examScore,
    total,
    grade: String(subject.grade ?? gradeDetails.grade).trim() || gradeDetails.grade,
    remark:
      String(subject.remark ?? gradeDetails.remark).trim() || gradeDetails.remark,
  };
}

export function normalizeBehaviourRatings(
  ratings?: Array<
    Partial<IReportCardBehaviourRating> & { key?: string; label?: string }
  >,
) {
  const byKey = new Map(
    (ratings ?? [])
      .map((item) => ({
        key: String(item.key ?? "").trim(),
        label: String(item.label ?? "").trim(),
        rating: String(item.rating ?? "").trim().toUpperCase(),
      }))
      .filter((item) => item.key && item.label)
      .map((item) => [item.key, item] as const),
  );

  return defaultBehaviourRatings.map((item) => {
    const current = byKey.get(item.key);
    return current
      ? {
          key: item.key,
          label: current.label || item.label,
          rating: current.rating,
        }
      : { ...item };
  });
}

export function buildReportCardView(reportCard: ReportCardLike): ReportCardView {
  const subjects = reportCard.subjects
    .map((item) => normalizeReportSubject(item))
    .filter((item): item is ReportCardRow => Boolean(item));

  const totalObtained = subjects.reduce(
    (sum: number, item: ReportCardRow) => sum + item.total,
    0,
  );
  const totalPossible = subjects.length * 100;
  const average = subjects.length
    ? Math.round((totalObtained / subjects.length) * 100) / 100
    : 0;

  return {
    id: String(reportCard._id),
    studentId: String(reportCard.studentId),
    schoolName: "Divine Mission School",
    studentName: reportCard.studentName,
    studentDmsNumber: reportCard.studentDmsNumber ?? "",
    gender: reportCard.gender?.trim() || "",
    className: reportCard.className,
    term: reportCard.term,
    sessionLabel: reportCard.sessionLabel,
    attendanceDays: reportCard.attendanceDays,
    nextTermBegins: reportCard.nextTermBegins,
    resumptionDate: reportCard.resumptionDate,
    teacherName: reportCard.teacherName?.trim() || "Class Teacher",
    subjects,
    subjectCount: subjects.length,
    totalObtained,
    totalPossible,
    average,
    behaviourRatings: normalizeBehaviourRatings(reportCard.behaviourRatings),
    teacherComment:
      reportCard.teacherComment?.trim() ||
      defaultTeacherComment(average, reportCard.term),
    principalComment:
      reportCard.principalComment?.trim() ||
      defaultPrincipalComment(average, reportCard.term),
    teacherSignature: normalizeOptionalString(reportCard.teacherSignature),
    principalSignature: normalizeOptionalString(reportCard.principalSignature),
    generatedAt: new Date(),
    createdAt: reportCard.createdAt,
    updatedAt: reportCard.updatedAt,
  };
}

export function defaultTeacherComment(average: number, term?: string) {
  if (String(term).toLowerCase().includes("third")) {
    if (average >= 75) return "Excellent work throughout the session. Keep soaring higher.";
    if (average >= 60) return "A very good end-of-session performance. Maintain the effort.";
    if (average >= 50) return "A fair session result. Greater consistency will lift the next class result.";
    return "Needs stronger preparation and support before the next academic session.";
  }

  if (average >= 75) return "Excellent performance this term. Keep the standard high.";
  if (average >= 60) return "A strong term result with clear progress.";
  if (average >= 50) return "A fair term performance. More consistent study will help.";
  return "Needs closer attention, extra practice, and stronger support.";
}

export function defaultPrincipalComment(average: number, term?: string) {
  const normalizedTerm = String(term ?? "").toLowerCase();
  const isThirdTerm = normalizedTerm.includes("third");

  if (!isThirdTerm) {
    if (average >= 75) return "Excellent academic showing this term. Keep improving.";
    if (average >= 60) return "Good progress recorded this term. Stay focused.";
    if (average >= 50) return "Satisfactory term performance with room for improvement.";
    return "Academic support and closer monitoring are strongly advised.";
  }

  if (average >= 75) return "Promoted to the next class with distinction.";
  if (average >= 50) return "Promoted to the next class.";
  return "Promotion decision should follow academic review.";
}

function normalizeOptionalString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
