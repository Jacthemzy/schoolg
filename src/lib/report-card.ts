import type { IReportCard, IReportCardSubject } from "@/models/ReportCard";

export type ReportCardRow = {
  subject: string;
  classWork: number;
  examScore: number;
  total: number;
  grade: string;
  remark: string;
};

export type ReportCardView = {
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
  createdAt: Date;
  updatedAt: Date;
};

type ReportCardLike = Omit<IReportCard, "studentId" | "_id" | "subjects"> & {
  _id: { toString(): string } | string;
  studentId: { toString(): string } | string;
  subjects: Array<Partial<IReportCardSubject> & { subject?: string }>;
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

export function getGradeDetails(total: number) {
  const safeTotal = clampScore(total);
  return (
    gradeScale.find((item) => safeTotal >= item.min) ?? {
      grade: "F9",
      remark: "Fail",
    }
  );
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

export function buildReportCardView(reportCard: ReportCardLike): ReportCardView {
  const subjects = reportCard.subjects
    .map((item) => normalizeReportSubject(item))
    .filter((item): item is ReportCardRow => Boolean(item));

  const totalObtained = subjects.reduce((sum, item) => sum + item.total, 0);
  const totalPossible = subjects.length * 100;
  const average = subjects.length
    ? Math.round((totalObtained / subjects.length) * 100) / 100
    : 0;

  return {
    id: String(reportCard._id),
    studentId: String(reportCard.studentId),
    studentName: reportCard.studentName,
    studentDmsNumber: reportCard.studentDmsNumber ?? "",
    className: reportCard.className,
    term: reportCard.term,
    sessionLabel: reportCard.sessionLabel,
    attendanceDays: reportCard.attendanceDays,
    nextTermBegins: reportCard.nextTermBegins,
    subjects,
    subjectCount: subjects.length,
    totalObtained,
    totalPossible,
    average,
    teacherComment: reportCard.teacherComment?.trim() || defaultTeacherComment(average),
    principalComment:
      reportCard.principalComment?.trim() || defaultPrincipalComment(average),
    createdAt: reportCard.createdAt,
    updatedAt: reportCard.updatedAt,
  };
}

function defaultTeacherComment(average: number) {
  if (average >= 75) return "An excellent performance. Keep it up.";
  if (average >= 60) return "A strong result with room for even more growth.";
  if (average >= 50) return "A fair performance. More consistent study will help.";
  return "Needs closer attention, more practice, and extra support.";
}

function defaultPrincipalComment(average: number) {
  if (average >= 75) return "Promoted with distinction.";
  if (average >= 50) return "Promoted to the next class.";
  return "Promotion decision should follow academic review.";
}
