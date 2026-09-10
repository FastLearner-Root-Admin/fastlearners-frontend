import { PaginationLinks, PaginationMeta } from "@/lib/types/subscription";

export interface QuizDashboardUser {
  name: string;
  class: string;
  age: number | null;
  location: string | null;
  sponsor: string | null;
}

export interface QuizDashboard {
  user: QuizDashboardUser;
  pairing_details: unknown[];
  matching_history: unknown[];
  leaderboard: unknown[];
}

export interface QuizState {
  id: number;
  name: string;
  slug: string;
  code: string;
  zone: string | null;
}

export interface QuizLga {
  id: number;
  name: string;
  slug: string;
  code: string;
  zone: string | null;
}

export type CompetitionStatus =
  | "Registration Open"
  | "Registration Closed"
  | "Published"
  | "Archived"
  | string;

export interface QuizCompetition {
  id: number;
  title: string;
  description: string;
  competition_code: string;
  registration_start_date: string;
  registration_end_date: string;
  competition_date: string;
  start_time: string;
  end_time: string;
  status: CompetitionStatus;
  is_active: boolean;
  created_at: string;
}

export type RegistrationStatus = "approved" | "pending" | "rejected" | string;

export interface QuizRegistration {
  id: number;
  competition_title: string;
  competition_description: string;
  competition_code: string;
  registration_start_date: string;
  registration_end_date: string;
  competition_date: string;
  competition_start_time: string;
  competition_end_time: string;
  competition_status: CompetitionStatus;
  user_code: string;
  state: string;
  lga: string;
  sponsor: string | null;
  registration_status: RegistrationStatus;
  created_at: string;
}

// ---- Superadmin management ----

export interface AdminQuizCompetition {
  id: number;
  title: string;
  description: string;
  competition_code: string;
  registration_start_date: string;
  registration_end_date: string;
  competition_date: string;
  start_time: string;
  end_time: string;
  maximum_contestants: number;
  registered_contestants: number;
  available_slots: number;
  status: CompetitionStatus;
  allow_self_registration: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface CreateQuizCompetitionData {
  title: string;
  description: string;
  registration_start_date: string;
  registration_end_date: string;
  competition_date: string;
  start_time: string;
  end_time: string;
  maximum_contestants: string;
  competition_status_id: number;
  allow_self_registration: 0 | 1;
  is_active: 0 | 1;
}

export interface QuizCompetitionStatusOption {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminQuizState {
  id: number;
  name: string;
  slug: string;
  code: string;
  zone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminQuizLga {
  id: number;
  name: string;
  slug: string;
  code: string;
  state: string;
  state_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStateData {
  name: string;
  code: string;
  zone: string;
}

export interface CreateLgaData {
  name: string;
  code: string;
  state_id: number;
}

export type { PaginationLinks, PaginationMeta };
