import type { Express } from "express";
import { and, eq } from "drizzle-orm";
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
  specialty?: string;
  categoryId?: number;
  category?: string;
  minRating?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page: number;
  limit: number;
};

type ProviderRow = typeof phoneUsers.$inferSelect;

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
  const categoryId = finiteNumber(query.categoryId);
  return {
    city: queryString(query.city),
    district: queryString(query.district),
    search: queryString(query.search),
    specialty: queryString(query.specialty),
    categoryId: categoryId === undefined ? undefined : Math.trunc(categoryId),
    category: queryString(query.category),
    minRating: finiteNumber(query.minRating),
    lat: finiteNumber(query.lat),
    lng: finiteNumber(query.lng),
    radiusKm: finiteNumber(query.radiusKm),
    page: positiveInteger(query.page, 1),
    limit: positiveInteger(query.limit, 20, 100),
  };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = Math.PI / 180;
  const dLat = (lat2 - lat1) * radians;
  const dLng = (lng2 - lng1) * radians;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * radians) * Math.cos(lat2 * radians) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categoryFor(provider: ProviderRow) {
  return categories.find(category => category.id === provider.categoryId) ?? null;
}

function toSummary(provider: ProviderRow, query: CatalogQuery, approvedIds: Set<number>) {
  const lat = provider.latitude === null ? null : Number(provider.latitude);
  const lng = provider.longitude === null ? null : Number(provider.longitude);
  const hasCoordinates = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
  const distance = hasCoordinates && query.lat !== undefined && query.lng !== undefined
    ? Number(distanceKm(query.lat, query.lng, lat, lng).toFixed(2))
    : null;
  const category = categoryFor(provider);

  return {
    id: provider.id,
    name: provider.name,
    phone: provider.phone,
    whatsapp: null,
    avatarUrl: null,
    categoryId: provider.categoryId,
    categoryName: category?.name ?? "مقدم خدمة",
    categoryIcon: category?.icon ?? null,
    specialty: provider.specialty ?? "",
    bio: provider.bio ?? "",
    city: provider.city ?? "",
    district: provider.district ?? "",
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    yearsExperience: provider.yearsExperience ?? 0,
    hourlyRate: null,
    isVerified: approvedIds.has(provider.id),
    isAvailable: provider.status === "active",
    distanceKm: distance,
    lat: hasCoordinates ? lat : null,
    lng: hasCoordinates ? lng : null,
  };
}

async function activeProviders() {
  const db = await getDb();
  if (!db) return null;
  const [providers, approved] = await Promise.all([
    db.select().from(phoneUsers).where(and(eq(phoneUsers.role, "provider"), eq(phoneUsers.status, "active"))),
    db.select({ providerId: providerVerificationRequests.providerId })
      .from(providerVerificationRequests)
      .where(eq(providerVerificationRequests.status, "approved")),
  ]);
  return { providers, approvedIds: new Set(approved.map(row => row.providerId)) };
}

async function listProviders(query: CatalogQuery, sort: "name" | "distance" = "name") {
  const result = await activeProviders();
  if (result === null) return { providers: [], total: 0 };
  const search = query.search ? normalize(query.search) : "";
  const specialty = query.specialty ? normalize(query.specialty) : "";
  const category = query.category ? normalize(query.category) : "";
  const providers = result.providers.map(row => toSummary(row, query, result.approvedIds)).filter(provider => {
    if (query.categoryId !== undefined && provider.categoryId !== query.categoryId) return false;
    if (category && normalize(provider.categoryName) !== category) return false;
    if (specialty && normalize(provider.specialty) !== specialty) return false;
    if (query.city && provider.city !== query.city) return false;
    if (query.district && provider.district !== query.district) return false;
    if (query.minRating !== undefined && provider.rating < query.minRating) return false;
    if (search && ![provider.name, provider.city, provider.district, provider.categoryName, provider.specialty, provider.bio]
      .some(value => normalize(value).includes(search))) return false;
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
