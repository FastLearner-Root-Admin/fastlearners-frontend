// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  content: T | null;
  code: number;
  type?: "success" | "error" | "info" | "warning";
  errors?: Record<string, string[]>;
}

// User Types
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  email_verified_at: string | null;
  phone: string;
  school: string | null;
  class: string | null;
  discipline: string | null;
  date_of_birth: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  gender: string | null;
  parent_email?: string | null;
  parent_phone?: string | null;
  image: string | null;
  avatar?: string | null;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  role: UserRole[];
  child_email?: string | null;
  child_phone?: string | null;
  subscription_status?: string | null;
}

export type UserRole =
  | "guest"
  | "student"
  | "guardian"
  | "teacher"
  | "admin"
  | "superadmin";
export type ProfileStatus =
  | "guest"
  | "basic_complete"
  | "role_selected"
  | "role_details_complete"
  | "complete";

// Authentication Types
export interface AuthTokens {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email_phone: string;
  password: string;
}

export interface RegisterData {
  email: string;
  referral_code?: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface CreatePasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordData {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyResetCodeData {
  email: string;
  code: string;
}

// Profile Types
export interface ProfileUpdateData {
  name?: string;
  username?: string;
  phone?: string;
  school?: string;
  class?: string;
  discipline?: string;
  date_of_birth?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  gender?: string;
  role?: string;
  parent_email?: string;
  parent_phone?: string;

  // Guardian-specific fields
  child_email?: string;
  child_phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// Guest capabilities and content access levels
export interface GuestCapabilities {
  canBrowseContent: boolean;
  canPreviewActivities: boolean;
  canAccessInteractiveFeatures: boolean;
  canMakeTransactions: boolean;
  canAccessPersonalizedContent: boolean;
}

export const guestCapabilities: GuestCapabilities = {
  canBrowseContent: true, // ✅ Browse course catalogs, descriptions
  canPreviewActivities: true, // ✅ Preview sample lessons, demos
  canAccessInteractiveFeatures: false, // ❌ Cannot interact with content
  canMakeTransactions: false, // ❌ Cannot purchase or enroll
  canAccessPersonalizedContent: false, // ❌ No personalized recommendations
};

// Stage 1: Basic profile information
export interface BasicProfileData {
  full_name: string;
  email: string; // Pre-filled from registration
  date_of_birth: string; // For age verification (COPPA compliance)
  role: "student" | "parent";
}

// Stage 2A: Student-specific details
export interface StudentProfileData {
  grade_level: string;
  school_name?: string;
  subjects_of_interest: string[];
  learning_goals?: string;
  preferred_learning_style: "visual" | "auditory" | "kinesthetic" | "mixed";
}

// Stage 2B: Parent-specific details
export interface ParentProfileData {
  children: ChildInfo[];
  relationship_to_children: string;
  educational_involvement_level: "high" | "medium" | "low";
  communication_preferences: string[];
}

export interface ChildInfo {
  name: string;
  age: number;
  grade_level: string;
}
