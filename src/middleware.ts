import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const session = req.auth;

  const isPublicProfile = nextUrl.pathname.startsWith("/u/");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isApiCron = nextUrl.pathname.startsWith("/api/cron");
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");
  const isVerifyEmail = nextUrl.pathname.startsWith("/verify-email");
  const isLanding = nextUrl.pathname === "/";

  // Always allow public routes
  if (isPublicProfile || isApiAuth || isApiCron || isLanding || isVerifyEmail) {
    return;
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isAuthRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  // Force email verification wall for credentials users
  if (
    isLoggedIn &&
    !session?.user?.emailVerified &&
    !isVerifyEmail &&
    !isApiAuth
  ) {
    return Response.redirect(new URL("/verify-email", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
