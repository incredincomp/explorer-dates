// extension.js - Explorer Dates
const vscode = require('vscode');
// FileDateDecorationProvider: loaded lazily from chunk at activation to keep core bundle small
// If chunks are not available at runtime, we fall back to the source provider synchronously in activation.
const { getLogger } = require('./src/utils/logger');
// Localization will be loaded lazily to reduce initial bundle size
let l10n;
async function ensureLocalization() {
    if (!l10n) {
        const mod = await import('./src/utils/localization.js');
        l10n = mod.getLocalization();
    }
    return l10n;
}
const { fileSystem } = require('./src/filesystem/FileSystemAdapter');
const { registerCoreCommands } = require('./src/commands/coreCommands');
const { registerOnboardingCommands } = require('./src/commands/onboardingCommands');
const { registerMigrationCommands } = require('./src/commands/migrationCommands');
const { initializeTemplateStore } = require('./src/utils/templateStore');
const { SettingsMigrationManager } = require('./src/utils/settingsMigration');
const { ExtensionError, ERROR_CODES, ChunkLoadError, handleChunkFailure } = require('./src/utils/errors');
// Prefer shared utils chunk when available (keeps core smaller)
let ensureDate;
try {
    const shared = require('./src/chunks/utils-shared-chunk');
    if (shared) ensureDate = shared.ensureDate;
} catch { /* ignore */ }
if (!ensureDate) { const dateHelpers = require('./src/utils/dateHelpers'); ensureDate = dateHelpers.ensureDate; }
const { WEB_CHUNK_GLOBAL_KEY, LEGACY_WEB_CHUNK_GLOBAL_KEY } = require('./src/constants');
const isWebEnvironment = typeof process !== 'undefined' && process?.env?.VSCODE_WEB === 'true';
let nodeFs = null;
let nodePath = null;
const webTextDecoder = typeof TextDecoder === 'function' ? new TextDecoder('utf-8') : null;
if (!isWebEnvironment) {
    try {
        nodeFs = require('fs');
    } catch {
        nodeFs = null;
    }
    try {
        nodePath = require('path');
    } catch {
        nodePath = null;
    }
}
const AUTO_SUGGESTION_DELAY_MS = 3000;
const CRITICAL_CHUNKS = ['incrementalWorkers'];

function resolveDefaultDistPath() {
    if (!nodePath || typeof nodePath.basename !== 'function' || typeof nodePath.join !== 'function') {
        return null;
    }
    const currentDirName = nodePath.basename(__dirname);
    if (currentDirName === 'dist') {
        return __dirname;
    }
    return nodePath.join(__dirname, 'dist');
}

const DEFAULT_DIST_PATH = resolveDefaultDistPath();
// Lazy load large modules to reduce initial bundle size
// const { OnboardingManager } = require('./src/onboarding');
// const { WorkspaceTemplatesManager } = require('./src/workspaceTemplates');
// const { ExtensionApiManager } = require('./src/extensionApi');
// const { ExportReportingManager } = require('./src/exportReporting');

let fileDateProvider;
let logger;
let runtimeAutoSuggestionTimer = null;
let activeRuntimeManager = null;
let activeTeamPersistenceManager = null;

// In-memory cache to avoid races when marking workspace warnings during sync tests
const _warnedWorkspaces = new Set();

const ANALYSIS_WARNING_WORKSPACE_KEY = 'explorerDates.analysisCommandsDisabledWarningByWorkspace';

// Global WeakMap fallback to survive module reloads when the same context object is reused
if (typeof globalThis !== 'undefined' && !globalThis.__explorerDates_analysisWarningWeakMap) {
    try { globalThis.__explorerDates_analysisWarningWeakMap = new WeakMap(); } catch { globalThis.__explorerDates_analysisWarningWeakMap = null; }
}

function getActiveLogger() {
    if (!logger) {
        logger = getLogger();
    }
    return logger;
}

function getWorkspaceId() {
    const firstWorkspace = vscode.workspace.workspaceFolders?.[0];
    return firstWorkspace?.uri?.toString() || 'global';
}

function hasShownAnalysisWarning(context) {
    const workspaceId = getWorkspaceId();
    const map = context?.globalState?.get ? context.globalState.get(ANALYSIS_WARNING_WORKSPACE_KEY, {}) : {};
    // WeakMap fallback: map context -> persisted map so a reloaded module can find it for the same context object
    const wm = (typeof globalThis !== 'undefined') ? globalThis.__explorerDates_analysisWarningWeakMap : null;
    const wmMap = (wm && wm.has(context)) ? wm.get(context) : {};
    return Boolean(map[workspaceId]) || Boolean(wmMap[workspaceId]) || _warnedWorkspaces.has(workspaceId);
}

async function setAnalysisWarningShown(context, value) {
    const workspaceId = getWorkspaceId();
    const map = context?.globalState?.get ? context.globalState.get(ANALYSIS_WARNING_WORKSPACE_KEY, {}) : {};
    map[workspaceId] = value;
    // update in-memory set immediately to avoid races
    if (value) _warnedWorkspaces.add(workspaceId);
    else _warnedWorkspaces.delete(workspaceId);
    // update persistent map in globalThis as an immediate synchronous fallback
    // Persist map to WeakMap fallback (if available) to survive module reloads for same context object
    const wm = (typeof globalThis !== 'undefined') ? globalThis.__explorerDates_analysisWarningWeakMap : null;
    if (wm && context) {
        try {
            wm.set(context, map);
        } catch {
            // ignore
        }
    }
    await context.globalState.update(ANALYSIS_WARNING_WORKSPACE_KEY, map);
}

/**
 * Enhanced Dynamic Loading System with Feature Flags
 * Implements module federation for maximum bundle optimization
 */

const { registerFeatureFlagsGlobal } = require('./src/utils/featureFlagsBridge');
const featureFlagsModule = require('./src/featureFlags');
registerFeatureFlagsGlobal(featureFlagsModule);
const featureFlags = featureFlagsModule;  // Get all exported methods including spread ones
const { setFeatureChunkResolver } = featureFlagsModule;
const { generateDevLoaderMap } = require('./src/shared/chunkMap');

// Chunk loading system for module federation
const sourceChunkLoader = (() => {
    if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') {
        return null;
    }
    try {
        const localRequire = eval('require');
        return (chunkName) => {
            try {
                // Generate the map from shared chunk configuration
                const map = generateDevLoaderMap(localRequire);
                const chunk = map[chunkName]?.();
                return chunk?.default || chunk || null;
            } catch (error) {
                const chunkError = new ExtensionError(
                    ERROR_CODES.CHUNK_LOAD_FAILED,
                    `Source chunk fallback failed for ${chunkName}`,
                    { chunkName, source: 'development', error: error.message }
                );
                getActiveLogger().warn(chunkError.message, chunkError.context);
                return null;
            }
        };
    } catch {
        return null;
    }
})();

const chunkLoader = {
    loadedChunks: new Map(),
    distPath: DEFAULT_DIST_PATH,
    extensionUri: null,
    webChunkPromises: new Map(),
    _webLoadedScripts: new Set(),
    _missingChunks: new Set(),

    initialize(context) {
        if (nodePath) {
            if (typeof context?.asAbsolutePath === 'function') {
                this.distPath = context.asAbsolutePath('dist');
            } else if (context?.extensionPath) {
                this.distPath = nodePath.join(context.extensionPath, 'dist');
            }
        }
        if (context?.extensionUri) {
            this.extensionUri = context.extensionUri;
        }
    },

    async loadChunk(chunkName) {
        if (this.loadedChunks.has(chunkName)) {
            return this.loadedChunks.get(chunkName);
        }

        try {
            if (isWebEnvironment) {
                const chunk = await this._loadWebChunk(chunkName);
                if (chunk) {
                    this.loadedChunks.set(chunkName, chunk);
                    getActiveLogger().info('Chunk loaded', { chunkName, target: 'web' });
                }
                return chunk;
            }

            const chunk = this._loadNodeChunk(chunkName);
            if (chunk) {
                this.loadedChunks.set(chunkName, chunk);
                getActiveLogger().info('Chunk loaded', { chunkName, target: 'node' });
            }
            return chunk;
        } catch (error) {
            const chunkError = error instanceof ExtensionError
                ? error
                : new ExtensionError(
                    ERROR_CODES.CHUNK_LOAD_FAILED,
                    `Failed to load chunk ${chunkName}`,
                    {
                        chunkName,
                        target: isWebEnvironment ? 'web' : 'node',
                        error: error?.message
                    }
                );
            getActiveLogger().warn(chunkError.message, chunkError.context);
            return null;
        }
    },

    assertChunkArtifacts(chunkNames = []) {
        if (!nodeFs || !this.distPath || !Array.isArray(chunkNames) || chunkNames.length === 0) {
            return;
        }
        const missing = chunkNames.filter((name) => !this._hasChunkArtifacts(name));
        if (missing.length > 0) {
            const error = new ChunkLoadError(
                missing.join(', '),
                'missing built artifacts',
                {
                    recoverable: false,
                    context: {
                        chunkNames: missing,
                        distPath: this.distPath,
                        fix: 'Run "npm run package-chunks" before packaging or testing.'
                    }
                }
            );
            handleChunkFailure(missing.join(', '), error, { userFacing: true });
            throw error;
        }
    },

    _hasChunkArtifacts(chunkName) {
        if (!nodeFs || !this.distPath) {
            return true;
        }
        const nodeChunkPath = nodePath.join(this.distPath, 'chunks', `${chunkName}.js`);
        const webChunkPath = nodePath.join(this.distPath, 'web-chunks', `${chunkName}.js`);
        return nodeFs.existsSync(nodeChunkPath) && nodeFs.existsSync(webChunkPath);
    },

    _loadNodeChunk(chunkName) {
        if (nodeFs && nodePath && this.distPath) {
            const builtChunkPath = nodePath.join(this.distPath, 'chunks', `${chunkName}.js`);
            if (nodeFs.existsSync(builtChunkPath)) {
                try {
                    let chunk = require(builtChunkPath);
                    if (chunk?.default) {
                        chunk = chunk.default;
                    }
                    return chunk;
                } catch (error) {
                    const chunkError = new ExtensionError(
                        ERROR_CODES.CHUNK_LOAD_FAILED,
                        `Failed to require built chunk ${chunkName}`,
                        { chunkName, path: builtChunkPath, error: error.message }
                    );
                    getActiveLogger().warn(chunkError.message, chunkError.context);
                }
            }
        }

        if (sourceChunkLoader) {
            return sourceChunkLoader(chunkName);
        }

        this._markChunkMissing(chunkName);
        return null;
    },

    async _loadWebChunk(chunkName) {
        if (!this.extensionUri) {
            const chunkError = new ExtensionError(
                ERROR_CODES.CHUNK_LOAD_FAILED,
                'Missing extensionUri for web chunk loading',
                { chunkName }
            );
            getActiveLogger().warn(chunkError.message, chunkError.context);
            return null;
        }

        if (!this.webChunkPromises.has(chunkName)) {
            const promise = (async () => {
                await this._ensureWebChunkScript(chunkName);
                const registry = this._getWebChunkRegistry();
                const chunk = registry?.[chunkName];
                if (!chunk) {
                    throw new Error(`Web chunk ${chunkName} failed to register`);
                }
                return chunk;
            })();
            this.webChunkPromises.set(chunkName, promise);
        }

        return this.webChunkPromises.get(chunkName);
    },

    async _ensureWebChunkScript(chunkName) {
        if (this._webLoadedScripts.has(chunkName)) {
            return;
        }
        const chunkUri = vscode.Uri.joinPath(this.extensionUri, 'dist', 'web-chunks', `${chunkName}.js`);
        if (!vscode.workspace?.fs || !webTextDecoder) {
            throw new Error('Workspace FS or TextDecoder unavailable for web chunk loading');
        }
        try {
            const raw = await vscode.workspace.fs.readFile(chunkUri);
            const source = webTextDecoder.decode(raw);
            const evaluator = new Function(source);
            evaluator.call(globalThis);
            this._syncChunkRegistryKeys();
            this._webLoadedScripts.add(chunkName);
        } catch (error) {
            this._markChunkMissing(chunkName);
            throw error;
        }
    },

    _getWebChunkRegistry() {
        const registry =
            globalThis[WEB_CHUNK_GLOBAL_KEY] ||
            globalThis[LEGACY_WEB_CHUNK_GLOBAL_KEY] ||
            null;
        if (registry) {
            this._syncChunkRegistryKeys();
        }
        return registry;
    },

    _syncChunkRegistryKeys() {
        const registry =
            globalThis[WEB_CHUNK_GLOBAL_KEY] ||
            globalThis[LEGACY_WEB_CHUNK_GLOBAL_KEY] ||
            {};
        if (!globalThis[WEB_CHUNK_GLOBAL_KEY]) {
            globalThis[WEB_CHUNK_GLOBAL_KEY] = registry;
        }
        if (!globalThis[LEGACY_WEB_CHUNK_GLOBAL_KEY]) {
            globalThis[LEGACY_WEB_CHUNK_GLOBAL_KEY] = registry;
        }
    },

    _markChunkMissing(chunkName) {
        if (this._missingChunks.has(chunkName)) {
            return;
        }
        this._missingChunks.add(chunkName);
        const error = new ChunkLoadError(chunkName, 'artifact unavailable', {
            recoverable: false,
            context: {
                chunkName,
                distPath: this.distPath,
                fix: 'Run "npm run package-chunks" to rebuild runtime chunks.'
            }
        });
        getActiveLogger().error(error.message, error);
        handleChunkFailure(chunkName, error, { userFacing: false });
    }
};

/**
 * Dynamic import for maximum bundle splitting with feature flags
 */
const dynamicImports = {
    async loadOnboarding(context) {
        const chunk = await featureFlags.onboarding();
        if (!chunk) {
            return null;
        }
        if (typeof chunk.createOnboardingManager === 'function') {
            return chunk.createOnboardingManager(context);
        }
        if (chunk.OnboardingManager) {
            return new chunk.OnboardingManager(context);
        }
        return null;
    },

    async loadExportReporting(context) {
        const chunk = await featureFlags.exportReporting();
        if (typeof chunk?.createExportReportingManager === 'function') {
            return chunk.createExportReportingManager(context);
        }
        if (!chunk) {
            return null;
        }
        return null;
    },

    async loadWorkspaceTemplates(context) {
        const chunk = await featureFlags.workspaceTemplates();
        if (typeof chunk?.createWorkspaceTemplatesManager === 'function') {
            return chunk.createWorkspaceTemplatesManager(context);
        }
        if (chunk?.WorkspaceTemplatesManager) {
            return new chunk.WorkspaceTemplatesManager(context);
        }
        return null;
    },

    async loadAnalysisCommands() {
        return featureFlags.analysisCommands();
    },

    async loadExtensionApi(context) {
        const chunk = await featureFlags.extensionApi();
        if (!chunk) {
            return null;
        }
        
        // Handle various chunk export patterns
        if (typeof chunk === 'function') {
            // Check if it's the createExtensionApiManager factory function
            if (chunk.name === 'createExtensionApiManager') {
                return chunk(context);
            }
            // Otherwise, might be the class itself
                try {
                    return new chunk();
                } catch {
                    // Failed to construct, return null
                    return null;
                }
        } else if (typeof chunk.createExtensionApiManager === 'function') {
            return chunk.createExtensionApiManager(context);
        } else if (chunk.ExtensionApiManager) {
            return new chunk.ExtensionApiManager();
        }
        
        return null;
    }
};

let onboardingManagerPromise = null;
let workspaceTemplatesManagerPromise = null;
let exportReportingManagerPromise = null;
let extensionApiManagerPromise = null;

function shouldPrimeOnboardingChunk(context) {
    if (!context?.globalState) {
        return true;
    }

    const hasShownWelcome = context.globalState.get('explorerDates.hasShownWelcome', false);
    const hasCompletedSetup = context.globalState.get('explorerDates.hasCompletedSetup', false);
    const storedVersion = context.globalState.get('explorerDates.onboardingVersion', '0.0.0');
    const currentVersion = context.extension?.packageJSON?.version || '0.0.0';

    if (!hasShownWelcome || !hasCompletedSetup) {
        return true;
    }

    return isMajorVersionUpdate(storedVersion, currentVersion);
}

function isMajorVersionUpdate(previousVersion, currentVersion) {
    const parseMajor = (version) => {
        const [major = '0'] = (version || '').split('.');
        const parsed = Number.parseInt(major, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const previousMajor = parseMajor(previousVersion);
    const currentMajor = parseMajor(currentVersion);
    return currentMajor > previousMajor;
}

function ensureOnboardingManager(context) {
    if (!onboardingManagerPromise) {
        onboardingManagerPromise = dynamicImports.loadOnboarding(context);
    }
    return onboardingManagerPromise;
}

function ensureWorkspaceTemplatesManager(context) {
    if (!workspaceTemplatesManagerPromise) {
        workspaceTemplatesManagerPromise = dynamicImports.loadWorkspaceTemplates(context);
    }
    return workspaceTemplatesManagerPromise;
}

function ensureExportReportingManager(context) {
    if (!exportReportingManagerPromise) {
        exportReportingManagerPromise = dynamicImports.loadExportReporting(context);
    }
    return exportReportingManagerPromise;
}

function ensureExtensionApiManager(context) {
    if (!extensionApiManagerPromise) {
        extensionApiManagerPromise = dynamicImports.loadExtensionApi(context);
    }
    return extensionApiManagerPromise;
}

function raiseChunkUnavailable(featureLabel, chunkName) {
    const message = `${featureLabel} is not available because the required "${chunkName}" runtime chunk failed to load. Reinstall Explorer Dates or run "npm run package-chunks" and reload VS Code.`;
    getActiveLogger().warn(message, { chunkName });
    vscode.window.showErrorMessage(message);
    const error = new ChunkLoadError(chunkName, 'chunk missing at runtime', {
        recoverable: false,
        context: { featureLabel }
    });
    throw error;
}





/**
 * Generate comprehensive diagnostics webview HTML
 */

/**
 * Initialize status bar integration
 */
function initializeStatusBar(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'explorerDates.showFileDetails';
    statusBarItem.tooltip = 'Click to show detailed file information';
    
    // Update status bar when selection changes
    const updateStatusBar = async () => {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                statusBarItem.hide();
                return;
            }
            
            const uri = activeEditor.document.uri;
            if (uri.scheme !== 'file') {
                statusBarItem.hide();
                return;
            }
            
            const stat = await fileSystem.stat(uri);
            
            const modified = ensureDate(stat.mtime);
            const timeAgo = fileDateProvider._formatDateBadge(modified, 'smart');
            const fileSize = fileDateProvider._formatFileSize(stat.size, 'auto');
            
            statusBarItem.text = `$(clock) ${timeAgo} $(file) ${fileSize}`;
            statusBarItem.show();
        } catch (error) {
            statusBarItem.hide();
            logger.debug('Failed to update status bar', error);
        }
    };
    
    // Listen for active editor changes and capture disposables
    const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(updateStatusBar);
    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(updateStatusBar);
    
    // Initial update
    updateStatusBar();
    
    context.subscriptions.push(statusBarItem, editorChangeDisposable, selectionChangeDisposable);
    return statusBarItem;
}

/**
 * Extension activation function
 * @param {vscode.ExtensionContext} context 
 */
async function activate(context) {
    try {
        // Initialize logger and localization
        logger = getLogger();
        l10n = await ensureLocalization();
        context.subscriptions.push(l10n);
        initializeTemplateStore(context);
        chunkLoader.initialize(context);
        chunkLoader.assertChunkArtifacts(CRITICAL_CHUNKS);
        setFeatureChunkResolver((chunkName) => chunkLoader.loadChunk(chunkName));
        
        logger.info('Explorer Dates: Extension activated');

        // Hydrate the heavy logger implementation in background (does not block activation)
        (async () => {
            try {
                const { getFeatureFlagsGlobal } = require('./src/utils/featureFlagsBridge');
                const featureFlagsGlobal = getFeatureFlagsGlobal();
                const chunk = featureFlagsGlobal ? await featureFlagsGlobal.loadFeatureModule('loggerImpl') : null;
                if (chunk && typeof chunk.getOrCreateLogger === 'function') {
                    try {
                        const real = chunk.getOrCreateLogger();
                        const GLOBAL_LOGGER_KEY = '__explorerDatesLogger';
                        if (real) {
                            if (typeof global !== 'undefined') global[GLOBAL_LOGGER_KEY] = real;
                            else if (typeof globalThis !== 'undefined') globalThis[GLOBAL_LOGGER_KEY] = real;
                        }
                    } catch { /* ignore */ }
                }
            } catch { /* ignore */ }
        })();

        // Initialize and run settings migration
        const settingsMigrationManager = new SettingsMigrationManager();
        try {
            await settingsMigrationManager.migrateAllSettings(context);
        } catch (error) {
            logger.warn('Settings migration encountered issues:', error);
        }
        try {
            await settingsMigrationManager.autoOrganizeSettingsIfNeeded(context, {
                trigger: 'activation',
                silent: true
            });
        } catch (error) {
            logger.warn('Settings organization encountered issues:', error);
        }

        const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        await vscode.commands.executeCommand('setContext', 'explorerDates.gitFeaturesAvailable', !isWeb);

        const featureConfig = vscode.workspace.getConfiguration('explorerDates');
        // Use unified enableExportReporting setting (with fallback to legacy enableReporting)
        const reportingEnabled = featureConfig.get('enableExportReporting', 
            featureConfig.get('enableReporting', true));
        const apiEnabled = featureConfig.get('enableExtensionApi', true);
        const onboardingEnabled = featureConfig.get('enableOnboardingSystem', true);
        const analysisEnabled = featureConfig.get('enableAnalysisCommands', true);

        // Register file date decoration provider for overlay dates in Explorer
        // Try to load a runtime chunk that contains the heavy provider implementation
        try {
            const providerChunk = await chunkLoader.loadChunk('providerInit');
            if (providerChunk && typeof providerChunk.createFileDateDecorationProvider === 'function') {
                const factory = providerChunk.createFileDateDecorationProvider(context);
                if (factory && typeof factory.createFileDateDecorationProvider === 'function') {
                    fileDateProvider = factory.createFileDateDecorationProvider();
                }
            }
        } catch (e) {
            logger.warn('Failed to load fileDateProvider chunk, falling back to local provider', e?.message || e);
        }

        // Fallback to local synchronous provider implementation if chunk loading failed
        if (!fileDateProvider) {
            try {
                // Use a dynamic require (via eval) so the provider implementation is not
                // statically bundled into the main extension bundle. The provider has
                // its own runtime chunk (`providerInit`) and should be lazily loaded.
                const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
                // Avoid attempting to require source files in a web runtime — rely on web chunks instead.
                if (!isWebEnvironment && typeof dynamicRequire === 'function') {
                    const mod = dynamicRequire('./src/fileDateDecorationProvider');
                    const FileDateDecorationProvider = mod && (mod.FileDateDecorationProvider || mod.default || mod);
                    fileDateProvider = new FileDateDecorationProvider();
                } else if (!isWebEnvironment) {
                    // Environments where eval is unavailable (non-web): fall back to synchronous require
                    const { FileDateDecorationProvider } = require('./src/fileDateDecorationProvider');
                    fileDateProvider = new FileDateDecorationProvider();
                } else {
                    // Web runtime and no chunk available — leave fileDateProvider null to allow graceful degradation.
                    logger.warn('No FileDateDecorationProvider available for web runtime; some features may be disabled.');
                }
            } catch (e) {
                logger.error('Failed to create FileDateDecorationProvider', e);
                throw e;
            }
        }

        if (fileDateProvider) {
            const decorationDisposable = vscode.window.registerFileDecorationProvider(fileDateProvider);
            context.subscriptions.push(decorationDisposable);
            context.subscriptions.push(fileDateProvider); // For proper disposal
            context.subscriptions.push(logger); // Dispose logger on deactivation

            // Initialize advanced performance systems (best-effort)
            try { await fileDateProvider.initializeAdvancedSystems(context); } catch (err) { logger.debug('FileDateDecorationProvider.initializeAdvancedSystems failed', err); }

            // Check workspace size and prompt for performance mode if very large
            try { await fileDateProvider.checkWorkspaceSize(); } catch (err) { logger.debug('FileDateDecorationProvider.checkWorkspaceSize failed', err); }
        } else {
            // Graceful degradation for web runtimes where the provider chunk may be absent
            logger.warn('FileDateDecorationProvider unavailable — continuing without file decorations.');
        }
        
        // Initialize managers lazily to reduce startup time and bundle size
        let extensionApiManager = null;
        let exportReportingRegistered = false;
        
        // Helper functions for lazy loading
        
        const getExtensionApiManager = async () => {
            if (!apiEnabled) {
                throw new Error('Extension API is disabled via explorerDates.enableExtensionApi');
            }
            if (!extensionApiManager) {
                extensionApiManager = await ensureExtensionApiManager(context);
                if (extensionApiManager && context.subscriptions) {
                    context.subscriptions.push(extensionApiManager);
                }
            }
            return extensionApiManager;
        };
        
        const getExportReportingManager = async () => {
            if (!reportingEnabled) {
                throw new Error('Reporting is disabled via explorerDates.enableExportReporting');
            }
            if (!exportReportingRegistered) {
                const config = vscode.workspace.getConfiguration('explorerDates');
                const performanceMode = config.get('performanceMode', false);
                const lightweightMode = process.env.EXPLORER_DATES_LIGHTWEIGHT_MODE === '1';
                if (performanceMode || lightweightMode) {
                    logger.warn('Initializing Export Reporting Manager while performance/lightweight mode is active; activity tracking will remain suppressed.');
                }
            }
            const manager = await ensureExportReportingManager(context);
            if (manager && !exportReportingRegistered) {
                context.subscriptions.push(manager);
                exportReportingRegistered = true;
            }
            return manager;
        };
        
        // Expose public API for other extensions (lazy)
        let cachedApi = null;
        let apiPromise = null;
        
        const apiFactory = async () => {
            if (!apiPromise) {
                apiPromise = (async () => {
                    const manager = await getExtensionApiManager();
                    cachedApi = manager ? manager.getApi() : null;
                    return cachedApi;
                })();
            }
            return apiPromise;
        };
        
        if (apiEnabled) {
            // Maintain synchronous compatibility: export function, not call result
            context.exports = apiFactory;
            // Also expose async version for future use
            context.exportsAsync = apiFactory;
        } else {
            context.exports = undefined;
            context.exportsAsync = undefined;
            logger.info('Explorer Dates API exports disabled via explorerDates.enableExtensionApi');
        }

        // Show onboarding if needed without eagerly loading the heavy chunk for users who have already completed it.
        const showWelcomeOnStartup = featureConfig.get('showWelcomeOnStartup', true);
        if (onboardingEnabled && showWelcomeOnStartup) {
            // Defensive: guard onboarding chunk preload so a malformed chunk/constructor cannot fail activation.
            try {
                if (shouldPrimeOnboardingChunk(context)) {
                    const onboardingManager = await ensureOnboardingManager(context);
                    if (onboardingManager && await onboardingManager.shouldShowOnboarding()) {
                        // Delay to let extension fully activate and avoid interrupting user workflow
                        setTimeout(() => {
                            try {
                                onboardingManager.showWelcomeMessage();
                            } catch (err) {
                                logger.warn('Onboarding showWelcomeMessage() failed (non-fatal):', err);
                            }
                        }, 5000);
                    }
                } else {
                    logger.debug('Skipping onboarding preload – user already completed onboarding for this major version.');
                }
            } catch (err) {
                // Swallow errors from dynamic chunk load / malformed exports to avoid breaking activation
                logger.warn('Onboarding preload failed (non-fatal):', err);
            }
        }

        registerCoreCommands({ context, fileDateProvider, logger, l10n });

        // Lazy load analysis commands only when needed
        const registerAnalysisCommandsLazy = async () => {
            const analysisCommands = await dynamicImports.loadAnalysisCommands();
            if (!analysisCommands) {
                const loadFailure = typeof featureFlags.getFeatureLoadFailure === 'function'
                    ? featureFlags.getFeatureLoadFailure('analysis')
                    : null;
                if (loadFailure) {
                    throw loadFailure;
                }
                const missingChunks = Array.from(chunkLoader?._missingChunks || []);
                const chunkHint = missingChunks.includes('analysis')
                    ? 'Analysis chunk is missing. Rebuild with "npm run package-bundle" and reload.'
                    : 'Analysis bundle did not load. Rebuild the extension and reload.';
                vscode.window.showWarningMessage(`Analysis commands unavailable. ${chunkHint}`);
                return null;
            }
            // Handle both module export and direct function export
            const registerFn = analysisCommands.registerAnalysisCommands || analysisCommands;
            if (typeof registerFn !== 'function') {
                vscode.window.showWarningMessage('Analysis commands registration function not found.');
                return null;
            }
            return registerFn({
                context,
                fileDateProvider,
                logger,
                chunkLoader
            });
        };
        
        // Register analysis commands if enabled
        if (analysisEnabled) {
            try {
                await registerAnalysisCommandsLazy();
                logger.info('Analysis commands registered successfully');
            } catch (error) {
                logger.warn('Failed to register analysis commands:', error);
                vscode.window.showWarningMessage('Explorer Dates analysis commands failed to initialize. Check build artifacts for the analysis chunk and reload.');
            }
            await setAnalysisWarningShown(context, false);
        } else {
            try {
                const alreadyWarned = hasShownAnalysisWarning(context);
                // DEBUG: Log the analysis warning state to aid tests and investigate races
                getActiveLogger().debug('analysisWarningState', { alreadyWarned, map: context.globalState.get(ANALYSIS_WARNING_WORKSPACE_KEY, {}), warnedSet: Array.from(_warnedWorkspaces) });
                console.log('DEBUG analysisWarningState', { alreadyWarned, map: context.globalState.get(ANALYSIS_WARNING_WORKSPACE_KEY, {}), warnedSet: Array.from(_warnedWorkspaces) });
                if (!alreadyWarned) {
                    // In test mode, pre-mark the workspace as warned synchronously to avoid races
                    if (process.env.EXPLORER_DATES_TEST_MODE === '1') {
                        try {
                            await setAnalysisWarningShown(context, true);
                        } catch (err) {
                            logger.debug('Failed to pre-mark analysis warning in test mode', err?.message || err);
                        }
                    }

                    vscode.window.showInformationMessage(
                        'Explorer Dates analysis commands are disabled. Shortcuts like Ctrl+Shift+M/H/A will not work until you enable explorerDates.enableAnalysisCommands.',
                        'Enable Now',
                        'Dismiss'
                    ).then(async (selection) => {
                        const effectiveSelection = process.env.EXPLORER_DATES_TEST_MODE === '1'
                            ? 'Dismiss'
                            : selection;
                        if (effectiveSelection === l10n.getString('analysisEnableNow')) {
                            try {
                                const inspectGlobal = featureConfig.inspect('enableAnalysisCommands');
                                const folders = vscode.workspace.workspaceFolders || [];

                                // Update every folder that explicitly disables the feature
                                let anyFolderFailures = false;
                                for (const folder of folders) {
                                    const folderConfig = vscode.workspace.getConfiguration('explorerDates', folder.uri);
                                    const folderInspect = folderConfig.inspect('enableAnalysisCommands');
                                    if (folderInspect?.workspaceFolderValue === false) {
                                        try {
                                            await folderConfig.update('enableAnalysisCommands', true, vscode.ConfigurationTarget.WorkspaceFolder);
                                        } catch (folderUpdateError) {
                                            anyFolderFailures = true;
                                            logger.warn('Failed to auto-enable analysis commands for workspace folder', { folder: folder.uri?.toString(), error: folderUpdateError?.message });
                                        }
                                    }
                                }

                                // Update workspace-level override if present
                                if (inspectGlobal?.workspaceValue === false) {
                                    try {
                                        await featureConfig.update('enableAnalysisCommands', true, vscode.ConfigurationTarget.Workspace);
                                    } catch (workspaceUpdateError) {
                                        anyFolderFailures = true;
                                        logger.warn('Failed to auto-enable analysis commands for workspace scope', workspaceUpdateError);
                                    }
                                }

                                // Update user-level override if present
                                if (inspectGlobal?.globalValue === false) {
                                    try {
                                        await featureConfig.update('enableAnalysisCommands', true, vscode.ConfigurationTarget.Global);
                                    } catch (globalUpdateError) {
                                        anyFolderFailures = true;
                                        logger.warn('Failed to auto-enable analysis commands for user scope', globalUpdateError);
                                    }
                                }

                                if (anyFolderFailures) {
                                    await setAnalysisWarningShown(context, false); // re-warn next activation
                                    vscode.window.showWarningMessage(l10n.getString('analysisEnablePartially'));
                                } else {
                                    await setAnalysisWarningShown(context, false);
                                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                                }
                            } catch (updateError) {
                                await setAnalysisWarningShown(context, false); // allow future warnings if enable failed
                                vscode.window.showWarningMessage(l10n.getString('analysisEnableFailed'));
                                logger.warn('Failed to auto-enable analysis commands', updateError);
                            }
                        } else {
                            // Dismissed or closed - avoid re-warning on next activation
                            await setAnalysisWarningShown(context, true);
                        }
                    });
                }
            } catch (warningError) {
                logger.debug('Unable to show analysis disabled warning', warningError);
            }
        }

        registerOnboardingCommands({
            context,
            logger,
            getOnboardingManager: () => ensureOnboardingManager(context)
        });

        // Register migration commands
        const migrationSubscriptions = await registerMigrationCommands({
            context,
            logger,
            getSettingsMigrationManager: () => Promise.resolve(settingsMigrationManager)
        });
        context.subscriptions.push(...migrationSubscriptions);

        // Register workspace templates commands with lazy loading
        const openTemplateManager = vscode.commands.registerCommand('explorerDates.openTemplateManager', async () => {
            try {
                const currentFeatureConfig = vscode.workspace.getConfiguration('explorerDates');
                console.log('DEBUG: currentFeatureConfig type:', typeof currentFeatureConfig);
                console.log('DEBUG: currentFeatureConfig keys:', Object.keys(currentFeatureConfig));
                const workspaceTemplatesCurrentlyEnabled = currentFeatureConfig.get('enableWorkspaceTemplates', true);
                console.log('DEBUG: workspaceTemplatesCurrentlyEnabled =', workspaceTemplatesCurrentlyEnabled);
                console.log('DEBUG: calling get with key enableWorkspaceTemplates, default true');
                if (!workspaceTemplatesCurrentlyEnabled) {
                    vscode.window.showInformationMessage(l10n.getString('workspaceTemplatesDisabled'));
                    throw new Error('Workspace templates feature disabled via settings.');
                }
                
                // Verify chunk availability before proceeding
                const workspaceTemplatesChunk = await featureFlags.workspaceTemplates();
                if (!workspaceTemplatesChunk) {
                    raiseChunkUnavailable('Workspace templates', 'workspaceTemplates');
                }
                
                const templatesManager = await ensureWorkspaceTemplatesManager(context);
                if (!templatesManager) {
                    raiseChunkUnavailable('Workspace templates', 'workspaceTemplates');
                }
                await templatesManager.showTemplateManager();
                logger.info('Template manager opened');
            } catch (error) {
                logger.error('Failed to open template manager', error);
                vscode.window.showErrorMessage(l10n.getString('failedToOpenTemplateManager', error.message));
                throw error;
            }
        });
        context.subscriptions.push(openTemplateManager);

        const saveTemplate = vscode.commands.registerCommand('explorerDates.saveTemplate', async () => {
            try {
                const currentFeatureConfig = vscode.workspace.getConfiguration('explorerDates');
                const workspaceTemplatesCurrentlyEnabled = currentFeatureConfig.get('enableWorkspaceTemplates', true);
                if (!workspaceTemplatesCurrentlyEnabled) {
                    vscode.window.showInformationMessage(l10n.getString('workspaceTemplatesDisabledSave'));
                    throw new Error('Workspace templates feature disabled via settings.');
                }
                const workspaceTemplatesChunk = await featureFlags.workspaceTemplates();
                if (!workspaceTemplatesChunk) {
                    raiseChunkUnavailable('Workspace templates', 'workspaceTemplates');
                }
                const name = await vscode.window.showInputBox({ 
                    prompt: 'Enter template name',
                    placeHolder: 'e.g., My Project Setup'
                });
                if (name) {
                    const description = await vscode.window.showInputBox({ 
                        prompt: l10n.getString('enterTemplateDescription'),
                        placeHolder: l10n.getString('enterTemplateDescription')
                    }) || ''; 
                    const templatesManager = await ensureWorkspaceTemplatesManager(context);
                    if (!templatesManager) {
                        raiseChunkUnavailable('Workspace templates', 'workspaceTemplates');
                    }
                    await templatesManager.saveCurrentConfiguration(name, description);
                }
                logger.info('Template saved');
            } catch (error) {
                logger.error('Failed to save template', error);
                vscode.window.showErrorMessage(l10n.getString('failedToSaveTemplate', error.message));
                throw error;
            }
        });
        context.subscriptions.push(saveTemplate);

        // Register export/reporting commands
        const generateReport = vscode.commands.registerCommand('explorerDates.generateReport', async () => {
            try {
                if (!reportingEnabled) {
                    vscode.window.showInformationMessage(l10n.getString('reportingDisabled'));
                    throw new Error('Reporting features disabled via settings.');
                }
                
                // Verify chunk availability before proceeding
                const exportReportingChunk = await featureFlags.exportReporting();
                if (!exportReportingChunk) {
                    raiseChunkUnavailable('Export reporting', 'exportReporting');
                }
                
                const reportingManager = await getExportReportingManager();
                if (!reportingManager) {
                    raiseChunkUnavailable('Export reporting', 'exportReporting');
                }
                await reportingManager.showReportDialog();
                logger.info('Report generation started');
            } catch (error) {
                logger.error('Failed to generate report', error);
                vscode.window.showErrorMessage(l10n.getString('failedToGenerateReport', error.message));
                throw error;
            }
        });
        context.subscriptions.push(generateReport);

        // Register API information command
        const showApiInfo = vscode.commands.registerCommand('explorerDates.showApiInfo', async () => {
            try {
                if (!apiEnabled) {
                    vscode.window.showInformationMessage(l10n.getString('apiDisabled'));
                    throw new Error('Explorer Dates API disabled via settings.');
                }
                
                // Verify chunk availability before proceeding
                const extensionApiChunk = await featureFlags.extensionApi();
                if (!extensionApiChunk) {
                    raiseChunkUnavailable('Extension API', 'extensionApi');
                }

                const panel = vscode.window.createWebviewPanel(
                    'apiInfo',
                    'Explorer Dates API Information',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                
                // Lazy load the diagnostics chunk for API info HTML generation
                const diagnosticsChunk = await chunkLoader.loadChunk('diagnostics');
                if (!diagnosticsChunk) {
                    throw new Error('Diagnostics chunk failed to load');
                }
                diagnosticsChunk.ensureInitialized(context);
                // Await the API factory to get resolved data, not a promise
                const apiData = await apiFactory();
                if (!apiData) {
                    throw new Error('API factory returned null - extension API may be disabled');
                }
                panel.webview.html = await diagnosticsChunk.getApiInformationHtml(apiData);
                logger.info('API information panel opened');
            } catch (error) {
                logger.error('Failed to show API information', error);
                vscode.window.showErrorMessage(l10n.getString('failedToShowApiInformation', error.message));
                throw error;
            }
        });
        context.subscriptions.push(showApiInfo);



        // Initialize status bar integration (disabled in performance mode)
        let statusBarItem;
        const config = vscode.workspace.getConfiguration('explorerDates');
        const performanceMode = config.get('performanceMode', false);
        const showStatusBar = config.get('showStatusBar', false);
        if (showStatusBar && !performanceMode) {
            statusBarItem = initializeStatusBar(context);
        }
        
        // Watch for status bar setting changes
        const statusBarConfigWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('explorerDates.showStatusBar') || e.affectsConfiguration('explorerDates.performanceMode')) {
                const newConfig = vscode.workspace.getConfiguration('explorerDates');
                const newValue = newConfig.get('showStatusBar', false);
                const newPerformanceMode = newConfig.get('performanceMode', false);
                const shouldShowStatusBar = newValue && !newPerformanceMode;
                
                if (shouldShowStatusBar && !statusBarItem) {
                    statusBarItem = initializeStatusBar(context);
                } else if (!shouldShowStatusBar && statusBarItem) {
                    statusBarItem.dispose();
                    statusBarItem = null;
                }
            }
        });
        context.subscriptions.push(statusBarConfigWatcher);
        
        logger.info('Explorer Dates: Date decorations ready');

        // Initialize runtime chunk management system
        const loadRuntimeCommands = async () => {
            const runtimeChunk = await featureFlags.loadFeatureModule('runtimeManagement');
            if (runtimeChunk?.registerRuntimeCommands) {
                return runtimeChunk.registerRuntimeCommands;
            }
            // Runtime commands are chunked; skip loading when the chunk is unavailable to keep the core bundle slim
            logger.warn('Runtime chunk missing; runtime commands not initialized');
            return null;
        };

        try {
            const registerRuntimeCommands = await loadRuntimeCommands();
            if (registerRuntimeCommands) {
                const { runtimeManager, teamPersistenceManager } = registerRuntimeCommands(context);

                if (activeRuntimeManager?.dispose) {
                    activeRuntimeManager.dispose();
                }
                if (activeTeamPersistenceManager?.dispose) {
                    activeTeamPersistenceManager.dispose();
                }
                activeRuntimeManager = runtimeManager;
                activeTeamPersistenceManager = teamPersistenceManager;

                // Schedule auto-suggestion check after activation (3-second delay)
                const shouldScheduleAutoSuggestion = process.env.EXPLORER_DATES_TEST_MODE !== '1';
                if (shouldScheduleAutoSuggestion) {
                    runtimeAutoSuggestionTimer = setTimeout(async () => {
                        try {
                            await runtimeManager.checkAutoSuggestion();
                            await teamPersistenceManager.validateTeamConfiguration();
                        } catch (error) {
                            logger.debug('Runtime system auto-suggestion failed:', error);
                        }
                    }, AUTO_SUGGESTION_DELAY_MS);
                } else {
                    logger.debug('Skipping runtime auto-suggestion timer in test mode');
                }

                logger.info('Runtime chunk management system initialized');
            } else {
                logger.warn('Runtime chunk management system unavailable');
            }
        } catch (error) {
            logger.error('Failed to initialize runtime chunk management:', error);
        }
        
        // Return API factory if enabled so VS Code exposes it to dependent extensions
        if (apiEnabled) {
            return apiFactory;
        }
        
    } catch (error) {
        const errorMessage = `${l10n ? l10n.getString('activationError') : 'Explorer Dates failed to activate'}: ${error.message}`;
        getActiveLogger().error('Extension activation failed', error);
        vscode.window.showErrorMessage(errorMessage);
        throw error;
    }
}

/**
 * Extension deactivation function
 */
async function deactivate() {
    try {
        getActiveLogger().info('Explorer Dates extension is being deactivated');

        if (runtimeAutoSuggestionTimer) {
            clearTimeout(runtimeAutoSuggestionTimer);
            runtimeAutoSuggestionTimer = null;
        }

        if (activeRuntimeManager?.dispose) {
            activeRuntimeManager.dispose();
            activeRuntimeManager = null;
        }

        if (activeTeamPersistenceManager?.dispose) {
            activeTeamPersistenceManager.dispose();
            activeTeamPersistenceManager = null;
        }
        
        // Clean up resources
        if (fileDateProvider && typeof fileDateProvider.dispose === 'function') {
            await fileDateProvider.dispose();
            // Clear module-scoped reference so subsequent activate() creates a fresh provider
            fileDateProvider = null;
        }

        // In test mode, wait briefly for any in-flight filesystem requests (fs.promises) to drain so
        // spawned test processes exit deterministically. This avoids flaky hangs caused by short-
        // lived libuv threadpool requests that may still be closing file handles.
        if (process.env.EXPLORER_DATES_TEST_MODE === '1' && typeof process._getActiveRequests === 'function') {
            const start = Date.now();
            while ((process._getActiveRequests() || []).length > 0 && Date.now() - start < 500) {
                // yield to the event loop and allow pending FS requests to complete
                // (short sleep keeps this deterministic and fast in CI)
                await new Promise((resolve) => setTimeout(resolve, 5));
            }
        }
        
        getActiveLogger().info('Explorer Dates extension deactivated successfully');
    } catch (error) {
        const errorMessage = 'Explorer Dates: Error during deactivation';
        getActiveLogger().error(errorMessage, error);
    }
}

module.exports = {
    activate,
    deactivate
};
