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
      clientSecret: {
        appleId: process.env.APPLE_ID!,
        teamId: process.env.APPLE_TEAM_ID!,
        privateKey: process.env.APPLE_PRIVATE_KEY!,
        keyId: process.env.APPLE_KEY_ID!,
      },
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
      const isPublicProfile = nextUrl.pathname.startsWith("/u/");
      const isVerifyEmail = nextUrl.pathname.startsWith("/verify-email");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isPublicProfile || isApiAuth) return true;
      if (isVerifyEmail) return true;
      if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      if (!isLoggedIn) return false;
      return true;
    },
  },
};
