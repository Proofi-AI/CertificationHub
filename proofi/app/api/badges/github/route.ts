import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractUsername(input: string): string {
  const trimmed = input.trim();
  const patterns = [/github\.com\/([a-zA-Z0-9_-]+)/];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
}

const GITHUB_ACHIEVEMENT_METADATA: Record<string, { description: string; tier: (variant: string) => string }> = {
  "starstruck": {
    description: "Created a repository that has many stars.",
    tier: (v) => v === "x2" ? "Bronze" : v === "x3" ? "Silver" : v === "x4" ? "Gold" : "Default",
  },
  "quickdraw": {
    description: "Closed an issue or pull request within 5 minutes of opening.",
    tier: () => "Default",
  },
  "pair-extraordinaire": {
    description: "Coauthored commits on merged pull requests.",
    tier: (v) => v === "x2" ? "Bronze" : v === "x3" ? "Silver" : v === "x4" ? "Gold" : "Default",
  },
  "pull-shark": {
    description: "Opened pull requests that have been merged.",
    tier: (v) => v === "x2" ? "Bronze" : v === "x3" ? "Silver" : v === "x4" ? "Gold" : "Default",
  },
  "galaxy-brain": {
    description: "Answered a discussion with a marked answer.",
    tier: (v) => v === "x2" ? "Bronze" : v === "x3" ? "Silver" : v === "x4" ? "Gold" : "Default",
  },
  "yolo": {
    description: "Merged a pull request without a code review.",
    tier: () => "Default",
  },
  "arctic-code-vault-contributor": {
    description: "Contributed code to repositories in the 2020 GitHub Archive Program.",
    tier: () => "Default",
  },
  "mars-2020-contributor": {
    description: "Contributed code to repositories used in the Mars 2020 Helicopter Mission.",
    tier: () => "Default",
  },
  "open-sourcerer": {
    description: "Had pull requests merged in multiple public repositories.",
    tier: (v) => v === "x2" ? "Bronze" : v === "x3" ? "Silver" : v === "x4" ? "Gold" : "Default",
  },
  "public-sponsor": {
    description: "Sponsored an open source contributor through GitHub Sponsors.",
    tier: () => "Default",
  },
  "heart-on-your-sleeve": {
    description: "Reacted to something on GitHub with a heart emoji.",
    tier: (v) => v === "x2" ? "Bronze" : v === "x3" ? "Silver" : v === "x4" ? "Gold" : "Default",
  },
  "developer-program-member": {
    description: "Member of the GitHub Developer Program.",
    tier: () => "Default",
  },
  "security-advisory-credit": {
    description: "Credited on a security advisory submitted to the GitHub Advisory Database.",
    tier: () => "Default",
  },
  "github-campus-expert": {
    description: "Trained as a GitHub Campus Expert.",
    tier: () => "Default",
  },
  "github-pro": {
    description: "Uses GitHub Pro.",
    tier: () => "Default",
  },
  "first-bug-fix": {
    description: "Opened first bug fix pull request.",
    tier: () => "Default",
  },
  "first-pull-request": {
    description: "Opened first pull request on GitHub.",
    tier: () => "Default",
  },
  "first-repo": {
    description: "Created first repository on GitHub.",
    tier: () => "Default",
  },
};

function formatAchievementName(slug: string, variant: string): string {
  const tierLabels: Record<string, string> = { x2: "Bronze", x3: "Silver", x4: "Gold" };
  const baseName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const tier = tierLabels[variant];
  return tier ? `${baseName} (${tier})` : baseName;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { input } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Please provide a GitHub username or profile URL." },
        { status: 400 }
      );
    }

    const username = extractUsername(input);

    if (!username || username.length < 1) {
      return NextResponse.json(
        { error: "Could not extract a valid GitHub username from the input." },
        { status: 400 }
      );
    }

    // Verify user exists
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Proofi-App",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (userResponse.status === 404) {
      return NextResponse.json(
        { error: `GitHub user "${username}" not found. Please check the username and try again.` },
        { status: 404 }
      );
    }

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Could not reach GitHub. Please try again shortly." },
        { status: 502 }
      );
    }

    // Scrape achievements tab
    const achievementsPageResponse = await fetch(
      `https://github.com/${username}?tab=achievements`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Proofi/1.0)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!achievementsPageResponse.ok) {
      return NextResponse.json(
        { error: "Could not fetch GitHub achievements. Please try again." },
        { status: 502 }
      );
    }

    const html = await achievementsPageResponse.text();

    // All hovercard URL matches — gives us slug + variant
    const hovercardMatches = [
      ...html.matchAll(
        /data-hovercard-url="([^"]*\/achievements\/([a-z0-9-]+)(?:\/variants\/([a-z0-9]+))?[^"]*)"/gi
      ),
    ];

    // All githubassets.com image src/data-src matches — whatever URL format GitHub currently uses
    const imgSrcMatches = [
      ...html.matchAll(
        /(?:src|data-src)="(https:\/\/github\.githubassets\.com\/[^"]+\.(?:png|gif|webp|svg))"/gi
      ),
    ];

    const seen = new Set<string>();
    const badges: object[] = [];

    for (const hc of hovercardMatches) {
      const slug = hc[2]?.toLowerCase();
      const variant = hc[3]?.toLowerCase() || "default";
      const key = `${slug}-${variant}`;

      if (!slug || seen.has(key)) continue;
      seen.add(key);

      const meta = GITHUB_ACHIEVEMENT_METADATA[slug];
      const displayName = formatAchievementName(slug, variant);
      const tier = meta?.tier(variant) ?? "Default";
      const description = meta?.description ?? null;

      // Find the closest img src that appears after this hovercard match (within 1200 chars)
      const hcEnd = (hc.index ?? 0) + hc[0].length;
      let closestImgUrl: string | null = null;
      let minDist = Infinity;
      for (const img of imgSrcMatches) {
        const dist = (img.index ?? 0) - hcEnd;
        if (dist >= 0 && dist < 1200 && dist < minDist) {
          minDist = dist;
          closestImgUrl = img[1];
        }
      }

      const imageUrl = closestImgUrl ?? null;

      badges.push({
        title: displayName,
        issuingOrganization: "GitHub",
        description: description
          ? `${description}${tier !== "Default" ? ` Tier: ${tier}.` : ""}`
          : null,
        issuedAt: null,
        imageUrl,
        credentialUrl: `https://github.com/${username}?tab=achievements`,
        originalId: key,
        slug,
        variant,
        tier,
      });
    }

    if (badges.length === 0) {
      return NextResponse.json(
        {
          error: `No public achievements found on GitHub for "${username}". Make sure the profile's achievements are set to public in GitHub settings.`,
          noAchievements: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ username, badges });
  } catch (error) {
    console.error("[github] Fetch error:", error);
    return NextResponse.json(
      { error: "Something went wrong fetching from GitHub. Please try again." },
      { status: 500 }
    );
  }
}
