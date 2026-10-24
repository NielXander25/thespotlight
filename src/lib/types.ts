export type SubmissionStatus = "visible" | "hidden";

export interface Question {
  id: string;
  slug: string;
  title: string;
  subtext: string | null;
  reveal_label: string;
  is_active: boolean;
  created_at: string;
}

export interface QuestionWithCount extends Question {
  guess_count: number;
}

export interface Submission {
  id: string;
  question_id: string | null; // null = legacy submission from before questions existed
  name: string;
  department: string;
  message: string;
  created_at: string;
  status: SubmissionStatus;
  featured: boolean;
  identity_revealed: boolean; // admin can choose to reveal identity in Share View
  ip_hash: string | null; // hashed, never raw IP — for basic spam throttling only
  user_id: string | null; // reserved for account-based submissions (not used yet)
  // Populated by the admin list endpoint via a join — not a real column.
  question?: { id: string; title: string; slug: string } | null;
}

export interface PublicSubmissionInput {
  questionId: string;
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

export interface QuestionInput {
  title: string;
  subtext?: string;
  revealLabel?: string;
  slug?: string;
}

export type MessageChannel = "anonymous" | "founder";

export interface Message {
  id: string;
  channel: MessageChannel;
  body: string;
  sender_name: string | null; // founder channel only, optional
  sender_contact: string | null; // founder channel only, optional
  is_read: boolean;
  created_at: string;
  expires_at: string; // created_at + 30 days; purged after this unless deleted sooner
}

export interface PublicMessageInput {
  channel: MessageChannel;
  body: string;
  senderName?: string;
  senderContact?: string;
  honeypot?: string; // spam trap, must stay empty
}
