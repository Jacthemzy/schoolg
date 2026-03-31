"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAdminReportCards,
  usePrefillReportSubjects,
  useSaveReportCard,
} from "@/hooks/use-admin-report-cards";
import { useAdminStudents } from "@/hooks/use-admin-students";
import { getGradeDetails, type ReportCardRow } from "@/lib/report-card";

const terms = ["First Term", "Second Term", "Third Term"];

function emptyRow(): ReportCardRow {
  return {
    subject: "",
    classWork: 0,
    examScore: 0,
    total: 0,
    grade: "F9",
    remark: "Fail",
  };
}

function computeRow(row: ReportCardRow): ReportCardRow {
  const total = Math.max(0, Math.min(100, Number(row.classWork) + Number(row.examScore)));
  const details = getGradeDetails(total);
  return {
    ...row,
    classWork: Number(row.classWork) || 0,
    examScore: Number(row.examScore) || 0,
    total,
    grade: details.grade,
    remark: details.remark,
  };
}

export function ReportCardManager() {
  const [studentSearch, setStudentSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [className, setClassName] = useState("");
  const [term, setTerm] = useState("First Term");
  const [sessionLabel, setSessionLabel] = useState("2025/2026");
  const [attendanceDays, setAttendanceDays] = useState("");
  const [nextTermBegins, setNextTermBegins] = useState("");
  const [resumptionDate, setResumptionDate] = useState("");
  const [gender, setGender] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherComment, setTeacherComment] = useState("");
  const [principalComment, setPrincipalComment] = useState("");
  const [rows, setRows] = useState<ReportCardRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const { data: students } = useAdminStudents({
    query: studentSearch || undefined,
    className: className || undefined,
  });
  const { data: reportCards, isLoading } = useAdminReportCards({
    className: className || undefined,
    studentId: studentId || undefined,
    term: term || undefined,
    sessionLabel: sessionLabel || undefined,
  });
  const prefill = usePrefillReportSubjects(studentId || undefined);
  const saveReportCard = useSaveReportCard();

  const selectedStudent = useMemo(
    () => students?.find((student) => student.id === studentId),
    [studentId, students],
  );

  useEffect(() => {
    if (selectedStudent?.className) {
      setClassName(selectedStudent.className);
    }
  }, [selectedStudent]);

  const average = useMemo(() => {
    const validRows = rows.filter((row) => row.subject.trim());
    if (!validRows.length) return 0;
    const total = validRows.reduce(
      (sum: number, row: ReportCardRow) => sum + Number(row.total || 0),
      0,
    );
    return Math.round((total / validRows.length) * 100) / 100;
  }, [rows]);

  function updateRow(index: number, patch: Partial<ReportCardRow>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? computeRow({ ...row, ...patch }) : row,
      ),
    );
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function loadPrefill() {
    if (!prefill.data?.length) {
      setFormMessage("No submitted online exam results were found for this student yet.");
      return;
    }

    setRows(prefill.data.map((row) => computeRow(row)));
    setFormMessage("Submitted online exam results have been added to the report card table.");
  }

  async function handleSave() {
    if (!studentId || !className) {
      setFormMessage("Choose a student and class before saving.");
      return;
    }

    const cleanRows = rows
      .map((row) => computeRow(row))
      .filter((row) => row.subject.trim());

    if (!cleanRows.length) {
      setFormMessage("Add at least one subject.");
      return;
    }

    try {
      const saved = await saveReportCard.mutateAsync({
        studentId,
        className,
        term,
        sessionLabel,
        attendanceDays,
        nextTermBegins,
        resumptionDate,
        gender,
        teacherName,
        subjects: cleanRows,
        teacherComment,
        principalComment,
      });

      setGender(saved.gender);
      setTeacherName(saved.teacherName);
      setTeacherComment(saved.teacherComment);
      setPrincipalComment(saved.principalComment);
      setFormMessage("Report card saved successfully.");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not save report card.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Generate Report Card</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Build report cards for any class, whether scores came from CBT exams or were entered manually.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs font-medium">Search Student</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Name or DMS number"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Student</label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              <option value="">Select student</option>
              {students?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} ({student.dmsNumber}) - {student.className}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Class</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="e.g. JSS1"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Term</label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            >
              {terms.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Session</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={sessionLabel}
              onChange={(event) => setSessionLabel(event.target.value)}
              placeholder="2025/2026"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Attendance Days</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={attendanceDays}
              onChange={(event) => setAttendanceDays(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Next Term Begins</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={nextTermBegins}
              onChange={(event) => setNextTermBegins(event.target.value)}
              placeholder="15/09/2026"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Resumption Date</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={resumptionDate}
              onChange={(event) => setResumptionDate(event.target.value)}
              placeholder="20/09/2026"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Gender</label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Teacher Name</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              placeholder="Mrs. John"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadPrefill}
              disabled={prefill.isLoading || !studentId}
              className="inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              {prefill.isLoading ? "Loading CBT scores..." : "Use CBT Exam Scores"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Subjects and Scores</h2>
            <p className="text-sm text-muted-foreground">
              Continuous assessment and exam scores are combined automatically to 100.
            </p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Add Subject
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">CA</th>
                <th className="py-2 pr-4">Exam</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Grade</th>
                <th className="py-2 pr-4">Remark</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`row-${index}`} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={row.subject}
                      onChange={(event) =>
                        updateRow(index, { subject: event.target.value })
                      }
                      placeholder="Mathematics"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      className="w-24 rounded-md border bg-background px-3 py-2 text-sm"
                      value={row.classWork}
                      onChange={(event) =>
                        updateRow(index, { classWork: Number(event.target.value) })
                      }
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      className="w-24 rounded-md border bg-background px-3 py-2 text-sm"
                      value={row.examScore}
                      onChange={(event) =>
                        updateRow(index, { examScore: Number(event.target.value) })
                      }
                    />
                  </td>
                  <td className="py-2 pr-4 font-medium">{row.total}</td>
                  <td className="py-2 pr-4">{row.grade}</td>
                  <td className="py-2 pr-4">{row.remark}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Teacher's Comment</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={teacherComment}
              onChange={(event) => setTeacherComment(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Principal's Comment</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={principalComment}
              onChange={(event) => setPrincipalComment(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-muted px-3 py-1 text-sm">
            Average: {average.toFixed(2)}%
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveReportCard.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saveReportCard.isPending ? "Saving..." : "Save Report Card"}
          </button>
          {formMessage ? (
            <p className="text-sm text-muted-foreground">{formMessage}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Saved Report Cards</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading report cards...</p>
        ) : !reportCards?.length ? (
          <p className="text-sm text-muted-foreground">No report cards found for the current filter.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Term</th>
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">Average</th>
                  <th className="py-2 pr-4">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {reportCards.map((card) => (
                  <tr key={card.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {card.studentName}
                      <div className="text-xs text-muted-foreground">{card.studentDmsNumber}</div>
                    </td>
                    <td className="py-2 pr-4">{card.className}</td>
                    <td className="py-2 pr-4">{card.term}</td>
                    <td className="py-2 pr-4">{card.sessionLabel}</td>
                    <td className="py-2 pr-4">{card.average.toFixed(2)}%</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <a href={`/report-cards/${card.id}`} className="text-primary hover:underline">
                          View
                        </a>
                        <a href={`/api/report-cards/${card.id}/export?format=pdf`} className="text-primary hover:underline">
                          PDF
                        </a>
                        <a href={`/api/report-cards/${card.id}/export?format=png`} className="text-primary hover:underline">
                          PNG
                        </a>
                        <a href={`/api/report-cards/${card.id}/export?format=jpeg`} className="text-primary hover:underline">
                          JPEG
                        </a>
                      </div>
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
