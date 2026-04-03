async function uploadViaApi(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  formData.append("path", path);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.url as string;
}

export async function uploadCertificateImage(
  file: File,
  userId: string,
  certId: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${certId}.${ext}`;
  return uploadViaApi(file, "certificates", path);
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;
  return uploadViaApi(file, "avatars", path);
}

export async function uploadBadgeImage(
  file: File,
  userId: string,
  badgeId: string
): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${badgeId}.${ext}`;
  return uploadViaApi(file, "badges", path);
}

