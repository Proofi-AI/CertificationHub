"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserFiles } from "@/lib/supabase";
import { updateProfileSchema } from "@/schemas/user.schema";
import type { ActionResult } from "@/types";
import type { User } from "@prisma/client";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function updateProfile(formData: FormData): Promise<ActionResult<User>> {
  const session = await getSession();

  const raw = {
    name: formData.get("name") || undefined,
    username: formData.get("username") || undefined,
    bio: formData.get("bio") || null,
    linkedinUrl: formData.get("linkedinUrl") || null,
    isPublicProfile: formData.get("isPublicProfile") === "true",
    notificationsEnabled: formData.get("notificationsEnabled") === "true",
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const data = parsed.data;

  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, id: { not: session.user.id } },
    });
    if (existing) return { success: false, error: "This username is already taken." };
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  revalidatePath("/settings/profile");
  revalidatePath(`/u/${data.username ?? session.user.username}`);

  return { success: true, data: user };
}

export async function exportUserData(): Promise<ActionResult<object>> {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      certificates: { where: { deletedAt: null } },
    },
  });

  if (!user) return { success: false, error: "User not found." };

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      bio: user.bio,
      linkedinUrl: user.linkedinUrl,
      createdAt: user.createdAt,
    },
    certificates: user.certificates.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      credentialId: c.credentialId,
      category: c.category,
      description: c.description,
      fileUrl: c.fileUrl,
      createdAt: c.createdAt,
    })),
  };

  return { success: true, data: exportData };
}

export async function deleteAccount(): Promise<ActionResult> {
  const session = await getSession();

  try {
    await deleteUserFiles(session.user.id);
  } catch {
    // Non-fatal
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  await signOut({ redirectTo: "/" });

  return { success: true, data: undefined };
}
