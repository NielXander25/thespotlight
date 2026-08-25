export type SubmissionStatus = "visible" | "hidden";

export interface Submission {
  id: string;
  name: string;
  department: string;
  message: string;
  created_at: string;
  status: SubmissionStatus;
  featured: boolean;
  identity_revealed: boolean; // admin can choose to reveal identity in Share View
  ip_hash: string | null; // hashed, never raw IP — for basic spam throttling only
}

export interface PublicSubmissionInput {
  name: string;
  department: string;
  message: string;
  honeypot?: string; // spam trap, must stay empty
}

export interface SubmissionStats {
  total: number;
  departments: number;
  today: number;
}
