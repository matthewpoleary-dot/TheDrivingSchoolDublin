import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,

  // Allow normal apostrophes/quotes in JSX text like "we'll" and
  // "instructor's". The copy is authored content, not an HTML injection.
  {
    rules: {
      "react/no-unescaped-entities": "off",
      // These opt-in React compiler rules are not correctness rules for this
      // app. Client effects intentionally start asynchronous fetches, and the
      // dynamic booking/admin pages intentionally compare against wall time.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
