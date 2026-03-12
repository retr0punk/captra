// NOTE: This file can be deleted as soon as this is fixed: https://github.com/prettier/prettier/issues/15956

/** @type {import("prettier").Config} */
export default {
  overrides: [
    {
      files: ["**/*.jsonc"],
      options: {
        trailingComma: "none",
      },
    },
  ],
};
