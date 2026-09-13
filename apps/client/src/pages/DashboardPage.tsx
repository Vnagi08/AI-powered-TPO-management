import { AdminCompaniesSection } from "../features/profile/AdminCompaniesSection";
import { RecruiterProfileSection } from "../features/profile/RecruiterProfileSection";
import { StudentProfileSection } from "../features/profile/StudentProfileSection";
import { NotificationsSection } from "../features/notifications/NotificationsSection";
import { Card } from "../components/ui/Card";
import { useAuth } from "../features/auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-lg font-semibold text-slate-900">Welcome, {user.fullName}</h1>
        <p className="mt-1 text-sm capitalize text-slate-600">
          {user.role.replace("_", " ")} · {user.email}
        </p>
      </Card>

      <NotificationsSection />

      <Card>
        {user.role === "student" && <StudentProfileSection userId={user.id} />}
        {user.role === "recruiter" && <RecruiterProfileSection userId={user.id} />}
        {user.role === "tpo_admin" && <AdminCompaniesSection />}
      </Card>
    </div>
  );
}
