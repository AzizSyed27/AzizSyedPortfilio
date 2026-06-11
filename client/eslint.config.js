import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// ESLint v9 flat config (migrated from the legacy .eslintrc.cjs). Rule choices
// fit this codebase: JS-only (no PropTypes), lots of natural-language copy with
// apostrophes, React Three Fiber intrinsics, and the deliberate provider+hook
// colocation pattern in the context files.
export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-no-target-blank": "off",
      "react/prop-types": "off",            // no PropTypes by design
      "react/no-unescaped-entities": "off", // apostrophes in copy are fine
      // (react-refresh plugin intentionally not enabled — the provider+hook
      //  colocation pattern would warn on every context file.)
    },
  },
  {
    // React Three Fiber intrinsics use three.js props the DOM-oriented rule flags.
    files: ["**/three/**/*.{js,jsx}"],
    rules: { "react/no-unknown-property": "off" },
  },
];
