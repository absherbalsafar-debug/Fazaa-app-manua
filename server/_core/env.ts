export const ENV = {
  appId: process.env.VITE_APP_ID ?? "GbK3EfHffbqNVFFBAmhEtGg",
  cookieSecret: process.env.JWT_SECRET ?? process.env.MANUS_JWT_SECRET ?? "",
  databaseUrl: process.env.NEON_DATABASE_URL ?? (/^(postgres|postgresql):\/\//.test(process.env.DATABASE_URL ?? "") ? process.env.DATABASE_URL : ""),
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://api.manus.ai",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  adminEmails: (process.env.ADMIN_EMAILS ?? "fazaaapp440@gmail.com")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
