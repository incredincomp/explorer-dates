const fs = require('fs');
const fsp = fs.promises;
const Module = require('module');
const path = require('path');

const DEFAULT_BLOCKED_MODULES = [
    'fs',
    'fs/promises',
    'child_process',
    'worker_threads',
    'net',
    'tls'
];

const workspaceRoot = path.resolve(__dirname, '..', '..');
const pkg = require(path.join(workspaceRoot, 'package.json'));
const configurationProperties = pkg?.contributes?.configuration?.properties || {};

function cloneDefault(value) {
    if (Array.isArray(value)) {
        return value.map(cloneDefault);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [key, cloneDefault(val)])
        );
    }
    return value;
}

function loadPackageConfigDefaults() {
    const defaults = {};
    for (const [key, schema] of Object.entries(configurationProperties)) {
        if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
            defaults[key] = cloneDefault(schema.default);
        }
    }
    return defaults;
}

const PACKAGE_DEFAULTS = loadPackageConfigDefaults();
const TEST_SPECIFIC_DEFAULTS = {
    'explorerDates.showWelcomeOnStartup': false,
    'explorerDates.excludedPatterns': []
};

function getDefaultValue(key, fallback) {
    if (Object.prototype.hasOwnProperty.call(PACKAGE_DEFAULTS, key)) {
        return cloneDefault(PACKAGE_DEFAULTS[key]);
    }
    if (Object.prototype.hasOwnProperty.call(TEST_SPECIFIC_DEFAULTS, key)) {
        return cloneDefault(TEST_SPECIFIC_DEFAULTS[key]);
    }
    return fallback;
}

function normalizeExplorerConfig(values = {}) {
    const normalized = {};
    for (const [key, value] of Object.entries(values)) {
        if (!key) continue;
        if (key.includes('.')) {
            normalized[key] = value;
        } else {
            normalized[`explorerDates.${key}`] = value;
        }
    }
    return normalized;
}

function interpretTarget(target) {
    if (target === 2 || target === 'workspace') {
        return 'workspace';
    }
    if (target === 3 || target === 'workspaceFolder') {
        return 'workspaceFolder';
    }
    return 'global';
}

function setValue(store, key, value) {
    if (value === undefined) {
        delete store[key];
    } else {
        store[key] = value;
    }
}

function toFsPath(input, fallback = workspaceRoot) {
    if (!input && fallback) {
        return path.resolve(fallback);
    }
    if (!input) {
        return workspaceRoot;
    }
    if (typeof input === 'string') {
        return path.resolve(input);
    }
    if (input.fsPath) {
        return path.resolve(input.fsPath);
    }
    if (input.path) {
        return path.resolve(input.path);
    }
    return path.resolve(String(input));
}

function createUriObject(targetPath, scheme = 'file') {
    const fsPathValue = path.resolve(targetPath);
    return {
        fsPath: fsPathValue,
        path: fsPathValue,
        scheme,
        toString() {
            return this.path;
        },
        with(changes = {}) {
            const newPath = changes.path || changes.fsPath || this.path;
            const newScheme = changes.scheme || this.scheme;
            return createUriObject(newPath, newScheme);
        }
    };
}

function parseUri(input) {
    if (!input) {
        return createUriObject(workspaceRoot);
    }
    if (typeof input === 'string') {
        const scheme = input.includes('://') ? input.split('://')[0] : 'file';
        if (scheme === 'file') {
            return createUriObject(input);
        }
        return {
            fsPath: input,
            path: input,
            scheme,
            toString() {
                return this.path;
            },
            with(changes = {}) {
                const newPath = changes.path || changes.fsPath || this.path;
                const newScheme = changes.scheme || this.scheme;
                return parseUri(`${newScheme}://${newPath}`);
            }
        };
    }
    if (typeof input === 'object') {
        return {
            fsPath: toFsPath(input.fsPath || input.path || workspaceRoot),
            path: input.path || input.fsPath || input.toString?.() || workspaceRoot,
            scheme: input.scheme || 'file',
            toString() {
                return this.path;
            },
            with(changes = {}) {
                const newPath = changes.path || changes.fsPath || this.path;
                const newScheme = changes.scheme || this.scheme;
                return parseUri(`${newScheme}://${newPath}`);
            }
        };
    }
    return createUriObject(input);
}

function normalizeWorkspaceFolders(definitions = [], fallbackBase = workspaceRoot) {
    if (!Array.isArray(definitions) || definitions.length === 0) {
        const defaultPath = path.join(
            typeof fallbackBase === 'string' ? fallbackBase : fallbackBase.fsPath || workspaceRoot,
            'tests',
            'workspace-web'
        );
        return [
            {
                uri: createUriObject(defaultPath),
                name: 'web-workspace',
                index: 0
            }
        ];
    }

    return definitions.map((definition, index) => {
        if (typeof definition === 'string') {
            const folderPath = path.resolve(definition);
            return {
                uri: createUriObject(folderPath),
                name: path.basename(folderPath) || `workspace-${index + 1}`,
                index
            };
        }

        if (definition && typeof definition === 'object') {
            if (definition.uri) {
                const fsPathValue = toFsPath(definition.uri);
                return {
                    uri: createUriObject(fsPathValue),
                    name: definition.name || path.basename(fsPathValue) || `workspace-${index + 1}`,
                    index
                };
            }
            if (definition.path) {
                const folderPath = path.resolve(definition.path);
                return {
                    uri: createUriObject(folderPath),
                    name: definition.name || path.basename(folderPath) || `workspace-${index + 1}`,
                    index
                };
            }
        }

        const fallbackPath = path.join(
            typeof fallbackBase === 'string' ? fallbackBase : fallbackBase.fsPath || workspaceRoot,
            `workspace-${index + 1}`
        );
        return {
            uri: createUriObject(fallbackPath),
            name: definition?.name || `workspace-${index + 1}`,
            index
        };
    });
}

function createReadOnlyWorkspaceFs(fileTypeEnum) {
    const unsupported = (method) => {
        throw new Error(`workspace.fs.${method} is unavailable in the web mock (read-only)`);
    };

    return {
        async readDirectory(target) {
            const targetPath = toFsPath(target);
            try {
                const entries = await fsp.readdir(targetPath, { withFileTypes: true });
                return entries.map((entry) => {
                    let entryType = fileTypeEnum.File;
                    if (typeof entry.isDirectory === 'function' && entry.isDirectory()) {
                        entryType = fileTypeEnum.Directory;
                    } else if (typeof entry.isSymbolicLink === 'function' && entry.isSymbolicLink()) {
                        entryType = fileTypeEnum.SymbolicLink ?? fileTypeEnum.File;
                    }
                    return [entry.name, entryType];
                });
            } catch (error) {
                if (error && error.code === 'ENOENT') {
                    return [];
                }
                throw error;
            }
        },
        async readFile(target) {
            const targetPath = toFsPath(target);
            return fsp.readFile(targetPath);
        },
        async writeFile() {
            unsupported('writeFile');
        },
        async stat(target) {
            const targetPath = toFsPath(target);
            const stats = await fsp.stat(targetPath);
            return {
                type: stats.isDirectory() ? fileTypeEnum.Directory : fileTypeEnum.File,
                ctime: stats.ctimeMs,
                mtime: stats.mtimeMs,
                size: stats.size
            };
        },
        async delete() {
            unsupported('delete');
        },
        async createDirectory() {
            unsupported('createDirectory');
        }
    };
}

function createWebVscodeMock(options = {}) {
    const {
        configValues = {},
        workspaceConfigValues = {},
        workspaceFolderConfigValues = {},
        workspaceFolders = [],
        blockedModules = DEFAULT_BLOCKED_MODULES,
        extensionPath = workspaceRoot,
        extensionUri: providedExtensionUri
    } = options;

    const previousWebFlag = process.env.VSCODE_WEB;
    process.env.VSCODE_WEB = 'true';

    const previousGlobals = {
        Blob: globalThis.Blob,
        URL: globalThis.URL,
        fetch: globalThis.fetch,
        Worker: globalThis.Worker,
        navigator: globalThis.navigator,
        self: globalThis.self,
        explorerChunks: globalThis.__explorerDatesChunks,
        require: globalThis.require
    };
    const previousProcess = globalThis.process;
    let processPatched = false;
    if (previousProcess && typeof previousProcess === 'object') {
        const processProxy = new Proxy(previousProcess, {
            get(target, prop) {
                if (prop === 'versions') {
                    return {};
                }
                return Reflect.get(target, prop);
            },
            has(target, prop) {
                if (prop === 'versions') {
                    return true;
                }
                return Reflect.has(target, prop);
            }
        });
        globalThis.process = processProxy;
        processPatched = true;
    }

    globalThis.Blob = class Blob {
        constructor(parts, opts) {
            this.parts = parts;
            this.options = opts;
        }
    };
    globalThis.URL = {
        createObjectURL() {
            return 'blob://mock';
        }
    };
    globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({}),
        text: async () => ''
    });
    globalThis.Worker = class Worker {
        constructor(url) {
            this.url = url;
            this.onmessage = null;
            this.onerror = null;
        }
        postMessage() {}
        terminate() {}
    };
    globalThis.navigator = { userAgent: 'Mozilla/5.0 (web-mock)' };
    globalThis.self = globalThis;
    globalThis.require = require;

    const chunkLoads = [];
    const chunkRegistry = new Proxy({}, {
        set(target, prop, value) {
            if (typeof prop === 'string') {
                chunkLoads.push(prop);
            }
            target[prop] = value;
            return true;
        },
        get(target, prop) {
            return target[prop];
        }
    });
    globalThis.__explorerDatesChunks = chunkRegistry;

    const configStore = { ...normalizeExplorerConfig(configValues) };
    const workspaceConfigStore = { ...normalizeExplorerConfig(workspaceConfigValues) };
    const workspaceFolderConfigStore = { ...normalizeExplorerConfig(workspaceFolderConfigValues) };
    const appliedUpdates = [];
    const commandCalls = [];
    const commandRegistry = new Map();
    let fileWatcherCount = 0;

    const resolveWorkspaceFolderValue = (fullKey) => {
        if (Object.prototype.hasOwnProperty.call(workspaceFolderConfigStore, fullKey)) {
            return workspaceFolderConfigStore[fullKey];
        }
        return undefined;
    };

    const getValue = (fullKey, defaultValue) => {
        const folderValue = resolveWorkspaceFolderValue(fullKey);
        if (folderValue !== undefined) {
            return folderValue;
        }
        if (Object.prototype.hasOwnProperty.call(workspaceConfigStore, fullKey)) {
            return workspaceConfigStore[fullKey];
        }
        if (Object.prototype.hasOwnProperty.call(configStore, fullKey)) {
            return configStore[fullKey];
        }
        return getDefaultValue(fullKey, defaultValue);
    };

    const applyUpdate = (fullKey, value, targetLabel) => {
        if (targetLabel === 'workspaceFolder') {
            setValue(workspaceFolderConfigStore, fullKey, value);
        } else if (targetLabel === 'workspace') {
            setValue(workspaceConfigStore, fullKey, value);
        } else {
            setValue(configStore, fullKey, value);
        }
        appliedUpdates.push({ key: fullKey, value, target: targetLabel });
    };

    const makeSectionConfig = (section = '') => {
        const buildKey = (key) => (section ? `${section}.${key}` : key);
        return {
            get(key, defaultValue) {
                const fullKey = buildKey(key);
                return getValue(fullKey, defaultValue);
            },
            inspect(key) {
                const fullKey = buildKey(key);
                return {
                    key: fullKey,
                    defaultValue: getDefaultValue(fullKey, undefined),
                    globalValue: Object.prototype.hasOwnProperty.call(configStore, fullKey)
                        ? configStore[fullKey]
                        : undefined,
                    workspaceValue: Object.prototype.hasOwnProperty.call(workspaceConfigStore, fullKey)
                        ? workspaceConfigStore[fullKey]
                        : undefined,
                    workspaceFolderValue: Object.prototype.hasOwnProperty.call(workspaceFolderConfigStore, fullKey)
                        ? workspaceFolderConfigStore[fullKey]
                        : undefined
                };
            },
            has(key) {
                const fullKey = buildKey(key);
                return Object.prototype.hasOwnProperty.call(configStore, fullKey) ||
                    Object.prototype.hasOwnProperty.call(workspaceConfigStore, fullKey) ||
                    Object.prototype.hasOwnProperty.call(workspaceFolderConfigStore, fullKey);
            },
            async update(key, value, target) {
                const fullKey = buildKey(key);
                const targetLabel = interpretTarget(target);
                applyUpdate(fullKey, value, targetLabel);
            }
        };
    };

    const explorerConfig = makeSectionConfig('explorerDates');
    const workbenchConfig = makeSectionConfig('workbench');

    const extensionFsPath = toFsPath(providedExtensionUri, extensionPath);
    const extensionUri = providedExtensionUri
        ? parseUri(providedExtensionUri)
        : createUriObject(extensionFsPath);

    const workspaceFolderEntries = normalizeWorkspaceFolders(workspaceFolders, extensionFsPath);
    const fileTypeEnum = {
        File: 1,
        Directory: 2,
        SymbolicLink: 64
    };
    const workspaceFs = createReadOnlyWorkspaceFs(fileTypeEnum);

    const workspaceApi = {
        getConfiguration(section) {
            if (!section) {
                return makeSectionConfig('');
            }
            if (section === 'explorerDates') {
                return explorerConfig;
            }
            if (section === 'workbench') {
                return workbenchConfig;
            }
            return makeSectionConfig(section);
        },
        createFileSystemWatcher() {
            throw new Error('workspace.createFileSystemWatcher is unavailable in web environments');
        },
        onDidChangeConfiguration() {
            return { dispose() {} };
        },
        workspaceFolders: workspaceFolderEntries,
        fs: workspaceFs,
        getWorkspaceFolder(target) {
            if (!target) {
                return workspaceFolderEntries[0] || null;
            }
            const targetPath = toFsPath(target);
            return workspaceFolderEntries.find((folder) => targetPath.startsWith(folder.uri.fsPath)) || null;
        },
        onDidChangeWorkspaceFolders() {
            return { dispose() {} };
        },
        asRelativePath(target) {
            const targetPath = toFsPath(target);
            const base = workspaceFolderEntries[0]?.uri.fsPath || extensionFsPath;
            return path.relative(base, targetPath);
        },
        async findFiles() {
            return [];
        }
    };

    const vscodeUriApi = {
        joinPath(base, ...segments) {
            const basePath = toFsPath(base);
            return createUriObject(path.join(basePath, ...segments));
        },
        parse(value) {
            return parseUri(value);
        },
        file(value) {
            return createUriObject(value);
        }
    };

    const disposable = { dispose() {} };
    const vscode = {
        workspace: workspaceApi,
        ColorThemeKind: {
            Light: 1,
            Dark: 2,
            HighContrast: 3,
            HighContrastLight: 4
        },
        FileType: fileTypeEnum,
        window: {
            createStatusBarItem() {
                return { show() {}, hide() {}, dispose() {} };
            },
            activeColorTheme: { kind: 1 },
            onDidChangeActiveColorTheme: () => disposable,
            createOutputChannel() {
                return { appendLine() {}, append() {}, show() {}, clear() {}, dispose() {} };
            },
            showInformationMessage() {},
            showWarningMessage() {},
            showErrorMessage() {},
            onDidChangeActiveTextEditor: () => disposable,
            onDidChangeVisibleTextEditors: () => disposable,
            registerFileDecorationProvider: () => disposable,
            createWebviewPanel() {
                return { webview: { html: '' }, reveal() {}, dispose() {} };
            },
            createInputBox() {
                return { show() {}, hide() {}, dispose() {} };
            }
        },
        commands: {
            registerCommand(commandId, handler) {
                commandRegistry.set(commandId, handler);
                return {
                    dispose() {
                        commandRegistry.delete(commandId);
                    }
                };
            },
            async getCommands(_filterInternal = true) {
                return Array.from(commandRegistry.keys());
            },
            executeCommand(command, ...args) {
                commandCalls.push({ command, args });
                const handler = commandRegistry.get(command);
                if (handler) {
                    return Promise.resolve(handler(...args));
                }
                return Promise.resolve();
            }
        },
        env: {
            uiKind: 2,
            appName: 'vscode-web',
            uriScheme: 'vscode-web',
            language: 'en',
            machineId: 'web-mock',
            sessionId: 'web-mock',
            remoteName: undefined
        },
        languages: {
            registerCodeActionsProvider: () => ({ dispose() {} })
        },
        Uri: vscodeUriApi,
        EventEmitter: class EventEmitter {
            constructor() {
                this.listeners = [];
            }
            event(listener) {
                this.listeners.push(listener);
                return { dispose() {} };
            }
            fire(data) {
                this.listeners.forEach((listener) => listener(data));
            }
            dispose() {
                this.listeners = [];
            }
        },
        StatusBarAlignment: { Right: 2, Left: 1 },
        ThemeColor: class ThemeColor {
            constructor(id) {
                this.id = id;
            }
        },
        FileDecoration: class FileDecoration {
            constructor(badge) {
                this.badge = badge;
                this.tooltip = undefined;
                this.color = undefined;
                this.propagate = true;
            }
        },
        RelativePattern: class RelativePattern {
            constructor(base, pattern) {
                this.base = typeof base === 'string' ? base : base?.fsPath || '';
                this.pattern = pattern;
            }
        },
        UIKind: { Desktop: 1, Web: 2 },
        ExtensionMode: { Production: 1, Development: 2, Test: 3 },
        ConfigurationTarget: {
            Global: 1,
            Workspace: 2,
            WorkspaceFolder: 3
        }
    };

    const originalLoad = Module._load;
    const blocked = new Set(blockedModules);
    Module._load = function patchedLoad(request, parent, isMain) {
        if (request === 'vscode') {
            return vscode;
        }
        if (blocked.has(request)) {
            const error = new Error(`Native module "${request}" should not load in web bundle`);
            error.code = 'WEB_NATIVE_MODULE';
            throw error;
        }
        return originalLoad.call(this, request, parent, isMain);
    };

    const restore = () => {
        Module._load = originalLoad;
        process.env.VSCODE_WEB = previousWebFlag;
        if (processPatched) {
            globalThis.process = previousProcess;
        }
        globalThis.Blob = previousGlobals.Blob;
        globalThis.URL = previousGlobals.URL;
        globalThis.fetch = previousGlobals.fetch;
        globalThis.Worker = previousGlobals.Worker;
        globalThis.navigator = previousGlobals.navigator;
        globalThis.self = previousGlobals.self;
        globalThis.__explorerDatesChunks = previousGlobals.explorerChunks;
        if (previousGlobals.require === undefined) {
            delete globalThis.require;
        } else {
            globalThis.require = previousGlobals.require;
        }
    };

    return {
        vscode,
        extensionUri,
        workspaceFolders: workspaceFolderEntries,
        commandCalls,
        appliedUpdates,
        configStore,
        workspaceConfigStore,
        workspaceFolderConfigStore,
        chunkLoads,
        get fileWatcherCount() {
            return fileWatcherCount;
        },
        restore
    };
}

module.exports = {
    createWebVscodeMock
};
