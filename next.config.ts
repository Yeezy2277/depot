import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public delivery API is meant to be called from other origins, so CORS
  // is opened on /api/v1/* only (admin routes stay same-origin).
  async headers() {
    return [
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
