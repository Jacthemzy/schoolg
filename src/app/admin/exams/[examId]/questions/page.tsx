import { ExamQuestionsManager } from "@/components/admin/exam-questions-manager";

export default async function AdminExamQuestionsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return <ExamQuestionsManager examId={examId} />;
}
