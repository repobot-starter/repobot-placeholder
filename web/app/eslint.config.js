// Flat ESLint config for web-app.
//
// Repo conventions enforced by review (documented here until custom rules exist):
// - gql`` documents live ONLY in src/Graphql/Operations/Gql/**; never define
//   operations inline in View/Config files.
// - Import from "@base/design-system" and "@base/core" package roots only;
//   no deep imports into their src/ trees.
import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
    { ignores: ["dist", "src/generated"] },
    {
        files: ["**/*.{ts,tsx}"],
        extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            // Deep design-system/core imports bypass the public API; use package roots.
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@base/design-system/*",
                                "!@base/design-system/tokens",
                                "!@base/design-system/theme",
                                "@base/core/*",
                            ],
                            message:
                                'Import from the package root ("@base/design-system" / "@base/core") only. Exception: .css.ts files import "@base/design-system/tokens" and "@base/design-system/theme" (packBrand/packFont overlay).',
                        },
                    ],
                },
            ],
        },
    },
)
