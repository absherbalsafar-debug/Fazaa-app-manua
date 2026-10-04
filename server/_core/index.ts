import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerPhoneAuthRoutes } from "../phoneAuth";
import { registerEmailAuthRoutes } from "../emailAuth";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { registerProviderCatalogRoutes } from "../providerCatalog";
import { registerProviderVerificationRoutes } from "../providerVerification";
import { registerProviderSubscriptionRoutes } from "../providerSubscription";
import { registerAppFlowRoutes } from "../appFlows";
import { registerAppUpdateRoutes } from "../appUpdate";
import { registerPushNotificationRoutes } from "../pushNotifications";
import { registerGeocodingRoutes } from "../geocoding";
import { registerAdminRoutes } from "../adminRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const allowedOrigins = (process.env.CONTROL_CENTER_ORIGIN ?? "").split(",").map(value => value.trim()).filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (typeof origin === "string" && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    return res.json({ status: "ok" });
  });
  // /manus-storage is a platform-owned stable asset path in Preview and published sites.
  // Keep the local proxy only for direct development-port use.
  if (process.env.NODE_ENV === "development") registerStorageProxy(app);
  registerPhoneAuthRoutes(app);
  registerEmailAuthRoutes(app);
  registerGoogleAuthRoutes(app);
  registerProviderCatalogRoutes(app);
  registerProviderVerificationRoutes(app);
  registerProviderSubscriptionRoutes(app);
  registerAppFlowRoutes(app);
  registerAppUpdateRoutes(app);
  registerPushNotificationRoutes(app);
  registerGeocodingRoutes(app);
  registerAdminRoutes(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);
