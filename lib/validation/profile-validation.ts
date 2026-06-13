/**
 * Profile Edit Validation Logic
 * Centralized validation for profile updates based on API documentation
 */

export interface ProfileValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  cleanedData: Record<string, any>;
}

export interface CurrentProfile {
  role: string | string[];
  username: string | null;
  date_of_birth: string | null;
  class: string | null;
  discipline: string | null;
  gender: string | null;
  [key: string]: any;
}

export interface UpdateData {
  role?: string;
  username?: string;
  name?: string;
  phone?: string;
  school?: string;
  class?: string;
  discipline?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  parent_email?: string;
  parent_phone?: string;
  child_email?: string;
  child_phone?: string;
  [key: string]: any;
}

/**
 * Extract role as string from array or string format
 */
function extractRole(
  role: string | string[] | undefined | null,
): string | null {
  if (!role) return null;
  if (Array.isArray(role)) {
    return role[0] || null;
  }
  return typeof role === "string" ? role : String(role);
}

/**
 * Check if a field is already set and cannot be changed
 */
function isFieldLocked(fieldName: string, currentValue: any): boolean {
  // Fields are locked if they have a non-null, non-empty value
  if (currentValue === null || currentValue === undefined) {
    return false;
  }
  if (typeof currentValue === "string" && currentValue.trim() === "") {
    return false;
  }
  return true;
}

/**
 * Validate profile edit data based on role and field editability rules
 */
export function validateProfileEdit(
  currentProfile: CurrentProfile,
  updateData: UpdateData,
): ProfileValidationResult {
  const errors: Record<string, string[]> = {};
  const cleanedData: Record<string, any> = { ...updateData };

  // Extract current role
  const currentRole = extractRole(currentProfile.role);

  // 1. Handle role field - check if it can be changed, but don't block other updates
  // Role is only used for validation purposes, then removed from payload if already set
  let roleForValidation = currentRole; // Default to current role for validation

  if (cleanedData.role !== undefined) {
    // Normalize role format
    let normalizedRole = cleanedData.role;
    if (Array.isArray(normalizedRole)) {
      normalizedRole = normalizedRole[0] || "";
    }
    if (typeof normalizedRole !== "string") {
      normalizedRole = String(normalizedRole);
    }

    // Check if role can be changed (only if current role is "guest")
    if (currentRole !== "guest" && currentRole !== normalizedRole) {
      // Role is already set and user is trying to change it - remove from payload
      // But don't block the entire request, just remove the role field
      delete cleanedData.role;
      // Use current role for validation
      roleForValidation = currentRole;
    } else if (currentRole === "guest") {
      // Guest can set role - validate it
      if (!["student", "guardian"].includes(normalizedRole)) {
        errors.role = ["Role must be one of: student, guardian"];
      } else {
        cleanedData.role = normalizedRole;
        roleForValidation = normalizedRole;
      }
    } else {
      // Role matches current role or user is not trying to change it - remove from payload
      delete cleanedData.role;
      roleForValidation = currentRole;
    }
  } else {
    // No role in update data - use current role for validation
    delete cleanedData.role; // Ensure it's not sent
    roleForValidation = currentRole;
  }

  // 4. Check if username can be changed (only if current username is null)
  if (
    cleanedData.username !== undefined &&
    isFieldLocked("username", currentProfile.username)
  ) {
    errors.username = ["Username already updated and cannot be changed."];
  }

  // 5. Check if date_of_birth can be changed (only if current date_of_birth is null)
  if (
    cleanedData.date_of_birth !== undefined &&
    isFieldLocked("date_of_birth", currentProfile.date_of_birth)
  ) {
    errors.date_of_birth = [
      "Date of birth already updated. For further enquiries, please contact our support team.",
    ];
  }

  // 6. Check if class can be changed (only if current class is null)
  if (
    cleanedData.class !== undefined &&
    isFieldLocked("class", currentProfile.class)
  ) {
    errors.class = ["Class already updated. Make a request for class upgrade."];
  }

  // 7. Validate discipline based on class
  if (cleanedData.discipline !== undefined) {
    const classValue = cleanedData.class || currentProfile.class;

    // Check if discipline can be changed (only if current discipline is null)
    if (isFieldLocked("discipline", currentProfile.discipline)) {
      errors.discipline = [
        "Discipline already updated. For further enquiries, please contact our support team.",
      ];
    }

    // Discipline only allowed for SSS classes
    if (classValue && !classValue.startsWith("SSS")) {
      errors.discipline = [
        "You have to be in SSS class to choose a discipline!",
      ];
    }

    // Validate discipline value
    if (
      cleanedData.discipline &&
      !["Art", "Commercial", "Science"].includes(cleanedData.discipline)
    ) {
      errors.discipline = [
        "Discipline must be one of: Art, Commercial, Science",
      ];
    }
  }

  // 8. Check if gender can be changed (only if current gender is null)
  if (
    cleanedData.gender !== undefined &&
    isFieldLocked("gender", currentProfile.gender)
  ) {
    errors.gender = [
      "Gender already updated. For further enquiries, please contact our support team.",
    ];
  }

  // 9. Role-based field requirements (use roleForValidation which is the effective role)
  if (roleForValidation === "guardian") {
    // Guardian-specific: child_email and child_phone are required
    const childEmail = cleanedData.child_email;
    if (
      !childEmail ||
      (typeof childEmail === "string" && childEmail.trim() === "")
    ) {
      errors.child_email = ["Child Email is required for guardians."];
    } else if (typeof childEmail === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(childEmail.trim())) {
        errors.child_email = [
          "The child email field must be a valid email address.",
        ];
      } else {
        cleanedData.child_email = childEmail.trim();
      }
    }

    const childPhone = cleanedData.child_phone;
    if (
      !childPhone ||
      (typeof childPhone === "string" && childPhone.trim() === "")
    ) {
      errors.child_phone = ["Child Phone is required for guardians."];
    } else if (typeof childPhone === "string") {
      const phoneTrimmed = childPhone.trim();
      if (phoneTrimmed.length < 8) {
        errors.child_phone = [
          "The child phone field must be at least 8 characters.",
        ];
      } else {
        cleanedData.child_phone = phoneTrimmed;
      }
    } else {
      errors.child_phone = ["The child phone field must be a string."];
    }

    // Guardian requires: gender, country, state, city, address (if not already set)
    if (
      !isFieldLocked("gender", currentProfile.gender) &&
      !cleanedData.gender
    ) {
      errors.gender = ["The gender is required for guardians."];
    }
    if (
      !cleanedData.country ||
      (typeof cleanedData.country === "string" &&
        cleanedData.country.trim() === "")
    ) {
      errors.country = ["The country is required for guardians."];
    }
    if (
      !cleanedData.state ||
      (typeof cleanedData.state === "string" && cleanedData.state.trim() === "")
    ) {
      errors.state = ["The state field is required."];
    }
    if (
      !cleanedData.city ||
      (typeof cleanedData.city === "string" && cleanedData.city.trim() === "")
    ) {
      errors.city = ["The city field is required."];
    }
    if (
      !cleanedData.address ||
      (typeof cleanedData.address === "string" &&
        cleanedData.address.trim() === "")
    ) {
      errors.address = ["The address field is required."];
    }
  }

  if (roleForValidation === "student") {
    // Student-specific: parent email, school, class, discipline (if SSS), and location are required
    // Note: Except for students, school, class and discipline are NOT required for other roles
    const parentEmail = cleanedData.parent_email;
    if (
      !parentEmail ||
      (typeof parentEmail === "string" && parentEmail.trim() === "")
    ) {
      errors.parent_email = ["The parent email is required."];
    } else if (typeof parentEmail === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(parentEmail.trim())) {
        errors.parent_email = [
          "The parent email field must be a valid email address.",
        ];
      } else {
        cleanedData.parent_email = parentEmail.trim();
      }
    }

    if (
      !cleanedData.school ||
      (typeof cleanedData.school === "string" &&
        cleanedData.school.trim() === "")
    ) {
      errors.school = ["The school field is required."];
    }
    if (
      !cleanedData.class ||
      (typeof cleanedData.class === "string" && cleanedData.class.trim() === "")
    ) {
      errors.class = ["The class field is required."];
    }
    if (
      !cleanedData.country ||
      (typeof cleanedData.country === "string" &&
        cleanedData.country.trim() === "")
    ) {
      errors.country = ["The country field is required."];
    }
    if (
      !cleanedData.state ||
      (typeof cleanedData.state === "string" && cleanedData.state.trim() === "")
    ) {
      errors.state = ["The state field is required."];
    }
    if (
      !cleanedData.city ||
      (typeof cleanedData.city === "string" && cleanedData.city.trim() === "")
    ) {
      errors.city = ["The city field is required."];
    }
    if (
      !cleanedData.address ||
      (typeof cleanedData.address === "string" &&
        cleanedData.address.trim() === "")
    ) {
      errors.address = ["The address field is required."];
    }

    // Discipline required for SSS classes
    const classValue = cleanedData.class || currentProfile.class;
    if (classValue && classValue.startsWith("SSS")) {
      if (
        !cleanedData.discipline ||
        (typeof cleanedData.discipline === "string" &&
          cleanedData.discipline.trim() === "")
      ) {
        errors.discipline = ["The discipline field is required."];
      }
    }

    // Remove child fields for students (not required)
    delete cleanedData.child_email;
    delete cleanedData.child_phone;
  }

  // 10. Clean up data: remove empty strings, null, undefined for optional fields
  Object.keys(cleanedData).forEach((key) => {
    const value = cleanedData[key];
    // Keep phone and guardian-specific fields even if empty (they're handled above)
    // Role is already handled and removed if needed
    if (key === "phone" || key === "child_email" || key === "child_phone") {
      // Only remove if it's an empty string and not required
      if (value === "" && roleForValidation !== "guardian") {
        delete cleanedData[key];
      }
      return;
    }
    // Remove undefined, null, or empty strings for other fields
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      delete cleanedData[key];
    }
  });

  // 11. Remove discipline for non-SSS classes
  const finalClass = cleanedData.class || currentProfile.class;
  if (finalClass && !finalClass.startsWith("SSS")) {
    delete cleanedData.discipline;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cleanedData,
  };
}
