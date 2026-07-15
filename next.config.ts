import type { NextConfig } from "next";

// CORS for the public delivery API (/api/v1/*) is set dynamically per delivery
// token in the route handlers (see src/lib/cors.ts) — open by default, or scoped
// to a token's allowed origins — so it isn't configured statically here.
const nextConfig: NextConfig = {};

export default nextConfig;
