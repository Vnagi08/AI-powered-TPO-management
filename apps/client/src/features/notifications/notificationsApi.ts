import { apiClient } from "../../lib/apiClient";

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications(): Promise<NotificationRecord[]> {
  const { data } = await apiClient.get("/notifications");
  return data.notifications;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}
