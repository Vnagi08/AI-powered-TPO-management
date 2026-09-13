import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "indigo" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-200 text-slate-700",
  info: "bg-blue-200 text-blue-800",
  indigo: "bg-brand-200 text-brand-800",
  success: "bg-emerald-200 text-emerald-800",
  warning: "bg-amber-200 text-amber-800",
  danger: "bg-red-200 text-red-800",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
