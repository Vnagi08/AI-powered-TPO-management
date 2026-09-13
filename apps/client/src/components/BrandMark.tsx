/**
 * One deployment = one college (see DEPLOYMENT.md's "deployable template" model) —
 * this is the single place that reads the branding env vars, so every page shows
 * the same name/logo without duplicating the fallback logic three times over.
 */
export const COLLEGE_NAME = (import.meta.env.VITE_COLLEGE_NAME as string | undefined)?.trim() || "TPO Platform";
const COLLEGE_LOGO_URL = import.meta.env.VITE_COLLEGE_LOGO_URL as string | undefined;

const SIZES = {
  sm: "h-7 w-7 rounded-lg text-sm",
  md: "h-8 w-8 rounded-lg text-sm",
  lg: "h-12 w-12 rounded-2xl text-lg",
};

export function BrandMark({ size = "md" }: { size?: keyof typeof SIZES }) {
  if (COLLEGE_LOGO_URL) {
    return (
      <img
        src={COLLEGE_LOGO_URL}
        alt={COLLEGE_NAME}
        className={`${SIZES[size]} object-cover shadow-card`}
      />
    );
  }
  return (
    <span
      className={`flex items-center justify-center bg-brand-700 font-bold text-white shadow-card ${SIZES[size]}`}
    >
      {COLLEGE_NAME.charAt(0).toUpperCase()}
    </span>
  );
}
