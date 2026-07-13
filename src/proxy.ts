import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Vercel injects these headers on production; fall back to Seoul defaults for localhost
  const city = req.headers.get("x-vercel-ip-city") ?? "Seoul";
  const country = req.headers.get("x-vercel-ip-country") ?? "KR";
  const region = req.headers.get("x-vercel-ip-country-region") ?? "11";
  const latitude = req.headers.get("x-vercel-ip-latitude") ?? "37.5665";
  const longitude = req.headers.get("x-vercel-ip-longitude") ?? "126.9780";
  const timezone = req.headers.get("x-vercel-ip-timezone") ?? "Asia/Seoul";

  const geo = JSON.stringify({ city, country, region, latitude, longitude, timezone });

  res.cookies.set("geo", geo, {
    httpOnly: false,   // readable by client JS
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,  // 1 hour
  });

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
