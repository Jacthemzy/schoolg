"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  normalizeExamSessionPayload,
  type ExamSessionPayload,
} from "@/lib/exam-session-payload";

export function ExamSessionClient({
  examId,
  initialData,
  initialTimeLeft,
}: {
  examId: string;
  initialData: ExamSessionPayload;
  initialTimeLeft: number;
}) {
  const router = useRouter();
  const [sessionData, setSessionData] = useState(() =>
    normalizeExamSessionPayload(initialData),
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [theoryAnswer, setTheoryAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [isOnline, setIsOnline] = useState(true);
  const expirySyncRef = useRef<string | null>(null);

  const draftKey = useMemo(
    () =>
      sessionData.currentQuestion
        ? `exam-draft:${examId}:${sessionData.currentQuestion.id}`
        : null,
    [examId, sessionData.currentQuestion],
  );

  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    preventBack();
    window.addEventListener("popstate", preventBack);
    return () => window.removeEventListener("popstate", preventBack);
  }, []);

  useEffect(() => {
    const updateStatus = () => setIsOnline(window.navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const timerTarget = useMemo(() => {
    if (sessionData.phase === "reading") {
      return sessionData.attempt.readingEndsAt ?? null;
    }

    if (sessionData.phase === "exam") {
      return sessionData.attempt.graceEndsAt ?? sessionData.attempt.examEndsAt ?? null;
    }

    return null;
  }, [
    sessionData.attempt.examEndsAt,
    sessionData.attempt.graceEndsAt,
    sessionData.attempt.readingEndsAt,
    sessionData.phase,
  ]);

  useEffect(() => {
    setTimeLeft(getTimeLeft(timerTarget));

    if (!timerTarget) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(timerTarget));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerTarget]);

  useEffect(() => {
    if (sessionData.phase === "submitted") {
      router.replace(`/results/${sessionData.attempt.id}`);
    }
  }, [router, sessionData.attempt.id, sessionData.phase]);

  useEffect(() => {
    if (!draftKey || !sessionData.currentQuestion) {
      setSelectedOption(null);
      setTheoryAnswer("");
      setError(null);
      return;
    }

    const savedDraft = window.localStorage.getItem(draftKey);
    if (!savedDraft) {
      setSelectedOption(null);
      setTheoryAnswer("");
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as {
        selectedOption?: number | null;
        theoryAnswer?: string;
      };
      setSelectedOption(
        Number.isInteger(parsed.selectedOption) ? Number(parsed.selectedOption) : null,
      );
      setTheoryAnswer(parsed.theoryAnswer ?? "");
    } catch {
      setSelectedOption(null);
      setTheoryAnswer("");
    }

    setError(null);
  }, [draftKey, sessionData.currentQuestion]);

  useEffect(() => {
    if (!draftKey) return;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        selectedOption,
        theoryAnswer,
      }),
    );
  }, [draftKey, selectedOption, theoryAnswer]);

  useEffect(() => {
    if (timeLeft > 0 || !timerTarget || !isOnline) {
      return;
    }

    if (expirySyncRef.current === timerTarget) {
      return;
    }

    expirySyncRef.current = timerTarget;
    void refreshSession();
  }, [isOnline, timeLeft, timerTarget]);

  async function refreshSession() {
    const res = await fetch(`/api/student/exams/${examId}/session`, {
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) {
      setSessionData(normalizeExamSessionPayload(data));
    }
  }

  function clearDraft() {
    if (draftKey) {
      window.localStorage.removeItem(draftKey);
    }
  }

  async function submitAnswer() {
    if (sessionData.currentQuestion?.answerType === "objective") {
      if (selectedOption === null) {
        setError("Choose an option before moving to the next question.");
        return;
      }
    } else if (!theoryAnswer.trim()) {
      setError("Write your theory answer before moving to the next question.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/student/exams/${examId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        selectedOption,
        answerText: theoryAnswer,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Could not save your answer.");
      return;
    }

    clearDraft();

    if (data.submitted) {
      window.location.assign(`/results/${data.resultId ?? sessionData.attempt.id}`);
      return;
    }

    await refreshSession();
    setLoading(false);
  }

  async function submitExam() {
    setLoading(true);
    const res = await fetch(`/api/student/exams/${examId}/submit`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit your exam.");
      return;
    }

    clearDraft();
    window.location.assign(`/results/${data.resultId}`);
  }

  const isRecoveryWindow =
    sessionData.phase === "exam" &&
    Boolean(sessionData.attempt.examEndsAt) &&
    Boolean(sessionData.attempt.graceEndsAt) &&
    getTimeLeft(sessionData.attempt.examEndsAt) === 0 &&
    timeLeft > 0;
  const currentQuestion = sessionData.phase === "exam" ? sessionData.currentQuestion : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      {!isOnline ? (
        <section className="rounded-[2rem] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
          Network connection was lost. Your current answer is being kept on this device, and the exam will stay on this page until connection returns.
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              DMS CBT Examination
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {sessionData.exam.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {sessionData.exam.subject} • {sessionData.exam.classTarget}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              {sessionData.phase === "reading"
                ? "Reading Time"
                : isRecoveryWindow
                  ? "Recovery Window"
                  : "Exam Timer"}
            </p>
            <p className="mt-1 text-2xl font-semibold">{formatTime(timeLeft)}</p>
          </div>
        </div>
      </section>

      {sessionData.phase === "reading" ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Read carefully before the exam starts
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            You are in reading mode. Answers are locked until the countdown ends. Once the
            exam starts, questions will appear one at a time and you cannot go back to a
            previous question.
          </p>
        </section>
      ) : null}

      {sessionData.phase === "exam" && currentQuestion ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-600">
              Question {currentQuestion.questionNumber} of {sessionData.questionsCount}
            </p>
            <p className="text-sm text-slate-600">
              Answered: {sessionData.attempt.answersCount}
            </p>
          </div>

          {isRecoveryWindow ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              Extra recovery time is active so brief network issues do not force an early
              submission. Submit as soon as you are done.
            </div>
          ) : null}

          <h2 className="mt-6 text-xl font-semibold text-slate-950">
            {currentQuestion.questionText || "Study the question image below."}
          </h2>

          <p className="mt-3 text-sm text-slate-600">
            {currentQuestion.answerType === "objective"
              ? "Select one option. Once you move on, the answer is locked."
              : "Write a clear theory answer. Your draft stays on this device if the network drops."}
          </p>

          {currentQuestion.questionType === "image" && currentQuestion.questionImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentQuestion.questionImageUrl}
              alt={`Question ${currentQuestion.questionNumber}`}
              className="mt-5 max-h-[28rem] w-full rounded-2xl border border-slate-200 object-contain"
            />
          ) : null}

          {currentQuestion.answerType === "objective" ? (
            <div className="mt-6 grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={`${currentQuestion.id}-${option}-${index}`}
                  type="button"
                  onClick={() => setSelectedOption(index)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                    selectedOption === index
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>{" "}
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <label className="text-sm font-medium text-slate-800">Your theory answer</label>
              <textarea
                rows={8}
                value={theoryAnswer}
                onChange={(event) => setTheoryAnswer(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                placeholder="Type your answer here"
              />
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={submitAnswer}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : currentQuestion.answerType === "objective"
                  ? "Next Question"
                  : "Save and Continue"}
            </button>
            <button
              type="button"
              onClick={submitExam}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Submit Exam
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getTimeLeft(target?: string | null) {
  if (!target) {
    return 0;
  }

  return Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000));
}
