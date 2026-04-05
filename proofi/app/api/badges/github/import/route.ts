import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

interface SelectedBadge {
  title: string;
  issuingOrganization: string;
  description: string | null;
  issuedAt: string | null;
  imageUrl: string | null;
  credentialUrl: string | null;
  originalId: string;
  slug: string;
  variant: string;
  tier: string;
}

async function downloadAndUploadImage(
  imageUrl: string,
  userId: string,
  badgeId: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer": "https://github.com",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    const rawBuffer = await response.arrayBuffer();
    const path = `${userId}/${badgeId}.png`;

    await supabaseAdmin.storage.createBucket("badges", { public: true }).catch(() => {});

    const { error } = await supabaseAdmin.storage
      .from("badges")
      .upload(path, rawBuffer, { contentType: "image/png", upsert: true });

    if (error) return null;

    const { data } = supabaseAdmin.storage.from("badges").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { badges: selectedBadges }: { badges: SelectedBadge[] } = await request.json();

    if (!Array.isArray(selectedBadges) || selectedBadges.length === 0) {
      return NextResponse.json({ error: "No badges selected." }, { status: 400 });
    }

    // Duplicate detection: existing GitHub badges for this user
    const existing = await prisma.badge.findMany({
      where: { userId: user.id, issuingOrganization: "GitHub" },
      select: { title: true },
    });
    const existingTitles = new Set(existing.map((b) => b.title.toLowerCase().trim()));

    const toCreate = selectedBadges.filter(
      (b) => !existingTitles.has(b.title.toLowerCase().trim())
    );
    const skipped = selectedBadges.length - toCreate.length;

    if (toCreate.length === 0) {
      return NextResponse.json({ data: [], imported: 0, skipped }, { status: 200 });
    }

    // Create badge records in parallel — GitHub does not provide dates, use today
    const records = await Promise.all(
      toCreate.map((badge) =>
        prisma.badge.create({
          data: {
            userId: user.id,
            title: badge.title,
            issuingOrganization: badge.issuingOrganization,
            description: badge.description || null,
            issuedAt: new Date(),
            expiresAt: null,
            credentialId: null,
            credentialUrl: badge.credentialUrl || null,
            imageUrl: null,
            domain: "Software Engineering",
            isPublic: true,
          },
        })
      )
    );

    // Download and upload all images in parallel — failures are silently skipped
    const imageUploads = await Promise.allSettled(
      records.map(async (record, i) => {
        const sourceUrl = toCreate[i].imageUrl;
        if (!sourceUrl) return { id: record.id, url: null };
        const url = await downloadAndUploadImage(sourceUrl, user.id, record.id);
        return { id: record.id, url };
      })
    );

    // Update imageUrls and build final record list
    const finalRecords = await Promise.all(
      records.map(async (record, i) => {
        const upload = imageUploads[i];
        if (upload.status === "fulfilled" && upload.value.url) {
          return prisma.badge.update({
            where: { id: record.id },
            data: { imageUrl: upload.value.url },
          });
        }
        return record;
      })
    );

    return NextResponse.json(
      { data: finalRecords, imported: finalRecords.length, skipped },
      { status: 201 }
    );
  } catch (error) {
    console.error("[github/import] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong during import. Please try again." },
      { status: 500 }
    );
  }
}
