import mammoth from "mammoth";
import pdfParse from "pdf-parse";

/** Works for both Cloudinary URLs and the local-disk dev fallback (see apps/server/src/config/storage.ts) — either way it's just an HTTP fetch. */
export async function fetchFileBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch resume file: ${response.status} ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function extractTextFromBuffer(buffer: Buffer, fileType: "pdf" | "docx"): Promise<string> {
  if (fileType === "pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
