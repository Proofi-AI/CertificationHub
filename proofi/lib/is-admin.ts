import { prisma } from "@/lib/prisma";

const DEFAULT_ADMIN_EMAIL = "proofi.ai26@gmail.com";

/**
 * Checks if an email has admin privileges.
 * Always grants access to the default admin email.
 * Otherwise checks the User.isAdmin flag in the database.
 */
export async function isAdmin(email: string | undefined | null): Promise<boolean> {
  if (!email) return false;
  if (email === DEFAULT_ADMIN_EMAIL) return true;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true },
    });
    return user?.isAdmin === true;
  } catch {
    return false;
  }
}

export { DEFAULT_ADMIN_EMAIL };
