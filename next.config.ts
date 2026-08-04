import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone so the Docker prod-parity image can run the app
  // without node_modules. Vercel ignores this; it costs nothing there.
  output: "standalone",

  // Fail the build on type or lint errors rather than shipping them. Both
  // default to failing already, but stating it means a future `ignoreErrors`
  // has to be a deliberate edit rather than a quiet default.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
