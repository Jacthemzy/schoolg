import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { StudentSignOutButton } from "@/components/auth/student-sign-out-button";
import { connectMongoose } from "@/lib/mongoose";
import { getAppSession } from "@/lib/server/auth";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { Question } from "@/models/Question";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const session = await getAppSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { resultId } = await params;

  if (!Types.ObjectId.isValid(resultId)) {
    notFound();
  }

  await connectMongoose();
  const result = await Result.findById(resultId).lean();

  if (!result) {
    notFound();
  }

  if (
    session.user.role === "student" &&
    String(result.studentId) !== session.user.id
  ) {
    redirect("/dashboard");
  }

  const [exam, questions] = await Promise.all([
    Exam.findById(result.examId).lean(),
    Question.find({ examId: result.examId }).sort({ questionNumber: 1 }).lean(),
  ]);
  const answerMap = new Map(
    result.answers.map((answer) => [String(answer.questionId), answer]),
  );
  const reviewedQuestions = questions.map((question) => {
    const answer = answerMap.get(String(question._id));
    const expectedOption =
      question.answerType === "objective" && question.correctAnswer !== undefined
        ? question.options[question.correctAnswer] ?? null
        : null;

    return {
      id: String(question._id),
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      questionImageUrl: question.questionImageUrl,
      questionType: question.questionType,
      answerType: question.answerType,
      marks: question.marks,
      options: question.options,
      selectedOption: answer?.selectedOption,
      answerText: answer?.answerText ?? "",
      isCorrect: answer?.isCorrect ?? false,
      scoreAwarded: answer?.scoreAwarded ?? 0,
      matchedKeywords: answer?.matchedKeywords ?? [],
      expectedKeywords: answer?.expectedKeywords ?? question.theoryKeywords ?? [],
      expectedOption,
      sampleAnswer: question.theorySampleAnswer ?? "",
    };
  });
  const correctCount = reviewedQuestions.filter((item) => item.isCorrect).length;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eefbf3_45%,#ffffff_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Exam Result
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {exam?.title ?? "Exam Result"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {exam?.subject ?? "Subject"} • Submitted{" "}
              {result.submittedAt
                ? new Date(result.submittedAt).toLocaleString()
                : "in progress"}
            </p>
          </div>
          {session.user.role === "student" ? <StudentSignOutButton /> : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Score" value={`${result.score}`} />
          <StatCard label="Total Marks" value={`${result.totalMarks}`} />
          <StatCard
            label="Status"
            value={result.status === "submitted" ? "Submitted" : "In Progress"}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-600">
            Answered questions: {result.answers.length}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Correct answers recorded: {result.answers.filter((answer) => answer.isCorrect).length}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Answer Review</h2>
            <p className="mt-2 text-sm text-slate-600">
              Review what was missed and how the theory auto-marker scored keyword matches.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Reviewed questions: {reviewedQuestions.length} • Fully correct: {correctCount}
          </div>

          {reviewedQuestions.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-5 ${
                item.isCorrect
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-rose-200 bg-rose-50/40"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Question {item.questionNumber} • {item.answerType}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {item.questionText || "Image-based question"}
                  </h3>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                  {item.scoreAwarded}/{item.marks}
                </div>
              </div>

              {item.questionType === "image" && item.questionImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.questionImageUrl}
                  alt={`Question ${item.questionNumber}`}
                  className="mt-4 max-h-72 w-full rounded-2xl border border-slate-200 object-contain"
                />
              ) : null}

              {item.answerType === "objective" ? (
                <div className="mt-4 grid gap-2">
                  {item.options.map((option, index) => {
                    const isExpected = item.expectedOption === option;
                    const isSelected = item.selectedOption === index;
                    return (
                      <div
                        key={`${item.id}-${option}-${index}`}
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          isExpected
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : isSelected
                              ? "border-rose-300 bg-rose-50 text-rose-900"
                              : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>{" "}
                        {option}
                        {isExpected ? "  Correct answer" : ""}
                        {isSelected && !isExpected ? "  Your answer" : ""}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-950">Your answer</p>
                    <p className="mt-2 whitespace-pre-wrap">{item.answerText || "No answer submitted."}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-950">Matched keywords</p>
                    <p className="mt-2">
                      {item.matchedKeywords.length
                        ? item.matchedKeywords.join(", ")
                        : "No expected keywords matched."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-950">Expected keywords</p>
                    <p className="mt-2">
                      {item.expectedKeywords.length
                        ? item.expectedKeywords.join(", ")
                        : "No keywords configured."}
                    </p>
                  </div>
                  {item.sampleAnswer ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-slate-950">Sample answer</p>
                      <p className="mt-2 whitespace-pre-wrap">{item.sampleAnswer}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href={session.user.role === "admin" ? "/admin/results" : "/dashboard"}
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to {session.user.role === "admin" ? "results" : "dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
