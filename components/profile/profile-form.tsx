"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  School,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { getClassLevelById, normalizeClassString } from "@/config/education";
import { profileApi } from "@/lib/api/auth";
import {
  checkUsernameAvailability,
  getProfile,
  getProfileData,
  ProfileEditData,
  updateProfile,
  UserProfile,
  validateProfileData,
} from "@/lib/api/profile";
import { ProfilePageData } from "@/lib/types/profile";
import { useDebounce } from "@/hooks/use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/date-picker";
import { useAcademicContext } from "@/components/providers/academic-context";

import { ProfilePictureModal } from "./profile-picture-modal";

function getSubscriptionStatusBadge(status?: string) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "active") {
    return (
      <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Active
      </Badge>
    );
  }
  if (s === "pending") {
    return (
      <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
        Pending
      </Badge>
    );
  }
  if (s === "expired") {
    return (
      <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
        Expired
      </Badge>
    );
  }
  if (s === "cancelled") {
    return (
      <Badge className="border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-100">
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge className="border-gray-200 bg-gray-100 capitalize text-gray-800 hover:bg-gray-100">
      {status}
    </Badge>
  );
}

// Form validation schema
const profileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    role: z.enum(["student", "guardian"]).or(z.literal("")).optional(),
    school: z.string().optional(),
    class: z.string().optional(),
    discipline: z.string().optional(),
    date_of_birth: z.date().optional(),
    gender: z.enum(["male", "female"]).optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    child_email: z.string().email().optional().or(z.literal("")),
    child_phone: z.string().optional().or(z.literal("")),
    parent_email: z
      .string()
      .email("Please enter a valid parent email")
      .optional()
      .or(z.literal("")),
    parent_phone: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Require discipline for classes starting with SS or SSS
      if (
        data.class &&
        (data.class.startsWith("SS") || data.class.startsWith("SSS")) &&
        !data.discipline
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Discipline is required for senior secondary classes",
      path: ["discipline"],
    },
  )
  .refine(
    (data) => {
      // Require parent email for students
      if (
        data.role === "student" &&
        (!data.parent_email || data.parent_email.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Parent email is required for students",
      path: ["parent_email"],
    },
  );

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSuccess?: (updatedProfile: UserProfile) => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user, updateUserProfile } = useAuthStore();
  const { setCurrentClass } = useAcademicContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metadata, setMetadata] = useState<ProfilePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingClassChange, setPendingClassChange] = useState<string | null>(
    null,
  );
  const [usernameAvailability, setUsernameAvailability] = useState<{
    status: "idle" | "checking" | "available" | "unavailable";
    message?: string;
  }>({ status: "idle" });
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: "student",
    },
  });

  const selectedRole = watch("role");
  const selectedClass = watch("class");
  const watchedUsername = watch("username");
  const debouncedUsername = useDebounce(watchedUsername, 500);

  // Clear discipline when JSS class is selected
  useEffect(() => {
    if (selectedClass && selectedClass.startsWith("JSS")) {
      setValue("discipline", "");
    }
  }, [selectedClass, setValue]);

  // Check username availability when debounced value changes
  useEffect(() => {
    const checkUsername = async () => {
      // Clear status if empty
      if (!debouncedUsername || debouncedUsername.trim().length === 0) {
        setUsernameAvailability({ status: "idle" });
        return;
      }

      // Skip if same as current profile username
      if (profile?.username && debouncedUsername === profile.username) {
        setUsernameAvailability({ status: "idle" });
        return;
      }

      // If user already has a username set, they can't change it (per business logic elsewhere)
      // but if the UI allows typing, we should validate.
      // Assuming the input is disabled if profile?.username exists, this effect won't run much.
      // But if it's editable, we check.

      setUsernameAvailability({ status: "checking" });

      try {
        const result = await checkUsernameAvailability(debouncedUsername);

        if (result.available) {
          setUsernameAvailability({
            status: "available",
            message: result.message || "Username is available",
          });
        } else {
          setUsernameAvailability({
            status: "unavailable",
            message: result.message || "Username is not available",
          });
        }
      } catch (error) {
        setUsernameAvailability({
          status: "unavailable",
          message: "Error checking availability",
        });
      }
    };

    checkUsername();
  }, [debouncedUsername, profile?.username]);

  // Derive primary role from profile for conditional rendering
  const primaryRole = profile
    ? Array.isArray(profile.role)
      ? profile.role[0]
      : profile.role
    : null;

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

        const primaryRole = Array.isArray(profileData.role)
          ? profileData.role[0]
          : profileData.role;

        const formRole =
          primaryRole === "guest"
            ? ""
            : primaryRole === "student" || primaryRole === "guardian"
              ? primaryRole
              : "";

        const genderValue =
          profileData.gender === "male"
            ? "male"
            : profileData.gender === "female"
              ? "female"
              : undefined;

        reset({
          name: profileData.name,
          username: profileData.username || "",
          email: profileData.email,
          phone: profileData.phone || "",
          role: (formRole || "") as "student" | "guardian" | "",
          school: profileData.school || "",
          class: profileData.class || "",
          discipline: profileData.discipline || "",
          date_of_birth: profileData.date_of_birth
            ? parse(profileData.date_of_birth, "dd/MM/yyyy", new Date())
            : undefined,
          gender: genderValue,
          country: profileData.country || "",
          state: profileData.state || "",
          city: profileData.city || "",
          child_email: profileData.child_email || "",
          child_phone: profileData.child_phone || "",
          parent_email: profileData.parent_email || "",
          parent_phone: profileData.parent_phone || "",
        } as ProfileFormData);
      } catch (error: any) {
        toast.error(error.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);
      const roleValue = data.role as string;
      const effectiveRole = roleValue || primaryRole;

      // Guest user handling
      if (primaryRole === "guest") {
        if (!roleValue) {
          toast.error("Please select a role (Student or Guardian) to proceed.");
          setIsSaving(false);
          return;
        }

        try {
          let roleUpdateResult;

          if (roleValue === "guardian") {
            const childEmail = data.child_email?.trim();
            const childPhone = data.child_phone?.trim();
            const extras: { child_email?: string; child_phone?: string } = {};

            if (childEmail) extras.child_email = childEmail;
            if (childPhone) extras.child_phone = childPhone;

            roleUpdateResult = await profileApi.updateRole(roleValue, extras);
          } else {
            roleUpdateResult = await profileApi.updateRole(roleValue);
          }

          const refreshedProfile = await getProfile();
          setProfile(refreshedProfile);

          // Update auth store
          const userToUpdate =
            roleUpdateResult.user || (refreshedProfile as any);
          const roles = Array.isArray(userToUpdate.role)
            ? userToUpdate.role
            : [userToUpdate.role];

          updateUserProfile({
            ...userToUpdate,
            role: roles,
            username: userToUpdate.username || "", // Ensure username is string
          } as any);

          toast.success(
            "Account type setup complete! Proceeding to save details...",
          );
        } catch (error: any) {
          toast.error("Failed to set account type.");
          throw error;
        }
      }

      // Prepare submission data
      const submitData: any = {
        name: data.name,
        phone: data.phone,
        username: data.username,
        school: data.school,
        class: data.class,
        date_of_birth: data.date_of_birth
          ? format(data.date_of_birth, "dd/MM/yyyy")
          : undefined,
        gender: data.gender,
        country: data.country,
        state: data.state,
        city: data.city,
        child_email: data.child_email,
        child_phone: data.child_phone,
        parent_email: data.parent_email,
        parent_phone: data.parent_phone,
      };

      if (data.class && data.class.startsWith("SSS")) {
        submitData.discipline = data.discipline;
      }

      // Validations
      if (effectiveRole === "guardian") {
        // Guardian specific validations if needed
      }

      const validationErrors = validateProfileData(
        submitData as ProfileEditData,
      );
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        setIsSaving(false);
        return;
      }

      // Final Update
      const updatedProfile = await updateProfile(submitData as ProfileEditData);

      const roles = Array.isArray(updatedProfile.role)
        ? updatedProfile.role
        : [updatedProfile.role];

      updateUserProfile({
        ...updatedProfile,
        role: roles,
        username: updatedProfile.username || "",
      } as any);

      setProfile(updatedProfile);
      toast.success("Profile changes saved successfully.");
      onSuccess?.(updatedProfile);

      if (data.class && data.class !== profile?.class) {
        const normalizedClass = normalizeClassString(data.class);
        const classLevel = normalizedClass
          ? getClassLevelById(normalizedClass.toLowerCase().replace(" ", ""))
          : null;
        if (classLevel) {
          setCurrentClass(classLevel);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border bg-card/50">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Helper to initals
  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left Column: Avatar & Basic Info */}
        <div className="flex min-w-0 flex-col gap-6 lg:w-1/3">
          <Card className="overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="bg-muted/30 pb-8 pt-6 text-center">
              <div className="relative mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-background p-1 shadow-sm ring-4 ring-background">
                <Avatar className="size-full">
                  <AvatarImage src={profile?.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Camera Button Overlay */}
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100"
                  disabled={primaryRole === "guest"}
                >
                  <Camera className="size-6 text-white" />
                </button>
              </div>
              <CardTitle>{profile?.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                {selectedRole || primaryRole ? (
                  <span className="badge rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                    {primaryRole || selectedRole}
                  </span>
                ) : (
                  "Guest User"
                )}
                {profile?.subscription_status &&
                  getSubscriptionStatusBadge(profile.subscription_status)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="name"
                    {...register("name")}
                    className="pl-9"
                    disabled={primaryRole === "guest"}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="username"
                    {...register("username")}
                    className="pl-8 pr-10"
                    disabled={primaryRole === "guest" || !!profile?.username}
                    placeholder="Choose a unique username"
                  />
                  {/* Status Icon */}
                  {usernameAvailability.status === "checking" && (
                    <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />
                  )}
                  {usernameAvailability.status === "available" && (
                    <CheckCircle2 className="absolute right-3 top-2.5 size-4 text-green-600" />
                  )}
                  {usernameAvailability.status === "unavailable" && (
                    <AlertCircle className="absolute right-3 top-2.5 size-4 text-destructive" />
                  )}
                </div>
                {/* Status Messages */}
                {!!profile?.username && (
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed.
                  </p>
                )}
                {!profile?.username &&
                  usernameAvailability.status === "available" && (
                    <p className="text-xs text-green-600">
                      {usernameAvailability.message}
                    </p>
                  )}
                {!profile?.username &&
                  usernameAvailability.status === "unavailable" && (
                    <p className="text-xs text-destructive">
                      {usernameAvailability.message}
                    </p>
                  )}
                {errors.username && (
                  <p className="text-xs text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="size-5 text-primary" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    value={profile?.email}
                    disabled
                    readOnly
                    className="bg-muted/50 pl-9"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {profile?.email_verified_at ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="size-3" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="size-3" /> Unverified
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...register("phone")}
                    className="pl-9"
                    placeholder="+123..."
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Forms */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Academic Section */}
          {(selectedRole === "student" || primaryRole === "student") && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <CardTitle>Academic Profile</CardTitle>
                    <CardDescription>
                      Your school and class details.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="school">School Name</Label>
                  <div className="relative">
                    <School className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="school"
                      {...register("school")}
                      className="pl-9"
                      placeholder="Enter school name"
                    />
                  </div>
                  {errors.school && (
                    <p className="text-xs text-destructive">
                      {errors.school.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Current Class</Label>
                  <Select
                    onValueChange={(val) => setValue("class", val)}
                    value={selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata?.classes.map((cls) => (
                        <SelectItem key={cls.name} value={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedClass?.startsWith("SS") ||
                  selectedClass?.startsWith("SSS")) && (
                  <div className="space-y-2">
                    <Label htmlFor="discipline">Discipline (Department)</Label>
                    <Select
                      onValueChange={(val) => setValue("discipline", val)}
                      value={watch("discipline")}
                      disabled={!!profile?.discipline}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Discipline" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadata?.discipline?.map((d) => (
                          <SelectItem key={d.name} value={d.name}>
                            {d.name}
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="Science">Science</SelectItem>
                            <SelectItem value="Art">Art</SelectItem>
                            <SelectItem value="Commercial">
                              Commercial
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>

              <Separator />

              <CardHeader>
                <CardTitle className="text-lg">
                  Parent / Guardian Contact
                </CardTitle>
                <CardDescription>
                  An email will be sent to your parent/guardian for consent.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="parent_email">
                    Parent Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="parent_email"
                      type="email"
                      {...register("parent_email")}
                      className="pl-9"
                      placeholder="parent@example.com"
                    />
                  </div>
                  {errors.parent_email && (
                    <p className="text-xs text-destructive">
                      {errors.parent_email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_phone">Parent Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="parent_phone"
                      type="tel"
                      {...register("parent_phone")}
                      className="pl-9"
                      placeholder="+123..."
                    />
                  </div>
                  {errors.parent_phone && (
                    <p className="text-xs text-destructive">
                      {errors.parent_phone.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guardian Section */}
          {(selectedRole === "guardian" || primaryRole === "guardian") && (
            <Card className="border-border/60 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="size-6" />
                  </div>
                  <div>
                    <CardTitle>Guardian Details</CardTitle>
                    <CardDescription>
                      Your child&apos;s contact information.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="child_email">
                    Child&apos;s Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="child_email"
                      type="email"
                      {...register("child_email")}
                      className="pl-9"
                      placeholder="child@example.com"
                      disabled={!!profile?.child_email}
                    />
                  </div>
                  {!!profile?.child_email && (
                    <p className="text-xs text-muted-foreground">
                      Contact support to change this.
                    </p>
                  )}
                  {errors.child_email && (
                    <p className="text-xs text-destructive">
                      {errors.child_email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="child_phone">Child&apos;s Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="child_phone"
                      type="tel"
                      {...register("child_phone")}
                      className="pl-9"
                      placeholder="+123..."
                      disabled={!!profile?.child_phone}
                    />
                  </div>
                  {!!profile?.child_phone && (
                    <p className="text-xs text-muted-foreground">
                      Contact support to change this.
                    </p>
                  )}
                  {errors.child_phone && (
                    <p className="text-xs text-destructive">
                      {errors.child_phone.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Details */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                <CardTitle className="text-lg">Personal Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <DatePicker
                  selected={watch("date_of_birth")}
                  onSelect={(d) => d && setValue("date_of_birth", d)}
                  disabled={!!profile?.date_of_birth}
                />
                {!!profile?.date_of_birth && (
                  <p className="text-xs text-muted-foreground">
                    Contact support to change DOB.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  onValueChange={(v) =>
                    setValue("gender", v as "male" | "female")
                  }
                  value={watch("gender")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Input {...register("country")} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input {...register("state")} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register("city")} />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={isSaving || !isDirty}
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Picture Upload Modal */}
      <ProfilePictureModal
        showModal={showAvatarModal}
        setShowModal={setShowAvatarModal}
        currentAvatar={profile?.avatar}
        onUploadSuccess={(avatarUrl) => {
          if (profile) {
            setProfile({ ...profile, avatar: avatarUrl });
          }
        }}
      />
    </form>
  );
}
