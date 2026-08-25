import { create } from "zustand";
import type { Submission, SubmissionStats } from "./types";

interface Filters {
  search: string;
  department: string; // "all" or a specific department
  sort: "newest" | "oldest";
  featuredOnly: boolean;
  includeHidden: boolean;
}

interface AdminState {
  submissions: Submission[];
  stats: SubmissionStats;
  departmentList: string[];
  filters: Filters;
  loading: boolean;
  selectedForShare: string[];

  setFilters: (patch: Partial<Filters>) => void;
  fetchSubmissions: () => Promise<void>;
  updateSubmission: (id: string, patch: Partial<Submission>) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
  toggleShareSelection: (id: string) => void;
  clearShareSelection: () => void;
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.department !== "all") params.set("department", filters.department);
  params.set("sort", filters.sort);
  if (filters.featuredOnly) params.set("featured", "true");
  if (filters.includeHidden) params.set("includeHidden", "true");
  return params.toString();
}

export const useAdminStore = create<AdminState>((set, get) => ({
  submissions: [],
  stats: { total: 0, departments: 0, today: 0 },
  departmentList: [],
  filters: {
    search: "",
    department: "all",
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
}));
