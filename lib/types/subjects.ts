// lib/types/subjects.ts

// API Response Types
export interface ApiSubjectsResponse {
  success: boolean;
  message: string;
  content: {
    subjects: SubjectItem[]; // All user's subjects
    compulsory_selective_status: "not_selected" | "selected";
    compulsory_selective: SubjectItem[]; // Religious studies options
    selective_status: "not_selected" | "selected";
    selective: SubjectItem[]; // Available elective subjects
  };
  code: number;
}

export interface SubjectItem {
  id: number;
  name: string;
  slug?: string; // Optional for backward compatibility
}

// Legacy alias for backward compatibility
export interface Subject extends SubjectItem {}

export interface Class {
  id: number;
  name: string; // "JSS1", "JSS2", "SSS1", etc.
}

export interface SubjectsContent {
  subjects: SubjectItem[];
  compulsory_selective_status: "not_selected" | "selected" | "pending";
  compulsory_selective: SubjectItem[];
  selective_status: "not_selected" | "selected" | "pending";
  selective: SubjectItem[];
}

export interface SubjectsResponse {
  success: boolean;
  message: string;
  content: SubjectsContent | null;
  code: number;
}

export interface UpdateResponse {
  success: boolean;
  message: string;
  content: null;
  code: number;
  errors?: Record<string, string | string[]>;
}

export interface ProfileData {
  id: number;
  name: string | null;
  username: string | null;
  email: string;
  phone: string | null;
  school: string | null;
  class: string | null; // JSS1, JSS2, JSS3, SSS1, SSS2, SSS3
  discipline: string | null; // Art, Commercial, Science
  date_of_birth: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  gender: string | null;
  status: string;
  created_at: string;
  role: string[];
}

export interface DashboardData {
  success: boolean;
  message: string;
  content: {
    name: string;
    subjects: string;
    lessons: string;
    progress: {
      subject: string;
      covered: number;
      left: number;
    };
    quizzes: string;
    subscription_status: string;
  };
  code: number;
}

// Frontend State Types
export interface SubjectRegistrationState {
  step: 1 | 2 | 3 | 4;
  profile: {
    class: string; // JSS1-JSS3 or SSS1-SSS3
    discipline?: string; // Only for SSS
    term: string; // 1, 2, 3
  };
  compulsorySelective: number | null; // Selected religious study ID
  selectiveSubjects: number[]; // Selected elective IDs
  availableSubjects: {
    compulsory: SubjectItem[];
    selective: SubjectItem[];
  };
}

// Student API Response Types

export interface StudentClass {
  class_id: number;
  class_name: string;
}

export interface ClassItem {
  id: number;
  name: string;
}

export interface TermItem {
  id: number;
  name: string;
}

export interface WeekItem {
  id: number;
  name: number;
}

export interface StudentClassResponse {
  success: boolean;
  message: string;
  content: StudentClass | null;
  code: number;
}

export interface ClassesResponse {
  success: boolean;
  message: string;
  content: { classes: ClassItem[] } | null;
  code: number;
}

export interface TermsResponse {
  success: boolean;
  message: string;
  content: { terms: TermItem[] } | null;
  code: number;
}

export interface WeeksResponse {
  success: boolean;
  message: string;
  content: { weeks: WeekItem[] } | null;
  code: number;
}
