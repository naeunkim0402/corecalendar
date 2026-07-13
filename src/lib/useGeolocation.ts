"use client";

import { useState, useEffect } from "react";

export interface GeoData {
  city: string;
  country: string;
  region: string;
  latitude: string;
  longitude: string;
  timezone: string;
  isLocal?: boolean;
}

const FALLBACK: GeoData = {
  city: "Seoul",
  country: "KR",
  region: "11",
  latitude: "37.5665",
  longitude: "126.9780",
  timezone: "Asia/Seoul",
  isLocal: true,
};

function parseCookie(): GeoData | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)geo=([^;]+)/);
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function useGeolocation(): GeoData {
  const [geo, setGeo] = useState<GeoData>(FALLBACK);

  useEffect(() => {
    // Try cookie first (set by middleware — already available on first render)
    const fromCookie = parseCookie();
    if (fromCookie) {
      setGeo(fromCookie);
      return;
    }

    // Fallback: fetch edge API
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data: GeoData) => setGeo(data))
      .catch(() => setGeo(FALLBACK));
  }, []);

  return geo;
}
