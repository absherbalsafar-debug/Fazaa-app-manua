import { describe, expect, it } from "vitest";

describe("control center CORS integration", () => {
  it("returns a protected response with CORS for the configured dashboard origin", async () => {
    const origin = process.env.CONTROL_CENTER_ORIGIN;
    const apiBaseUrl = process.env.CONTROL_CENTER_API_BASE_URL;
    if (!origin || !apiBaseUrl) return;
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/admin/me`, {
      headers: { Origin: origin },
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });
});
