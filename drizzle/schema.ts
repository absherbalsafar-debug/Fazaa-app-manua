import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const phoneUsers = mysqlTable("phone_users", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  role: mysqlEnum("role", ["client", "provider"]).default("client").notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  city: varchar("city", { length: 120 }),
  country: varchar("country", { length: 120 }),
  governorate: varchar("governorate", { length: 120 }),
  district: varchar("district", { length: 120 }),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  phoneVerified: int("phoneVerified").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const phoneOtpCodes = mysqlTable("phone_otp_codes", {
  phone: varchar("phone", { length: 20 }).primaryKey(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  expiryIndex: index("phone_otp_expires_idx").on(table.expiresAt),
}));

export const phoneAuthSessions = mysqlTable("phone_auth_sessions", {
  token: varchar("token", { length: 128 }).primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  phoneIndex: index("phone_session_phone_idx").on(table.phone),
  expiryIndex: index("phone_session_expires_idx").on(table.expiresAt),
}));

export type PhoneUser = typeof phoneUsers.$inferSelect;

export const providerVerificationRequests = mysqlTable("provider_verification_requests", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  providerIndex: index("provider_verification_provider_idx").on(table.providerId),
  statusIndex: index("provider_verification_status_idx").on(table.status),
}));

export const providerVerificationDocuments = mysqlTable("provider_verification_documents", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  type: mysqlEnum("type", ["selfie", "id_front", "id_back", "portfolio", "certificate"]).notNull(),
  objectPath: varchar("objectPath", { length: 512 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  requestIndex: index("provider_verification_document_request_idx").on(table.requestId),
}));

export type ProviderVerificationRequest = typeof providerVerificationRequests.$inferSelect;
export type ProviderVerificationDocument = typeof providerVerificationDocuments.$inferSelect;
