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
  "Software Engineering": { bg: "bg-violet-500/15", text: "text-violet-300", border: "border-violet-500/25" },
  "Machine Learning":     { bg: "bg-blue-500/15",   text: "text-blue-300",   border: "border-blue-500/25" },
  "Artificial Intelligence": { bg: "bg-cyan-500/15", text: "text-cyan-300",  border: "border-cyan-500/25" },
  "Business Analytics":   { bg: "bg-amber-500/15",  text: "text-amber-300",  border: "border-amber-500/25" },
  "Data Science":         { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/25" },
  "Cybersecurity":        { bg: "bg-red-500/15",     text: "text-red-300",    border: "border-red-500/25" },
  "Cloud Computing":      { bg: "bg-sky-500/15",     text: "text-sky-300",    border: "border-sky-500/25" },
  "Other":                { bg: "bg-gray-500/15",    text: "text-gray-300",   border: "border-gray-500/25" },
};

export const DOMAIN_GRAD: Record<string, string> = {
  "Software Engineering": "from-violet-500/20 to-purple-500/20",
  "Machine Learning":     "from-blue-500/20 to-cyan-500/20",
  "Artificial Intelligence": "from-cyan-500/20 to-teal-500/20",
  "Business Analytics":   "from-amber-500/20 to-yellow-500/20",
  "Data Science":         "from-emerald-500/20 to-green-500/20",
  "Cybersecurity":        "from-red-500/20 to-rose-500/20",
  "Cloud Computing":      "from-sky-500/20 to-blue-500/20",
  "Other":                "from-gray-500/20 to-slate-500/20",
};

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;
