import type { Request, Response } from "express";
import { User } from "@tpo/db";
import type { UpdateMeInput } from "@tpo/shared";
import { AppError } from "../../middleware/errorHandler.js";
import { toSafeUser } from "../../utils/safeUser.js";

export async function getMeHandler(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new AppError(404, "User not found");
  }
  res.json({ user: toSafeUser(user) });
}

export async function updateMeHandler(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateMeInput;
  const user = await User.findByIdAndUpdate(req.user!.id, input, { new: true });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  res.json({ user: toSafeUser(user) });
}
