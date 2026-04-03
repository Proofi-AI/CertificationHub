import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_BUCKETS = ["certificates", "avatars", "badges"];

async function ensureBucket(bucket: string) {
  const { error } = await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: MAX_SIZE,
  });
  // "already exists" is fine — ignore it
  if (error && !error.message.toLowerCase().includes("already exist")) {
    throw new Error(`Failed to create bucket "${bucket}": ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string) || "certificates";
  const path = formData.get("path") as string | null;

  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
  if (!path) return Response.json({ error: "No path provided" }, { status: 400 });
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return Response.json({ error: "Invalid bucket" }, { status: 400 });
  }
  // For non-badge buckets, enforce strict MIME types
  if (bucket !== "badges" && !ACCEPTED_MIME.includes(file.type)) {
    return Response.json(
      { error: "Only JPG, PNG, WebP, or PDF files are accepted." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File must be 5MB or smaller." }, { status: 400 });
  }

  // Ensure path is scoped to this user (security check)
  if (!path.startsWith(user.id + "/")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create bucket if it doesn't exist
  await ensureBucket(bucket);

  // Upload using admin client (bypasses RLS — safe because we verified ownership above)
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
