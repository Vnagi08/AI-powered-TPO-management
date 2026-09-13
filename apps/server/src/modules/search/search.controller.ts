import type { Request, Response } from "express";
import type { SearchResumesInput } from "@tpo/shared";
import * as searchService from "./search.service.js";

export async function searchResumesHandler(req: Request, res: Response): Promise<void> {
  const { query, limit } = req.body as SearchResumesInput;
  const results = await searchService.searchResumes(query, limit);
  res.json({ results });
}
