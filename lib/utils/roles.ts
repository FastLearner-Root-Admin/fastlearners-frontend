import type { User, UserRole } from "@/lib/types/auth";

export const KNOWN_USER_ROLES: UserRole[] = [
  "guest",
  "student",
  "guardian",
  "teacher",
  "admin",
  "superadmin",
];

const ROLE_SET = new Set<string>(KNOWN_USER_ROLES);

const normalizeRoleName = (value: unknown): UserRole | null => {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const role = normalized === "super_admin" ? "superadmin" : normalized;

  return ROLE_SET.has(role) ? (role as UserRole) : null;
};

const extractRoleFromObject = (value: Record<string, unknown>) =>
  normalizeRoleName(value.name) ||
  normalizeRoleName(value.role) ||
  normalizeRoleName(value.slug) ||
  normalizeRoleName(value.key);

export const normalizeUserRoles = (role: unknown): UserRole[] => {
  const rawRoles = Array.isArray(role) ? role : role ? [role] : [];

  const roles = rawRoles
    .map((item) => {
      if (typeof item === "string") return normalizeRoleName(item);
      if (item && typeof item === "object") {
        return extractRoleFromObject(item as Record<string, unknown>);
      }
      return null;
    })
    .filter((item): item is UserRole => Boolean(item));

  return Array.from(new Set(roles));
};

export const normalizeUser = (user: User): User => ({
  ...user,
  role: normalizeUserRoles((user as any).role ?? (user as any).roles),
});

export const getPrimaryRole = (user: Pick<User, "role"> | null | undefined) =>
  normalizeUserRoles(user?.role)[0] ?? null;

export const userHasRole = (
  user: Pick<User, "role"> | null | undefined,
  role: UserRole,
) => normalizeUserRoles(user?.role).includes(role);
