import type { Express } from "express";

function parseCoordinate(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

export function registerGeocodingRoutes(app: Express) {
  app.get("/api/geocode/reverse", async (req, res) => {
    const latitude = parseCoordinate(req.query.lat, -90, 90);
    const longitude = parseCoordinate(req.query.lon, -180, 180);
    if (latitude === null || longitude === null) {
      return res.status(400).json({ error: "إحداثيات الموقع غير صالحة" });
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "ar");

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "FAZAAH/1.0 (location lookup)",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return res.status(502).json({ error: "تعذر قراءة عنوان الموقع" });
      const data = await response.json() as { address?: Record<string, string> };
      return res.json({ address: data.address ?? {} });
    } catch (error) {
      console.warn("[Geocoding] reverse lookup failed", error);
      return res.status(502).json({ error: "تعذر قراءة عنوان الموقع" });
    }
  });
}
