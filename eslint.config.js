import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "*.min.js"],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        GM_xmlhttpRequest: "readonly",
        GM_download: "readonly",
        GM_setClipboard: "readonly",
        GM_setValue: "readonly",
        GM_getValue: "readonly",
        GM_log: "readonly",
        GM_openInTab: "readonly",
        unsafeWindow: "readonly",
        JSZip: "readonly",
        tippy: "readonly",
        sha256: "readonly",
        saveAs: "readonly",
        m3u8Parser: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn"],
      "no-undef": ["error"],
      "no-console": ["off"],
      "semi": ["error", "always"],
      "quotes": "off",
      "eqeqeq": ["error", "always"],
      "curly": ["warn", "multi-line"],
      "no-empty-function": ["warn"],
    },
  },
];
