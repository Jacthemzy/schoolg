"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createQuestionSchema, type CreateQuestionInput } from "@/lib/admin-schemas";
import { useAdminQuestions, useCreateQuestion } from "@/hooks/use-admin-questions";
import { useAdminExam, useUpdateExamStatus } from "@/hooks/use-admin-exams";

type ParsedQuestion = {
  questionType: "text" | "image";
  answerType: "objective" | "theory";
  questionText: string;
  questionImageUrl?: string;
  options: string[];
  correctAnswer?: number;
  theoryKeywords: string[];
  theorySampleAnswer?: string;
  marks: number;
};

export function ExamQuestionsManager({ examId }: { examId: string }) {
  const queryClient = useQueryClient();
  const { data: exam } = useAdminExam(examId);
  const updateStatus = useUpdateExamStatus();
  const { data: questions, isLoading } = useAdminQuestions(examId);
  const createQuestion = useCreateQuestion(examId);
  const [bulkText, setBulkText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const form = useForm<CreateQuestionInput>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      questionType: "text",
      answerType: "objective",
      questionText: "",
      questionImageUrl: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionE: "",
      correctAnswer: "0",
      theoryKeywords: "",
      theorySampleAnswer: "",
      marks: 1,
    },
  });

  async function onSubmit(values: CreateQuestionInput) {
    await createQuestion.mutateAsync(values);
    form.reset({
      questionType: "text",
      answerType: "objective",
      questionText: "",
      questionImageUrl: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionE: "",
      correctAnswer: "0",
      theoryKeywords: "",
      theorySampleAnswer: "",
      marks: 1,
    });
  }

  const parsedQuestions = useMemo(() => parseBulkQuestions(bulkText), [bulkText]);

  async function importQuestions() {
    if (!parsedQuestions.length) {
      setImportError("No valid questions were detected yet.");
      setImportSuccess(null);
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    const res = await fetch(`/api/exams/${examId}/questions/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ questions: parsedQuestions }),
    });

    const data = await res.json().catch(() => ({}));
    setIsImporting(false);

    if (!res.ok) {
      setImportError(data.error ?? "Could not import questions.");
      return;
    }

    setBulkText("");
    setImportSuccess(`${parsedQuestions.length} question(s) imported successfully.`);
    setImportError(null);
    await queryClient.invalidateQueries({ queryKey: ["admin-questions", examId] });
  }

  const answerType = form.watch("answerType");

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      const nextText = file.type.startsWith("image/")
        ? await extractTextFromImage(file)
        : await file.text();
      setBulkText(nextText);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not read the selected file.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function handleQuestionImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await readFileAsDataUrl(file);
      form.setValue("questionImageUrl", imageUrl, { shouldValidate: true });
      form.setValue("questionType", "image", { shouldValidate: true });
    } catch {
      form.setError("questionImageUrl", {
        type: "manual",
        message: "Could not load the selected question image.",
      });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {exam && !exam.isActive ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">This exam is currently inactive.</p>
              <p className="mt-1 text-sm">
                Students will not see it until it is activated.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateStatus.mutate({ examId, isActive: true })}
              disabled={updateStatus.isPending}
              className="inline-flex items-center rounded-full bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-70"
            >
              Activate Exam
            </button>
          </div>
        </section>
      ) : null}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add Question</h2>
        <form className="mt-4 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Question Type</label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("questionType")}
              >
                <option value="text">Question Text</option>
                <option value="image">Question Image</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium">Upload Question Image</label>
              <label className="mt-1 inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQuestionImageUpload}
                />
              </label>
              <FieldError message={form.formState.errors.questionImageUrl?.message} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Answer Style</label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("answerType")}
            >
              <option value="objective">Objective / Multiple Choice</option>
              <option value="theory">Theory / Written Answer</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium">Question Text</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("questionText")}
            />
            <FieldError message={form.formState.errors.questionText?.message} />
          </div>

          {form.watch("questionImageUrl") ? (
            <div className="rounded-xl border p-4">
              <p className="text-xs font-medium text-muted-foreground">Question image preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.watch("questionImageUrl")}
                alt="Question preview"
                className="mt-3 max-h-72 w-full rounded-lg object-contain"
              />
            </div>
          ) : null}

          {answerType === "objective" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Option A" registration={form.register("optionA")} error={form.formState.errors.optionA?.message} />
                <Input label="Option B" registration={form.register("optionB")} error={form.formState.errors.optionB?.message} />
                <Input label="Option C" registration={form.register("optionC")} error={form.formState.errors.optionC?.message} />
                <Input label="Option D" registration={form.register("optionD")} error={form.formState.errors.optionD?.message} />
                <Input label="Option E" registration={form.register("optionE")} error={form.formState.errors.optionE?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">Correct Option</label>
                  <select
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    {...form.register("correctAnswer")}
                  >
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                    <option value="4">Option E</option>
                  </select>
                  <FieldError message={form.formState.errors.correctAnswer?.message} />
                </div>

                <div>
                  <label className="text-xs font-medium">Marks</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    {...form.register("marks")}
                  />
                  <FieldError message={form.formState.errors.marks?.message} />
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Theory Keywords</label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="photosynthesis, sunlight, chlorophyll"
                  {...form.register("theoryKeywords")}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Separate keywords with commas or new lines. The auto-marker matches these words in the student's answer.
                </p>
                <FieldError message={form.formState.errors.theoryKeywords?.message} />
              </div>

              <div>
                <label className="text-xs font-medium">Sample Answer</label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="A strong model answer for review after submission."
                  {...form.register("theorySampleAnswer")}
                />
              </div>

              <div>
                <label className="text-xs font-medium">Marks</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  {...form.register("marks")}
                />
                <FieldError message={form.formState.errors.marks?.message} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={createQuestion.isPending}
            className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {createQuestion.isPending ? "Saving…" : "Add Question"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Bulk Import Questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste questions copied from Google Docs or Word, upload a plain text file, or upload an image for browser-based text scanning where supported.
        </p>
        <div className="mt-4 grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
              Upload File
              <input
                type="file"
                accept=".txt,.md,.json,.csv,image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <span className="text-xs text-muted-foreground">
              Format example: objective question with options and `ANSWER: B`, or theory question with `TYPE: THEORY`, `KEYWORDS: ...`, `SAMPLE ANSWER: ...`.
            </span>
          </div>
          <textarea
            rows={12}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={`1. What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
E. 7
ANSWER: B
MARKS: 2

2. Explain photosynthesis.
TYPE: THEORY
KEYWORDS: sunlight, chlorophyll, carbon dioxide, water, glucose, oxygen
SAMPLE ANSWER: Plants use sunlight and chlorophyll to convert water and carbon dioxide into glucose and oxygen.
MARKS: 5`}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={importQuestions}
              disabled={isImporting || parsedQuestions.length === 0}
              className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {isImporting ? "Importing..." : "Import Parsed Questions"}
            </button>
            <span className="rounded-full bg-muted px-3 py-1 text-xs">
              {parsedQuestions.length} question(s) ready
            </span>
            {importError ? <p className="text-sm text-destructive">{importError}</p> : null}
            {importSuccess ? <p className="text-sm text-emerald-700">{importSuccess}</p> : null}
          </div>
          {parsedQuestions.length ? (
            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Preview</p>
              <div className="mt-3 space-y-3">
                {parsedQuestions.slice(0, 5).map((question, index) => (
                  <article key={`${question.questionText}-${index}`} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Question {index + 1} • {question.answerType} • {question.marks} mark(s)
                    </p>
                    <p className="mt-1 font-medium">
                      {question.questionText || "Question imported as image-based prompt."}
                    </p>
                    {question.questionImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={question.questionImageUrl}
                        alt={`Question ${index + 1}`}
                        className="mt-3 max-h-56 w-full rounded-lg object-contain"
                      />
                    ) : null}
                    {question.answerType === "objective" ? (
                      <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                        {question.options.map((option, optionIndex) => (
                          <li key={`${option}-${optionIndex}`}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                            {question.correctAnswer === optionIndex ? " (answer)" : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <p>Keywords: {question.theoryKeywords.join(", ")}</p>
                        {question.theorySampleAnswer ? (
                          <p>Sample answer: {question.theorySampleAnswer}</p>
                        ) : null}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Question Bank</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading questions…</p>
        ) : !questions?.length ? (
          <p className="text-sm text-muted-foreground">No questions added yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {questions.map((question) => (
              <article key={question.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Question {question.questionNumber}
                    </p>
                    <h3 className="mt-1 font-medium">
                      {question.questionText || "Image-based question"}
                    </h3>
                    {question.questionType === "image" && question.questionImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={question.questionImageUrl}
                        alt={`Question ${question.questionNumber}`}
                        className="mt-3 max-h-72 w-full rounded-lg object-contain"
                      />
                    ) : null}
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {question.answerType} • {question.marks} mark(s)
                  </span>
                </div>
                {question.answerType === "objective" ? (
                  <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    {question.options.map((option, index) => (
                      <li
                        key={`${question.id}-${option}`}
                        className={`rounded-lg border px-3 py-2 ${
                          question.correctAnswer === index
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : ""
                        }`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>Keywords: {question.theoryKeywords.join(", ")}</p>
                    {question.theorySampleAnswer ? (
                      <p>Sample answer: {question.theorySampleAnswer}</p>
                    ) : null}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Input({
  label,
  registration,
  error,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        {...registration}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function parseBulkQuestions(input: string): ParsedQuestion[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => normalizeImportedQuestion(item as Record<string, unknown>))
        .filter((item): item is ParsedQuestion => Boolean(item));
    } catch {
      return [];
    }
  }

  const normalized = trimmed.replace(/\r/g, "");
  const blocks = normalized
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => parseQuestionBlock(block))
    .filter((item): item is ParsedQuestion => Boolean(item));
}

function parseQuestionBlock(block: string): ParsedQuestion | null {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const options: string[] = [];
  let questionText = "";
  let answerType: "objective" | "theory" = "objective";
  let correctAnswer: number | undefined = 0;
  let theoryKeywords: string[] = [];
  let theorySampleAnswer = "";
  let marks = 1;

  for (const line of lines) {
    if (/^type\s*:/i.test(line)) {
      answerType = /theory/i.test(line) ? "theory" : "objective";
      continue;
    }

    if (/^(answer|ans)\s*:/i.test(line)) {
      const match = line.match(/([A-E])/i);
      if (match) {
        correctAnswer = "ABCDE".indexOf(match[1].toUpperCase());
      }
      continue;
    }

    if (/^marks?\s*:/i.test(line)) {
      const match = line.match(/(\d+)/);
      if (match) {
        marks = Number(match[1]);
      }
      continue;
    }

    if (/^keywords?\s*:/i.test(line)) {
      theoryKeywords = line
        .replace(/^keywords?\s*:/i, "")
        .split(/[;,]+/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);
      continue;
    }

    if (/^sample answer\s*:/i.test(line)) {
      theorySampleAnswer = line.replace(/^sample answer\s*:/i, "").trim();
      continue;
    }

    const optionMatch = line.match(/^[A-E][\.\):\-]\s*(.+)$/i);
    if (optionMatch) {
      options.push(optionMatch[1].trim());
      continue;
    }

    questionText = questionText
      ? `${questionText} ${line.replace(/^\d+[\.\)]\s*/, "")}`.trim()
      : line.replace(/^\d+[\.\)]\s*/, "").trim();
  }

  return normalizeImportedQuestion({
    answerType,
    questionText,
    options,
    correctAnswer,
    theoryKeywords,
    theorySampleAnswer,
    marks,
  });
}

function normalizeImportedQuestion(
  item: Record<string, unknown>,
): ParsedQuestion | null {
  const questionText = String(item.questionText ?? "").trim();
  const questionImageUrl = String(item.questionImageUrl ?? "").trim();
  const answerType = item.answerType === "theory" ? "theory" : "objective";
  const options = Array.isArray(item.options)
    ? item.options.map((option) => String(option).trim()).filter(Boolean)
    : [];
  const correctAnswer =
    item.correctAnswer === undefined || item.correctAnswer === null
      ? undefined
      : Number(item.correctAnswer);
  const theoryKeywords = Array.isArray(item.theoryKeywords)
    ? item.theoryKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
    : [];
  const theorySampleAnswer = String(item.theorySampleAnswer ?? "").trim();
  const rawMarks = Number(item.marks ?? 1);
  const marks = Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : 1;

  if (
    (!questionText && !questionImageUrl) ||
    (answerType === "objective" &&
      (options.length < 2 ||
        !Number.isInteger(correctAnswer) ||
        correctAnswer < 0 ||
        correctAnswer >= options.length)) ||
    (answerType === "theory" && theoryKeywords.length === 0)
  ) {
    return null;
  }

  return {
    questionType: questionImageUrl ? "image" : "text",
    answerType,
    questionText,
    questionImageUrl: questionImageUrl || undefined,
    options: answerType === "objective" ? options : [],
    correctAnswer,
    theoryKeywords,
    theorySampleAnswer: theorySampleAnswer || undefined,
    marks,
  };
}

async function extractTextFromImage(file: File) {
  const detectorCtor = (
    window as Window & {
      TextDetector?: new () => { detect: (image: ImageBitmap) => Promise<Array<{ rawValue: string }>> };
    }
  ).TextDetector;

  if (!detectorCtor) {
    throw new Error(
      "Image scanning needs a browser with TextDetector support. Paste text from the image if your browser does not support it.",
    );
  }

  const bitmap = await createImageBitmap(file);
  try {
    const detector = new detectorCtor();
    const blocks = await detector.detect(bitmap);
    return blocks.map((item) => item.rawValue).join("\n");
  } finally {
    bitmap.close();
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Invalid image data."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
