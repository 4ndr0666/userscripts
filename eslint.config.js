import js from "@eslint/js";
import globals from "globals";
import userscripts from "eslint-plugin-userscripts";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "*.min.js"],
  },
  {
    files: ["**/*.js", "**/*.user.js"],
    plugins: {
      userscripts
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        GM_xmlhttpRequest: "readonly",
        GM_download: "readonly",
        GM_addStyle: "readonly",
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
        $: "readonly"  // For jQuery
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...userscripts.configs.recommended.rules,
      "userscripts/no-invalid-grant": "error",
      "userscripts/no-invalid-metadata": "error",
      "no-unused-vars": ["warn"],
      "no-undef": ["error"],
      "no-console": ["off"],
      "semi": ["error", "always"],
      "quotes": "off",
      "eqeqeq": ["error", "always"],
      "curly": ["warn", "multi-line"],
      "no-empty-function": ["warn"]
    },
    settings: {
      userscriptVersions: {
        violentmonkey: "*",
        tampermonkey: "*"
      }
    }
  }
];
