import pluginJs from "@eslint/js"
import biome from "eslint-config-biome"
import globals from "globals"
import tseslint from "typescript-eslint"

export default [
  pluginJs.configs.recommended,
  biome,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },
  {
    files: ["src/types.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  { ignores: ["**/*.js", "**/*.mjs", "dist/"] },
]
