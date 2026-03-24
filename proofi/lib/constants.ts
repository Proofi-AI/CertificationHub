export const DOMAINS = [
  { value: "Software Engineering", label: "Software Engineering" },
  { value: "Machine Learning", label: "Machine Learning" },
  { value: "Artificial Intelligence", label: "Artificial Intelligence" },
  { value: "Business Analytics", label: "Business Analytics" },
  { value: "Data Science", label: "Data Science" },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "Cloud Computing", label: "Cloud Computing" },
  { value: "Other", label: "Other" },
] as const;

export const DOMAIN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Software Engineering":    { bg: "bg-violet-500/10",  text: "text-violet-300",  border: "border-violet-500/20" },
  "Machine Learning":        { bg: "bg-blue-500/10",    text: "text-blue-300",    border: "border-blue-500/20"   },
  "Artificial Intelligence": { bg: "bg-cyan-500/10",    text: "text-cyan-300",    border: "border-cyan-500/20"   },
  "Business Analytics":      { bg: "bg-amber-500/10",   text: "text-amber-300",   border: "border-amber-500/20"  },
  "Data Science":            { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20"},
  "Cybersecurity":           { bg: "bg-red-500/10",     text: "text-red-300",     border: "border-red-500/20"    },
  "Cloud Computing":         { bg: "bg-sky-500/10",     text: "text-sky-300",     border: "border-sky-500/20"    },
  "Other":                   { bg: "bg-slate-500/10",   text: "text-slate-300",   border: "border-slate-500/20"  },
};

/** CSS gradient + glow per domain — used in card accent bar and hover shadow */
export const DOMAIN_ACCENT: Record<string, { from: string; to: string; glow: string }> = {
  "Software Engineering":    { from: "#7c3aed", to: "#6366f1", glow: "rgba(124,58,237,0.28)"  },
  "Machine Learning":        { from: "#3b82f6", to: "#06b6d4", glow: "rgba(59,130,246,0.28)"  },
  "Artificial Intelligence": { from: "#06b6d4", to: "#0d9488", glow: "rgba(6,182,212,0.28)"   },
  "Business Analytics":      { from: "#f59e0b", to: "#f97316", glow: "rgba(245,158,11,0.28)"  },
  "Data Science":            { from: "#10b981", to: "#34d399", glow: "rgba(16,185,129,0.28)"  },
  "Cybersecurity":           { from: "#ef4444", to: "#e11d48", glow: "rgba(239,68,68,0.28)"   },
  "Cloud Computing":         { from: "#0ea5e9", to: "#3b82f6", glow: "rgba(14,165,233,0.28)"  },
  "Other":                   { from: "#6b7280", to: "#4b5563", glow: "rgba(107,114,128,0.18)" },
};

// kept for any legacy consumers
export const DOMAIN_GRAD: Record<string, string> = {
  "Software Engineering":    "from-violet-500/8 to-purple-600/8",
  "Machine Learning":        "from-blue-500/8 to-cyan-500/8",
  "Artificial Intelligence": "from-cyan-500/8 to-teal-600/8",
  "Business Analytics":      "from-amber-500/8 to-orange-500/8",
  "Data Science":            "from-emerald-500/8 to-green-600/8",
  "Cybersecurity":           "from-red-500/8 to-rose-600/8",
  "Cloud Computing":         "from-sky-500/8 to-blue-600/8",
  "Other":                   "from-slate-500/8 to-gray-600/8",
};

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const ACCEPTED_FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
export const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;
