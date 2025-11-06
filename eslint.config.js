const globals = require("globals");

module.exports = [
    {
        ignores: ["node_modules/**", ".vscode-test/**", "*.vsix", ".env"]
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
        rules: {
            "no-const-assign": "warn",
            "no-this-before-super": "warn",
            "no-undef": "warn",
            "no-unreachable": "warn",
            "no-unused-vars": "warn",
            "constructor-super": "warn",
            "valid-typeof": "warn",
            "no-console": "off"
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

