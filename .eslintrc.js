module.exports = {
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
        "no-unused-vars": "warn",
        "constructor-super": "warn",
        "valid-typeof": "warn",
        "no-console": "off"
    },
    "overrides": [
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