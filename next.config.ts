import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only needed by the Docker prod-parity image. Vercel
  // performs its own output tracing, and enabling both breaks its Next 16
  // post-build step because it expects the standard server trace manifest.
  ...(process.env.VERCEL === "1" ? {} : { output: "standalone" as const }),

  // Fail the build on type errors rather than shipping them. Lint runs as its
  // own required command because Next 16 removed linting from `next build`.
  typescript: { ignoreBuildErrors: false },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
