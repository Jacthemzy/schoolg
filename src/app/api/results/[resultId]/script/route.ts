import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { requireSession } from "@/lib/server/auth";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { Question } from "@/models/Question";
import { User } from "@/models/User";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _: Request,
  context: { params: Promise<{ resultId: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { resultId } = await context.params;
  if (!Types.ObjectId.isValid(resultId)) {
    return NextResponse.json({ error: "Invalid result id." }, { status: 400 });
  }

  await connectMongoose();
  const result = await Result.findById(resultId).lean();

  if (!result) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  if (
    auth.session.user?.role === "student" &&
    String(result.studentId) !== auth.session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [student, exam, questions] = await Promise.all([
    User.findById(result.studentId).lean(),
    Exam.findById(result.examId).lean(),
    Question.find({ examId: result.examId }).sort({ questionNumber: 1 }).lean(),
  ]);

  const answerMap = new Map(result.answers.map((answer) => [String(answer.questionId), answer]));
  const generatedLabel = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${esc(student?.fullName ?? "Student")} Script</title>
      <style>
        body { font-family: Arial, sans-serif; background:#f8fafc; color:#0f172a; margin:0; padding:24px; }
        .sheet { max-width: 900px; margin: 0 auto; background:#fff; border:1px solid #cbd5e1; border-radius:24px; padding:32px; }
        .header { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; border-bottom:1px solid #cbd5e1; padding-bottom:20px; }
        .stamp { width:130px; height:130px; border-radius:999px; border:4px solid #166534; background:#f0fdf4; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-size:10px; color:#14532d; }
        .title { font-size:30px; font-weight:700; margin:8px 0 0; }
        .motto { font-size:13px; letter-spacing:0.2em; text-transform:uppercase; color:#047857; font-weight:700; }
        .meta { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; margin-top:20px; }
        .meta div { border:1px solid #cbd5e1; border-radius:16px; padding:12px 14px; background:#f8fafc; }
        .meta strong { display:block; font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.16em; margin-bottom:6px; }
        .question { margin-top:18px; border:1px solid #cbd5e1; border-radius:20px; padding:18px; }
        .question h3 { margin:0 0 8px; font-size:18px; }
        .score { float:right; font-weight:700; background:#ecfdf5; color:#166534; padding:6px 10px; border-radius:999px; }
        .option, .answer-box { margin-top:8px; border:1px solid #e2e8f0; border-radius:14px; padding:10px 12px; background:#fff; }
        .correct { border-color:#86efac; background:#f0fdf4; color:#166534; }
        .selected { border-color:#fca5a5; background:#fef2f2; color:#991b1b; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div>
            <div class="motto">Education for Success and Peace</div>
            <div class="title">Divine Mission School</div>
            <div>08164039006, 08106565953</div>
            <div style="margin-top:8px;font-weight:700;">${esc((exam?.assessmentType ?? "exam").toUpperCase())} SCRIPT</div>
            <div style="margin-top:6px;color:#475569;">Generated ${esc(generatedLabel)}</div>
          </div>
          <div class="stamp">
            <div style="font-weight:700; letter-spacing:0.18em;">OFFICIAL</div>
            <div style="font-weight:700; letter-spacing:0.18em;">STAMP</div>
            <div style="margin-top:8px; font-weight:700;">DMS</div>
          </div>
        </div>
        <div class="meta">
          <div><strong>Student</strong>${esc(student?.fullName ?? "Unknown student")}</div>
          <div><strong>DMS Number</strong>${esc(student?.dmsNumber ?? "")}</div>
          <div><strong>Class</strong>${esc(student?.className ?? "")}</div>
          <div><strong>Assessment</strong>${esc(exam?.title ?? "Assessment")}</div>
          <div><strong>Subject</strong>${esc(exam?.subject ?? "")}</div>
          <div><strong>Score</strong>${result.score} / ${result.totalMarks}</div>
        </div>
        ${questions
          .map((question) => {
            const answer = answerMap.get(String(question._id));
            return `
              <article class="question">
                <div class="score">${answer?.scoreAwarded ?? 0}/${question.marks}</div>
                <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.16em;">Question ${question.questionNumber}</div>
                <h3>${esc(question.questionText || "Image-based question")}</h3>
                ${
                  question.answerType === "objective"
                    ? question.options
                        .map((option, index) => {
                          const isCorrect = question.correctAnswer === index;
                          const isSelected = answer?.selectedOption === index;
                          return `<div class="option ${isCorrect ? "correct" : isSelected ? "selected" : ""}">
                            ${String.fromCharCode(65 + index)}. ${esc(option)}
                            ${isCorrect ? " - Correct answer" : ""}
                            ${isSelected && !isCorrect ? " - Student answer" : ""}
                          </div>`;
                        })
                        .join("")
                    : `
                      <div class="answer-box"><strong>Student Answer</strong><div style="margin-top:6px;">${esc(answer?.answerText ?? "No answer submitted.")}</div></div>
                      <div class="answer-box"><strong>Expected Keywords</strong><div style="margin-top:6px;">${esc((answer?.expectedKeywords ?? question.theoryKeywords ?? []).join(", ") || "None")}</div></div>
                      <div class="answer-box"><strong>Matched Keywords</strong><div style="margin-top:6px;">${esc((answer?.matchedKeywords ?? []).join(", ") || "None")}</div></div>
                    `
                }
              </article>
            `;
          })
          .join("")}
      </div>
    </body>
  </html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="script-${String(result._id)}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
