import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { requireSession } from "@/lib/server/auth";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { Question } from "@/models/Question";
import { User } from "@/models/User";

type ScriptQuestion = {
  questionNumber: number;
  questionText: string;
  answerType: "objective" | "theory";
  options: string[];
  correctAnswer?: number;
  theoryKeywords: string[];
  marks: number;
  scoreAwarded: number;
  selectedOption?: number;
  answerText?: string;
  matchedKeywords: string[];
};

function pdfEsc(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maxChars: number) {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function buildScriptPdf(input: {
  schoolName: string;
  motto: string;
  phone: string;
  generatedLabel: string;
  assessmentType: string;
  assessmentTitle: string;
  subject: string;
  studentName: string;
  dmsNumber: string;
  className: string;
  score: number;
  totalMarks: number;
  questions: ScriptQuestion[];
}) {
  const pageWidth = 842;
  const pageHeight = 1191;
  const margin = 40;
  const header = Buffer.from("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n", "binary");
  const parts: Buffer[] = [header];
  const offsets: number[] = [0];
  let length = header.length;

  const addObject = (objectNumber: number, body: Buffer | string) => {
    const headerBuffer = Buffer.from(`${objectNumber} 0 obj\n`);
    const bodyBuffer = typeof body === "string" ? Buffer.from(body, "binary") : body;
    const footerBuffer = Buffer.from("\nendobj\n");
    const objectBuffer = Buffer.concat([headerBuffer, bodyBuffer, footerBuffer]);
    offsets[objectNumber] = length;
    parts.push(objectBuffer);
    length += objectBuffer.length;
  };

  const pages: string[] = [];
  let currentY = 84;
  let currentPage: string[] = [];

  const top = (value: number) => pageHeight - value;
  const text = (x: number, y: number, value: string, size: number, bold = false) =>
    `BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${top(y).toFixed(2)} Tm (${pdfEsc(value)}) Tj ET`;
  const rectFill = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) =>
    `${r} ${g} ${b} rg ${x.toFixed(2)} ${top(y + h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`;
  const rectStroke = (x: number, y: number, w: number, h: number) =>
    `0.79 0.85 0.91 RG ${x.toFixed(2)} ${top(y + h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`;

  function startPage() {
    currentPage = [
      rectFill(0, 0, pageWidth, pageHeight, 0.97, 0.98, 0.99),
      rectFill(margin, 36, pageWidth - margin * 2, 108, 0.06, 0.09, 0.16),
      text(margin + 16, 70, input.schoolName.toUpperCase(), 21, true),
      text(margin + 16, 94, input.motto.toUpperCase(), 11, true),
      text(margin + 16, 116, input.phone, 10, false),
      text(margin + 16, 136, `${input.assessmentType.toUpperCase()} SCRIPT`, 14, true),
      text(pageWidth - 238, 76, `Generated: ${input.generatedLabel}`, 10, true),
      text(pageWidth - 238, 98, `Score: ${input.score} / ${input.totalMarks}`, 10, true),
      rectFill(margin, 164, pageWidth - margin * 2, 84, 0.93, 0.99, 0.96),
      rectStroke(margin, 164, pageWidth - margin * 2, 84),
      text(margin + 16, 188, `Student: ${input.studentName}`, 12, true),
      text(margin + 16, 210, `DMS Number: ${input.dmsNumber || "-"}`, 11),
      text(margin + 300, 210, `Class: ${input.className || "-"}`, 11),
      text(margin + 16, 232, `Assessment: ${input.assessmentTitle}`, 11),
      text(margin + 300, 232, `Subject: ${input.subject}`, 11),
    ];
    currentY = 278;
  }

  function flushPage() {
    pages.push(currentPage.join("\n"));
  }

  function ensureSpace(linesNeeded: number) {
    if (currentY + linesNeeded * 16 <= pageHeight - 70) {
      return;
    }
    flushPage();
    startPage();
  }

  startPage();

  for (const question of input.questions) {
    const heading = `Question ${question.questionNumber}  (${question.scoreAwarded}/${question.marks})`;
    const questionLines = wrapText(question.questionText || "Image-based question", 82);
    const optionLines =
      question.answerType === "objective"
        ? question.options.flatMap((option, index) => {
            const isCorrect = question.correctAnswer === index;
            const isSelected = question.selectedOption === index;
            const suffix = isCorrect
              ? " - Correct answer"
              : isSelected
                ? " - Student answer"
                : "";
            return wrapText(`${String.fromCharCode(65 + index)}. ${option}${suffix}`, 84);
          })
        : [
            ...wrapText(`Student Answer: ${question.answerText || "No answer submitted."}`, 84),
            ...wrapText(
              `Expected Keywords: ${question.theoryKeywords.join(", ") || "None"}`,
              84,
            ),
            ...wrapText(
              `Matched Keywords: ${question.matchedKeywords.join(", ") || "None"}`,
              84,
            ),
          ];

    ensureSpace(4 + questionLines.length + optionLines.length);

    currentPage.push(rectStroke(margin, currentY - 14, pageWidth - margin * 2, 28 + (questionLines.length + optionLines.length) * 14));
    currentPage.push(text(margin + 12, currentY, heading, 11, true));
    currentY += 20;

    for (const line of questionLines) {
      currentPage.push(text(margin + 12, currentY, line, 10));
      currentY += 14;
    }

    currentY += 6;
    for (const line of optionLines) {
      currentPage.push(text(margin + 20, currentY, line, 9));
      currentY += 14;
    }

    currentY += 18;
  }

  flushPage();

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index} 0 R`).join(" ")}] /Count ${pages.length} >>`);

  const fontRegularObjectNumber = 3 + pages.length;
  const fontBoldObjectNumber = fontRegularObjectNumber + 1;
  let objectNumber = fontBoldObjectNumber + 1;
  const contentObjectNumbers: number[] = [];

  pages.forEach((pageContent, index) => {
    const contentObjectNumber = objectNumber++;
    contentObjectNumbers.push(contentObjectNumber);
    addObject(
      3 + index,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularObjectNumber} 0 R /F2 ${fontBoldObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
  });

  addObject(fontRegularObjectNumber, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject(fontBoldObjectNumber, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageContent, index) => {
    addObject(
      contentObjectNumbers[index],
      `<< /Length ${Buffer.byteLength(pageContent)} >>\nstream\n${pageContent}\nendstream`,
    );
  });

  const xrefOffset = length;
  const xrefEntries = Array.from({ length: offsets.length }, (_, index) => offsets[index] ?? 0)
    .map((offset, index) =>
      index === 0
        ? "0000000000 65535 f "
        : `${String(offset).padStart(10, "0")} 00000 n `,
    )
    .join("\n");

  const trailer = `xref\n0 ${offsets.length}\n${xrefEntries}\ntrailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Uint8Array(Buffer.concat([...parts, Buffer.from(trailer)]));
}

function binaryResponse(bytes: Uint8Array, filename: string) {
  const body = Buffer.from(bytes);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "no-store",
    },
  });
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

  const pdf = buildScriptPdf({
    schoolName: "Divine Mission School",
    motto: "Education for Success and Peace",
    phone: "08164039006, 08106565953",
    generatedLabel,
    assessmentType: exam?.assessmentType ?? "exam",
    assessmentTitle: exam?.title ?? "Assessment",
    subject: exam?.subject ?? "",
    studentName: student?.fullName ?? "Unknown student",
    dmsNumber: student?.dmsNumber ?? "",
    className: student?.className ?? "",
    score: result.score,
    totalMarks: result.totalMarks,
    questions: questions.map((question) => {
      const answer = answerMap.get(String(question._id));
      return {
        questionNumber: question.questionNumber,
        questionText: question.questionText || "Image-based question",
        answerType: question.answerType,
        options: question.options,
        correctAnswer: question.correctAnswer,
        theoryKeywords: answer?.expectedKeywords ?? question.theoryKeywords ?? [],
        marks: question.marks,
        scoreAwarded: answer?.scoreAwarded ?? 0,
        selectedOption: answer?.selectedOption,
        answerText: answer?.answerText ?? "",
        matchedKeywords: answer?.matchedKeywords ?? [],
      };
    }),
  });

  const safeName = `${student?.fullName ?? "student"}-${exam?.title ?? "script"}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return binaryResponse(pdf, `${safeName}.pdf`);
}
