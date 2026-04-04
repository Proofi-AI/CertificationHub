import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractCredlySlug(url: string): string | null {
  const match = url.match(/credly\.com\/badges\/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
}

function toISODate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
}


async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.credly.com/",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

// Two-step OBI v2 fetch: assertion (has issuedOn) + badge class (has name/org/image)
async function fetchViaOBIv2(slug: string) {
  // Step 1 — assertion gives us issuedOn and the badge class URL
  const assertionRes = await fetch(
    `https://api.credly.com/api/v1/obi/v2/badge_assertions/${slug}`,
    {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!assertionRes.ok) return null;

  const assertion = await assertionRes.json();
  const issuedAt = toISODate(assertion.issuedOn ?? null);
  const badgeClassUrl: string | null = assertion.badge ?? null;
  if (!badgeClassUrl) return null;

  // Step 2 — badge class gives us name, issuer, description, image
  const classRes = await fetch(badgeClassUrl, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!classRes.ok) return null;

  const cls = await classRes.json();
  // Use image.id directly — it's the authoritative named PNG (e.g. /images/{id}/badge.png)
  // Do NOT rewrite to /size/680x680/images/{id}/image.png — that URL is access-denied
  const imageUrl: string | null = cls.image?.id ?? null;

  return {
    title: cls.name ?? null,
    org: cls.issuer?.name ?? null,
    description: cls.description ?? null,
    issuedAt,
    imageUrl,
  };
}

// Fallback: scrape OG tags from the badge HTML page
function parseMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
  }
  return null;
}

function parseTitleAndOrg(ogTitle: string): { title: string; org: string } {
  const issuedByMatch = ogTitle.match(/^(.+?)\s+was issued by\s+(.+?)\s+to\s+/i);
  if (issuedByMatch) {
    return { title: issuedByMatch[1].trim(), org: issuedByMatch[2].trim() };
  }
  const earnedMatch = ogTitle.match(/^(.+?)\s+was (?:earned|awarded)/i);
  if (earnedMatch) {
    return { title: earnedMatch[1].trim(), org: "" };
  }
  return { title: ogTitle.split(/\s+was issued/i)[0].trim(), org: "" };
}

async function fetchViaHTMLScrape(slug: string) {
  const badgePageUrl = `https://www.credly.com/badges/${slug}`;
  const res = await fetch(badgePageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;

  const html = await res.text();
  const ogTitle = parseMeta(html, "og:title");
  const ogImage = parseMeta(html, "og:image");
  const ogDescription = parseMeta(html, "og:description") || parseMeta(html, "description");
  if (!ogTitle) return null;

  const { title, org } = parseTitleAndOrg(ogTitle);
  // Use the OG image URL as-is — the /size/680x680/.../image.png variant is access-denied
  const imageUrl = ogImage ?? null;

  return { title, org, description: ogDescription ?? null, issuedAt: null, imageUrl };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { url } = body;

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }
  if (!url.includes("credly.com")) {
    return Response.json({ error: "Not a Credly URL" }, { status: 400 });
  }

  const slug = extractCredlySlug(url);
  if (!slug) {
    return Response.json({ error: "Could not extract badge ID from URL" }, { status: 400 });
  }

  const badgePageUrl = `https://www.credly.com/badges/${slug}`;

  try {
    // Try the OBI v2 API first — it has issuedOn and full badge data
    let result = await fetchViaOBIv2(slug);

    // Fall back to HTML scraping if OBI fails
    if (!result) {
      result = await fetchViaHTMLScrape(slug);
    }

    if (!result || !result.title) {
      return Response.json({ error: "Could not read badge data from Credly" }, { status: 400 });
    }

    // Download image server-side so the client can upload it to storage
    const imageBase64 = result.imageUrl ? await downloadImageAsBase64(result.imageUrl) : null;

    return Response.json({
      data: {
        title: result.title,
        issuingOrganization: result.org ?? "",
        description: result.description ?? null,
        issuedAt: result.issuedAt ?? null,
        expiresAt: null,
        imageBase64,
        imageUrl: result.imageUrl ?? null,
        credentialUrl: badgePageUrl,
        credentialId: slug,
      },
    });
  } catch (err) {
    console.error("[credly] Fetch failed:", err);
    return Response.json({ error: "Failed to fetch badge from Credly" }, { status: 500 });
  }
}
