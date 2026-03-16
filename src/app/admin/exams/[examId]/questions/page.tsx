"use client";

import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createQuestionSchema,
  type CreateQuestionInput,
} from "@/lib/admin-schemas";
import {
  useAdminQuestions,
  useCreateQuestion,
} from "@/hooks/use-admin-questions";

export default function ExamQuestionsPage() {
  const params = useParams<{ examId: string }>();
  const examId = params.examId;

  const { data: questions, isLoading } = useAdminQuestions(examId);
  const createQuestion = useCreateQuestion(examId);

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
      marks: values.marks,
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add Question</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Questions are strictly ordered. Students will see one question per
          screen and cannot go back.
        </p>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-xs font-medium">Question text</label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              {...form.register("questionText")}
            />
            <Error message={form.formState.errors.questionText?.message} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Option A</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("optionA")}
              />
              <Error message={form.formState.errors.optionA?.message} />
            </div>
            <div>
              <label className="text-xs font-medium">Option B</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("optionB")}
              />
              <Error message={form.formState.errors.optionB?.message} />
            </div>
            <div>
              <label className="text-xs font-medium">Option C (optional)</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("optionC")}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Option D (optional)</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("optionD")}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium">Correct option</label>
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("correctAnswer")}
              >
                <option value="0">Option A</option>
                <option value="1">Option B</option>
                <option value="2">Option C</option>
                <option value="3">Option D</option>
              </select>
              <Error message={form.formState.errors.correctAnswer?.message} />
            </div>
            <div>
              <label className="text-xs font-medium">Marks</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("marks")}
              />
              <Error message={form.formState.errors.marks?.message} />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={createQuestion.isPending}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {createQuestion.isPending ? "Adding…" : "Add Question"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Questions</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading questions…</p>
        ) : !questions || questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions yet.</p>
        ) : (
          <ol className="mt-4 space-y-3 text-sm">
            {questions.map((q) => (
              <li key={q.id} className="rounded-lg border bg-background p-3">
                <p className="font-medium">
                  {q.questionNumber}. {q.questionText}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {q.options.map((opt, idx) => (
                    <li key={idx}>
                      <span className="font-medium">
                        {String.fromCharCode(65 + idx)}.
                      </span>{" "}
                      <span
                        className={
                          idx === q.correctAnswer ? "text-emerald-600" : ""
                        }
                      >
                        {opt}
                        {idx === q.correctAnswer ? " (correct)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  Marks: {q.marks}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Error({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

