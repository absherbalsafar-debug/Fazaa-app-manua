import { describe, expect, it } from "vitest";
import { getAllowedControlCenterOrigins, isAllowedControlCenterOrigin } from "./controlCenterConfig";

describe("control center origin policy", () => {
  it("accepts the configured dashboard origin and rejects unknown origins", () => {
    const raw = " https://fazaa-dash-cluzwdju.manus.space,https://admin.example.test ";
    expect(getAllowedControlCenterOrigins(raw)).toEqual([
      "https://fazaa-dash-cluzwdju.manus.space",
      "https://admin.example.test",
    ]);
    expect(isAllowedControlCenterOrigin("https://fazaa-dash-cluzwdju.manus.space", raw)).toBe(true);
    expect(isAllowedControlCenterOrigin("https://evil.example", raw)).toBe(false);
  });
});
