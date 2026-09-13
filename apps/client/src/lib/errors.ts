import axios from "axios";

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
