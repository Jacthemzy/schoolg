"use client";

import { useState } from "react";
import { useAdminStudents, useDeleteStudent } from "@/hooks/use-admin-students";

export function StudentManagement() {
  const [query, setQuery] = useState("");
  const [className, setClassName] = useState("");
  const { data: students, isLoading } = useAdminStudents({
    query: query || undefined,
    className: className || undefined,
  });
  const deleteStudent = useDeleteStudent();

  async function handleDelete(studentId: string) {
    if (!window.confirm("Delete this student account?")) {
      return;
    }

    await deleteStudent.mutateAsync(studentId);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Student Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by DMS Number or name, filter by class, and remove records when needed.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Search</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="DMS001 or student name"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Class</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="e.g. SS2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Students</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading students…</p>
        ) : !students?.length ? (
          <p className="text-sm text-muted-foreground">No students found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">DMS Number</th>
                  <th className="py-2 pr-4">Full Name</th>
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Registered</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{student.dmsNumber}</td>
                    <td className="py-2 pr-4">{student.fullName}</td>
                    <td className="py-2 pr-4">{student.className}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(student.id)}
                        disabled={deleteStudent.isPending}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
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
