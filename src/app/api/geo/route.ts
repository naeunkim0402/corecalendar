import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export function GET(req: NextRequest) {
  const city = req.headers.get("x-vercel-ip-city") ?? "Seoul";
  const country = req.headers.get("x-vercel-ip-country") ?? "KR";
  const region = req.headers.get("x-vercel-ip-country-region") ?? "11";
  const latitude = req.headers.get("x-vercel-ip-latitude") ?? "37.5665";
  const longitude = req.headers.get("x-vercel-ip-longitude") ?? "126.9780";
  const timezone = req.headers.get("x-vercel-ip-timezone") ?? "Asia/Seoul";

  const isLocal = !req.headers.get("x-vercel-ip-city");

  return NextResponse.json({ city, country, region, latitude, longitude, timezone, isLocal });
}
