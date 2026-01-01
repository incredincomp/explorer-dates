const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const Module = require('module');

const workspaceRoot = path.resolve(__dirname, '..', '..');
const defaultWorkspace = path.join(workspaceRoot, 'src');
const pkg = require(path.join(workspaceRoot, 'package.json'));
const MAX_LOG_ENTRIES = Number(process.env.MOCK_VSCODE_MAX_LOG_ENTRIES || 200);

const configurationProperties = pkg?.contributes?.configuration?.properties || {};

function cloneDefault(value) {
    if (Array.isArray(value)) {
        return value.map(cloneDefault);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, cloneDefault(val)]));
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
    // Avoid asynchronous onboarding popups slowing tests down
    'explorerDates.showWelcomeOnStartup': false,
    // Provide backwards-compatible default for legacy key used in several modules
    'explorerDates.excludedPatterns': []
};

class VSCodeUri {
    constructor(targetPath) {
        this.fsPath = targetPath;
        this.path = targetPath;
        this.scheme = 'file';
    }

    toString() {
        return this.path;
    }

    static file(targetPath) {
        return new VSCodeUri(targetPath);
    }

    static parse(targetPath) {
        return new VSCodeUri(targetPath);
    }

    static joinPath(base, ...segments) {
        return new VSCodeUri(path.join(base.fsPath, ...segments));
    }
}

class InMemoryMemento {
    constructor(initialValues = {}) {
        this._store = new Map(Object.entries(initialValues));
    }

    get(key, defaultValue) {
        return this._store.has(key) ? this._store.get(key) : defaultValue;
    }

    async update(key, value) {
        this._store.set(key, value);
    }
}

function createDefaultConfig(customValues = {}) {
    return {
        ...PACKAGE_DEFAULTS,
        ...TEST_SPECIFIC_DEFAULTS,
        ...customValues
    };
}

function createConfiguration(configValues, appliedUpdates) {
    return function getConfiguration(section) {
        if (!section) {
            return {
                get(key, defaultValue) {
                    return configValues[key] ?? defaultValue;
                },
                async update(key, value) {
                    configValues[key] = value;
                    appliedUpdates.push({ key, value });
                }
            };
        }

        if (section === 'explorerDates') {
            return {
                inspect() {
                    const inspected = {};
                    for (const [fullKey, value] of Object.entries(configValues)) {
                        if (fullKey.startsWith('explorerDates.')) {
                            const trimmed = fullKey.replace('explorerDates.', '');
                            inspected[trimmed] = { workspaceValue: value };
                        }
                    }
                    return inspected;
                },
                get(key, defaultValue) {
                    const fullKey = `explorerDates.${key}`;
                    return Object.prototype.hasOwnProperty.call(configValues, fullKey)
                        ? configValues[fullKey]
                        : defaultValue;
                },
                has(key) {
                    const fullKey = `explorerDates.${key}`;
                    return Object.prototype.hasOwnProperty.call(configValues, fullKey);
                },
                async update(key, value) {
                    const fullKey = `explorerDates.${key}`;
                    configValues[fullKey] = value;
                    appliedUpdates.push({ key: fullKey, value });
                }
            };
        }

        return {
            get(key, defaultValue) {
                const fullKey = `${section}.${key}`;
                return Object.prototype.hasOwnProperty.call(configValues, fullKey)
                    ? configValues[fullKey]
                    : defaultValue;
            },
            has(key) {
                const fullKey = `${section}.${key}`;
                return Object.prototype.hasOwnProperty.call(configValues, fullKey);
            },
            async update(key, value) {
                const fullKey = `${section}.${key}`;
                configValues[fullKey] = value;
                appliedUpdates.push({ key: fullKey, value });
            }
        };
    };
}

function createFileSystemApi(mock) {
    return {
        async readDirectory(uri) {
            const entries = await fsp.readdir(uri.fsPath, { withFileTypes: true });
            return entries.map((entry) => [
                entry.name,
                entry.isDirectory() ? mock.FileType.Directory : mock.FileType.File
            ]);
        },
        async stat(uri) {
            const stats = await fsp.stat(uri.fsPath);
            return {
                type: stats.isDirectory() ? mock.FileType.Directory : mock.FileType.File,
                ctime: stats.ctimeMs,
                mtime: stats.mtimeMs,
                size: stats.size,
                birthtime: stats.birthtimeMs ?? (stats.birthtime ? stats.birthtime.getTime() : stats.ctimeMs)
            };
        },
        async readFile(uri) {
            return fsp.readFile(uri.fsPath);
        },
        async writeFile(uri, data) {
            await fsp.mkdir(path.dirname(uri.fsPath), { recursive: true });
            await fsp.writeFile(uri.fsPath, data);
        },
        async createDirectory(uri) {
            await fsp.mkdir(uri.fsPath, { recursive: true });
        },
        async delete(uri, options = {}) {
            await fsp.rm(uri.fsPath, { recursive: options.recursive ?? false, force: true });
        }
    };
}

function createMockVscode(options = {}) {
    const infoLog = [];
    const errorLog = [];
    const appliedUpdates = [];
    const contexts = {};
    const commandRegistry = new Map();
    const configValues = createDefaultConfig(options.config || {});
    const sampleWorkspace = options.sampleWorkspace || defaultWorkspace;

    const pushLog = (entry) => {
        infoLog.push(entry);
        if (infoLog.length > MAX_LOG_ENTRIES) {
            infoLog.shift();
        }
    };

    const clipboard = {
        value: '',
        async writeText(text) {
            this.value = text;
            pushLog(`clipboard.writeText:${text}`);
        },
        async readText() {
            return this.value;
        }
    };

    const configuration = createConfiguration(configValues, appliedUpdates);

    const registeredProviders = [];

    const mock = {
        ConfigurationTarget: {
            Global: 1,
            Workspace: 2
        },
        StatusBarAlignment: {
            Left: 1,
            Right: 2
        },
        UIKind: {
            Desktop: 1,
            Web: 2
        },
        ColorThemeKind: {
            Light: 1,
            Dark: 2,
            HighContrast: 3
        },
        FileType: {
            File: 1,
            Directory: 2
        },
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
        ViewColumn: {
            One: 1,
            Two: 2,
            Three: 3
        },
        EventEmitter: class EventEmitter {
            constructor() {
                this._listeners = new Set();
                this.event = this.event.bind(this);
            }

            event(listener) {
                this._listeners.add(listener);
                return {
                    dispose: () => this._listeners.delete(listener)
                };
            }

            fire(data) {
                for (const listener of this._listeners) {
                    try {
                        listener(data);
                    } catch {
                        // Ignore listener errors in tests
                    }
                }
            }

            dispose() {
                this._listeners.clear();
            }
        },
        Uri: VSCodeUri,
            env: {
                language: 'en',
                clipboard,
                uiKind: options.uiKind || 1,
                async openExternal(uri) {
                    pushLog(`openExternal:${uri.toString()}`);
                }
            },
        extensions: {
            all: [],
            getExtension() {
                return {
                    packageJSON: {
                        version: '1.2.2'
                    }
                };
            }
        },
        window: {
            activeColorTheme: {
                kind: 2
            },
            activeTextEditor: null,
            onDidChangeActiveColorTheme() {
                return { dispose() {} };
            },
            onDidChangeActiveTextEditor() {
                return { dispose() {} };
            },
            onDidChangeTextEditorSelection() {
                return { dispose() {} };
            },
            createOutputChannel() {
                return {
                    appendLine(message) {
                        pushLog(message);
                    },
                    show() {},
                    clear() {},
                    dispose() {}
                };
            },
            createWebviewPanel() {
                return {
                    webview: {
                        html: '',
                        postMessage() {},
                        onDidReceiveMessage() {
                            return { dispose() {} };
                        }
                    },
                    reveal() {},
                    dispose() {}
                };
            },
            createStatusBarItem() {
                return {
                    text: '',
                    tooltip: '',
                    command: '',
                    show() {},
                    hide() {},
                    dispose() {}
                };
            },
            registerFileDecorationProvider(provider) {
                registeredProviders.push(provider);
                return {
                    dispose() {
                        const index = registeredProviders.indexOf(provider);
                        if (index !== -1) {
                            registeredProviders.splice(index, 1);
                        }
                    }
                };
            },
            async showInformationMessage(message) {
                pushLog(message);
                const options = Array.from(arguments).slice(1);
                return options.find((option) => typeof option === 'string') || message;
            },
            async showWarningMessage(message) {
                pushLog(message);
                return message;
            },
            async showErrorMessage(message) {
                errorLog.push(message);
                return message;
            },
            async showInputBox() {
                return null;
            },
            async showQuickPick(items) {
                const resolved = Array.isArray(items) ? items : await items;
                if (!resolved || resolved.length === 0) {
                    return null;
                }
                const choice = resolved[0];
                if (typeof choice === 'string') {
                    pushLog(`showQuickPick:${choice}`);
                    return choice;
                }
                pushLog(`showQuickPick:${choice?.label || 'object-choice'}`);
                return choice;
            },
            async showSaveDialog(options = {}) {
                const defaultUri = options.defaultUri?.fsPath;
                const targetPath = defaultUri && path.isAbsolute(defaultUri)
                    ? defaultUri
                    : path.join(workspaceRoot, 'tests', 'artifacts', 'reports', 'configuration-report.json');
                await fsp.mkdir(path.dirname(targetPath), { recursive: true });
                return VSCodeUri.file(targetPath);
            },
            withProgress: async (_, task) => task(() => {})
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
            async executeCommand(commandId, ...args) {
                if (commandId === 'setContext') {
                    const [key, value] = args;
                    contexts[key] = value;
                    return true;
                }
                const handler = commandRegistry.get(commandId);
                if (handler) {
                    return handler(...args);
                }
                pushLog(`executeCommand:${commandId}:missing`);
                return undefined;
            }
        },
        workspace: {
            workspaceFolders: options.workspaceFolders || [
                { uri: VSCodeUri.file(sampleWorkspace) }
            ],
            getConfiguration: configuration,
            onDidChangeConfiguration() {
                return { dispose() {} };
            },
            asRelativePath(target) {
                const fullPath = typeof target === 'string' ? target : (target?.fsPath || target?.path);
                return path.relative(sampleWorkspace, fullPath);
            },
            createFileSystemWatcher() {
                const disposable = { dispose() {} };
                return {
                    onDidChange() {
                        return disposable;
                    },
                    onDidCreate() {
                        return disposable;
                    },
                    onDidDelete() {
                        return disposable;
                    },
                    dispose() {}
                };
            },
            fs: null,
            findFiles: async () => []
        },
        RelativePattern: class RelativePattern {
            constructor(base, pattern) {
                this.base = base;
                this.pattern = pattern;
            }
        }
    };

    mock.workspace.fs = createFileSystemApi(mock);

    const originalLoad = Module._load;
    Module._load = function(request) {
        if (request === 'vscode') {
            return mock;
        }
        return originalLoad.apply(this, arguments);
    };

    function dispose() {
        Module._load = originalLoad;
    }

    function resetLogs() {
        infoLog.length = 0;
        errorLog.length = 0;
    }

    return {
        vscode: mock,
        infoLog,
        errorLog,
        appliedUpdates,
        configValues,
        contexts,
        commandRegistry,
        sampleWorkspace,
        workspaceRoot,
        registeredProviders,
        dispose,
        resetLogs,
        InMemoryMemento,
        VSCodeUri
    };
}

function createExtensionContext(overrides = {}) {
    const subscriptions = [];
    const context = {
        subscriptions,
        extensionPath: workspaceRoot,
        extensionUri: VSCodeUri.file(workspaceRoot),
        globalState: new InMemoryMemento(),
        workspaceState: new InMemoryMemento(),
        storageUri: VSCodeUri.file(path.join(workspaceRoot, '.mock-storage')),
        extension: {
            packageJSON: require(path.join(workspaceRoot, 'package.json'))
        },
        asAbsolutePath(relativePath) {
            return path.join(workspaceRoot, relativePath);
        },
        secrets: {
            async get() {
                return null;
            },
            async store() {},
            async delete() {}
        },
        environmentVariableCollection: {
            replace() {},
            persistent: true,
            description: 'mock'
        },
        ...overrides
    };

    return context;
}

module.exports = {
    createMockVscode,
    createExtensionContext,
    InMemoryMemento,
    VSCodeUri,
    workspaceRoot
};
