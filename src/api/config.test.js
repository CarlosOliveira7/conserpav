import { describe, expect, it } from "vitest";
import { buildApiUrl, normalizeApiBase } from "./config";

describe("API URL configuration", () => {
  it.each([
    [undefined, "/api"],
    ["  https://conserpav-api.up.railway.app  ", "https://conserpav-api.up.railway.app/api"],
    ["https://conserpav-api.up.railway.app/api/", "https://conserpav-api.up.railway.app/api"],
  ])("normalizes %s", (value, expected) => {
    expect(normalizeApiBase(value)).toBe(expected);
  });

  it("keeps API paths under the configured /api base", () => {
    expect(buildApiUrl("/auth/login")).toBe("/api/auth/login");
  });
});