const DOMAIN_ABBREVIATIONS: Record<string, string> = {
  "software engineering": "dev",
  "machine learning": "ml",
  "artificial intelligence": "ai",
  "cloud computing": "cloud",
  "cybersecurity": "sec",
  "data science": "data",
  "project management": "pm",
  "agile": "agile",
  "human resources": "hr",
  "finance": "fin",
  "accounting": "acct",
  "marketing": "mktg",
  "digital marketing": "dmktg",
  "healthcare": "health",
  "nursing": "rn",
  "fitness & personal training": "fit",
  "teaching & education": "edu",
  "legal": "legal",
  "graphic design": "design",
  "ui ux design": "ux",
  "culinary arts": "chef",
  "supply chain": "scm",
  "lean & six sigma": "lean",
  "quality management": "qa",
  "sustainability": "green",
  "aviation": "pilot",
  "maritime": "marine",
  "real estate": "re",
  "language proficiency": "lang",
  "music": "music",
  "photography": "photo",
  "sports coaching": "coach",
  "devops": "devops",
  "networking": "net",
  "business analysis": "ba",
  "product management": "pm",
  "risk management": "risk",
  "compliance": "grc",
  "architecture": "arch",
  "construction": "build",
  "operations management": "ops",
  "manufacturing": "mfg",
  "data privacy": "priv",
  "coaching": "coach",
  "mental health": "mh",
  "nutrition": "nutri",
  "physiotherapy": "physio",
  "video production": "video",
  "audio engineering": "audio",
  "performing arts": "arts",
  "fashion design": "fashion",
  "interior design": "interior",
  "translation & interpretation": "interp",
  "early childhood education": "ece",
  "instructional design": "id",
  "training & facilitation": "trainer",
  "social work": "sw",
  "pharmacy": "rx",
  "civil engineering": "civil",
  "mechanical engineering": "mech",
  "electrical engineering": "elec",
  "energy management": "energy",
  "environmental management": "env",
  "audit": "audit",
  "insurance": "ins",
  "investment": "inv",
  "sales": "sales",
  "customer service": "cx",
  "entrepreneurship": "found",
  "leadership": "lead",
  "sports science": "sport",
  "tourism": "tour",
  "event management": "events",
  "hospitality management": "hosp",
  "food safety": "food",
  "first aid & safety": "aid",
  "public relations": "pr",
  "journalism": "press",
  "writing & communication": "write",
  "other": "pro",
};

function getDomainAbbreviation(domain: string): string {
  const lower = domain.toLowerCase().trim();
  return DOMAIN_ABBREVIATIONS[lower] ?? lower.split(" ")[0].slice(0, 6);
}

function toSlugPart(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function generateSlugSuggestions(name: string, domains: string[]): string[] {
  const suggestions: string[] = [];
  const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts[nameParts.length - 1] ?? "";

  // Strategy 1: firstname-lastname
  if (firstName && lastName && firstName !== lastName) {
    suggestions.push(`${firstName}-${lastName}`);
  }

  // Strategy 2: firstname + top domain abbreviation
  if (firstName && domains.length > 0) {
    const domainAbbr = getDomainAbbreviation(domains[0]);
    suggestions.push(`${firstName}-${domainAbbr}`);
  }

  // Strategy 3: full name initials + domain
  if (nameParts.length >= 2 && domains.length > 0) {
    const initials = nameParts.map((p) => p[0]).join("");
    const domainAbbr = getDomainAbbreviation(domains[0]);
    suggestions.push(`${initials}-${domainAbbr}`);
  }

  // Fallback suggestions
  if (suggestions.length < 3 && firstName) {
    suggestions.push(`${firstName}-pro`);
    suggestions.push(`${firstName}-certs`);
  }

  // Deduplicate and sanitize
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of suggestions) {
    const sanitized = toSlugPart(s).replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
    if (sanitized.length >= 3 && !seen.has(sanitized)) {
      seen.add(sanitized);
      unique.push(sanitized);
    }
  }

  return unique.slice(0, 3);
}
