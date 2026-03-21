import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/schemas/auth.schema";
import { generateUsername } from "@/lib/utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers.filter((p) => p.id !== "credentials"),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          username: user.username,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string | null }).username ?? null;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      // On OAuth sign-in, ensure username is set
      if (account && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, emailVerified: true },
        });
        if (!dbUser?.username) {
          const username = generateUsername(token.email as string);
          await prisma.user.update({
            where: { id: token.id as string },
            data: {
              username,
              emailVerified: dbUser?.emailVerified ?? new Date(),
            },
          });
          token.username = username;
        } else {
          token.username = dbUser.username;
        }
        token.emailVerified = new Date();
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-generate username for OAuth users who just created an account
      if (!user.username && user.email) {
        const username = generateUsername(user.email);
        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });
      }
    },
  },
});
