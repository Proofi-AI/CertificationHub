import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET, getUserStoragePath } from "@/lib/supabase";
import { computeSHA256 } from "@/lib/hash";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not supported. Use PDF, JPG, or PNG." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum 25 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = computeSHA256(buffer);

  // Check for duplicate by file hash
  const duplicate = await prisma.certificate.findFirst({
    where: { userId: session.user.id, fileHash: hash, deletedAt: null },
    select: { id: true, name: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "DUPLICATE", duplicateId: duplicate.id, duplicateName: duplicate.name },
      { status: 409 }
    );
  }

  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/jpeg" ? "jpg" : "png";
  const filename = `${uuidv4()}.${ext}`;
  const filePath = getUserStoragePath(session.user.id, filename);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[upload] Supabase storage error:", uploadError.message);
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return NextResponse.json({
    fileUrl: urlData.publicUrl,
    filePath,
    fileHash: hash,
    fileName: file.name,
    fileMimeType: file.type,
    fileSizeBytes: file.size,
  });
}
