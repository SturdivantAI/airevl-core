import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/telemetry",
        destination: "/demos/telemetry",
        permanent: true,
      },
      {
        source: "/security",
        destination: "/demos/security",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
