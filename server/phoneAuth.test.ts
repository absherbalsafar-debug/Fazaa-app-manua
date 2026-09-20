import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerPhoneAuthRoutes } from "./phoneAuth";

// This suite validates HTTP behavior with an in-memory auth store; Neon integration is covered separately.
process.env.PHONE_AUTH_USE_DB = "false";

let baseUrl = "";
let server: ReturnType<import("node:http").Server>;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerPhoneAuthRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address !== "string") baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("phone authentication", () => {
  it("sends a same-screen OTP and verifies a new client", async () => {
    const phone = "712345678";
    const sent = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, role: "client" }),
    });
    expect(sent.status).toBe(200);
    const sentBody = await sent.json() as { otp: string };
    expect(sentBody.otp).toMatch(/^\d{6}$/);

    const registrationStep = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code: sentBody.otp, role: "client" }),
    });
    expect(registrationStep.status).toBe(200);
    expect((await registrationStep.json()).needsRegistration).toBe(true);

    const verified = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code: sentBody.otp, name: "محمد خالد أحمد الشظبي", role: "client", country: "اليمن", governorate: "أمانة العاصمة", city: "صنعاء", district: "التحرير", latitude: 15.3694, longitude: 44.191 }),
    });
    expect(verified.status).toBe(200);
    const verifiedBody = await verified.json() as { token: string; user: { phoneVerified: boolean } };
    expect(verifiedBody.token).toMatch(/^phone_/);
    expect(verifiedBody.user.phoneVerified).toBe(true);

    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${verifiedBody.token}` } });
    expect(me.status).toBe(200);
  });

  it("rejects a client profile without four names or a location", async () => {
    const incompleteNamePhone = "712345679";
    const incompleteNameSent = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: incompleteNamePhone, role: "client" }),
    });
    const incompleteNameOtp = (await incompleteNameSent.json() as { otp: string }).otp;
    const nameResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: incompleteNamePhone, code: incompleteNameOtp, name: "محمد خالد أحمد", role: "client", latitude: 15, longitude: 44 }),
    });
    expect(nameResponse.status).toBe(400);
    expect((await nameResponse.json()).error).toBe("يرجى إدخال الاسم الرباعي كاملاً");

    const missingLocationPhone = "712345680";
    const missingLocationSent = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: missingLocationPhone, role: "client" }),
    });
    const missingLocationOtp = (await missingLocationSent.json() as { otp: string }).otp;
    const locationResponse = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: missingLocationPhone, code: missingLocationOtp, name: "محمد خالد أحمد الشظبي", role: "client" }),
    });
    expect(locationResponse.status).toBe(400);
    expect((await locationResponse.json()).error).toBe("يجب تحديد موقعك للعثور على المهنيين القريبين منك");
  });

  it("rejects registering a phone number that already has an account", async () => {
    const sent = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "712345678", role: "client" }),
    });
    expect(sent.status).toBe(409);
    expect((await sent.json()).error).toBe("هذا الرقم مسجل من قبل، لا يمكنك التسجيل به. يرجى تغيير الرقم");
  });

  it("blocks a client number from being used as a provider", async () => {
    const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "712345678", role: "provider", mode: "register" }),
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("هذا الرقم مسجل ومفعل حسابه على حساب العملاء، لا يمكنك التسجيل به");
  });

  it("creates a provider account when the provider role is selected", async () => {
    const phone = "712345681";
    const sent = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, role: "provider" }),
    });
    const otp = (await sent.json() as { otp: string }).otp;
    const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code: otp, name: "علي محمد سالم الشظبي", role: "provider", categoryId: 1, specialty: "تمديدات", nationalId: "12345678901", whatsapp: "771234567", termsAccepted: true, bio: "فني اختبار يقدم خدمات موثوقة وآمنة للعملاء مع خبرة واسعة في تنفيذ أعمال الصيانة المنزلية باحترافية", latitude: 15.3694, longitude: 44.191 }),
    });
    expect(response.status).toBe(200);
    const body = await response.json() as { user: { role: string } };
    expect(body.user.role).toBe("provider");
  });

  it("requires an explicit role for a new phone account", async () => {
    const phone = "712345682";
    const sent = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const otp = (await sent.json() as { otp: string }).otp;
    const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code: otp, name: "محمد علي سالم حسن" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("حدد نوع الحساب: عميل أو مهني");
  });
});
