import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { buttonClasses } from "../lib/buttonStyles";
import { BrandMark, COLLEGE_NAME } from "./BrandMark";
import type { UserRole } from "../features/auth/types";

const NAV_LINKS: Record<UserRole, { to: string; label: string }[]> = {
  student: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/jobs", label: "Browse jobs" },
    { to: "/applications", label: "My applications" },
  ],
  recruiter: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/my-jobs", label: "My jobs" },
    { to: "/search", label: "Search resumes" },
    { to: "/analytics", label: "Analytics" },
  ],
  tpo_admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/analytics", label: "Analytics" },
  ],
};

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user ? NAV_LINKS[user.role] : [];

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
              <BrandMark size="sm" />
              <span className="hidden text-sm font-semibold text-slate-900 sm:inline">{COLLEGE_NAME}</span>
            </Link>
            <nav className="flex gap-4 overflow-x-auto">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="whitespace-nowrap text-sm text-slate-600 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          {user && (
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-sm text-slate-600 md:inline">{user.fullName}</span>
              <button onClick={handleLogout} className={buttonClasses("secondary", "sm")}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
