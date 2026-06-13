import { User } from "@/lib/types/auth";

// Define required fields by role
const REQUIRED_FIELDS: Record<string, string[]> = {
  guest: ["name", "email", "role"],
  student: [
    "name",
    "email",
    "username",
    "phone",
    "parent_email",
    "school",
    "class",
    "date_of_birth",
    "gender",
    "country",
    "state",
    "city",
    "address",
    // discipline is conditionally required for SS/SSS classes only
  ],
  guardian: [
    "name",
    "email",
    "username",
    "phone",
    "date_of_birth",
    "gender",
    "country",
    "state",
    "city",
    "address",
    "child_email",
    "child_phone",
  ],
};

/**
 * Gets the required fields for a student based on their class.
 * Discipline is only required for SS/SSS classes, not JSS.
 */
function getRequiredFieldsForStudent(user: User): string[] {
  const baseFields = REQUIRED_FIELDS.student;
  const userClass = user.class;

  // Only include discipline if class starts with SS or SSS
  if (
    userClass &&
    (userClass.startsWith("SS") || userClass.startsWith("SSS"))
  ) {
    return [...baseFields, "discipline"];
  }

  return baseFields;
}

// Human-readable labels for fields
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  username: "Username",
  phone: "Phone",
  parent_email: "Parent Email",
  school: "School",
  class: "Class",
  date_of_birth: "Date of Birth",
  gender: "Gender",
  country: "Country",
  state: "State",
  city: "City",
  address: "Address",
  discipline: "Discipline",
  child_email: "Child Email",
  child_phone: "Child Phone",
  role: "Role",
};

/**
 * Calculates the profile completion percentage based on required fields for the user's role.
 * @param user - The user object
 * @returns A number between 0 and 100 representing completion percentage
 */
export function calculateProfileCompletion(user: User): number {
  if (!user) return 0;

  const role = user.role[0];
  let required: string[];

  // Use dynamic required fields for students based on class
  if (role === "student") {
    required = getRequiredFieldsForStudent(user);
  } else {
    required = REQUIRED_FIELDS[role] || [];
  }

  let filled = 0;

  for (const field of required) {
    if (field === "role") {
      // For role, check if user has selected a non-guest role
      if (user.role[0] !== "guest") {
        filled++;
      }
    } else {
      const value = user[field as keyof User];
      if (value !== null && value !== undefined && value !== "") {
        filled++;
      }
    }
  }

  return required.length > 0
    ? Math.round((filled / required.length) * 100)
    : 100;
}

/**
 * Gets an array of human-readable names for missing required fields.
 * @param user - The user object
 * @returns An array of strings representing missing field names
 */
export function getMissingFields(user: User): string[] {
  if (!user) return [];

  const role = user.role[0];
  let required: string[];

  // Use dynamic required fields for students based on class
  if (role === "student") {
    required = getRequiredFieldsForStudent(user);
  } else {
    required = REQUIRED_FIELDS[role] || [];
  }

  const missing: string[] = [];

  for (const field of required) {
    if (field === "role") {
      if (user.role[0] === "guest") {
        missing.push(FIELD_LABELS[field]);
      }
    } else {
      const value = user[field as keyof User];
      if (value === null || value === undefined || value === "") {
        missing.push(FIELD_LABELS[field]);
      }
    }
  }

  return missing;
}

/**
 * Checks if the user's profile is complete (100% completion).
 * @param user - The user object
 * @returns True if profile is complete, false otherwise
 */
export function isProfileComplete(user: User): boolean {
  return calculateProfileCompletion(user) === 100;
}

/**
 * Gets the profile completion status including percentage, completeness, missing fields, and next step suggestion.
 * @param user - The user object (can be null)
 * @returns An object with completion details
 */
export function getProfileCompletionStatus(user: User | null): {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
  nextStep: string;
} {
  if (!user) {
    return {
      percentage: 0,
      isComplete: false,
      missingFields: [],
      nextStep: "Complete your profile",
    };
  }

  const percentage = calculateProfileCompletion(user);
  const isComplete = percentage === 100;
  const missingFields = getMissingFields(user);
  let nextStep = "Your profile is complete";

  if (missingFields.length > 0) {
    const firstMissing = missingFields[0].toLowerCase();
    if (firstMissing === "role") {
      nextStep = "Set your role";
    } else {
      nextStep = `Add your ${firstMissing}`;
    }
  }

  return {
    percentage,
    isComplete,
    missingFields,
    nextStep,
  };
}
