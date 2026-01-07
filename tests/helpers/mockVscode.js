const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const Module = require('module');
const { registerFeatureFlagsGlobal } = require('../../src/utils/featureFlagsBridge');

const FORCE_WORKSPACE_FS_ENV = 'EXPLORER_DATES_FORCE_VSCODE_FS';
const TEST_MODE_ENV = 'EXPLORER_DATES_TEST_MODE';
const CHUNK_TIMEOUT_ENV = 'EXPLORER_DATES_CHUNK_TIMEOUT';
const GLOBAL_VSCODE_SYMBOL = '__explorerDatesVscode';
const CHUNK_ALIAS_MAP = {
    exportReporting: 'reporting',
    workspaceTemplates: 'templates',
    analysisCommands: 'analysis'
};
const originalModuleLoad = Module._load;
let sharedVscodeMock = null;
let hookInstalled = false;
let activeMockUsers = 0;
const originalEnvSnapshot = {
    [FORCE_WORKSPACE_FS_ENV]: process.env[FORCE_WORKSPACE_FS_ENV],
    [TEST_MODE_ENV]: process.env[TEST_MODE_ENV],
    [CHUNK_TIMEOUT_ENV]: process.env[CHUNK_TIMEOUT_ENV]
};

const workspaceRoot = path.resolve(__dirname, '..', '..');
const defaultWorkspace = path.join(workspaceRoot, 'src');
const pkg = require(path.join(workspaceRoot, 'package.json'));
const MAX_LOG_ENTRIES = Number(process.env.MOCK_VSCODE_MAX_LOG_ENTRIES || 200);

const configurationProperties = pkg?.contributes?.configuration?.properties || {};

function ensureFeatureFlagsRegistered() {
    try {
        if (typeof globalThis !== 'undefined' && globalThis.__explorerDatesFeatureFlags) {
            return globalThis.__explorerDatesFeatureFlags;
        }
        const featureFlags = require('../../src/featureFlags');
        registerFeatureFlagsGlobal(featureFlags);
        return featureFlags;
    } catch {
        return null;
    }
}

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

function installModuleHook() {
    if (hookInstalled) {
        return;
    }
    Module._load = function(request, parent, isMain) {
        if (request === 'vscode') {
            if (!sharedVscodeMock) {
                throw new Error('VS Code mock requested before initialization');
            }
            return sharedVscodeMock;
        }
        return originalModuleLoad.call(this, request, parent, isMain);
    };
    hookInstalled = true;
}

function uninstallModuleHook() {
    if (!hookInstalled) {
        return;
    }
    Module._load = originalModuleLoad;
    hookInstalled = false;
}

function replaceMockContents(target, source) {
    for (const key of Reflect.ownKeys(target)) {
        delete target[key];
    }
    for (const key of Reflect.ownKeys(source)) {
        const descriptor = Object.getOwnPropertyDescriptor(source, key);
        Object.defineProperty(target, key, descriptor);
    }
}

function hashString(input = '') {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function createVirtualFileStat(mock, targetPath) {
    const normalized = path.normalize(targetPath);
    const hash = hashString(normalized || 'virtual');
    const now = Date.now();
    const ageMs = hash % (30 * 24 * 60 * 60 * 1000);
    return {
        type: mock.FileType.File,
        ctime: now - ageMs - 5000,
        mtime: now - ageMs,
        size: (hash % (1024 * 50)) + 512
    };
}

function createVirtualFileContent(targetPath) {
    const normalized = path.basename(targetPath || 'virtual');
    return `// virtual content generated for ${normalized}\n`;
}

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
        this._data = {}; // For easier test inspection
    }

    get(key, defaultValue) {
        return this._store.has(key) ? this._store.get(key) : defaultValue;
    }

    async update(key, value) {
        this._store.set(key, value);
        this._data[key] = value; // For easier test inspection
    }
}

function createDefaultConfig(customValues = {}) {
    return {
        ...PACKAGE_DEFAULTS,
        ...TEST_SPECIFIC_DEFAULTS,
        ...customValues
    };
}

function createConfiguration(
    configValues,
    appliedUpdates,
    workspaceConfigValues = {},
    workspaceFolderConfigValues = {}
) {
    const hasOwn = (store, key) => Object.prototype.hasOwnProperty.call(store, key);
    const getValue = (fullKey, defaultValue) => {
        if (hasOwn(workspaceFolderConfigValues, fullKey)) {
            return workspaceFolderConfigValues[fullKey];
        }
        if (hasOwn(workspaceConfigValues, fullKey)) {
            return workspaceConfigValues[fullKey];
        }
        if (hasOwn(configValues, fullKey)) {
            return configValues[fullKey];
        }
        return defaultValue;
    };
    const setValue = (store, key, value) => {
        if (value === undefined) {
            delete store[key];
        } else {
            store[key] = value;
        }
    };
    const interpretTarget = (target) => {
        if (target === 2 || target === 'workspace') {
            return 'workspace';
        }
        if (target === 3 || target === 'workspaceFolder') {
            return 'workspaceFolder';
        }
        return 'global';
    };
    const applyUpdate = (fullKey, value, targetLabel) => {
        if (targetLabel === 'workspaceFolder') {
            setValue(workspaceFolderConfigValues, fullKey, value);
        } else if (targetLabel === 'workspace') {
            setValue(workspaceConfigValues, fullKey, value);
        } else {
            setValue(configValues, fullKey, value);
        }
        appliedUpdates.push({ key: fullKey, value, target: targetLabel });
    };

    return function getConfiguration(section, _scope) {
        if (!section) {
            return {
                get(key, defaultValue) {
                    return getValue(key, defaultValue);
                },
                inspect(key) {
                    const globalValue = hasOwn(configValues, key) ? configValues[key] : undefined;
                    const workspaceValue = hasOwn(workspaceConfigValues, key)
                        ? workspaceConfigValues[key]
                        : undefined;
                    const workspaceFolderValue = hasOwn(workspaceFolderConfigValues, key)
                        ? workspaceFolderConfigValues[key]
                        : undefined;

                    return {
                        key,
                        defaultValue: PACKAGE_DEFAULTS[key],
                        globalValue,
                        workspaceValue,
                        workspaceFolderValue
                    };
                },
                async update(key, value, target) {
                    const targetLabel = interpretTarget(target);
                    applyUpdate(key, value, targetLabel);
                }
            };
        }

        const buildSectionKey = (key) => (section ? `${section}.${key}` : key);

        return {
            inspect(key) {
                if (section === 'explorerDates') {
                    const fullKey = `explorerDates.${key}`;
                    const globalValue = hasOwn(configValues, fullKey) ? configValues[fullKey] : undefined;
                    const workspaceValue = hasOwn(workspaceConfigValues, fullKey)
                        ? workspaceConfigValues[fullKey]
                        : undefined;
                    const workspaceFolderValue = hasOwn(workspaceFolderConfigValues, fullKey)
                        ? workspaceFolderConfigValues[fullKey]
                        : undefined;
                    return {
                        key: fullKey,
                        defaultValue: PACKAGE_DEFAULTS[fullKey],
                        globalValue,
                        workspaceValue,
                        workspaceFolderValue
                    };
                }
                const fullKey = buildSectionKey(key);
                const globalValue = hasOwn(configValues, fullKey) ? configValues[fullKey] : undefined;
                const workspaceValue = hasOwn(workspaceConfigValues, fullKey)
                    ? workspaceConfigValues[fullKey]
                    : undefined;
                const workspaceFolderValue = hasOwn(workspaceFolderConfigValues, fullKey)
                    ? workspaceFolderConfigValues[fullKey]
                    : undefined;
                return {
                    key: fullKey,
                    defaultValue: undefined,
                    globalValue,
                    workspaceValue,
                    workspaceFolderValue
                };
            },
            get(key, defaultValue) {
                const fullKey = buildSectionKey(key);
                return getValue(fullKey, defaultValue);
            },
            has(key) {
                const fullKey = buildSectionKey(key);
                return (
                    hasOwn(configValues, fullKey) ||
                    hasOwn(workspaceConfigValues, fullKey) ||
                    hasOwn(workspaceFolderConfigValues, fullKey)
                );
            },
            async update(key, value, target) {
                const fullKey = buildSectionKey(key);
                const targetLabel = interpretTarget(target);
                applyUpdate(fullKey, value, targetLabel);
            }
        };
    };
}

function createFileSystemApi(mock, options = {}) {
    const mockDirectoryContents = options.mockDirectoryContents || {};
    const activeStats = new Map();
    let statCounter = 0;

    const recordStatStart = (uri) => {
        const id = `stat-${Date.now()}-${statCounter++}`;
        activeStats.set(id, {
            id,
            path: uri?.fsPath || uri?.path || '<unknown>',
            startedAt: Date.now()
        });
        return id;
    };

    const recordStatEnd = (id) => {
        activeStats.delete(id);
    };

    const shouldUseVirtualStat = (targetPath) => {
        if (!targetPath) {
            return true;
        }
        const base = path.basename(targetPath);
        if (base === '.explorer-dates-profiles.json') {
            return true;
        }
        return !fs.existsSync(targetPath);
    };

    const api = {
        async readDirectory(uri) {
            const dirPath = uri.fsPath;
            
            // Check if we have mock directory contents for this path
            if (mockDirectoryContents[dirPath]) {
                return mockDirectoryContents[dirPath];
            }
            
            try {
                const entries = fs.readdirSync(uri.fsPath, { withFileTypes: true });
                return entries.map((entry) => [
                    entry.name,
                    entry.isDirectory() ? mock.FileType.Directory : mock.FileType.File
                ]);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return [];
                }
                throw error;
            }
        },
        async stat(uri) {
            const token = recordStatStart(uri);
            try {
                const targetPath = uri.fsPath;
                if (shouldUseVirtualStat(targetPath)) {
                    return createVirtualFileStat(mock, targetPath);
                }
                const stats = fs.statSync(targetPath);
                return {
                    type: stats.isDirectory() ? mock.FileType.Directory : mock.FileType.File,
                    ctime: stats.ctimeMs ?? stats.ctime?.getTime?.(),
                    mtime: stats.mtimeMs ?? stats.mtime?.getTime?.(),
                    size: stats.size,
                    birthtime: stats.birthtimeMs ?? (stats.birthtime ? stats.birthtime.getTime() : stats.ctimeMs)
                };
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return createVirtualFileStat(mock, uri.fsPath);
                }
                throw error;
            } finally {
                recordStatEnd(token);
            }
        },
        async readFile(uri) {
            const targetPath = uri.fsPath;
            try {
                if (fs.existsSync(targetPath)) {
                    return fs.readFileSync(targetPath);
                }
                return Buffer.from(createVirtualFileContent(targetPath));
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return Buffer.from(createVirtualFileContent(targetPath));
                }
                throw error;
            }
        },
        async writeFile(uri, data) {
            fs.mkdirSync(path.dirname(uri.fsPath), { recursive: true });
            fs.writeFileSync(uri.fsPath, data);
        },
        async createDirectory(uri) {
            fs.mkdirSync(uri.fsPath, { recursive: true });
        },
        async delete(uri, options = {}) {
            try {
                fs.rmSync(uri.fsPath, { recursive: options.recursive ?? false, force: true });
            } catch (error) {
                if (error.code === 'ERR_FS_EISDIR' || error.code === 'EISDIR') {
                    fs.rmdirSync(uri.fsPath, { recursive: options.recursive ?? false });
                } else {
                    throw error;
                }
            }
        }
    };
    
    api._getActiveStats = () => Array.from(activeStats.values());

    return api;
}

/**
 * Configuration Snapshot and Restore Utilities
 * Prevents test interference by saving and restoring configuration state
 */
class ConfigurationSnapshot {
    constructor(configValues) {
        this.original = { ...configValues };
        this.applied = [];
    }
    
    restore(configValues) {
        // Clear current values
        for (const key in configValues) {
            delete configValues[key];
        }
        
        // Restore original values
        Object.assign(configValues, this.original);
        
        return this;
    }
    
    trackApplied(key, value) {
        this.applied.push({ key, value, timestamp: Date.now() });
    }
    
    getAppliedChanges() {
        return [...this.applied];
    }
}

/**
 * Enhanced Mock Factory with Per-Test Isolation
 * Prevents global state sharing between tests
 */
function createIsolatedMock(options = {}) {
    const baseOptions = {
        ...options,
        isolated: true
    };
    
    const mock = createMockVscode(baseOptions);
    const configSnapshot = new ConfigurationSnapshot(mock.configValues);
    
    // Override dispose to include configuration restoration
    const originalDispose = mock.dispose;
    mock.dispose = () => {
        if (options.restoreConfig !== false) {
            configSnapshot.restore(mock.configValues);
        }
        originalDispose();
    };
    
    mock.snapshot = configSnapshot;
    mock.saveConfigSnapshot = () => new ConfigurationSnapshot(mock.configValues);
    mock.restoreFromSnapshot = (snapshot) => snapshot.restore(mock.configValues);
    
    return mock;
}

/**
 * Test Suite Configuration Manager
 * Manages configuration state across multiple test functions in a suite
 */
class TestSuiteManager {
    constructor(suiteName) {
        this.suiteName = suiteName;
        this.baseMock = null;
        this.originalConfig = null;
        this.testCount = 0;
        this.suiteDisposed = false;
    }
    
    initialize(baseConfig = {}) {
        if (this.baseMock) {
            throw new Error('Test suite already initialized');
        }
        
        this.baseMock = createMockVscode({
            config: baseConfig,
            isolated: true
        });
        
        this.originalConfig = { ...this.baseMock.configValues };
        return this.baseMock;
    }
    
    createTestMock(testName, overrides = {}) {
        if (!this.baseMock) {
            throw new Error('Test suite not initialized - call initialize() first');
        }
        
        if (this.suiteDisposed) {
            throw new Error('Test suite already disposed');
        }
        
        this.testCount++;
        
        // Create isolated mock with test-specific overrides
        const testMock = createIsolatedMock({
            config: { ...this.originalConfig, ...overrides },
            workspace: this.baseMock.vscode.workspace.workspaceFolders,
            testName: `${this.suiteName}.${testName}`,
            testId: this.testCount
        });
        
        // Track this as a child mock
        testMock.parentSuite = this.suiteName;
        
        return testMock;
    }
    
    resetToBaseConfig() {
        if (!this.baseMock) return;
        
        // Reset base mock configuration
        Object.assign(this.baseMock.configValues, this.originalConfig);
    }
    
    dispose() {
        if (this.suiteDisposed) return;
        
        if (this.baseMock) {
            this.baseMock.dispose();
            this.baseMock = null;
        }
        
        this.suiteDisposed = true;
    }
}

/**
 * Mock State Validator
 * Detects and reports state leaks between tests
 */
class MockStateValidator {
    constructor() {
        this.baselines = new Map();
        this.violations = [];
    }
    
    captureBaseline(testName, mock) {
        this.baselines.set(testName, {
            configKeys: Object.keys(mock.configValues),
            configValues: { ...mock.configValues },
            commandCount: mock.commandRegistry.size,
            providerCount: mock.registeredProviders.length,
            timestamp: Date.now()
        });
    }
    
    validateAgainstBaseline(testName, mock) {
        const baseline = this.baselines.get(testName);
        if (!baseline) {
            console.warn(`No baseline found for test: ${testName}`);
            return true;
        }
        
        const violations = [];
        
        // Check for config key changes
        const currentKeys = Object.keys(mock.configValues);
        const addedKeys = currentKeys.filter(key => !baseline.configKeys.includes(key));
        const removedKeys = baseline.configKeys.filter(key => !currentKeys.includes(key));
        
        if (addedKeys.length > 0) {
            violations.push(`Added config keys: ${addedKeys.join(', ')}`);
        }
        
        if (removedKeys.length > 0) {
            violations.push(`Removed config keys: ${removedKeys.join(', ')}`);
        }
        
        // Check for config value changes
        for (const key of baseline.configKeys) {
            if (mock.configValues[key] !== baseline.configValues[key]) {
                violations.push(`Config changed: ${key} = ${baseline.configValues[key]} -> ${mock.configValues[key]}`);
            }
        }
        
        // Check for command registry changes
        if (mock.commandRegistry.size !== baseline.commandCount) {
            violations.push(`Command count changed: ${baseline.commandCount} -> ${mock.commandRegistry.size}`);
        }
        
        // Check for provider registration changes
        if (mock.registeredProviders.length !== baseline.providerCount) {
            violations.push(`Provider count changed: ${baseline.providerCount} -> ${mock.registeredProviders.length}`);
        }
        
        if (violations.length > 0) {
            this.violations.push({
                testName,
                violations,
                timestamp: Date.now()
            });
            
            console.warn(`State violations detected in ${testName}:`);
            violations.forEach(violation => console.warn(`  - ${violation}`));
            
            return false;
        }
        
        return true;
    }
    
    getViolations() {
        return [...this.violations];
    }
    
    clearViolations() {
        this.violations.length = 0;
    }
}

// Global state validator for cross-test validation
const globalStateValidator = new MockStateValidator();

function createMockVscode(options = {}) {
    const infoLog = [];
    const errorLog = [];
    const appliedUpdates = [];
    const contexts = {};
    const commandRegistry = new Map();
    
    // Check for forced isolation request
    const forceIsolation = options.forceIsolation === true || options.isolationKey;
    
    // Process explorerDates configuration from options
    const configValues = createDefaultConfig(options.config || {});
    const workspaceConfigValues = {};
    if (options.workspaceConfig) {
        for (const [key, value] of Object.entries(options.workspaceConfig)) {
            const normalizedKey = key.includes('.') ? key : `explorerDates.${key}`;
            workspaceConfigValues[normalizedKey] = value;
        }
    }
    const workspaceFolderConfigValues = {};
    if (options.workspaceFolderConfig) {
        for (const [key, value] of Object.entries(options.workspaceFolderConfig)) {
            const normalizedKey = key.includes('.') ? key : `explorerDates.${key}`;
            workspaceFolderConfigValues[normalizedKey] = value;
        }
    }
    if (options.explorerDates) {
        for (const [key, value] of Object.entries(options.explorerDates)) {
            configValues[`explorerDates.${key}`] = value;
        }
    }
    
    const sampleWorkspace = options.sampleWorkspace || defaultWorkspace;
    
    // Workspace simulation options
    const mockWorkspaceFileCount = options.mockWorkspaceFileCount || 1000;
    const mockDirectoryContents = options.mockDirectoryContents || {};
    const simulateFileSystemError = options.simulateFileSystemError || false;
    
    // Configuration change event handling
    const configChangeListeners = new Set();
    const workspaceFoldersChangeListeners = new Set();
    
    const triggerConfigChange = (newConfig = {}) => {
        // Update config values
        Object.assign(configValues, newConfig);
        
        // Create change event
        const changeEvent = {
            affectsConfiguration(section) {
                if (!section) return true;
                return Object.keys(newConfig).some(key => key.startsWith(section));
            }
        };
        
        // Notify all listeners
        configChangeListeners.forEach(listener => {
            try {
                listener(changeEvent);
            } catch (error) {
                errorLog.push(`Config change listener error: ${error.message}`);
            }
        });
    };

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

    const configuration = createConfiguration(
        configValues,
        appliedUpdates,
        workspaceConfigValues,
        workspaceFolderConfigValues
    );

    const registeredProviders = [];

    const mock = {
        ConfigurationTarget: {
            Global: 1,
            Workspace: 2,
            WorkspaceFolder: 3
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
                machineId: 'test-machine',
                sessionId: 'test-session',
                appName: 'Visual Studio Code',
                appHost: 'desktop',
                appRoot: '/app',
                language: 'en',
                clipboard,
                uiKind: options.uiKind || 1,
                remoteName: options.remoteName || undefined,
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
                kind: options.themeKind || 2
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
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
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
            async getCommands(_filterInternal = true) {
                return Array.from(commandRegistry.keys());
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
            workspaceFolders: options.workspaceFolders || options.workspace?.workspaceFolders || [
                { uri: VSCodeUri.file(sampleWorkspace), name: 'workspace1', index: 0 }
            ],
            getConfiguration: configuration,
            getWorkspaceFolder(uri) {
                return this.workspaceFolders?.find(folder => {
                    if (typeof uri === 'string') {
                        return uri.startsWith(folder.uri.fsPath);
                    }
                    return uri.fsPath?.startsWith(folder.uri.fsPath);
                });
            },
            onDidChangeConfiguration(listener) {
                if (listener) {
                    configChangeListeners.add(listener);
                }
                return {
                    dispose() {
                        if (listener) {
                            configChangeListeners.delete(listener);
                        }
                    }
                };
            },
            onDidChangeWorkspaceFolders(listener) {
                if (listener) {
                    workspaceFoldersChangeListeners.add(listener);
                }
                return {
                    dispose() {
                        if (listener) {
                            workspaceFoldersChangeListeners.delete(listener);
                        }
                    }
                };
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
            async findFiles(include, exclude, maxResults) {
                if (simulateFileSystemError) {
                    throw new Error('Simulated filesystem error');
                }
                
                // Generate mock file URIs based on mockWorkspaceFileCount
                const files = [];
                const actualMax = Math.min(mockWorkspaceFileCount, maxResults || mockWorkspaceFileCount);
                
                for (let i = 0; i < actualMax; i++) {
                    const fileName = `file${i.toString().padStart(5, '0')}.txt`;
                    const filePath = path.join(sampleWorkspace, fileName);
                    files.push(VSCodeUri.file(filePath));
                }
                
                return files;
            }
        },
        RelativePattern: class RelativePattern {
            constructor(base, pattern) {
                this.base = base;
                this.pattern = pattern;
            }
        }
    };

    const workspaceFs = createFileSystemApi(mock, { mockDirectoryContents });
    mock.workspace.fs = workspaceFs;

    // Theme change helpers so tests can simulate VS Code notifications
    const themeEmitter = new mock.EventEmitter();
    mock.window.onDidChangeActiveColorTheme = themeEmitter.event;
    mock.fireThemeChange = (kind = mock.window.activeColorTheme.kind) => {
        if (typeof kind === 'number') {
            mock.window.activeColorTheme.kind = kind;
        } else if (kind && typeof kind.kind === 'number') {
            mock.window.activeColorTheme.kind = kind.kind;
        }
        themeEmitter.fire({ kind: mock.window.activeColorTheme.kind });
    };
    const fireThemeChange = mock.fireThemeChange;
    mock.getThemeListenerCount = () => themeEmitter._listeners.size;

    function resetLogs() {
        infoLog.length = 0;
        errorLog.length = 0;
    }

    const triggerWorkspaceFoldersChange = (added = [], removed = []) => {
        const event = { added, removed };
        for (const listener of workspaceFoldersChangeListeners) {
            listener(event);
        }
    };

    const addWorkspaceFolder = (folder) => {
        mock.workspace.workspaceFolders = mock.workspace.workspaceFolders || [];
        const newFolder = {
            uri: VSCodeUri.file(folder.path),
            name: folder.name || path.basename(folder.path),
            index: mock.workspace.workspaceFolders.length
        };
        mock.workspace.workspaceFolders.push(newFolder);
        triggerWorkspaceFoldersChange([newFolder], []);
        return newFolder;
    };

    const removeWorkspaceFolder = (indexOrName) => {
        const folders = mock.workspace.workspaceFolders || [];
        let index = -1;
        
        if (typeof indexOrName === 'number') {
            index = indexOrName;
        } else {
            index = folders.findIndex(f => f.name === indexOrName);
        }
        
        if (index >= 0 && index < folders.length) {
            const removed = folders.splice(index, 1);
            // Update indices for remaining folders
            for (let i = index; i < folders.length; i++) {
                folders[i].index = i;
            }
            triggerWorkspaceFoldersChange([], removed);
            return removed[0];
        }
        return null;
    };

    installModuleHook();

    // Handle isolation: create separate mock instances when requested
    let actualVscodeMock;
    if (forceIsolation) {
        // Create isolated mock - don't use shared instance
        actualVscodeMock = mock;
        // Ensure module hook can serve a mock for resolver installs in isolation mode
        if (!sharedVscodeMock) {
            sharedVscodeMock = mock;
        }
    } else {
        // Use shared mock system as before
        if (!sharedVscodeMock) {
            sharedVscodeMock = mock;
        } else {
            replaceMockContents(sharedVscodeMock, mock);
        }
        actualVscodeMock = sharedVscodeMock;
    }
    try {
        globalThis[GLOBAL_VSCODE_SYMBOL] = actualVscodeMock;
    } catch {
        // ignore if global scope unavailable
    }
    activeMockUsers++;

    // Always install a chunk resolver so both node and web test modes can see built artifacts
    try {
        const { CHUNK_MAP } = require('../../src/shared/chunkMap');
        const featureFlags = require('../../src/featureFlags');

        const resolveChunkName = (requested) => {
            if (CHUNK_MAP[requested]) {
                return requested;
            }
            if (CHUNK_ALIAS_MAP[requested]) {
                const alias = CHUNK_ALIAS_MAP[requested];
                return CHUNK_MAP[alias] ? alias : requested;
            }
            return requested;
        };

        const preferSourceChunks = options.useDistChunks !== true &&
            process.env.EXPLORER_DATES_FORCE_DIST_CHUNKS !== '1';

        const resolveChunkPath = (chunkName, target) => {
            const normalized = resolveChunkName(chunkName);

            if (preferSourceChunks) {
                const sourceRelPath = CHUNK_MAP[normalized];
                if (sourceRelPath) {
                    const sourcePath = path.join(workspaceRoot, `${sourceRelPath}.js`);
                    if (fs.existsSync(sourcePath)) {
                        return sourcePath;
                    }
                }
            }

            const baseDir = target === 'web'
                ? ['dist', 'web-chunks']
                : ['dist', 'chunks'];
            return path.join(workspaceRoot, ...baseDir, `${normalized}.js`);
        };

        featureFlags.setFeatureChunkResolver((chunkName) => {
            const isWeb = (options.uiKind === 2) || process.env.VSCODE_WEB === 'true';
            const target = isWeb ? 'web' : 'node';
            const chunkPath = resolveChunkPath(chunkName, target);
            if (!fs.existsSync(chunkPath)) {
                return null;
            }
            try {
                delete require.cache[chunkPath];
                const mod = require(chunkPath);
                return mod?.default || mod;
            } catch (error) {
                console.warn(`Failed to resolve chunk ${chunkName} from ${chunkPath}: ${error.message}`);
                return null;
            }
        });
    } catch (error) {
        console.warn(`Failed to install feature chunk resolver: ${error.message}`);
    }

    process.env[FORCE_WORKSPACE_FS_ENV] = '1';
    process.env[TEST_MODE_ENV] = '1';
    if (Object.prototype.hasOwnProperty.call(options, 'chunkTimeout')) {
        process.env[CHUNK_TIMEOUT_ENV] = String(options.chunkTimeout);
    } else if (!process.env[CHUNK_TIMEOUT_ENV]) {
        process.env[CHUNK_TIMEOUT_ENV] = '15000';
    }

    const dispose = () => {
        activeMockUsers = Math.max(0, activeMockUsers - 1);
        
        // Validate state if isolation is enabled
        if (options.isolated && options.testName) {
            globalStateValidator.validateAgainstBaseline(options.testName, mockResult);
        }
        
        if (activeMockUsers === 0) {
            try {
                delete globalThis[GLOBAL_VSCODE_SYMBOL];
            } catch {
                // ignore
            }
            if (originalEnvSnapshot[FORCE_WORKSPACE_FS_ENV] === undefined) {
                delete process.env[FORCE_WORKSPACE_FS_ENV];
            } else {
                process.env[FORCE_WORKSPACE_FS_ENV] = originalEnvSnapshot[FORCE_WORKSPACE_FS_ENV];
            }

            if (originalEnvSnapshot[TEST_MODE_ENV] === undefined) {
                delete process.env[TEST_MODE_ENV];
            } else {
                process.env[TEST_MODE_ENV] = originalEnvSnapshot[TEST_MODE_ENV];
            }

            if (originalEnvSnapshot[CHUNK_TIMEOUT_ENV] === undefined) {
                delete process.env[CHUNK_TIMEOUT_ENV];
            } else {
                process.env[CHUNK_TIMEOUT_ENV] = originalEnvSnapshot[CHUNK_TIMEOUT_ENV];
            }

            uninstallModuleHook();
        }
    };

    const mockResult = {
        vscode: actualVscodeMock,
        infoLog,
        errorLog,
        appliedUpdates,
        configValues,
        workspaceConfigValues,
        workspaceFolderConfigValues,
        contexts,
        commandRegistry,
        sampleWorkspace,
        workspaceRoot,
        registeredProviders,
        resetLogs,
        triggerConfigChange,
        triggerWorkspaceFoldersChange,
        addWorkspaceFolder,
        removeWorkspaceFolder,
        fireThemeChange,
        getThemeListenerCount: () => (actualVscodeMock.getThemeListenerCount ? actualVscodeMock.getThemeListenerCount() : 0),
        InMemoryMemento,
        VSCodeUri,
        getActiveFsOperations: () => (workspaceFs._getActiveStats ? workspaceFs._getActiveStats() : []),
        dispose
    };
    
    // Add isolation features if requested
    if (options.isolated) {
        mockResult.isolated = true;
        mockResult.testName = options.testName || 'unknown-test';
        
        // Capture baseline for state validation
        if (options.testName) {
            setTimeout(() => {
                globalStateValidator.captureBaseline(options.testName, mockResult);
            }, 0);
        }
        
        // Enhanced dispose with state restoration
        const originalDispose = dispose;
        mockResult.dispose = () => {
            // Clear any test-specific state
            resetLogs();
            
            // Reset configuration if requested
            if (options.restoreConfig !== false && options.baseConfig) {
                Object.assign(configValues, options.baseConfig);
            }
            
            originalDispose();
        };
    }
    
    return mockResult;
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

// Chunk testing utilities
function loadChunkForTesting(chunkName, options = {}) {
    const { suppressLoadErrors = true } = options;
    const { CHUNK_MAP } = require('../../src/shared/chunkMap');
    const sourcePath = CHUNK_MAP[chunkName];
    
    if (!sourcePath) {
        const error = new Error(`Unknown chunk: ${chunkName}`);
        error.code = 'CHUNK_NOT_FOUND';
        throw error;
    }
    
    const fullSourcePath = `../../${sourcePath}`;
    try {
        ensureFeatureFlagsRegistered();
        return require(fullSourcePath);
    } catch (error) {
        if (!suppressLoadErrors) {
            throw error;
        }
        console.warn(`Failed to load chunk ${chunkName}:`, error.message);
        return null;
    }
}

const CHUNK_BUILD_DIRS = {
    node: ['dist', 'chunks'],
    web: ['dist', 'web-chunks']
};

function getBuiltChunkPath(chunkName, target = 'node') {
    const dirSegments = CHUNK_BUILD_DIRS[target];
    if (!dirSegments) {
        throw new Error(`Unknown chunk target: ${target}`);
    }
    return path.join(workspaceRoot, ...dirSegments, `${chunkName}.js`);
}

function loadBuiltChunkForTesting(chunkName, options = {}) {
    const { target = 'node', suppressLoadErrors = true } = options;
    const chunkPath = getBuiltChunkPath(chunkName, target);
    const originalWebFlag = process.env.VSCODE_WEB;
    if (target === 'web') {
        process.env.VSCODE_WEB = 'true';
    }
    try {
        ensureFeatureFlagsRegistered();
        delete require.cache[chunkPath];
        return require(chunkPath);
    } catch (error) {
        if (!suppressLoadErrors) {
            throw error;
        }
        console.warn(`Failed to load ${target} chunk ${chunkName}:`, error.message);
        return null;
    } finally {
        if (target === 'web') {
            process.env.VSCODE_WEB = originalWebFlag;
        }
    }
}

function validateAllChunks() {
    const { CHUNK_MAP } = require('../../src/shared/chunkMap');
    const results = {
        success: true,
        loadedCount: 0,
        totalCount: 0,
        errors: {}
    };
    
    const chunkNames = Object.keys(CHUNK_MAP);
    results.totalCount = chunkNames.length;
    
    for (const chunkName of chunkNames) {
        try {
            const chunk = loadChunkForTesting(chunkName);
            if (chunk) {
                results.loadedCount++;
            } else {
                results.success = false;
                results.errors[chunkName] = 'Failed to load (returned null)';
            }
        } catch (error) {
            results.success = false;
            results.errors[chunkName] = error.message;
        }
    }

    return results;
}

function validateBuiltChunks(target = 'node') {
    const { CHUNK_MAP } = require('../../src/shared/chunkMap');
    const chunkNames = Object.keys(CHUNK_MAP);
    const results = {
        target,
        success: true,
        loadedCount: 0,
        totalCount: chunkNames.length,
        errors: {}
    };

    for (const chunkName of chunkNames) {
        try {
            const chunk = loadBuiltChunkForTesting(chunkName, { target, suppressLoadErrors: false });
            if (chunk) {
                results.loadedCount++;
            } else {
                results.success = false;
                results.errors[chunkName] = 'Failed to load (returned null)';
            }
        } catch (error) {
            results.success = false;
            results.errors[chunkName] = error.message;
        }
    }

    return results;
}

function loadAllChunksForTesting() {
    const { CHUNK_MAP } = require('../../src/shared/chunkMap');
    const chunks = {};
    
    for (const chunkName of Object.keys(CHUNK_MAP)) {
        try {
            const chunk = loadChunkForTesting(chunkName);
            if (chunk) {
                chunks[chunkName] = chunk;
            }
        } catch (error) {
            console.warn(`Failed to load chunk ${chunkName}:`, error.message);
        }
    }
    
    return chunks;
}

function getAllChunkNames() {
    const { getAllChunkNames: getNames } = require('../../src/shared/chunkMap');
    return getNames();
}

function chunkExists(chunkName) {
    const { CHUNK_MAP } = require('../../src/shared/chunkMap');
    const normalized = CHUNK_MAP[chunkName]
        ? chunkName
        : (CHUNK_ALIAS_MAP[chunkName] && CHUNK_MAP[CHUNK_ALIAS_MAP[chunkName]])
            ? CHUNK_ALIAS_MAP[chunkName]
            : chunkName;

    const nodePath = path.join(workspaceRoot, 'dist', 'chunks', `${normalized}.js`);
    const webPath = path.join(workspaceRoot, 'dist', 'web-chunks', `${normalized}.js`);

    // Succeed when either target is built to avoid false negatives in single-target runs
    return fs.existsSync(nodePath) || fs.existsSync(webPath);
}

function expectChunkOrFail(chunkName, required = false) {
    const exists = chunkExists(chunkName);
    if (required && !exists) {
        throw new Error(`Required chunk ${chunkName} missing - run "npm run package-chunks"`);
    }
    return exists;
}

module.exports = {
    createMockVscode,
    createExtensionContext,
    InMemoryMemento,
    VSCodeUri,
    workspaceRoot,
    // Chunk testing utilities
    loadChunkForTesting,
    loadBuiltChunkForTesting,
    validateAllChunks,
    validateBuiltChunks,
    loadAllChunksForTesting,
    getAllChunkNames,
    chunkExists,
    expectChunkOrFail,
    // Enhanced isolation utilities  
    createIsolatedMock: (options = {}) => createMockVscode({ ...options, forceIsolation: true }),
    TestSuiteManager,
    MockStateValidator,
    ConfigurationSnapshot,
    globalStateValidator
};
