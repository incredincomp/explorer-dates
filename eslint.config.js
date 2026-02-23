const globals = require("globals");

module.exports = [
    {
        ignores: [
            "node_modules/**",
            ".vscode-test/**",
            "*.vsix",
            ".env",
            "dist/**",
            ".local-web-cert/**",
            ".vscode-dev-sideload/**",
            "tests/artifacts/**"
        ]
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.es6,
                ...globals.mocha,
                AbortController: "readonly"
            }
        },
        plugins: {
            import: require('eslint-plugin-import')
        },
        rules: {
            "no-const-assign": "warn",
            "no-this-before-super": "warn",
            "no-undef": "warn",
            "no-unreachable": "warn",
            "no-unused-vars": "warn",
            "constructor-super": "warn",
            "valid-typeof": "warn",
            "no-console": "off",
            // In CI environments the 'import' plugin may sometimes be unavailable
            // due to install/profile differences; treat this rule as optional.
            "import/no-dynamic-require": "off"
        }
    },

    {
        files: ["src/webview/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
                acquireVsCodeApi: "readonly"
            }
        }
    }
];
