import type { HydratedDocument } from "mongoose";
import type { UserRole } from "@tpo/shared";

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isEmailVerified: boolean;
  status: string;
}

// Never leak passwordHash / tokens to the client — this is the one shape auth
// responses are allowed to return.
export function toSafeUser(user: HydratedDocument<any>): SafeUser {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    status: user.status,
  };
}
