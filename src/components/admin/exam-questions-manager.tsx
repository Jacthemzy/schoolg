"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createQuestionSchema, type CreateQuestionInput } from "@/lib/admin-schemas";
import { useAdminQuestions, useCreateQuestion } from "@/hooks/use-admin-questions";

type ParsedQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: number;
  marks: number;
};

export function ExamQuestionsManager({ examId }: { examId: string }) {
  const queryClient = useQueryClient();
  const { data: questions, isLoading } = useAdminQuestions(examId);
  const createQuestion = useCreateQuestion(examId);
  const [bulkText, setBulkText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const form = useForm<CreateQuestionInput>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "0",
      marks: 1,
    },
  });

  async function onSubmit(values: CreateQuestionInput) {
    await createQuestion.mutateAsync(values);
    form.reset({
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "0",
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add Question</h2>
        <form className="mt-4 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-xs font-medium">Question</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("questionText")}
            />
            <FieldError message={form.formState.errors.questionText?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Option A" registration={form.register("optionA")} error={form.formState.errors.optionA?.message} />
            <Input label="Option B" registration={form.register("optionB")} error={form.formState.errors.optionB?.message} />
            <Input label="Option C" registration={form.register("optionC")} error={form.formState.errors.optionC?.message} />
            <Input label="Option D" registration={form.register("optionD")} error={form.formState.errors.optionD?.message} />
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
              </select>
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
              Format example: question line, options `A.` to `D.`, then `ANSWER: B`, `MARKS: 2`.
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
ANSWER: B
MARKS: 2`}
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
                      Question {index + 1} • {question.marks} mark(s)
                    </p>
                    <p className="mt-1 font-medium">{question.questionText}</p>
                    <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                      {question.options.map((option, optionIndex) => (
                        <li key={`${option}-${optionIndex}`}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                          {question.correctAnswer === optionIndex ? " (answer)" : ""}
                        </li>
                      ))}
                    </ul>
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
                    <h3 className="mt-1 font-medium">{question.questionText}</h3>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {question.marks} mark(s)
                  </span>
                </div>
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
  let correctAnswer = 0;
  let marks = 1;

  for (const line of lines) {
    if (/^(answer|ans)\s*:/i.test(line)) {
      const match = line.match(/([A-D])/i);
      if (match) {
        correctAnswer = "ABCD".indexOf(match[1].toUpperCase());
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

    const optionMatch = line.match(/^[A-D][\.\):\-]\s*(.+)$/i);
    if (optionMatch) {
      options.push(optionMatch[1].trim());
      continue;
    }

    questionText = questionText
      ? `${questionText} ${line.replace(/^\d+[\.\)]\s*/, "")}`.trim()
      : line.replace(/^\d+[\.\)]\s*/, "").trim();
  }

  return normalizeImportedQuestion({
    questionText,
    options,
    correctAnswer,
    marks,
  });
}

function normalizeImportedQuestion(
  item: Record<string, unknown>,
): ParsedQuestion | null {
  const questionText = String(item.questionText ?? "").trim();
  const options = Array.isArray(item.options)
    ? item.options.map((option) => String(option).trim()).filter(Boolean)
    : [];
  const correctAnswer = Number(item.correctAnswer ?? 0);
  const rawMarks = Number(item.marks ?? 1);
  const marks = Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : 1;

  if (
    !questionText ||
    options.length < 2 ||
    !Number.isInteger(correctAnswer) ||
    correctAnswer < 0 ||
    correctAnswer >= options.length
  ) {
    return null;
  }

  return {
    questionText,
    options,
    correctAnswer,
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
