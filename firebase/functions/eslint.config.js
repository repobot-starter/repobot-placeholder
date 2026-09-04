import eslint from "@eslint/js"
import prettierConfig from "eslint-config-prettier"
import drizzlePlugin from "eslint-plugin-drizzle"
import tseslint from "typescript-eslint"

export default tseslint.config(
    {
        ignores: ["node_modules/", "lib/", "generated/", "eslint.config.js"],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.mjs"],
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                URL: "readonly",
            },
        },
    },
    {
        plugins: {
            drizzle: drizzlePlugin,
        },
        rules: {
            "drizzle/enforce-delete-with-where": "error",
            "drizzle/enforce-update-with-where": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            // Blackbox tests exercise resolvers whose generated types are loose; keep the
            // signal rules on and allow explicit any only where tests need it.
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    prettierConfig,
)
