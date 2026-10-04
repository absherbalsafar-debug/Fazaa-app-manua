export type RegistrationRole = "client" | "provider";
export const FIRST_LOGIN_WELCOME_KEY = "fazaah_first_login_welcomed_v1";

export function getRegistrationRole(search: string): RegistrationRole {
  return new URLSearchParams(search).get("role") === "provider" ? "provider" : "client";
}

export function getPostAuthPath(role: RegistrationRole): "/" | "/provider-dashboard" {
  return role === "provider" ? "/provider-dashboard" : "/";
}

export function getFirstLoginPath(role: RegistrationRole): string {
  return getPostAuthPath(role);
}

export function buildGoogleAuthPayload(
  payload: { sub: string; email?: string; name?: string; picture?: string },
  role: RegistrationRole,
) {
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.picture,
    role,
  };
}
