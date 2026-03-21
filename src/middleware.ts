import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const session = req.auth;
  const isEmailVerified = !!session?.user?.emailVerified;

  const isPublicProfile = nextUrl.pathname.startsWith("/u/");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isApiCron = nextUrl.pathname.startsWith("/api/cron");
  const isApiVerify = nextUrl.pathname.startsWith("/api/verify-email");
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");
  const isVerifyEmail = nextUrl.pathname.startsWith("/verify-email");
  const isLanding = nextUrl.pathname === "/";

  // Always allow public + auth-infrastructure routes
  if (isPublicProfile || isApiAuth || isApiCron || isApiVerify || isLanding) {
    return;
  }

  // Always allow the verify-email page (signed-in or not)
  if (isVerifyEmail) return;

  // Unauthenticated user trying to access a protected page → send to login
  if (!isLoggedIn && !isAuthRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  // Signed-in user visiting login/register → send to dashboard
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
