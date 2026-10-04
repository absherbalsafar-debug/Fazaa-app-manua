const ENABLED_KEY = "fazaah-biometric-enabled";
const CREDENTIAL_KEY = "fazaah-biometric-credential";

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function isBiometricEnabled() {
  return localStorage.getItem(ENABLED_KEY) === "true" && Boolean(localStorage.getItem(CREDENTIAL_KEY));
}

export async function isBiometricAvailable() {
  if (typeof window === "undefined" || !window.isSecureContext || !window.PublicKeyCredential || !navigator.credentials) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") return true;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export async function enableBiometric(user: { id: number; name: string }) {
  if (!(await isBiometricAvailable())) throw new Error("البصمة أو قفل الجهاز غير متاح في هذا المتصفح أو الجهاز.");

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: "فزعة" },
      user: {
        id: new TextEncoder().encode(`fazaah-user-${user.id}`),
        name: user.name || `user-${user.id}`,
        displayName: user.name || "مستخدم فزعة",
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "preferred", userVerification: "required" },
      timeout: 60_000,
      attestation: "none",
    },
  });

  if (!(credential instanceof PublicKeyCredential)) throw new Error("تعذر إنشاء اعتماد البصمة على هذا الجهاز.");
  localStorage.setItem(ENABLED_KEY, "true");
  localStorage.setItem(CREDENTIAL_KEY, credential.id);
}

export function disableBiometric() {
  localStorage.removeItem(ENABLED_KEY);
  localStorage.removeItem(CREDENTIAL_KEY);
}
