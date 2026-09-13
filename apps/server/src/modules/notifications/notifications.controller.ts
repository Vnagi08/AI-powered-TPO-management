import type { Request, Response } from "express";
import * as notificationsService from "./notifications.service.js";

export async function listNotificationsHandler(req: Request, res: Response): Promise<void> {
  const notifications = await notificationsService.listNotifications(req.user!.id);
  res.json({ notifications });
}

export async function markReadHandler(req: Request, res: Response): Promise<void> {
  const notification = await notificationsService.markRead(req.user!.id, req.params.id!);
  res.json({ notification });
}
