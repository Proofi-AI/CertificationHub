import { createClient } from "@supabase/supabase-js";

// Server-side admin client (uses service role key — never expose to client)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const STORAGE_BUCKET = "certificates";

export function getUserStoragePath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

export async function deleteFileFromStorage(filePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

export async function deleteUserFiles(userId: string): Promise<void> {
  const { data: files, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .list(userId);
  if (error || !files?.length) return;
  const paths = files.map((f) => `${userId}/${f.name}`);
  await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(paths);
}
