import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/is-admin";

// POST — submit feedback
// Table: "Feedback" (PascalCase, created by Prisma)
// Columns: camelCase (imageUrl, userId, createdAt, etc.)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const formData = await req.formData();
    const type = (formData.get("type") as string)?.trim();
    const name = (formData.get("name") as string)?.trim() || null;
    const message = (formData.get("message") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const priority = (formData.get("priority") as string)?.trim() || null;
    const file = formData.get("file") as File | null;

    let metadata: Record<string, unknown> = {};
    const metaStr = formData.get("metadata") as string;
    if (metaStr) {
      try { metadata = JSON.parse(metaStr); } catch { /* ignore */ }
    }

    if (!type || !message) {
      return Response.json({ error: "Type and message are required." }, { status: 400 });
    }

    // Upload screenshot to Supabase Storage if provided
    let imageUrl: string | null = null;
    if (file && file.size > 0) {
      const bucket = "feedback-screenshots";
      await supabaseAdmin.storage.createBucket(bucket, { public: true, fileSizeLimit: 5 * 1024 * 1024 });

      const ext = file.name.split(".").pop() ?? "png";
      const folder = user?.id ?? "anonymous";
      const path = `${folder}/${Date.now()}.${ext}`;
      const bytes = await file.arrayBuffer();

      const { error: upErr } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, bytes, { contentType: file.type, upsert: true });

      if (!upErr) {
        const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("Feedback").insert({
      id: crypto.randomUUID(),
      type,
      name: name || user?.user_metadata?.full_name || null,
      email: email || user?.email || null,
      message,
      priority: priority || null,
      imageUrl,
      metadata,
      userId: user?.id || null,
      status: "open",
      createdAt: now,   // Prisma @default(now()) is app-level
      updatedAt: now,   // Prisma @updatedAt is app-level
    }).select().single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, feedback: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("Feedback POST error:", err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

// GET — fetch all feedback (admin only)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email || !(await isAdmin(user.email))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let query = supabaseAdmin.from("Feedback").select("*").order("createdAt", { ascending: false });
    if (type && type !== "all") query = query.eq("type", type);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ feedbacks: data ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

// PATCH — update feedback status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email || !(await isAdmin(user.email))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, status } = await req.json();
    const { error } = await supabaseAdmin.from("Feedback").update({ status }).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
