module.exports = {
    "ignorePatterns": [
        "tests/**/*.js"
    ],
    "env": {
        "commonjs": true,
        "node": true,
        "es6": true,
        "mocha": true
    },
    "extends": [
        "eslint:recommended"
    ],
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "script"
    },
    "globals": {
        "AbortController": "readonly"
    },
    "rules": {
        "no-const-assign": "warn",
        "no-this-before-super": "warn",
        "no-undef": "warn",
        "no-unreachable": "warn",
        "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
        "constructor-super": "warn",
        "valid-typeof": "warn",
        "no-console": "off"
    },
    "overrides": [
        {
            "files": ["tests/**/*.js"],
            "rules": {
                "no-unused-vars": "off",
                "no-undef": "off"
            }
        },
        {
            "files": ["src/webview/**/*.js"],
            "env": {
                "browser": true,
                "commonjs": false
            },
            "globals": {
                "acquireVsCodeApi": "readonly"
            }
        }
    ]
};
