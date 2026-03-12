/** @type {import("prettier").Config} */
export default {
  overrides: [
    {
      files: "*.gmrc",
      options: {
        parser: "jsonc",
        trailingComma: "none",
      },
    },
  ],
  plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
  embeddedSqlTags: ["SQL"],
  language: "postgresql",
  keywordCase: "upper",
  dataTypeCase: "lower",
  functionCase: "lower",
  identifierCase: "lower",
};
