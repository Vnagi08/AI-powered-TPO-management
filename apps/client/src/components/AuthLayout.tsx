import type { ReactNode } from "react";
import { BrandMark, COLLEGE_NAME } from "./BrandMark";

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="mb-6 flex items-center justify-center gap-2">
          <BrandMark size="md" />
          <span className="text-sm font-semibold text-slate-900">{COLLEGE_NAME}</span>
        </div>
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-card">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
