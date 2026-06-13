"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";

import {
  classLevels,
  getClassLevelById,
  getCompulsorySubjectsForClass,
  getConfigSubjectIdFromApiId,
  getElectiveSubjectsForClass,
  getSubjectById,
  getSubjectsForClass,
  getTermById,
  type Subject as ConfigSubject,
} from "@/config/education";
import {
  getStudentSubjects,
  updateCompulsorySelectiveClient,
  updateSelectiveSubjectsClient,
} from "@/lib/api/subjects";
import type { Subject as ApiSubject } from "@/lib/types/subjects";
import { formatApiErrorMessage } from "@/lib/utils/api-errors";
import {
  jssSubjectSetupSchema,
  sssSubjectSetupSchema,
  subjectSetupSchema,
  type SubjectSetupFormData,
} from "@/lib/validations/subjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubjectCard } from "@/components/ui/subject-selection/subject-card";
import { useToast } from "@/components/ui/use-toast";
import { useAcademicContext } from "@/components/providers/academic-context";

interface SubjectSetupFormProps {
  onComplete?: (updatedSubjectsData?: any) => void;
  initialData?: {
    classId?: string;
    termId?: string;
    compulsorySelective?: number;
    electiveIds?: number[];
  };
  requireConfirmation?: boolean;
  onRequestConfirmation?: (submitHandler: () => void) => void;
}

const STEPS = [
  { id: 1, title: "Class & Term", description: "Select your class and term" },
  {
    id: 2,
    title: "Track Selection",
    description: "Select your academic track (SSS only)",
  },
  {
    id: 3,
    title: "Core Subjects",
    description: "Select your core/selective subjects for your class",
  },
  { id: 4, title: "Electives", description: "Select your elective subjects" },
  { id: 5, title: "Review", description: "Review your selections" },
] as const;

// Mapping between UI term IDs ("1", "2", "3") and config term IDs ("term1", "term2", "term3")
const UI_TERM_TO_CONFIG_TERM: Record<string, string> = {
  "1": "term1",
  "2": "term2",
  "3": "term3",
};

const CONFIG_TERM_TO_UI_TERM: Record<string, string> = {
  term1: "1",
  term2: "2",
  term3: "3",
};

// Helper functions for term ID conversion
function uiTermIdToConfigTermId(uiTermId: string): string | null {
  return UI_TERM_TO_CONFIG_TERM[uiTermId] || null;
}

function configTermIdToUiTermId(configTermId: string): string | null {
  return CONFIG_TERM_TO_UI_TERM[configTermId] || null;
}

export function SubjectSetupForm({
  onComplete,
  initialData,
  requireConfirmation = false,
  onRequestConfirmation,
}: SubjectSetupFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setCurrentClass, setCurrentTerm } = useAcademicContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiSubjectsData, setApiSubjectsData] = useState<{
    subjects: ApiSubject[];
    compulsory_selective: ApiSubject[];
    selective: ApiSubject[];
  } | null>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [classLevel, setClassLevel] = useState<"JSS" | "SSS">("JSS");
  const [selectedTrack, setSelectedTrack] = useState<
    "science" | "arts" | "commercial" | null
  >(null);
  const [coreSubjectIds, setCoreSubjectIds] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState<{
    step?: string;
    message: string;
    retry?: () => void;
  } | null>(null);

  const getRequiredElectiveCount = (isJssClass: boolean) =>
    isJssClass ? 2 : 4;

  // Convert initial term ID from config format to UI format if needed
  const initialTermId = useMemo(() => {
    if (!initialData?.termId) return "";
    // Check if it's already in UI format ("1", "2", "3")
    if (["1", "2", "3"].includes(initialData.termId)) {
      return initialData.termId;
    }
    // Otherwise, convert from config format ("term1", "term2", "term3")
    return configTermIdToUiTermId(initialData.termId) || initialData.termId;
  }, [initialData?.termId]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<SubjectSetupFormData>({
    resolver: async (data, context, options) => {
      // Dynamically select schema based on classId
      const formClassId = data.classId as string;
      const schema =
        formClassId && formClassId.toLowerCase().includes("jss")
          ? jssSubjectSetupSchema
          : formClassId && formClassId.toLowerCase().includes("sss")
            ? sssSubjectSetupSchema
            : subjectSetupSchema;
      return zodResolver(schema)(data, context, options);
    },
    defaultValues: {
      classId: initialData?.classId || "",
      termId: initialTermId,
      compulsorySelective: initialData?.compulsorySelective || null,
      electiveIds: initialData?.electiveIds || [],
    },
  });

  const classId = watch("classId");

  // Determine which schema to use based on class level (for UI display)
  const currentSchema = useMemo(() => {
    if (!classId) return subjectSetupSchema;
    const isJSS = classId.toLowerCase().includes("jss");
    return isJSS ? jssSubjectSetupSchema : sssSubjectSetupSchema;
  }, [classId]);
  const termId = watch("termId");
  const compulsorySelective = watch("compulsorySelective");
  const electiveIds = watch("electiveIds");

  // Map classId to config class level ID based on track selection
  const configClassId = useMemo(() => {
    if (!classId) return null;
    const isJSS = classId.toLowerCase().includes("jss");

    if (isJSS) {
      const classMap: Record<string, string> = {
        JSS1: "jss1",
        JSS2: "jss2",
        JSS3: "jss3",
      };
      return classMap[classId] || null;
    } else {
      // For SSS, use track selection to determine class ID
      if (!selectedTrack) return null;
      const level = classId.replace("SSS", "");
      return `sss${level}-${selectedTrack}`;
    }
  }, [classId, selectedTrack]);

  // Determine core subjects from API response, not config
  // For JSS: api.subjects are core; for SSS: api.subjects are core/selective
  const coreApiSubjects = useMemo(() => {
    if (!apiSubjectsData) return [];
    // Core subjects come from api.subjects (not from config)
    return apiSubjectsData.subjects || [];
  }, [apiSubjectsData]);

  // Auto-select all core subjects when entering core subjects step
  useEffect(() => {
    const coreStep = classLevel === "JSS" ? 2 : 3;
    if (
      currentStep === coreStep &&
      coreApiSubjects.length > 0 &&
      coreSubjectIds.length === 0
    ) {
      const allCoreIds = coreApiSubjects.map((s) => s.id);
      setCoreSubjectIds(allCoreIds);
    }
  }, [currentStep, classLevel, coreApiSubjects, coreSubjectIds.length]);

  // Determine class level from classId
  useEffect(() => {
    if (classId) {
      const isJSS = classId.toLowerCase().includes("jss");
      setClassLevel(isJSS ? "JSS" : "SSS");
      // Reset track selection when class changes
      if (isJSS) {
        setSelectedTrack(null);
      }
    }
  }, [classId]);

  // Fetch available subjects from API
  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const response = await getStudentSubjects();
        if (response.success && response.content) {
          setApiSubjectsData({
            subjects: response.content.subjects || [],
            compulsory_selective: response.content.compulsory_selective || [],
            selective: response.content.selective || [],
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load subjects. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [toast]);

  // Note: handleCoreSubjectToggle is no longer needed as we directly use API subjects

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(["classId", "termId"]);
    } else if (currentStep === 2) {
      // Track selection step (SSS only)
      if (classLevel === "SSS") {
        isValid = selectedTrack !== null;
        if (!isValid) {
          toast({
            title: "Selection Required",
            description: "Please select your academic track.",
            variant: "destructive",
          });
        }
      } else {
        // JSS skips track selection
        isValid = true;
      }
    } else if (currentStep === 3) {
      // Validate core subjects selection - all core subjects must be selected
      const isJSS = classId && classId.toLowerCase().includes("jss");
      const requiredCoreCount = coreApiSubjects.length;

      if (isJSS) {
        // JSS requires compulsory selective and all core subjects
        isValid =
          compulsorySelective !== null &&
          coreSubjectIds.length === requiredCoreCount;
        if (!isValid) {
          if (compulsorySelective === null) {
            toast({
              title: "Selection Required",
              description: "Please select your compulsory selective subject.",
              variant: "destructive",
            });
          } else if (coreSubjectIds.length !== requiredCoreCount) {
            toast({
              title: "Selection Required",
              description: `Please ensure all ${requiredCoreCount} core subjects are selected.`,
              variant: "destructive",
            });
          }
        }
      } else {
        // SSS requires all core subjects (typically 3)
        isValid = coreSubjectIds.length === requiredCoreCount;
        if (!isValid) {
          toast({
            title: "Selection Required",
            description: `Please ensure all ${requiredCoreCount} core subjects are selected.`,
            variant: "destructive",
          });
        }
      }
    } else if (currentStep === 4) {
      isValid = await trigger(["electiveIds"]);
    } else {
      isValid = true;
    }

    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Retry helper with exponential backoff
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };

  const performSubmit = async (data: SubjectSetupFormData) => {
    setIsSubmitting(true);
    let compulsoryResult: any = null;
    let selectiveResult: any = null;
    let correlationId: string | null = null;

    // Final validation: ensure exact totals (core + electives)
    const isJSS = classLevel === "JSS";
    const requiredElectives = getRequiredElectiveCount(isJSS);
    const totalSelected = coreSubjectIds.length + data.electiveIds.length;
    const expectedTotal = coreApiSubjects.length + requiredElectives;

    if (totalSelected !== expectedTotal) {
      setIsSubmitting(false);
      toast({
        title: "Invalid Selection",
        description: `You must select exactly ${expectedTotal} subjects (${coreApiSubjects.length} core + ${requiredElectives} electives). Currently selected: ${totalSelected}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Update compulsory selective if JSS and selected
      if (classLevel === "JSS" && data.compulsorySelective) {
        compulsoryResult = await retryWithBackoff(async () => {
          const result = await updateCompulsorySelectiveClient(
            data.compulsorySelective!,
          );
          if (!result.success) {
            throw new Error(
              formatApiErrorMessage(
                result,
                "Failed to update compulsory selective",
              ),
            );
          }
          return result;
        });

        if (!compulsoryResult.success) {
          if (compulsoryResult.code === 401) {
            toast({
              title: "Unauthorized",
              description: "Please log in again",
              variant: "destructive",
            });
            router.push("/auth/login");
            return;
          }
          throw new Error(
            `Failed to update compulsory selective: ${compulsoryResult.message}`,
          );
        }

        // Capture correlation ID if available
        correlationId =
          compulsoryResult.requestId || compulsoryResult.correlationId || null;
      }

      // Step 2: Update selective subjects (core + electives) with retry
      // Include both core subjects selected in Step 2 and electives selected in Step 3
      // Ensure electiveIds is an array and filter out any invalid values
      const electiveIds = Array.isArray(data.electiveIds)
        ? data.electiveIds
        : [];
      const allSelectedSubjectIds = [...coreSubjectIds, ...electiveIds].filter(
        (id) => id != null && id !== undefined && !Number.isNaN(id) && id > 0,
      );

      // Validate that we have at least one subject ID
      if (allSelectedSubjectIds.length === 0) {
        throw new Error(
          "No valid subject IDs to update. Please select at least one subject.",
        );
      }

      try {
        selectiveResult = await retryWithBackoff(async () => {
          const result = await updateSelectiveSubjectsClient(
            allSelectedSubjectIds,
          );
          if (!result.success) {
            // Create a detailed error with validation information
            const fullMessage = `${formatApiErrorMessage(
              result,
              "Failed to update selective subjects",
            )} (Code: ${result.code})`;

            // Log for debugging
            if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
              console.error(
                "[SubjectSetupForm] updateSelectiveSubjectsClient failed:",
                {
                  result,
                  sentSubjectIds: allSelectedSubjectIds,
                  coreSubjectIds,
                  electiveIds: data.electiveIds,
                },
              );
            }

            const error = new Error(fullMessage) as any;
            error.code = result.code;
            error.errors = result.errors;
            throw error;
          }
          return result;
        });
      } catch (error: any) {
        // If selective update fails after retries, attempt rollback if compulsory was updated
        if (
          compulsoryResult?.success &&
          classLevel === "JSS" &&
          data.compulsorySelective
        ) {
          // Note: Rollback would require an API endpoint to clear compulsory selective
          // For now, we report the issue and provide recovery options
          setSubmitError({
            step: "selective subjects",
            message: `Failed to update selective subjects after retries: ${error.message}. Compulsory selective was updated successfully. Please contact support with correlation ID: ${correlationId || "N/A"}`,
            retry: () => {
              setSubmitError(null);
              performSubmit(data);
            },
          });

          toast({
            title: "Partial Update",
            description:
              "Compulsory selective was updated, but selective subjects failed. Please retry or contact support.",
            variant: "destructive",
          });

          setIsSubmitting(false);
          return;
        }

        // If no rollback needed, throw the error
        throw error;
      }

      if (!selectiveResult.success) {
        if (selectiveResult.code === 401) {
          toast({
            title: "Unauthorized",
            description: "Please log in again",
            variant: "destructive",
          });
          router.push("/auth/login");
          return;
        }
        throw new Error(
          `Failed to update selective subjects: ${selectiveResult.message}`,
        );
      }

      // Capture correlation ID from selective result if available
      if (!correlationId) {
        correlationId =
          selectiveResult.requestId || selectiveResult.correlationId || null;
      }

      // Both updates succeeded - optimistically update local state
      // (See Comment 12 for optimistic update implementation)
      toast({
        title: "Success!",
        description: "Your subjects have been registered successfully.",
      });

      // Persist selected class/term to AcademicContext
      if (data.classId && configClassId) {
        const classLevel = getClassLevelById(configClassId);
        if (classLevel) {
          setCurrentClass(classLevel);
        }
      }

      if (data.termId) {
        // Map UI term ID to config term ID using helper function
        const configTermId = uiTermIdToConfigTermId(data.termId);
        if (configTermId) {
          const term = getTermById(configTermId);
          if (term) {
            setCurrentTerm(term);
          }
        }
      }

      // Optimistically construct updated data
      const updatedData = {
        ...apiSubjectsData,
        compulsory_selective:
          classLevel === "JSS" && data.compulsorySelective
            ? apiSubjectsData?.compulsory_selective.filter(
                (s) => s.id === data.compulsorySelective,
              ) || []
            : apiSubjectsData?.compulsory_selective || [],
        selective:
          apiSubjectsData?.selective.filter((s) =>
            data.electiveIds.includes(s.id),
          ) || [],
        subjects:
          apiSubjectsData?.subjects.filter((s) =>
            coreSubjectIds.includes(s.id),
          ) || [],
      };

      onComplete?.(updatedData);
      // Clear any previous errors on success
      setSubmitError(null);
    } catch (error: any) {
      // Report which step failed and set inline error
      const failedStep =
        compulsoryResult && !compulsoryResult.success
          ? "compulsory selective"
          : selectiveResult && !selectiveResult.success
            ? "selective subjects"
            : "unknown";

      const errorMessage = error.message || "Unknown error occurred";
      const correlationInfo = correlationId
        ? ` (Correlation ID: ${correlationId})`
        : "";

      setSubmitError({
        step: failedStep,
        message: `${errorMessage}${correlationInfo}`,
        retry: () => {
          setSubmitError(null);
          performSubmit(data);
        },
      });

      toast({
        title: "Update Failed",
        description: `Failed to update ${failedStep}: ${errorMessage}. Please try again.${correlationInfo}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: SubjectSetupFormData) => {
    if (requireConfirmation && onRequestConfirmation) {
      onRequestConfirmation(() => performSubmit(data));
      return;
    }
    await performSubmit(data);
  };

  const progress = (currentStep / STEPS.length) * 100;
  // Derive requiredElectiveCount from the same logic as the schema
  // JSS requires 2 electives; SSS requires 4 electives.
  const requiredElectiveCount = useMemo(() => {
    if (!classId) return 2; // Default to JSS
    const isJSS = classId.toLowerCase().includes("jss");
    return getRequiredElectiveCount(isJSS);
  }, [classId]);

  // Note: isConfigSubjectSelected and isConfigSubjectDisabled removed as we use API subjects directly

  // Calculate subject counts for tracker
  const totalSelected = coreSubjectIds.length + electiveIds.length;
  const expectedTotal = useMemo(() => {
    if (!classId) return 0;
    const isJSS = classId.toLowerCase().includes("jss");
    return coreApiSubjects.length + getRequiredElectiveCount(isJSS);
  }, [classId, coreApiSubjects.length]);
  const requiredCoreCount = coreApiSubjects.length;
  const requiredElectiveCountForTracker = useMemo(() => {
    if (!classId) return 2;
    const isJSS = classId.toLowerCase().includes("jss");
    return getRequiredElectiveCount(isJSS);
  }, [classId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Subject Count Tracker */}
      {classId && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Subject Selection Progress
            </h3>
            <span
              className={`text-sm font-medium ${
                totalSelected === expectedTotal
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              {totalSelected}/{expectedTotal} Total
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground">Core Subjects</span>
                <span
                  className={`font-medium ${
                    coreSubjectIds.length === requiredCoreCount
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {coreSubjectIds.length}/{requiredCoreCount}
                </span>
              </div>
              <Progress
                value={(coreSubjectIds.length / requiredCoreCount) * 100}
                className="h-2"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground">Elective Subjects</span>
                <span
                  className={`font-medium ${
                    electiveIds.length === requiredElectiveCountForTracker
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {electiveIds.length}/{requiredElectiveCountForTracker}
                </span>
              </div>
              <Progress
                value={
                  (electiveIds.length / requiredElectiveCountForTracker) * 100
                }
                className="h-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Inline Error Display */}
      {submitError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">
                Update Failed{submitError.step ? ` - ${submitError.step}` : ""}
              </h4>
              <p className="mt-1 text-sm text-destructive/90">
                {submitError.message}
              </p>
            </div>
            {submitError.retry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitError(null);
                  submitError.retry?.();
                }}
                className="ml-4"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Class & Term Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[0].title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {STEPS[0].description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <Select
                    value={classId}
                    onValueChange={(value) => setValue("classId", value)}
                  >
                    <SelectTrigger id="classId">
                      <SelectValue placeholder="Select your class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JSS1">JSS 1</SelectItem>
                      <SelectItem value="JSS2">JSS 2</SelectItem>
                      <SelectItem value="JSS3">JSS 3</SelectItem>
                      <SelectItem value="SSS1">SSS 1</SelectItem>
                      <SelectItem value="SSS2">SSS 2</SelectItem>
                      <SelectItem value="SSS3">SSS 3</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.classId && (
                    <p className="text-sm text-destructive">
                      {errors.classId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termId">Term</Label>
                  <Select
                    value={termId}
                    onValueChange={(value) => setValue("termId", value)}
                  >
                    <SelectTrigger id="termId">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Term</SelectItem>
                      <SelectItem value="2">Second Term</SelectItem>
                      <SelectItem value="3">Third Term</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.termId && (
                    <p className="text-sm text-destructive">
                      {errors.termId.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Track Selection (SSS only) */}
          {currentStep === 2 && classLevel === "SSS" && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[1].title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {STEPS[1].description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {(["science", "arts", "commercial"] as const).map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setSelectedTrack(track)}
                      className={`rounded-lg border-2 p-6 text-left transition-all ${
                        selectedTrack === track
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <h3 className="mb-2 font-semibold capitalize">
                        {track} Track
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {track === "science" &&
                          "For students pursuing medicine, engineering, or science-related fields"}
                        {track === "arts" &&
                          "For students interested in law, languages, or social sciences"}
                        {track === "commercial" &&
                          "For students interested in business, accounting, or economics"}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 (JSS) or Step 3 (SSS): Core/Selective Subjects Selection */}
          {((currentStep === 2 && classLevel === "JSS") ||
            (currentStep === 3 && classLevel === "SSS")) &&
            classId && (
              <Card>
                <CardHeader>
                  <CardTitle>{STEPS[2].title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {STEPS[2].description}
                  </p>
                  {classLevel === "JSS" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Select one compulsory selective subject (religious
                      studies) and your core subjects
                    </p>
                  )}
                  {classLevel === "SSS" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Select your core/selective subjects for your class
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingSubjects || !apiSubjectsData ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Compulsory Selective for JSS */}
                      {classLevel === "JSS" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">
                              Compulsory Selective (Select One)
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {compulsorySelective
                                ? "1 selected"
                                : "0 selected"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {apiSubjectsData.compulsory_selective.map(
                              (apiSubject) => {
                                const isSelected =
                                  compulsorySelective === apiSubject.id;

                                return (
                                  <SubjectCard
                                    key={apiSubject.id}
                                    subject={apiSubject}
                                    isSelected={isSelected}
                                    onSelect={() => {
                                      setValue(
                                        "compulsorySelective",
                                        isSelected ? null : apiSubject.id,
                                      );
                                    }}
                                  />
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                      {/* Core Subjects from API - Core/Selective Selection */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">
                            {classLevel === "JSS"
                              ? "Core Subjects"
                              : "Core/Selective Subjects"}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {coreSubjectIds.length} selected (all required)
                          </span>
                        </div>
                        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                          <p className="text-xs text-blue-900 dark:text-blue-100">
                            Core subjects are mandatory and have been
                            automatically selected for you.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {coreApiSubjects.map((apiSubject) => {
                            const isSelected = coreSubjectIds.includes(
                              apiSubject.id,
                            );

                            return (
                              <SubjectCard
                                key={apiSubject.id}
                                subject={{
                                  id: apiSubject.id,
                                  name: apiSubject.name,
                                }}
                                isSelected={isSelected}
                                onSelect={() => {
                                  // Core subjects cannot be deselected
                                  toast({
                                    title: "Core Subject Required",
                                    description:
                                      "Core subjects are mandatory and cannot be deselected.",
                                    variant: "default",
                                  });
                                }}
                                disabled={true}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Step 4 (JSS) or Step 4 (SSS): Elective Selection */}
          {((currentStep === 4 && classLevel === "JSS") ||
            (currentStep === 4 && classLevel === "SSS")) && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[3].title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select {requiredElectiveCount} elective subjects
                </p>
                <p className="text-xs text-muted-foreground">
                  {electiveIds.length}/{requiredElectiveCount} selected
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingSubjects || !apiSubjectsData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Show selected core subjects (disabled) */}
                    {coreSubjectIds.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">
                            Core Subjects (Selected)
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {coreSubjectIds.length} selected
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {coreApiSubjects
                            .filter((s) => coreSubjectIds.includes(s.id))
                            .map((apiSubject) => (
                              <SubjectCard
                                key={apiSubject.id}
                                subject={{
                                  id: apiSubject.id,
                                  name: apiSubject.name,
                                }}
                                isSelected={true}
                                onSelect={() => {}}
                                disabled={true}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Elective subjects */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">
                          Choose Your Electives ({electiveIds.length}/
                          {requiredElectiveCount})
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {apiSubjectsData.selective.map((subject) => {
                          const isSelected = electiveIds.includes(subject.id);
                          const isDisabled =
                            !isSelected &&
                            (electiveIds.length >= requiredElectiveCount ||
                              coreSubjectIds.includes(subject.id));

                          return (
                            <SubjectCard
                              key={subject.id}
                              subject={subject}
                              isSelected={isSelected}
                              onSelect={() => {
                                if (isSelected) {
                                  setValue(
                                    "electiveIds",
                                    electiveIds.filter(
                                      (id) => id !== subject.id,
                                    ),
                                  );
                                } else if (
                                  electiveIds.length < requiredElectiveCount
                                ) {
                                  setValue("electiveIds", [
                                    ...electiveIds,
                                    subject.id,
                                  ]);
                                }
                              }}
                              disabled={isDisabled}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {errors.electiveIds && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.electiveIds.message}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[4].title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {STEPS[4].description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Class & Term</h4>
                  <p className="text-sm text-muted-foreground">
                    Class: {classId}
                    {selectedTrack &&
                      ` (${selectedTrack.charAt(0).toUpperCase() + selectedTrack.slice(1)} Track)`}{" "}
                    | Term:{" "}
                    {termId === "1"
                      ? "First Term"
                      : termId === "2"
                        ? "Second Term"
                        : termId === "3"
                          ? "Third Term"
                          : "Unknown"}
                  </p>
                </div>

                {classLevel === "JSS" && compulsorySelective && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Compulsory Selective</h4>
                    <p className="text-sm text-muted-foreground">
                      {
                        apiSubjectsData?.compulsory_selective.find(
                          (s) => s.id === compulsorySelective,
                        )?.name
                      }
                    </p>
                  </div>
                )}

                {coreSubjectIds.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      Core Subjects ({coreSubjectIds.length})
                    </h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {coreSubjectIds.map((id) => {
                        const subject =
                          apiSubjectsData?.subjects.find((s) => s.id === id) ||
                          apiSubjectsData?.selective.find((s) => s.id === id);
                        return (
                          <li key={id}>{subject?.name || `Subject ${id}`}</li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">
                    Elective Subjects ({electiveIds.length})
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {electiveIds.map((id) => (
                      <li key={id}>
                        {apiSubjectsData?.selective.find((s) => s.id === id)
                          ?.name || `Subject ${id}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        {currentStep < STEPS.length ? (
          <Button type="button" onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 size-4" />
                Confirm & Submit
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
