export type OrgColor = {
  border: string;
  pill: string;
  pillText: string;
  pillBorder: string;
};

// 10 visually distinct colors — no red
const ORG_PALETTE: OrgColor[] = [
  { border: "#7c3aed", pill: "rgba(124,58,237,0.12)", pillText: "#7c3aed", pillBorder: "rgba(124,58,237,0.40)" },
  { border: "#2563eb", pill: "rgba(37,99,235,0.10)",  pillText: "#2563eb", pillBorder: "rgba(37,99,235,0.40)"  },
  { border: "#0891b2", pill: "rgba(8,145,178,0.10)",  pillText: "#0891b2", pillBorder: "rgba(8,145,178,0.40)"  },
  { border: "#0d9488", pill: "rgba(13,148,136,0.10)", pillText: "#0d9488", pillBorder: "rgba(13,148,136,0.40)" },
  { border: "#16a34a", pill: "rgba(22,163,74,0.10)",  pillText: "#16a34a", pillBorder: "rgba(22,163,74,0.40)"  },
  { border: "#65a30d", pill: "rgba(101,163,13,0.10)", pillText: "#65a30d", pillBorder: "rgba(101,163,13,0.40)" },
  { border: "#d97706", pill: "rgba(217,119,6,0.10)",  pillText: "#d97706", pillBorder: "rgba(217,119,6,0.40)"  },
  { border: "#ea580c", pill: "rgba(234,88,12,0.10)",  pillText: "#ea580c", pillBorder: "rgba(234,88,12,0.40)"  },
  { border: "#db2777", pill: "rgba(219,39,119,0.10)", pillText: "#db2777", pillBorder: "rgba(219,39,119,0.40)" },
  { border: "#4f46e5", pill: "rgba(79,70,229,0.10)",  pillText: "#4f46e5", pillBorder: "rgba(79,70,229,0.40)"  },
];

/**
 * Builds a color map for a list of org names, assigning each a unique color by
 * index so no two orgs share the same color (up to palette size).
 * Pass the full ordered list of orgs once; reuse the returned map for lookups.
 */
export function buildOrgColorMap(orgs: string[]): Map<string, OrgColor> {
  const map = new Map<string, OrgColor>();
  const seen: string[] = [];
  for (const org of orgs) {
    if (!map.has(org)) {
      map.set(org, ORG_PALETTE[seen.length % ORG_PALETTE.length]);
      seen.push(org);
    }
  }
  return map;
}
