import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone so the Docker prod-parity image can run the app
  // without node_modules. Vercel ignores this; it costs nothing there.
  output: "standalone",

  // Fail the build on type errors rather than shipping them. Lint runs as its
  // own required command because Next 16 removed linting from `next build`.
  typescript: { ignoreBuildErrors: false },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
