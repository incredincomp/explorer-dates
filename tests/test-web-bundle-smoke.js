#!/usr/bin/env node

// Simulate a minimal vscode.dev-like environment to ensure the web bundle
// doesn't touch Node-only APIs at load/activation time.
const assert = require('assert');
const path = require('path');
const Module = require('module');

// Provide minimal globals used by the web worker host
globalThis.Blob = class Blob {
    constructor(parts, options) {
        this.parts = parts;
        this.options = options;
    }
};
globalThis.URL = {
    createObjectURL() {
        return 'blob://fake';
    }
};
globalThis.Worker = class Worker {
    constructor(url) {
        this.url = url;
        this.onmessage = null;
        this.onerror = null;
    }
    postMessage() {}
    terminate() {}
};
globalThis.self = globalThis;

// Minimal vscode shim
const vscode = {
    workspace: {
        getConfiguration() {
            return {
                get: () => undefined,
                has: () => false,
                update: () => Promise.resolve()
            };
        },
        onDidChangeConfiguration() { return { dispose() {} }; }
    },
    ColorThemeKind: {
        Light: 1,
        Dark: 2,
        HighContrast: 3,
        HighContrastLight: 4
    },
    window: {
        createStatusBarItem() {
            return { show() {}, hide() {}, dispose() {} };
        },
        activeColorTheme: { kind: 1 },
        onDidChangeActiveColorTheme() { return { dispose() {} }; },
        createOutputChannel() {
            return { appendLine() {}, append() {}, show() {}, clear() {}, dispose() {} };
        },
        showInformationMessage() {},
        showWarningMessage() {},
        showErrorMessage() {},
        onDidChangeActiveTextEditor() { return { dispose() {} }; },
        onDidChangeVisibleTextEditors() { return { dispose() {} }; },
        registerFileDecorationProvider() { return { dispose() {} }; }
    },
    commands: {
        registerCommand() { return { dispose() {} }; },
        executeCommand() { return Promise.resolve(); }
    },
    env: {
        uiKind: 2,
        appName: 'vscode-web',
        uriScheme: 'vscode-web',
        language: 'en',
        machineId: 'web-smoke',
        sessionId: 'web-smoke',
        remoteName: undefined
    },
    languages: {
        registerCodeActionsProvider() { return { dispose() {} }; }
    },
    Uri: {
        joinPath: (...segments) => ({ fsPath: path.join(...segments) }),
        parse: (p) => ({ fsPath: p }),
        file: (p) => ({ fsPath: p })
    },
    EventEmitter: class EventEmitter {
        constructor() { this.listeners = []; }
        event = (listener) => { this.listeners.push(listener); return { dispose() {} }; };
        fire(data) { this.listeners.forEach((l) => l(data)); }
        dispose() {}
    },
    StatusBarAlignment: { Right: 2 },
    ThemeColor: class ThemeColor {
        constructor(id) { this.id = id; }
    },
    FileDecoration: class FileDecoration {
        constructor(badge) { this.badge = badge; }
    },
    UIKind: { Desktop: 1, Web: 2 },
    ExtensionMode: { Production: 1, Development: 2, Test: 3 }
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'vscode') {
        return vscode;
    }
    return originalLoad(request, parent, isMain);
};

// Load the web bundle
const webBundlePath = path.join(__dirname, '..', 'dist', 'extension.web.js');
const webBundle = require(webBundlePath);

assert.ok(webBundle.activate, 'Web bundle should export activate');
assert.ok(webBundle.deactivate, 'Web bundle should export deactivate');

// Run a lightweight activate/deactivate cycle
const context = { subscriptions: [] };
Promise.resolve(webBundle.activate(context))
    .then(() => Promise.resolve(webBundle.deactivate()))
    .then(() => {
        Module._load = originalLoad;
        console.log('✅ Web bundle smoke test passed');
    })
    .catch((error) => {
        Module._load = originalLoad;
        console.error('❌ Web bundle smoke test failed:', error);
        process.exitCode = 1;
    });
