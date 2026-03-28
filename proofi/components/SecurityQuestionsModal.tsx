"use client";

import { useState } from "react";

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What was the name of your primary school?",
  "What is your mother's maiden name?",
  "What was the make and model of your first car?",
  "What is the name of the town where you were born?",
  "What was the name of your childhood best friend?",
  "What was the street you grew up on?",
  "What is the name of the first company you worked for?",
  "What was your childhood nickname?",
  "What is the name of the hospital where you were born?",
  "What was your favourite subject in school?",
  "What was the name of your first teacher?",
  "What is your oldest sibling's middle name?",
  "What was the name of your favourite childhood sports team?",
  "What was your favourite book as a child?",
  "What was the first concert you attended?",
  "What was the name of your first boyfriend or girlfriend?",
  "What was your dream job as a child?",
  "What was the first country you visited?",
  "What was the name of your favourite childhood restaurant?",
];

interface Props {
  userId: string;
  onComplete: () => void;
}

interface QuestionState {
  question: string;
  answer: string;
}

export default function SecurityQuestionsModal({ userId, onComplete }: Props) {
  const [questions, setQuestions] = useState<QuestionState[]>([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [errors, setErrors] = useState<string[]>(["", "", ""]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setQuestion = (index: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], question: value };
      return updated;
    });
    setErrors((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });
    setGlobalError(null);
  };

  const setAnswer = (index: number, value: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], answer: value };
      return updated;
    });
    setErrors((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });
    setGlobalError(null);
  };

  const validate = (): boolean => {
    const newErrors = ["", "", ""];
    let valid = true;

    const selectedQuestions = questions.map((q) => q.question);

    for (let i = 0; i < 3; i++) {
      if (!questions[i].question) {
        newErrors[i] = "Please select a question.";
        valid = false;
      } else if (questions[i].answer.trim().length < 2) {
        newErrors[i] = "Answer must be at least 2 characters.";
        valid = false;
      }
    }

    // Check for duplicate questions
    const uniqueQuestions = new Set(
      selectedQuestions.filter((q) => q !== "")
    );
    if (uniqueQuestions.size < selectedQuestions.filter((q) => q !== "").length) {
      setGlobalError(
        "You must select a different question for each slot. Please change your selections."
      );
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError(null);

    try {
      const res = await fetch("/api/security-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          q1: questions[0].question,
          a1: questions[0].answer.trim().toLowerCase(),
          q2: questions[1].question,
          a2: questions[1].answer.trim().toLowerCase(),
          q3: questions[2].question,
          a3: questions[2].answer.trim().toLowerCase(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setGlobalError(data.error || "Failed to save security questions. Please try again.");
        setLoading(false);
        return;
      }

      onComplete();
    } catch {
      setGlobalError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Available questions for each slot (exclude questions already picked in other slots)
  const getAvailableQuestions = (slotIndex: number) => {
    const otherSelected = questions
      .filter((_, i) => i !== slotIndex)
      .map((q) => q.question)
      .filter(Boolean);
    return SECURITY_QUESTIONS.filter((q) => !otherSelected.includes(q));
  };

  return (
    // Full-screen overlay — no way to dismiss, no close button
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-y-auto"
        style={{
          background: "linear-gradient(135deg, #0f0f1a 0%, #0a0a12 100%)",
          maxHeight: "90vh",
        }}
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(79,70,229,0.15))",
                border: "1px solid rgba(124,58,237,0.4)",
              }}
            >
              <svg
                className="w-7 h-7 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Set Up Security Questions
            </h2>
          </div>

          {/* Info box — required message */}
          <div
            className="rounded-xl px-4 py-3 mb-6 text-sm leading-relaxed"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "rgba(196,181,253,1)",
            }}
          >
            These security questions are required to verify your identity if you
            ever need to reset your password. You cannot skip this step.
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Question {i + 1}
                </p>

                {/* Question dropdown */}
                <select
                  value={questions[i].question}
                  onChange={(e) => setQuestion(i, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all mb-2 appearance-none cursor-pointer"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" disabled style={{ background: "#0f0f1a" }}>
                    — Select a question —
                  </option>
                  {getAvailableQuestions(i).map((q) => (
                    <option key={q} value={q} style={{ background: "#0f0f1a" }}>
                      {q}
                    </option>
                  ))}
                  {/* Keep the selected question visible even if it would be filtered */}
                  {questions[i].question &&
                    !getAvailableQuestions(i).includes(questions[i].question) && (
                      <option
                        value={questions[i].question}
                        style={{ background: "#0f0f1a" }}
                      >
                        {questions[i].question}
                      </option>
                    )}
                </select>

                {/* Answer input */}
                <input
                  type="text"
                  value={questions[i].answer}
                  onChange={(e) => setAnswer(i, e.target.value)}
                  placeholder="Your answer"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                />

                {errors[i] && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                    {errors[i]}
                  </p>
                )}
              </div>
            ))}

            {globalError && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <svg
                  className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="text-sm text-red-400">{globalError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving…
                </span>
              ) : (
                "Save Security Questions"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
