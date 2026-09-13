import { Notification } from "@tpo/db";
import { AppError } from "../../middleware/errorHandler.js";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  meta?: Record<string, unknown>,
) {
  return Notification.create({ userId, type, title, body, meta });
}

export async function listNotifications(userId: string) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function markRead(userId: string, notificationId: string) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true },
  );
  if (!notification) {
    throw new AppError(404, "Notification not found");
  }
  return notification;
}
