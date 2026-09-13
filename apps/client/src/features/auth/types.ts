export type UserRole = "student" | "recruiter" | "tpo_admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isEmailVerified: boolean;
  status: string;
}
