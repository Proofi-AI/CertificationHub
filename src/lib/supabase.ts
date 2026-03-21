import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Supabase environment variables are not configured");
    }
    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});

export const STORAGE_BUCKET = "certificates";

export function getUserStoragePath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

export async function deleteFileFromStorage(filePath: string): Promise<void> {
  const { error } = await getSupabaseAdmin().storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

export async function deleteUserFiles(userId: string): Promise<void> {
  const client = getSupabaseAdmin();
  const { data: files, error } = await client.storage
    .from(STORAGE_BUCKET)
    .list(userId);
  if (error || !files?.length) return;
  const paths = files.map((f) => `${userId}/${f.name}`);
  await client.storage.from(STORAGE_BUCKET).remove(paths);
}
