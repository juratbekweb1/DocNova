const path = require("node:path");

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" ")}`;

module.exports = {
  "src/**/*.{js,jsx,ts,tsx}": [buildEslintCommand, "prettier --write"],
  "scripts/**/*.{js,jsx,ts,tsx}": [buildEslintCommand, "prettier --write"],
  "next.config.ts": [buildEslintCommand, "prettier --write"],
  "*.{json,md,css}": ["prettier --write"],
};
