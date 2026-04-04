import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractUsername(input: string): string {
  const trimmed = input.trim();
  const patterns = [
    /leetcode\.com\/u\/([a-zA-Z0-9_-]+)/,
    /leetcode\.com\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { input } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Please provide a LeetCode username or profile URL." },
        { status: 400 }
      );
    }

    const username = extractUsername(input);

    if (!username || username.length < 2) {
      return NextResponse.json(
        { error: "Could not extract a valid LeetCode username from the input." },
        { status: 400 }
      );
    }

    const query = `
      query getUserBadges($username: String!) {
        matchedUser(username: $username) {
          username
          badges {
            id
            name
            displayName
            shortName
            icon
            hoverText
            creationDate
            category
            medal {
              slug
              config {
                iconGif
                iconGifBackground
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ query, variables: { username } }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not reach LeetCode right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.errors || !data.data?.matchedUser) {
      return NextResponse.json(
        { error: "LeetCode user not found. Please check the username and try again." },
        { status: 404 }
      );
    }

    const rawBadges = data.data.matchedUser.badges ?? [];

    if (rawBadges.length === 0) {
      return NextResponse.json(
        { error: "No badges found on this LeetCode profile." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badges = rawBadges.map((b: any) => {
      const iconUrl =
        b.medal?.config?.iconGif ||
        b.medal?.config?.iconGifBackground ||
        (b.icon?.startsWith("http") ? b.icon : b.icon ? `https://leetcode.com${b.icon}` : null);

      return {
        title: b.displayName || b.name || b.shortName,
        issuingOrganization: "LeetCode",
        description: b.hoverText || null,
        issuedAt: (() => {
          const ts = parseInt(b.creationDate);
          return ts > 0 ? new Date(ts * 1000).toISOString().split("T")[0] : null;
        })(),
        imageUrl: iconUrl || null,
        credentialUrl: `https://leetcode.com/${username}`,
        originalId: String(b.id),
      };
    });

    return NextResponse.json({ username, badges });
  } catch (error) {
    console.error("[leetcode] Fetch error:", error);
    return NextResponse.json(
      { error: "Could not reach LeetCode right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
