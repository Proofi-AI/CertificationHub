import type { NextAuthConfig } from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/schemas/auth.schema";

// Edge-safe config — no Node.js-only imports (no Prisma, no bcrypt)
export const authConfig: NextAuthConfig = {
  providers: [
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_PRIVATE_KEY ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Actual validation happens in auth.ts (Node.js runtime)
      async authorize() {
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Always allow — the custom middleware in middleware.ts handles all routing logic.
    authorized() {
      return true;
    },
    // Map JWT token fields to session so middleware can read them.
    session({ session, token }) {
      if (token) {
        (session.user as { id?: string; username?: string | null; emailVerified?: Date | null }).id =
          token.id as string;
        (session.user as { id?: string; username?: string | null; emailVerified?: Date | null }).username =
          (token.username as string | null) ?? null;
        (session.user as { id?: string; username?: string | null; emailVerified?: Date | null }).emailVerified =
          (token.emailVerified as Date | null) ?? null;
      }
      return session;
    },
  },
};
