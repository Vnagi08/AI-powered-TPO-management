import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../components/ui/Card";
import { listNotifications, markNotificationRead } from "./notificationsApi";

export function NotificationsSection() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const notifications = notificationsQuery.data ?? [];
  if (notifications.length === 0) return null;

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
      <ul className="mt-2 space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-lg p-2.5 text-sm ${n.isRead ? "text-slate-400" : "bg-brand-50 text-slate-700"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs">{n.body}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
