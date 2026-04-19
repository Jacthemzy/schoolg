"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  useAdminReportCards,
  usePrefillReportSubjects,
  useSaveReportCard,
  type AdminReportCard,
} from "@/hooks/use-admin-report-cards";
import { useAdminStudents } from "@/hooks/use-admin-students";
import {
  behaviourRatingOptions,
  defaultBehaviourRatings,
  getGradeDetails,
  getGradePalette,
  type BehaviourRating,
  type ReportCardRow,
} from "@/lib/report-card";

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
  const [teacherSignature, setTeacherSignature] = useState("");
  const [principalSignature, setPrincipalSignature] = useState("");
  const [rows, setRows] = useState<ReportCardRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [behaviourRatings, setBehaviourRatings] = useState<BehaviourRating[]>(
    defaultBehaviourRatings,
  );
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
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

  function resetForm() {
    setEditingCardId(null);
    setAttendanceDays("");
    setNextTermBegins("");
    setResumptionDate("");
    setGender("");
    setTeacherName("");
    setTeacherComment("");
    setPrincipalComment("");
    setTeacherSignature("");
    setPrincipalSignature("");
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setBehaviourRatings(defaultBehaviourRatings);
  }

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

  function loadCard(card: AdminReportCard) {
    setEditingCardId(card.id);
    setStudentId(card.studentId);
    setClassName(card.className);
    setTerm(card.term);
    setSessionLabel(card.sessionLabel);
    setAttendanceDays(card.attendanceDays ? String(card.attendanceDays) : "");
    setNextTermBegins(card.nextTermBegins ?? "");
    setResumptionDate(card.resumptionDate ?? "");
    setGender(card.gender ?? "");
    setTeacherName(card.teacherName ?? "");
    setRows(card.subjects.map((row) => computeRow(row)));
    setBehaviourRatings(card.behaviourRatings?.length ? card.behaviourRatings : defaultBehaviourRatings);
    setTeacherComment(card.teacherComment ?? "");
    setPrincipalComment(card.principalComment ?? "");
    setTeacherSignature(card.teacherSignature ?? "");
    setPrincipalSignature(card.principalSignature ?? "");
    setFormMessage("Saved report card loaded for editing.");
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
        behaviourRatings,
        teacherComment,
        principalComment,
        teacherSignature,
        principalSignature,
      });

      setEditingCardId(saved.id);
      setGender(saved.gender);
      setTeacherName(saved.teacherName);
      setTeacherComment(saved.teacherComment);
      setPrincipalComment(saved.principalComment);
      setBehaviourRatings(saved.behaviourRatings);
      setTeacherSignature(saved.teacherSignature ?? "");
      setPrincipalSignature(saved.principalSignature ?? "");
      setFormMessage("Report card saved successfully.");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not save report card.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#0f172a_0%,#134e4a_55%,#ecfeff_55%,#ffffff_100%)] shadow-sm">
        <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_1fr] md:p-8">
          <div className="space-y-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Professional Report Builder
            </p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight">
              Build polished A4 report cards with signatures, behaviour ratings, and cleaner comments.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-emerald-50/90">
              Save report cards, reopen them for editing, and download them again any time.
              Third-term promotion comments are handled separately so first and second term cards stay appropriate.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/95 p-5 text-slate-900">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Editing" value={editingCardId ? "Saved card" : "New card"} />
              <StatCard label="Average" value={`${average.toFixed(2)}%`} />
              <StatCard label="Subjects" value={String(rows.filter((row) => row.subject.trim()).length)} />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Use the saved list below to reopen any report card without losing it.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Report Card Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a student, enter scores, and capture the teacher or principal signature directly on screen.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Clear Form
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Search Student">
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Name or DMS number"
            />
          </Field>
          <Field label="Student">
            <select
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
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
          </Field>
          <Field label="Class">
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="e.g. JSS1"
            />
          </Field>
          <Field label="Term">
            <select
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            >
              {terms.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Session">
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={sessionLabel}
              onChange={(event) => setSessionLabel(event.target.value)}
              placeholder="2025/2026"
            />
          </Field>
          <Field label="Attendance Days">
            <input
              type="number"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={attendanceDays}
              onChange={(event) => setAttendanceDays(event.target.value)}
            />
          </Field>
          <Field label="Next Term Begins">
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={nextTermBegins}
              onChange={(event) => setNextTermBegins(event.target.value)}
              placeholder="15/09/2026"
            />
          </Field>
          <Field label="Resumption Date">
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={resumptionDate}
              onChange={(event) => setResumptionDate(event.target.value)}
              placeholder="20/09/2026"
            />
          </Field>
          <Field label="Gender">
            <select
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field label="Teacher Name">
            <input
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              placeholder="Mrs. John"
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadPrefill}
              disabled={prefill.isLoading || !studentId}
              className="inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              {prefill.isLoading ? "Loading CBT scores..." : "Use CBT Exam Scores"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Subjects and Scores</h2>
            <p className="text-sm text-muted-foreground">
              Grade colours are applied automatically so failures such as F9 stand out immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Add Subject
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="py-3 pr-4">Subject</th>
                <th className="py-3 pr-4">CA</th>
                <th className="py-3 pr-4">Exam</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3 pr-4">Grade</th>
                <th className="py-3 pr-4">Remark</th>
                <th className="py-3 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const palette = getGradePalette(row.grade);
                return (
                  <tr key={`row-${index}`} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <input
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                        value={row.subject}
                        onChange={(event) =>
                          updateRow(index, { subject: event.target.value })
                        }
                        placeholder="Mathematics"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        className="w-24 rounded-xl border bg-background px-3 py-2 text-sm"
                        value={row.classWork}
                        onChange={(event) =>
                          updateRow(index, { classWork: Number(event.target.value) })
                        }
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        className="w-24 rounded-xl border bg-background px-3 py-2 text-sm"
                        value={row.examScore}
                        onChange={(event) =>
                          updateRow(index, { examScore: Number(event.target.value) })
                        }
                      />
                    </td>
                    <td className="py-3 pr-4 font-medium">{row.total}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          color: palette.text,
                          backgroundColor: palette.bg,
                          border: `1px solid ${palette.border}`,
                        }}
                      >
                        {row.grade}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{row.remark}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Behaviour Ratings and Comments</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
            {behaviourRatings.map((item) => (
              <div key={item.key} className="grid gap-2 sm:grid-cols-[1fr_140px] sm:items-center">
                <label className="text-sm font-medium text-slate-700">{item.label}</label>
                <select
                  className="rounded-xl border bg-white px-3 py-2 text-sm"
                  value={item.rating}
                  onChange={(event) =>
                    setBehaviourRatings((current) =>
                      current.map((rating) =>
                        rating.key === item.key
                          ? { ...rating, rating: event.target.value }
                          : rating,
                      ),
                    )
                  }
                >
                  <option value="">Not rated</option>
                  {behaviourRatingOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="grid gap-4">
            <Field label="Teacher's Comment">
              <textarea
                rows={4}
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                value={teacherComment}
                onChange={(event) => setTeacherComment(event.target.value)}
              />
            </Field>
            <Field label="Principal's Comment">
              <textarea
                rows={4}
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                value={principalComment}
                onChange={(event) => setPrincipalComment(event.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">On-screen Signatures</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <SignaturePad
            label="Teacher Signature"
            helper="Draw with your finger, mouse, or stylus."
            value={teacherSignature}
            onChange={setTeacherSignature}
          />
          <SignaturePad
            label="Principal Signature"
            helper="Optional if the principal signs separately."
            value={principalSignature}
            onChange={setPrincipalSignature}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-muted px-3 py-1 text-sm">
            Average: {average.toFixed(2)}%
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveReportCard.isPending}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saveReportCard.isPending
              ? "Saving..."
              : editingCardId
                ? "Update Report Card"
                : "Save Report Card"}
          </button>
          {formMessage ? <p className="text-sm text-muted-foreground">{formMessage}</p> : null}
        </div>
      </section>

      <section className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Saved Report Cards</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading report cards...</p>
        ) : !reportCards?.length ? (
          <p className="text-sm text-muted-foreground">
            No report cards found for the current filter.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Student</th>
                  <th className="py-3 pr-4">Class</th>
                  <th className="py-3 pr-4">Term</th>
                  <th className="py-3 pr-4">Session</th>
                  <th className="py-3 pr-4">Average</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportCards.map((card) => (
                  <tr key={card.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      {card.studentName}
                      <div className="text-xs text-muted-foreground">{card.studentDmsNumber}</div>
                    </td>
                    <td className="py-3 pr-4">{card.className}</td>
                    <td className="py-3 pr-4">{card.term}</td>
                    <td className="py-3 pr-4">{card.sessionLabel}</td>
                    <td className="py-3 pr-4">{card.average.toFixed(2)}%</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => loadCard(card)}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <a href={`/report-cards/${card.id}`} className="text-primary hover:underline">
                          View
                        </a>
                        <a href={`/api/report-cards/${card.id}/export?format=pdf`} className="text-primary hover:underline">
                          PDF
                        </a>
                        <a href={`/api/report-cards/${card.id}/export?format=svg`} className="text-primary hover:underline">
                          SVG
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SignaturePad({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (!value) {
      context.strokeStyle = "#0f172a";
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.lineJoin = "round";
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = value;
  }, [value]);

  function getPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    drawingRef.current = true;
    const point = getPosition(event);
    context.strokeStyle = "#0f172a";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !drawingRef.current) return;
    const point = getPosition(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !drawingRef.current) return;
    drawingRef.current = false;
    context.closePath();
    onChange(canvas.toDataURL("image/png"));
  }

  function clearSignature() {
    onChange("");
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-1 text-sm text-slate-600">{helper}</p>
        </div>
        <button
          type="button"
          onClick={clearSignature}
          className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-white"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={180}
        className="mt-4 h-40 w-full rounded-2xl border border-dashed border-slate-300 bg-white touch-none"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
    </div>
  );
}
