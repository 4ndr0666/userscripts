// Flat config for ESLint v9
import prettier from "eslint-plugin-prettier";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx,user.js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly",
        location: "readonly"
      }
    },
    plugins: {
      prettier
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "no-console": "off"
    },
    ignores: ["dist/**", "node_modules/**", "coverage/**", "tools/**"]
  }
];
