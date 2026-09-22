export const USER_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();

  if (normalized === "USER" || normalized === "ADMIN" || normalized === "SUPER_ADMIN") {
    return normalized as UserRole;
  }

  return null;
}

export function isAdminRole(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN";
}

export function isSuperAdminRole(role: unknown): boolean {
  return normalizeRole(role) === "SUPER_ADMIN";
}
