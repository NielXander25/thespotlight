import { create } from "zustand";
import type { Submission, SubmissionStats, QuestionWithCount, QuestionInput } from "./types";

interface Filters {
  search: string;
  department: string; // "all" or a specific department
  questionId: string; // "all", "none" (uncategorized), or a specific question id
  sort: "newest" | "oldest";
  featuredOnly: boolean;
  includeHidden: boolean;
}

interface QuestionListItem {
  id: string;
  title: string;
  slug: string;
}

interface AdminState {
  submissions: Submission[];
  stats: SubmissionStats;
  departmentList: string[];
  questionList: QuestionListItem[]; // lightweight list, for the filter dropdown
  questions: QuestionWithCount[]; // full list with counts, for the Questions page
  questionsLoading: boolean;
  filters: Filters;
  loading: boolean;
  selectedForShare: string[];

  setFilters: (patch: Partial<Filters>) => void;
  fetchSubmissions: () => Promise<void>;
  updateSubmission: (id: string, patch: Partial<Submission>) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
  toggleShareSelection: (id: string) => void;
  clearShareSelection: () => void;

  fetchQuestions: () => Promise<void>;
  createQuestion: (input: QuestionInput) => Promise<{ ok: boolean; error?: string }>;
  updateQuestion: (id: string, patch: Partial<QuestionInput & { is_active: boolean }>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.department !== "all") params.set("department", filters.department);
  if (filters.questionId !== "all") params.set("questionId", filters.questionId);
  params.set("sort", filters.sort);
  if (filters.featuredOnly) params.set("featured", "true");
  if (filters.includeHidden) params.set("includeHidden", "true");
  return params.toString();
}

export const useAdminStore = create<AdminState>((set, get) => ({
  submissions: [],
  stats: { total: 0, departments: 0, today: 0 },
  departmentList: [],
  questionList: [],
  questions: [],
  questionsLoading: false,
  filters: {
    search: "",
    department: "all",
    questionId: "all",
    sort: "newest",
    featuredOnly: false,
    includeHidden: true,
  },
  loading: false,
  selectedForShare: [],

  setFilters: (patch) => {
    set((state) => ({ filters: { ...state.filters, ...patch } }));
    get().fetchSubmissions();
  },

  fetchSubmissions: async () => {
    set({ loading: true });
    try {
      const qs = buildQuery(get().filters);
      const res = await fetch(`/api/admin/submissions?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("failed to fetch");
      const body = await res.json();
      set({
        submissions: body.submissions,
        stats: body.stats,
        departmentList: body.departmentList,
        questionList: body.questionList ?? [],
      });
    } finally {
      set({ loading: false });
    }
  },

  updateSubmission: async (id, patch) => {
    // Optimistic update
    set((state) => ({
      submissions: state.submissions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      // Roll back by refetching on failure
      get().fetchSubmissions();
    }
  },

  deleteSubmission: async (id) => {
    const prev = get().submissions;
    set((state) => ({ submissions: state.submissions.filter((s) => s.id !== id) }));
    const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      set({ submissions: prev });
    } else {
      get().fetchSubmissions();
    }
  },

  toggleShareSelection: (id) => {
    set((state) => ({
      selectedForShare: state.selectedForShare.includes(id)
        ? state.selectedForShare.filter((s) => s !== id)
        : [...state.selectedForShare, id],
    }));
  },

  clearShareSelection: () => set({ selectedForShare: [] }),

  fetchQuestions: async () => {
    set({ questionsLoading: true });
    try {
      const res = await fetch("/api/admin/questions", { cache: "no-store" });
      if (!res.ok) throw new Error("failed to fetch questions");
      const body = await res.json();
      set({ questions: body.questions });
    } finally {
      set({ questionsLoading: false });
    }
  },

  createQuestion: async (input) => {
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error || "Failed to create question." };
    }
    await get().fetchQuestions();
    return { ok: true };
  },

  updateQuestion: async (id, patch) => {
    set((state) => ({
      questions: state.questions.map((q) => (q.id === id ? { ...q, ...patch } as QuestionWithCount : q)),
    }));
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      get().fetchQuestions();
    }
  },

  deleteQuestion: async (id) => {
    const prev = get().questions;
    set((state) => ({ questions: state.questions.filter((q) => q.id !== id) }));
    const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      set({ questions: prev });
    }
  },
}));
