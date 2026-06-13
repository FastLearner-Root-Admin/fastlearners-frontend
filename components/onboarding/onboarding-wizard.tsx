"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  UserCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { getClassLevelById, normalizeClassString } from "@/config/education";
import {
  getProfile,
  getProfileData,
  ProfileEditData,
  updateProfile,
  UserProfile,
} from "@/lib/api/profile";
import { UserRole } from "@/lib/types/auth";
import { ProfilePageData } from "@/lib/types/profile";
import { isValidDate, parseProfileDate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { useAcademicContext } from "@/components/providers/academic-context";

// Form validation schema with conditional validation
type RoleOption = "" | "student" | "guardian";

function showProfileErrorToast(message: string) {
  const lines = message
    .split(/\n|;\s*/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    toast.error(message);
    return;
  }

  toast.error("Please review these profile fields", {
    description: (
      <ul className="list-disc space-y-1 pl-4">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    ),
  });
}

const createOnboardingSchema = (
  primaryRole: string | null,
  profileUsername: string | null,
  profile: UserProfile | null,
) => {
  return z
    .object({
      role: z
        .union([z.enum(["student", "guardian"]), z.literal("")])
        .optional(),
      name: z.string().min(1, "Name is required"),
      username: z.string().optional(),
      email: z.string().email("Please enter a valid email address"),
      phone: z.string().optional(),
      date_of_birth: z.preprocess(
        (value) => (isValidDate(value) ? value : undefined),
        z.date().optional(),
      ),
      gender: z.enum(["male", "female"]).optional(),
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
      school: z.string().optional(),
      class: z.string().optional(),
      discipline: z.string().optional(),
      parent_email: z
        .string()
        .email("Please enter a valid parent email address")
        .optional()
        .or(z.literal("")),
      child_email: z.string().email().optional().or(z.literal("")),
      child_phone: z.string().optional().or(z.literal("")),
    })
    .superRefine((data, ctx) => {
      // Require username when profile.username is null
      if (
        profileUsername === null &&
        (!data.username || data.username.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Username is required",
          path: ["username"],
        });
      }

      // Require role when primaryRole is guest
      if (primaryRole === "guest" && !data.role) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Role selection is required",
          path: ["role"],
        });
      }

      const effectiveRole = data.role || primaryRole;

      // Require phone for student and guardian roles when empty
      if (
        (effectiveRole === "student" || effectiveRole === "guardian") &&
        (!data.phone || data.phone.trim() === "")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required",
          path: ["phone"],
        });
      }

      // Require date_of_birth when it is null in profile (for both roles)
      if (profile?.date_of_birth === null && !data.date_of_birth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of birth is required",
          path: ["date_of_birth"],
        });
      }

      // Require gender when it is null in profile (for both roles)
      if (profile?.gender === null && !data.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Gender is required",
          path: ["gender"],
        });
      }

      // Student-specific requirements
      if (effectiveRole === "student") {
        if (!data.parent_email || data.parent_email.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Parent email is required",
            path: ["parent_email"],
          });
        }

        if (!data.country || data.country.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Country is required for students",
            path: ["country"],
          });
        }

        if (!data.state || data.state.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "State is required for students",
            path: ["state"],
          });
        }

        if (!data.city || data.city.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "City is required for students",
            path: ["city"],
          });
        }

        // Require school for students
        if (!data.school || data.school.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "School is required for students",
            path: ["school"],
          });
        }

        // Require class for students
        if (!data.class || data.class.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Class is required for students",
            path: ["class"],
          });
        }

        // Require discipline when class starts with SS or SSS
        if (
          data.class &&
          (data.class.startsWith("SS") || data.class.startsWith("SSS"))
        ) {
          if (!data.discipline || data.discipline.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Discipline is required for senior secondary classes",
              path: ["discipline"],
            });
          }
        }
      }

      // Guardian-specific requirements
      if (effectiveRole === "guardian") {
        // Require child_email and child_phone for guardians
        if (!data.child_email || data.child_email.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Child email is required for guardians",
            path: ["child_email"],
          });
        }
        if (!data.child_phone || data.child_phone.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Child phone is required for guardians",
            path: ["child_phone"],
          });
        }

        // Require gender when not present in profile
        if (
          (profile?.gender === null ||
            profile?.gender === undefined ||
            profile?.gender === "") &&
          !data.gender
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Gender is required for guardians",
            path: ["gender"],
          });
        }

        // Require country when not present in profile
        if (
          (profile?.country === null ||
            profile?.country === undefined ||
            profile?.country === "") &&
          (!data.country || data.country.trim() === "")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Country is required for guardians",
            path: ["country"],
          });
        }

        // Require state when not present in profile
        if (
          (profile?.state === null ||
            profile?.state === undefined ||
            profile?.state === "") &&
          (!data.state || data.state.trim() === "")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "State is required for guardians",
            path: ["state"],
          });
        }

        // Require city when not present in profile
        if (
          (profile?.city === null ||
            profile?.city === undefined ||
            profile?.city === "") &&
          (!data.city || data.city.trim() === "")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "City is required for guardians",
            path: ["city"],
          });
        }
      }
    });
};

const STEPS = [
  { id: 1, title: "Role Selection", description: "Choose your account type" },
  {
    id: 2,
    title: "Basic Information",
    description: "Your name, username, and contact details",
  },
  {
    id: 3,
    title: "Personal Details",
    description: "Date of birth, gender, and location",
  },
  {
    id: 4,
    title: "Role-Specific Info",
    description: "Additional information based on your role",
  },
  {
    id: 5,
    title: "Review",
    description: "Review your information before completing",
  },
] as const;

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const { user, updateUserProfile } = useAuthStore();
  const { setCurrentClass } = useAcademicContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metadata, setMetadata] = useState<ProfilePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const primaryRole = profile
    ? Array.isArray(profile.role)
      ? profile.role[0]
      : profile.role
    : null;

  // Create schema with current context
  const onboardingSchema = useMemo(
    () =>
      createOnboardingSchema(primaryRole, profile?.username ?? null, profile),
    [primaryRole, profile],
  );

  type OnboardingFormData = z.infer<
    ReturnType<typeof createOnboardingSchema>
  > & {
    role?: RoleOption | undefined;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const selectedRole = watch("role");
  const selectedClass = watch("class");

  // Determine if we should skip steps
  const shouldSkipRoleSelection = primaryRole && primaryRole !== "guest";
  const effectiveSteps = useMemo(() => {
    if (shouldSkipRoleSelection) {
      return STEPS.filter((step) => step.id !== 1);
    }
    return STEPS;
  }, [shouldSkipRoleSelection]);

  const currentStepIndex = effectiveSteps.findIndex(
    (step) => step.id === currentStep,
  );
  const progress = ((currentStepIndex + 1) / effectiveSteps.length) * 100;

  // Load profile data and metadata
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [profileData, metadataData] = await Promise.all([
          getProfile(),
          getProfileData(),
        ]);
        setProfile(profileData);
        setMetadata(metadataData);

        // Populate form with profile data
        const genderValue: "male" | "female" | undefined =
          profileData.gender === "male"
            ? "male"
            : profileData.gender === "female"
              ? "female"
              : undefined;

        const profileRole = Array.isArray(profileData.role)
          ? profileData.role[0]
          : profileData.role;
        const formRole =
          profileRole === "guest"
            ? ""
            : profileRole === "student" || profileRole === "guardian"
              ? profileRole
              : "";

        setValue("name", profileData.name || "");
        setValue("username", profileData.username || "");
        setValue("email", profileData.email);
        setValue("phone", profileData.phone || "");
        setValue("role", formRole as "student" | "guardian" | "");
        setValue("school", profileData.school || "");
        setValue("class", profileData.class || "");
        setValue("discipline", profileData.discipline || "");
        setValue("parent_email", profileData.parent_email || "");
        setValue("date_of_birth", parseProfileDate(profileData.date_of_birth));
        setValue("gender", genderValue);
        setValue("country", profileData.country || "");
        setValue("state", profileData.state || "");
        setValue("city", profileData.city || "");
        setValue("address", profileData.address || "");
        setValue("child_email", profileData.child_email || "");
        setValue("child_phone", profileData.child_phone || "");
      } catch (error: any) {
        showProfileErrorToast(error.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setValue, primaryRole]);

  // Adjust current step if skipping
  useEffect(() => {
    if (shouldSkipRoleSelection && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [shouldSkipRoleSelection, currentStep]);

  const handleNext = async () => {
    let isValid = false;
    const effectiveRole = selectedRole || primaryRole;

    if (currentStep === 1) {
      isValid = await trigger(["role"] as (keyof OnboardingFormData)[]);

      // If role is valid and user is guest, submit role immediately
      if (isValid && primaryRole === "guest" && selectedRole) {
        try {
          setIsSubmitting(true);
          const updatedProfile = await updateProfile({
            role: selectedRole as "student" | "guardian",
          });

          // Refresh profile to get updated role
          const refreshedProfile = await getProfile();
          setProfile(refreshedProfile);

          // Update auth store
          const roles: UserRole[] = Array.isArray(updatedProfile.role)
            ? (updatedProfile.role as UserRole[])
            : ([updatedProfile.role] as UserRole[]);
          updateUserProfile({
            name: updatedProfile.name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            role: roles,
            username: updatedProfile.username || "",
            school: updatedProfile.school,
            class: updatedProfile.class,
            discipline: updatedProfile.discipline,
            date_of_birth: updatedProfile.date_of_birth,
            country: updatedProfile.country,
            state: updatedProfile.state,
            city: updatedProfile.city,
            gender: updatedProfile.gender,
            child_email: updatedProfile.child_email,
            child_phone: updatedProfile.child_phone,
          });

          toast.success("Role updated successfully");
        } catch (error: any) {
          showProfileErrorToast(error.message || "Failed to update role");
          isValid = false;
        } finally {
          setIsSubmitting(false);
        }
      }
    } else if (currentStep === 2) {
      // Validate basic info including phone (required for student/guardian)
      const fieldsToValidate: (keyof OnboardingFormData)[] = [
        "name",
        "username",
        "email",
      ];
      if (effectiveRole === "student" || effectiveRole === "guardian") {
        fieldsToValidate.push("phone");
      }
      isValid = await trigger(fieldsToValidate);
    } else if (currentStep === 3) {
      // Validate personal details - conditionally require based on profile state
      const fieldsToValidate: Array<keyof OnboardingFormData> = [];

      // Require date_of_birth when it is null in profile (for both roles)
      if (profile?.date_of_birth === null) {
        fieldsToValidate.push("date_of_birth");
      }

      // Require gender when it is null in profile (for both roles)
      if (profile?.gender === null) {
        fieldsToValidate.push("gender");
      }

      // For students and guardians, require location fields when not present
      if (effectiveRole === "student" || effectiveRole === "guardian") {
        if (
          profile?.gender === null ||
          profile?.gender === undefined ||
          profile?.gender === ""
        ) {
          if (!fieldsToValidate.includes("gender")) {
            fieldsToValidate.push("gender");
          }
        }
        if (
          profile?.country === null ||
          profile?.country === undefined ||
          profile?.country === ""
        ) {
          fieldsToValidate.push("country");
        }
        if (
          profile?.state === null ||
          profile?.state === undefined ||
          profile?.state === ""
        ) {
          fieldsToValidate.push("state");
        }
        if (
          profile?.city === null ||
          profile?.city === undefined ||
          profile?.city === ""
        ) {
          fieldsToValidate.push("city");
        }
      }

      isValid = await trigger(fieldsToValidate as (keyof OnboardingFormData)[]);
    } else if (currentStep === 4) {
      if (effectiveRole === "student") {
        isValid = await trigger([
          "parent_email",
          "school",
          "class",
        ] as (keyof OnboardingFormData)[]);
        // Check for both SS and SSS prefixes
        if (
          selectedClass &&
          (selectedClass.startsWith("SS") || selectedClass.startsWith("SSS"))
        ) {
          isValid =
            isValid &&
            (await trigger(["discipline"] as (keyof OnboardingFormData)[]));
        }
      } else if (effectiveRole === "guardian") {
        isValid = await trigger([
          "child_email",
          "child_phone",
        ] as (keyof OnboardingFormData)[]);
      } else {
        isValid = true;
      }
    } else {
      isValid = true;
    }

    if (isValid && currentStep < effectiveSteps[effectiveSteps.length - 1].id) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > effectiveSteps[0].id) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsSubmitting(true);

      const hasProfileValue = (value: unknown) =>
        value !== null &&
        value !== undefined &&
        !(typeof value === "string" && value.trim() === "");
      const effectiveClass = data.class || profile?.class || "";
      const isSeniorClass = effectiveClass.startsWith("SSS");

      // Prepare data for submission. Locked profile fields are omitted once set.
      const submitData: any = {
        name: data.name,
        phone: data.phone,
        school: data.school,
        parent_email: data.parent_email,
        country: data.country,
        state: data.state,
        city: data.city,
        address: data.address,
        child_email: data.child_email,
        child_phone: data.child_phone,
      };

      if (!hasProfileValue(profile?.username)) {
        submitData.username = data.username;
      }

      if (!hasProfileValue(profile?.class)) {
        submitData.class = data.class;
      }

      if (!hasProfileValue(profile?.date_of_birth)) {
        submitData.date_of_birth = data.date_of_birth
          ? format(data.date_of_birth, "yyyy-MM-dd")
          : undefined;
      }

      if (!hasProfileValue(profile?.gender)) {
        submitData.gender = data.gender;
      }

      if (isSeniorClass && !hasProfileValue(profile?.discipline)) {
        submitData.discipline = data.discipline;
      }

      // Include role if guest
      if (primaryRole === "guest") {
        submitData.role = data.role as "student" | "guardian";
      }

      // Update profile
      const updatedProfile = await updateProfile(submitData as ProfileEditData);

      // Update auth store
      const roles: UserRole[] = Array.isArray(updatedProfile.role)
        ? (updatedProfile.role as UserRole[])
        : ([updatedProfile.role] as UserRole[]);
      updateUserProfile({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: roles,
        username: updatedProfile.username || "",
        school: updatedProfile.school,
        class: updatedProfile.class,
        discipline: updatedProfile.discipline,
        parent_email: updatedProfile.parent_email,
        date_of_birth: updatedProfile.date_of_birth,
        country: updatedProfile.country,
        state: updatedProfile.state,
        city: updatedProfile.city,
        address: updatedProfile.address,
        gender: updatedProfile.gender,
        child_email: updatedProfile.child_email,
        child_phone: updatedProfile.child_phone,
      });

      // Update academic context with new class if set during onboarding
      if (updatedProfile.class) {
        const normalizedClass = normalizeClassString(updatedProfile.class);
        const classLevel = normalizedClass
          ? getClassLevelById(normalizedClass.toLowerCase().replace(" ", ""))
          : null;
        if (classLevel) {
          setCurrentClass(classLevel);
        }
      }

      toast.success("Profile completed successfully!");

      // Invoke onComplete callback if provided
      if (onComplete) {
        onComplete();
      }

      router.push("/dashboard");
    } catch (error: any) {
      showProfileErrorToast(error.message || "Failed to complete profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary sm:size-12" />
          <span className="text-sm text-muted-foreground sm:text-base">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStepIndex + 1} of {effectiveSteps.length}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2">
        {effectiveSteps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                index < currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : index === currentStepIndex
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStepIndex ? (
                <CheckCircle className="size-4" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={`max-w-[60px] truncate text-center text-xs ${
                index === currentStepIndex
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[0].title}</CardTitle>
                <CardDescription>{STEPS[0].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Select
                    value={selectedRole || primaryRole || undefined}
                    onValueChange={(value) =>
                      setValue("role", value as "student" | "guardian")
                    }
                    disabled={primaryRole !== "guest" && primaryRole !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                  {primaryRole !== "guest" && primaryRole !== null && (
                    <p className="text-xs text-muted-foreground">
                      Your role cannot be changed once set.
                    </p>
                  )}
                  {errors.role && (
                    <p className="text-sm text-destructive">
                      {errors.role.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Basic Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[1].title}</CardTitle>
                <CardDescription>{STEPS[1].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...register("username")}
                      placeholder="Enter your username"
                      disabled={Boolean(
                        profile?.username &&
                        typeof profile.username === "string" &&
                        profile.username.trim() !== "",
                      )}
                    />
                    {Boolean(
                      profile?.username &&
                      typeof profile.username === "string" &&
                      profile.username.trim() !== "",
                    ) && (
                      <p className="text-xs text-muted-foreground">
                        Username cannot be changed once set.
                      </p>
                    )}
                    {errors.username && (
                      <p className="text-sm text-destructive">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="your.email@example.com"
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed here.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Personal Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[2].title}</CardTitle>
                <CardDescription>{STEPS[2].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <DatePicker
                      selected={watch("date_of_birth")}
                      onSelect={(date) => {
                        if (
                          !Boolean(
                            profile?.date_of_birth &&
                            typeof profile.date_of_birth === "string" &&
                            profile.date_of_birth.trim() !== "",
                          )
                        ) {
                          setValue("date_of_birth", date);
                        }
                      }}
                      placeholder="Select your date of birth"
                      disabled={Boolean(
                        profile?.date_of_birth &&
                        typeof profile.date_of_birth === "string" &&
                        profile.date_of_birth.trim() !== "",
                      )}
                    />
                    {Boolean(
                      profile?.date_of_birth &&
                      typeof profile.date_of_birth === "string" &&
                      profile.date_of_birth.trim() !== "",
                    ) && (
                      <p className="text-xs text-muted-foreground">
                        Date of birth cannot be changed once set.
                      </p>
                    )}
                    {errors.date_of_birth && (
                      <p className="text-sm text-destructive">
                        {errors.date_of_birth.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={watch("gender")}
                      onValueChange={(value) => {
                        if (value === "male" || value === "female") {
                          setValue("gender", value);
                        }
                      }}
                      disabled={Boolean(
                        profile?.gender &&
                        typeof profile.gender === "string" &&
                        profile.gender.trim() !== "",
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {Boolean(
                      profile?.gender &&
                      typeof profile.gender === "string" &&
                      profile.gender.trim() !== "",
                    ) && (
                      <p className="text-xs text-muted-foreground">
                        Gender cannot be changed once set.
                      </p>
                    )}
                    {errors.gender && (
                      <p className="text-sm text-destructive">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      {...register("country")}
                      placeholder="Enter your country"
                    />
                    {errors.country && (
                      <p className="text-sm text-destructive">
                        {errors.country.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...register("state")}
                      placeholder="Enter your state"
                    />
                    {errors.state && (
                      <p className="text-sm text-destructive">
                        {errors.state.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Enter your city"
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="Enter your address"
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Role-Specific Info */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[3].title}</CardTitle>
                <CardDescription>{STEPS[3].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(selectedRole === "student" || primaryRole === "student") && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="parent_email">Parent Email *</Label>
                        <Input
                          id="parent_email"
                          type="email"
                          {...register("parent_email")}
                          placeholder="parent@example.com"
                        />
                        {errors.parent_email && (
                          <p className="text-sm text-destructive">
                            {errors.parent_email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="school">School</Label>
                        <Input
                          id="school"
                          {...register("school")}
                          placeholder="Enter your school name"
                        />
                        {errors.school && (
                          <p className="text-sm text-destructive">
                            {errors.school.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="class">Class</Label>
                        <Select
                          value={selectedClass}
                          onValueChange={(value) => setValue("class", value)}
                          disabled={Boolean(
                            profile?.class &&
                            typeof profile.class === "string" &&
                            profile.class.trim() !== "",
                          )}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your class" />
                          </SelectTrigger>
                          <SelectContent>
                            {metadata?.classes.map((cls) => (
                              <SelectItem key={cls.name} value={cls.name}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {Boolean(
                          profile?.class &&
                          typeof profile.class === "string" &&
                          profile.class.trim() !== "",
                        ) && (
                          <p className="text-xs text-muted-foreground">
                            Class cannot be changed once set.
                          </p>
                        )}
                        {errors.class && (
                          <p className="text-sm text-destructive">
                            {errors.class.message}
                          </p>
                        )}
                      </div>

                      {(selectedClass?.startsWith("SS") ||
                        selectedClass?.startsWith("SSS")) && (
                        <div className="space-y-2">
                          <Label htmlFor="discipline">Discipline</Label>
                          <Select
                            value={watch("discipline")}
                            onValueChange={(value) =>
                              setValue("discipline", value)
                            }
                            disabled={Boolean(
                              profile?.discipline &&
                              typeof profile.discipline === "string" &&
                              profile.discipline.trim() !== "",
                            )}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select your discipline" />
                            </SelectTrigger>
                            <SelectContent>
                              {metadata?.discipline &&
                              metadata.discipline.length > 0 ? (
                                metadata.discipline.map((disc) => (
                                  <SelectItem key={disc.name} value={disc.name}>
                                    {disc.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="Art">Art</SelectItem>
                                  <SelectItem value="Commercial">
                                    Commercial
                                  </SelectItem>
                                  <SelectItem value="Science">
                                    Science
                                  </SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          {Boolean(
                            profile?.discipline &&
                            typeof profile.discipline === "string" &&
                            profile.discipline.trim() !== "",
                          ) && (
                            <p className="text-xs text-muted-foreground">
                              Discipline cannot be changed once set.
                            </p>
                          )}
                          {errors.discipline && (
                            <p className="text-sm text-destructive">
                              {errors.discipline.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(selectedRole === "guardian" ||
                  primaryRole === "guardian") && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="child_email">Child&apos;s Email</Label>
                        <Input
                          id="child_email"
                          type="email"
                          {...register("child_email")}
                          placeholder="child@example.com"
                        />
                        {errors.child_email && (
                          <p className="text-sm text-destructive">
                            {errors.child_email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="child_phone">Child&apos;s Phone</Label>
                        <Input
                          id="child_phone"
                          type="tel"
                          {...register("child_phone")}
                          placeholder="+1 (555) 987-6543"
                        />
                        {errors.child_phone && (
                          <p className="text-sm text-destructive">
                            {errors.child_phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[4].title}</CardTitle>
                <CardDescription>{STEPS[4].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Role</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRole || primaryRole}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Basic Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Name: {watch("name")}
                    <br />
                    Username: {watch("username")}
                    <br />
                    Email: {watch("email")}
                    <br />
                    Phone: {watch("phone")}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Personal Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Date of Birth:{" "}
                    {(() => {
                      const dob = watch("date_of_birth");
                      if (dob) {
                        return format(dob as Date, "dd/MM/yyyy");
                      }
                      return "Not set";
                    })()}
                    <br />
                    Gender: {watch("gender")}
                    <br />
                    Location: {watch("country")}, {watch("state")},{" "}
                    {watch("city")}
                    <br />
                    Address: {watch("address")}
                  </p>
                </div>

                {(selectedRole === "student" || primaryRole === "student") && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Student Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Parent Email: {watch("parent_email")}
                      <br />
                      School: {watch("school")}
                      <br />
                      Class: {watch("class")}
                      <br />
                      Discipline: {watch("discipline")}
                    </p>
                  </div>
                )}

                {(selectedRole === "guardian" ||
                  primaryRole === "guardian") && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Guardian Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Child Email: {watch("child_email")}
                      <br />
                      Child Phone: {watch("child_phone")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === effectiveSteps[0].id || isSubmitting}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        {currentStep < effectiveSteps[effectiveSteps.length - 1].id ? (
          <Button type="button" onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 size-4" />
                Complete Profile
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
