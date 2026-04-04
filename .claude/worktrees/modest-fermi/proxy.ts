import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ULTRASOOQ_TOKEN_KEY } from "./utils/constants";

export function proxy(request: NextRequest) {
  const authToken = request.cookies.get(ULTRASOOQ_TOKEN_KEY)?.value;
  const pathname = request.nextUrl.pathname;

  // Auth pages: if logged in, redirect to /home; otherwise allow access
  const authPages = [
    "/login",
    "/register",
    "/forget-password",
    "/reset-password",
    "/password-reset-verify",
    "/otp-verify",
  ];

  // Protected pages that REQUIRE authentication (everything else is public)
  const protectedPaths = [
    "/profile",
    "/my-settings",
    "/my-accounts",
    "/my-orders",
    "/checkout",
    "/notifications",
    "/wallet",
    "/wishlist",
    "/manage-products",
    "/manage-services",
    "/existing-products",
    "/seller-orders",
    "/seller-rewards",
    "/seller-rfq-list",
    "/seller-rfq-request",
    "/team-members",
    "/role-settings",
    "/vendor-dashboard",
    "/dropship-management",
    "/dropship-products",
    "/share-links",
    "/transactions",
    "/queries",
    "/company-profile",
    "/freelancer-profile",
    "/email-change-verify",
  ];

  // Redirect root to /home
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Auth pages: redirect to /home if already logged in
  if (authPages.includes(pathname)) {
    return authToken
      ? NextResponse.redirect(new URL("/home", request.url))
      : NextResponse.next();
  }

  // Check if the current path is protected
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // If protected and no auth token, redirect to login
  if (isProtected && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Everything else is publicly accessible
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
