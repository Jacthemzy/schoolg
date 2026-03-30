"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExamSchema, type CreateExamInput } from "@/lib/admin-schemas";
import { useAdminExams, useCreateExam, useUpdateExamStatus } from "@/hooks/use-admin-exams";

export default function AdminExamsPage() {
  const { data: exams, isLoading } = useAdminExams();
  const createExam = useCreateExam();
  const updateStatus = useUpdateExamStatus();

  const form = useForm<CreateExamInput>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      classTarget: "",
      readingTime: 5,
      duration: 30,
      totalMarks: 100,
      examPassword: "",
      isActive: false,
    },
  });

  async function onSubmit(values: CreateExamInput) {
    await createExam.mutateAsync(values);
    form.reset({
      ...values,
      title: "",
      description: "",
      subject: "",
      examPassword: "",
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create Exam</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Define subject, class, timers, and secure password. Students cannot change any timer.
        </p>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Title</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("title")}
            />
            <ErrorMessage message={form.formState.errors.title?.message} />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div>
            <label className="text-xs font-medium">Subject</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("subject")}
            />
            <ErrorMessage message={form.formState.errors.subject?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Class</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="e.g. JSS1, SS2"
              {...form.register("classTarget")}
            />
            <ErrorMessage message={form.formState.errors.classTarget?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Reading Time (minutes)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("readingTime")}
            />
            <ErrorMessage message={form.formState.errors.readingTime?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Exam Duration (minutes)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("duration")}
            />
            <ErrorMessage message={form.formState.errors.duration?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Total Marks</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("totalMarks")}
            />
            <ErrorMessage message={form.formState.errors.totalMarks?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Exam Password</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              {...form.register("examPassword")}
            />
            <ErrorMessage message={form.formState.errors.examPassword?.message} />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              className="h-4 w-4"
              {...form.register("isActive")}
            />
            <label htmlFor="isActive" className="text-xs font-medium">
              Activate exam immediately
            </label>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createExam.isPending}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {createExam.isPending ? "Creating…" : "Create Exam"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Existing Exams</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading exams…</p>
        ) : !exams || exams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exams created yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Reading</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2 pr-4">Marks</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                  <th className="py-2 pr-4">Questions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{exam.title}</td>
                    <td className="py-2 pr-4">{exam.subject}</td>
                    <td className="py-2 pr-4">{exam.classTarget}</td>
                    <td className="py-2 pr-4">{exam.readingTime} min</td>
                    <td className="py-2 pr-4">{exam.duration} min</td>
                    <td className="py-2 pr-4">{exam.totalMarks}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          exam.isActive
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {exam.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus.mutate({ examId: exam.id, isActive: !exam.isActive })
                        }
                        disabled={updateStatus.isPending}
                        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-60"
                      >
                        {exam.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <a
                        href={`/admin/exams/${exam.id}/questions`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Manage
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

