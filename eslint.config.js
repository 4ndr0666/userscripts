// eslint.config.js (ES Module version)
export default {
  root: true,
  env: {
    browser: true,
    es2021: true,
    greasemonkey: true
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  rules: {
    "no-unused-vars": ["warn"],
    "no-undef": ["error"],
    "no-console": ["off"],
    "semi": ["error", "always"],
    "quotes": ["error", "double"],
    "eqeqeq": ["error", "always"],
    "curly": ["error", "multi-line"],
    "no-empty-function": ["warn"]
  },
  globals: {
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
    saveAs: "readonly"
  }
};