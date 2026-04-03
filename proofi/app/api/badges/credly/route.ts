import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractCredlySlug(url: string): string | null {
  try {
    const patterns = [
      /credly\.com\/badges\/([a-z0-9-]+)/i,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
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
    return Response.json({ error: "Could not extract badge slug from URL" }, { status: 400 });
  }

  try {
    const apiUrl = `https://api.credly.com/v1/obi/v2/badges/${slug}`;
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return Response.json(
        { error: `Credly API returned ${res.status}` },
        { status: 400 }
      );
    }

    const json = await res.json();
    const badge = json;

    const title = badge?.name || badge?.badge_template?.name || null;
    const issuingOrganization = badge?.issuer?.name || badge?.badge_template?.issuer?.name || null;
    const description = badge?.description || badge?.badge_template?.description || null;
    const imageUrl = badge?.image?.url || badge?.badge_template?.image?.url || null;
    const credentialUrl = url.split("?")[0].replace(/\/public_url$/, "");

    // Parse dates
    let issuedAt: string | null = null;
    let expiresAt: string | null = null;

    const issuedRaw = badge?.issued_at || badge?.issuedOn;
    if (issuedRaw) {
      try {
        issuedAt = new Date(issuedRaw).toISOString().split("T")[0];
      } catch { /* ignore */ }
    }

    const expiresRaw = badge?.expires_at || badge?.expiresAt;
    if (expiresRaw) {
      try {
        expiresAt = new Date(expiresRaw).toISOString().split("T")[0];
      } catch { /* ignore */ }
    }

    return Response.json({
      data: {
        title,
        issuingOrganization,
        description,
        issuedAt,
        expiresAt,
        imageUrl,
        credentialUrl,
        credentialId: slug,
      },
    });
  } catch (err) {
    console.error("[credly] Fetch failed:", err);
    return Response.json({ error: "Failed to fetch badge from Credly" }, { status: 500 });
  }
}
