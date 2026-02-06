import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "admin-auth";

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/dashboard/login";
  const response = NextResponse.redirect(url);
  // Clear cookie by setting it with maxAge: 0
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
