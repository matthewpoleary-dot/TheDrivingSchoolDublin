import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      TIMEZONE: "Europe/Dublin",
      NEXT_PUBLIC_SUPABASE_URL: "http://supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      STRIPE_SECRET_KEY: "sk_test_fake",
      STRIPE_WEBHOOK_SECRET: "whsec_fake",
      ADMIN_TOKEN: "test-admin-token-1234567890",
    },
  },
});
