import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Set false for list-style cards (e.g. a divide-y list) that manage their own row padding. */
  padded?: boolean;
}

export function Card({ children, className = "", padded = true }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-300 bg-white shadow-card ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
