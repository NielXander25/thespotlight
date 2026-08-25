"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/store";
import { NewQuestionForm } from "@/components/admin/NewQuestionForm";
import { QuestionCard } from "@/components/admin/QuestionCard";

export default function QuestionsPage() {
  const fetchQuestions = useAdminStore((s) => s.fetchQuestions);
  const questions = useAdminStore((s) => s.questions);
  const questionsLoading = useAdminStore((s) => s.questionsLoading);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-beam">Questions</h1>
          <p className="mt-1 text-sm text-mist">
            Create a question, copy its link, and share it — every guess that comes back
            is tagged with exactly which question it answered.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          {showForm ? "Close" : "New question"}
        </button>
      </div>

      {showForm && (
        <div className="mt-5">
          <NewQuestionForm onCreated={() => setShowForm(false)} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {questionsLoading && questions.length === 0 && (
          <p className="text-sm text-mist">Loading questions…</p>
        )}
        {!questionsLoading && questions.length === 0 && (
          <p className="text-sm text-mist">
            No questions yet — create one above to get your first shareable link.
          </p>
        )}
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}
