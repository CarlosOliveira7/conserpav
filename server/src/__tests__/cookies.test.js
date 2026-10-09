import { describe, expect, it } from "vitest";
import { getAuthCookieOptions } from "../cookies.js";

describe("auth cookie options", () => {
  it("uses cross-site secure attributes in production", () => {
    expect(getAuthCookieOptions({ NODE_ENV: "production" })).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
  });

  it("uses local-development attributes and allows environment overrides", () => {
    expect(getAuthCookieOptions({ NODE_ENV: "development" })).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    expect(
      getAuthCookieOptions({
        NODE_ENV: "development",
        COOKIE_SECURE: "true",
        COOKIE_SAMESITE: "none",
        COOKIE_DOMAIN: ".example.test",
      })
    ).toMatchObject({ secure: true, sameSite: "none", domain: ".example.test" });
  });
});