export function getAuthCookieOptions(env = process.env) {
  const production = env.NODE_ENV === "production";
  const secure = env.COOKIE_SECURE === undefined ? production : env.COOKIE_SECURE.toLowerCase() === "true";
  const sameSite = (env.COOKIE_SAMESITE || (production ? "none" : "lax")).toLowerCase();
  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
  const domain = env.COOKIE_DOMAIN?.trim();

  if (domain) options.domain = domain;
  return options;
}