import type { Express } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { phoneUsers, providerVerificationRequests } from "../drizzle/schema";

const categories = [
  { id: 1, name: "سباكة", icon: "🔧", providerCount: 0 },
  { id: 2, name: "كهرباء", icon: "⚡", providerCount: 0 },
  { id: 3, name: "تكييف وتبريد", icon: "❄️", providerCount: 0 },
  { id: 4, name: "نجارة", icon: "🪚", providerCount: 0 },
  { id: 5, name: "دهانات", icon: "🎨", providerCount: 0 },
  { id: 6, name: "تنظيف", icon: "🧹", providerCount: 0 },
  { id: 7, name: "نقل أثاث", icon: "🚚", providerCount: 0 },
  { id: 8, name: "بناء ومقاولات", icon: "🏗️", providerCount: 0 },
];

type CatalogQuery = {
  city?: string;
  district?: string;
  search?: string;
  minRating?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page: number;
  limit: number;
};

function positiveInteger(value: unknown, fallback: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function finiteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function queryString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseQuery(query: Record<string, unknown>): CatalogQuery {
  return {
    city: queryString(query.city),
    district: queryString(query.district),
    search: queryString(query.search),
    minRating: finiteNumber(query.minRating),
    lat: finiteNumber(query.lat),
    lng: finiteNumber(query.lng),
    radiusKm: finiteNumber(query.radiusKm),
    page: positiveInteger(query.page, 1),
    limit: positiveInteger(query.limit, 20, 100),
  };
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = Math.PI / 180;
  const dLat = (lat2 - lat1) * radians;
  const dLng = (lng2 - lng1) * radians;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * radians) * Math.cos(lat2 * radians) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toSummary(provider: typeof phoneUsers.$inferSelect, query: CatalogQuery) {
  const lat = provider.latitude === null ? null : Number(provider.latitude);
  const lng = provider.longitude === null ? null : Number(provider.longitude);
  const hasCoordinates = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
  const distance = hasCoordinates && query.lat !== undefined && query.lng !== undefined
    ? Number(distanceKm(query.lat, query.lng, lat, lng).toFixed(2))
    : null;

  return {
    id: provider.id,
    name: provider.name,
    phone: provider.phone,
    whatsapp: null,
    avatarUrl: null,
    categoryName: "مقدم خدمة",
    categoryIcon: null,
    city: provider.city ?? "",
    district: provider.district ?? "",
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    yearsExperience: 0,
    hourlyRate: null,
    isVerified: true,
    isAvailable: true,
    distanceKm: distance,
    lat: hasCoordinates ? lat : null,
    lng: hasCoordinates ? lng : null,
  };
}

async function approvedProviders() {
  const db = await getDb();
  if (!db) return null;
  const approved = await db.select({ providerId: providerVerificationRequests.providerId })
    .from(providerVerificationRequests)
    .where(eq(providerVerificationRequests.status, "approved"));
  const ids = Array.from(new Set(approved.map(row => row.providerId)));
  if (ids.length === 0) return [];
  return db.select().from(phoneUsers).where(and(
    eq(phoneUsers.role, "provider"),
    eq(phoneUsers.status, "active"),
    inArray(phoneUsers.id, ids),
  ));
}

async function listProviders(query: CatalogQuery, sort: "name" | "distance" = "name") {
  const rows = await approvedProviders();
  if (rows === null) return { providers: [], total: 0 };
  const search = query.search?.toLocaleLowerCase("ar");
  let providers = rows.map(row => toSummary(row, query)).filter(provider => {
    if (query.city && provider.city !== query.city) return false;
    if (query.district && provider.district !== query.district) return false;
    if (query.minRating !== undefined && provider.rating < query.minRating) return false;
    if (search && ![provider.name, provider.city, provider.district, provider.categoryName]
      .some(value => value.toLocaleLowerCase("ar").includes(search))) return false;
    if (query.radiusKm !== undefined && (provider.distanceKm === null || provider.distanceKm > query.radiusKm)) return false;
    return true;
  });
  providers.sort((a, b) => sort === "distance"
    ? (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
    : a.name.localeCompare(b.name, "ar"));
  return { providers, total: providers.length };
}

export function registerProviderCatalogRoutes(app: Express) {
  app.get("/api/categories", (_req, res) => res.json(categories));

  app.get("/api/providers", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    const result = await listProviders(query);
    const start = (query.page - 1) * query.limit;
    res.json({ providers: result.providers.slice(start, start + query.limit), total: result.total, page: query.page, limit: query.limit });
  });

  app.get("/api/providers/top-rated", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    const result = await listProviders(query);
    res.json(result.providers.slice(0, query.limit));
  });

  app.get("/api/providers/most-requested", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    const result = await listProviders(query);
    res.json(result.providers.slice(0, query.limit));
  });

  app.get("/api/providers/nearby", async (req, res) => {
    const query = parseQuery(req.query as Record<string, unknown>);
    if (query.lat === undefined || query.lng === undefined) return res.status(400).json({ error: "يجب تحديد خط العرض وخط الطول" });
    if (query.lat < -90 || query.lat > 90 || query.lng < -180 || query.lng > 180) return res.status(400).json({ error: "إحداثيات الموقع غير صالحة" });
    const result = await listProviders(query, "distance");
    res.json(result.providers.slice(0, query.limit));
  });
}
