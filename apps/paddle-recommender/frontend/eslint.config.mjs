import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/jsx-key": "error",
      "react/self-closing-comp": "error",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-var": "error",
      "prefer-arrow-callback": "warn",
    },
  },
];

export default eslintConfig;
