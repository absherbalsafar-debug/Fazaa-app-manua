import { index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const phoneRole = pgEnum("phone_role", ["client", "provider"]);
export const phoneStatus = pgEnum("phone_status", ["active", "suspended"]);
export const verificationStatus = pgEnum("verification_status", ["pending", "approved", "rejected"]);
export const documentType = pgEnum("document_type", ["selfie", "id_front", "id_back", "portfolio", "certificate"]);
export const providerAccountStatus = pgEnum("provider_account_status", ["pending", "approved"]);
export const subscriptionPlan = pgEnum("subscription_plan", ["monthly", "yearly"]);
export const subscriptionPaymentStatus = pgEnum("subscription_payment_status", ["pending", "approved", "rejected"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const phoneUsers = pgTable("phone_users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  role: phoneRole("role").default("client").notNull(),
  status: phoneStatus("status").default("active").notNull(),
  city: varchar("city", { length: 120 }),
  country: varchar("country", { length: 120 }),
  governorate: varchar("governorate", { length: 120 }),
  district: varchar("district", { length: 120 }),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  nationalId: varchar("nationalId", { length: 11 }),
  whatsapp: varchar("whatsapp", { length: 9 }),
  categoryId: integer("categoryId"),
  specialty: varchar("specialty", { length: 160 }),
  bio: text("bio"),
  yearsExperience: integer("yearsExperience"),
  providerAccountStatus: providerAccountStatus("providerAccountStatus").default("pending").notNull(),
  subscriptionPlan: subscriptionPlan("subscriptionPlan"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt", { withTimezone: true }),
  termsAcceptedAt: timestamp("termsAcceptedAt", { withTimezone: true }),
  phoneVerified: integer("phoneVerified").default(1).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type PhoneUser = typeof phoneUsers.$inferSelect;

export const phoneOtpCodes = pgTable("phone_otp_codes", {
  phone: varchar("phone", { length: 20 }).primaryKey(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ expiryIndex: index("phone_otp_expires_idx").on(table.expiresAt) }));

export const phoneAuthSessions = pgTable("phone_auth_sessions", {
  token: varchar("token", { length: 128 }).primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  phoneIndex: index("phone_session_phone_idx").on(table.phone),
  expiryIndex: index("phone_session_expires_idx").on(table.expiresAt),
}));

export const providerVerificationRequests = pgTable("provider_verification_requests", {
  id: serial("id").primaryKey(),
  providerId: integer("providerId").notNull(),
  status: verificationStatus("status").default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  submittedAt: timestamp("submittedAt", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  providerIndex: index("provider_verification_provider_idx").on(table.providerId),
  statusIndex: index("provider_verification_status_idx").on(table.status),
}));

export const providerVerificationDocuments = pgTable("provider_verification_documents", {
  id: serial("id").primaryKey(),
  requestId: integer("requestId").notNull(),
  type: documentType("type").notNull(),
  objectPath: varchar("objectPath", { length: 512 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ requestIndex: index("provider_verification_document_request_idx").on(table.requestId) }));

export const providerVerificationReviewHistory = pgTable("provider_verification_review_history", {
  id: serial("id").primaryKey(),
  requestId: integer("requestId").notNull(),
  status: verificationStatus("status").notNull(),
  rejectionReason: text("rejectionReason"),
  adminOpenId: varchar("adminOpenId", { length: 64 }).notNull(),
  adminName: varchar("adminName", { length: 160 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ requestIndex: index("provider_verification_history_request_idx").on(table.requestId) }));

export const providerSubscriptionPayments = pgTable("provider_subscription_payments", {
  id: serial("id").primaryKey(),
  providerId: integer("providerId").notNull(),
  plan: subscriptionPlan("plan").notNull(),
  amount: integer("amount").notNull(),
  status: subscriptionPaymentStatus("status").default("pending").notNull(),
  proofPath: varchar("proofPath", { length: 512 }),
  submittedAt: timestamp("submittedAt", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ providerIndex: index("provider_subscription_payment_provider_idx").on(table.providerId), statusIndex: index("provider_subscription_payment_status_idx").on(table.status) }));

export type ProviderVerificationRequest = typeof providerVerificationRequests.$inferSelect;
export type ProviderVerificationDocument = typeof providerVerificationDocuments.$inferSelect;
export type ProviderVerificationReviewHistory = typeof providerVerificationReviewHistory.$inferSelect;
export type ProviderSubscriptionPayment = typeof providerSubscriptionPayments.$inferSelect;
