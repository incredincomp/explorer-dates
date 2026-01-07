const vscode = require('vscode');
const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');
const featureFlags = getFeatureFlagsGlobal();

if (!featureFlags) {
    throw new Error('Explorer Dates: feature flags bridge unavailable for decorationsAdvanced chunk');
}

function ensureProgressiveJobSet(provider) {
    let jobs = provider['_progressiveLoadingJobs'];
    if (!(jobs instanceof Set)) {
        jobs = new Set(jobs && typeof jobs[Symbol.iterator] === 'function' ? jobs : []);
        provider['_progressiveLoadingJobs'] = jobs;
    }
    return jobs;
}

async function loadBatchProcessorIfNeeded(provider) {
    if (provider['_performanceMode']) {
        return null;
    }

    if (!provider['_batchProcessorModule']) {
        try {
            provider['_batchProcessorModule'] = await featureFlags.batchProcessor();
            if (!provider['_batchProcessorModule']) {
                provider['_logger']?.debug?.('BatchProcessor chunk not available');
                return null;
            }
            provider['_logger']?.debug?.('BatchProcessor module loaded dynamically');
        } catch (error) {
            provider['_logger']?.error?.('Failed to load BatchProcessor module:', error);
            return null;
        }
    }

    if (!provider['_batchProcessor'] && provider['_batchProcessorModule']) {
        const ctor = provider['_batchProcessorModule'].BatchProcessor || provider['_batchProcessorModule'].default?.BatchProcessor;
        if (!ctor) {
            provider['_logger']?.warn?.('BatchProcessor chunk missing BatchProcessor export');
            return null;
        }
        provider['_batchProcessor'] = new ctor();
        provider['_logger']?.debug?.('BatchProcessor instance created');
    }

    return provider['_batchProcessor'];
}

function cancelProgressiveWarmupJobs(provider) {
    const progressiveJobs = ensureProgressiveJobSet(provider);
    if (progressiveJobs.size === 0) {
        return;
    }

    if (provider['_batchProcessor']?.cancelBatch) {
        for (const jobId of progressiveJobs) {
            provider['_batchProcessor'].cancelBatch(jobId);
        }
    } else if (provider['_batchProcessor']) {
        provider['_logger']?.debug?.('BatchProcessor missing cancelBatch, skipping job cancellation');
    }
    progressiveJobs.clear();
}

async function applyProgressiveLoadingSetting(provider) {
    const config = vscode.workspace.getConfiguration('explorerDates');
    const enabled = config.get('progressiveLoading', true);

    if (!enabled) {
        provider['_logger']?.info?.('Progressive loading disabled via explorerDates.progressiveLoading - BatchProcessor will not be loaded');
        provider['_progressiveLoadingEnabled'] = false;
        if (provider['_batchProcessor']) {
            provider['_batchProcessor'].dispose();
            provider['_batchProcessor'] = null;
            provider['_logger']?.debug?.('BatchProcessor disposed due to disabled progressive loading');
        }
        cancelProgressiveWarmupJobs(provider);
        return;
    }

    if (provider['_performanceMode']) {
        provider['_logger']?.info?.('Progressive loading disabled due to performance mode');
        cancelProgressiveWarmupJobs(provider);
        provider['_progressiveLoadingEnabled'] = false;
        return;
    }

    const batchProcessor = await loadBatchProcessorIfNeeded(provider);
    if (!batchProcessor) {
        provider['_logger']?.info?.('BatchProcessor not available - progressive loading disabled');
        provider['_progressiveLoadingEnabled'] = false;
        return;
    }

    provider['_progressiveLoadingEnabled'] = true;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }

    cancelProgressiveWarmupJobs(provider);
    const progressiveJobs = ensureProgressiveJobSet(provider);

    workspaceFolders.forEach((folder) => {
        const jobId = provider['_batchProcessor'].processDirectoryProgressively(
            folder.uri,
            async (uri) => {
                try {
                    await provider.provideFileDecoration(uri);
                } catch (error) {
                    provider['_logger']?.debug?.('Progressive warmup processor failed', error);
                }
            },
            { background: true, priority: 'low', maxFiles: 500 }
        );
        if (jobId) {
            progressiveJobs.add(jobId);
        }
    });

    provider['_logger']?.info?.(`Progressive loading queued for ${workspaceFolders.length} workspace folder(s).`);
}

async function initializeAdvancedSystems(provider, context) {
    try {
        provider['_extensionContext'] = context;
        if (provider['_isWeb']) {
            await provider['_maybeWarnAboutGitLimitations']?.();
        }

        if (provider['_performanceMode']) {
            provider['_logger']?.info?.('Performance mode enabled - skipping advanced cache, batch processor, and progressive loading');
            return;
        }

        const advancedCacheModule = await featureFlags.advancedCache();
        if (advancedCacheModule) {
            let AdvancedCache = null;
            if (typeof advancedCacheModule === 'function') {
                if (advancedCacheModule.name === 'createAdvancedCache') {
                    provider['_advancedCache'] = advancedCacheModule(context);
                    await provider['_advancedCache'].initialize();
                    provider['_logger']?.info?.('Advanced cache initialized via factory function');
                } else {
                    try {
                        provider['_advancedCache'] = new advancedCacheModule(context);
                        await provider['_advancedCache'].initialize();
                        provider['_logger']?.info?.('Advanced cache initialized via direct constructor');
                    } catch (error) {
                        provider['_logger']?.warn?.('Failed to instantiate AdvancedCache via direct constructor, disabling advanced cache:', error.message);
                        provider['_advancedCache'] = null;
                    }
                }
            } else if (advancedCacheModule.AdvancedCache) {
                AdvancedCache = advancedCacheModule.AdvancedCache;
                provider['_advancedCache'] = new AdvancedCache(context);
                await provider['_advancedCache'].initialize();
                provider['_logger']?.info?.('Advanced cache initialized via module property');
            } else if (advancedCacheModule.createAdvancedCache) {
                provider['_advancedCache'] = advancedCacheModule.createAdvancedCache(context);
                await provider['_advancedCache'].initialize();
                provider['_logger']?.info?.('Advanced cache initialized via module factory');
            } else {
                provider['_logger']?.warn?.('AdvancedCache module format not recognized, disabling advanced cache');
                provider['_advancedCache'] = null;
            }
        } else {
            provider['_logger']?.info?.('Advanced cache disabled by feature flag');
            provider['_advancedCache'] = null;
        }

        await applyProgressiveLoadingSetting(provider);

        if (provider['_batchProcessor']) {
            provider['_batchProcessor'].initialize();
            provider['_logger']?.info?.('Batch processor initialized');
        }

        const workspaceIntelligenceModule = await featureFlags.workspaceIntelligence();
        if (workspaceIntelligenceModule) {
            try {
                let WorkspaceIntelligenceManager = workspaceIntelligenceModule.WorkspaceIntelligenceManager ||
                    workspaceIntelligenceModule.default?.WorkspaceIntelligenceManager ||
                    workspaceIntelligenceModule;
                if (typeof WorkspaceIntelligenceManager === 'function') {
                    provider['_workspaceIntelligence'] = new WorkspaceIntelligenceManager(provider['_fileSystem']);
                    await provider['_workspaceIntelligence'].initialize({
                        batchProcessor: provider['_batchProcessor'],
                        extensionContext: context,
                        enableProgressiveAnalysis: provider['_shouldEnableProgressiveAnalysis']?.()
                    });

                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders?.length) {
                        await provider['_workspaceIntelligence'].analyzeWorkspace(workspaceFolders, {
                            maxFiles: provider['_getIndexerMaxFiles']()
                        });
                    }

                    await provider['_workspaceIntelligence'].cleanupWorkspaceProfiles();

                    provider['_logger']?.info?.('Workspace intelligence initialized');
                } else {
                    provider['_logger']?.warn?.('WorkspaceIntelligenceManager not found in chunk, disabling workspace intelligence');
                    provider['_workspaceIntelligence'] = null;
                }
            } catch (error) {
                provider['_logger']?.warn?.('Failed to initialize workspace intelligence:', error.message);
                provider['_workspaceIntelligence'] = null;
            }
        } else {
            provider['_logger']?.info?.('Workspace intelligence disabled by feature flag');
            provider['_workspaceIntelligence'] = null;
        }

        const config = vscode.workspace.getConfiguration('explorerDates');
        if (config.get('autoThemeAdaptation', true) && provider['_themeIntegration']?.autoConfigureForTheme) {
            await provider['_themeIntegration'].autoConfigureForTheme();
            provider['_logger']?.info?.('Theme integration configured');
        }

        if (provider['_accessibility']?.shouldEnhanceAccessibility?.()) {
            await provider['_accessibility'].applyAccessibilityRecommendations?.();
            provider['_logger']?.info?.('Accessibility recommendations applied');
        }

        if (provider['_allocationTelemetryEnabled']) {
            scheduleTelemetryReport(provider);
            provider['_logger']?.info?.(
                'Allocation telemetry enabled - reports every',
                provider['_telemetryReportInterval'],
                'ms'
            );
        }

        provider['_logger']?.info?.('Advanced systems initialized successfully');
    } catch (error) {
        provider['_logger']?.error?.('Failed to initialize advanced systems', error);
    }
}

function shouldUseFallbackWatcher(provider) {
    if (provider['_enableWatcherFallbacks'] === false) {
        return false;
    }
    if (provider['_enableWatcherFallbacks'] === 'auto' || provider['_enableWatcherFallbacks'] === true) {
        return isPlatformFallbackRequired();
    }
    return false;
}

function isPlatformFallbackRequired() {
    const platform = process.platform;
    const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV;
    const isRemote = vscode.env.remoteName;
    const isDocker = process.env.DOCKER_CONTAINER;
    return isWSL || isRemote || isDocker || platform === 'android';
}

async function createFallbackWatcher(provider, pattern, label) {
    try {
        if (!provider['_smartWatcherFallbackManager']) {
            const SmartWatcherFallbackModule = await featureFlags.loadFeatureModule('smartWatcherFallback');
            if (SmartWatcherFallbackModule) {
                const { SmartWatcherFallbackManager } = SmartWatcherFallbackModule;
                provider['_smartWatcherFallbackManager'] = new SmartWatcherFallbackManager({ logger: provider['_logger'] });
                await provider['_smartWatcherFallbackManager'].initialize();
            }
        }

        if (provider['_smartWatcherFallbackManager']) {
            const fallback = await provider['_smartWatcherFallbackManager'].getFallback();
            const watcher = await fallback.createWatcherWithFallback(pattern);
            provider['_logger']?.debug?.(`Fallback watcher created for ${label}`);
            return watcher;
        }
    } catch (error) {
        provider['_logger']?.warn?.(`Fallback watcher creation failed for ${label}:`, error);
    }
    return null;
}

async function createWatcherWithFallback(provider, pattern, label = 'unknown') {
    try {
        const nativeWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        provider['_logger']?.debug?.(`Native watcher created for ${label}`);
        return nativeWatcher;
    } catch (nativeError) {
        provider['_logger']?.debug?.(`Native watcher failed for ${label}:`, nativeError);
        if (!shouldUseFallbackWatcher(provider)) {
            throw nativeError;
        }
        return createFallbackWatcher(provider, pattern, label);
    }
}

function scheduleTelemetryReport(provider) {
    if (!provider['_allocationTelemetryEnabled'] || provider['_telemetryReportTimer']) {
        return;
    }
    provider['_telemetryReportTimer'] = setTimeout(() => {
        provider['_telemetryReportTimer'] = null;
        reportAllocationTelemetry(provider);
        scheduleTelemetryReport(provider);
    }, provider['_telemetryReportInterval']);
}

function reportAllocationTelemetry(provider) {
    const telemetry = provider.getMetrics().allocationTelemetry;
    const totalAllocations = telemetry.decorationPool.allocations +
        telemetry.badgeFlyweight.allocations +
        telemetry.readableFlyweight.allocations;
    const totalReuses = telemetry.decorationPool.reuses +
        telemetry.badgeFlyweight.reuses +
        telemetry.readableFlyweight.reuses;

    if (totalAllocations > 0 || totalReuses > 0) {
        provider['_logger']?.info?.('🧮 Allocation telemetry report', {
            timestamp: new Date().toISOString(),
            pool: {
                allocations: telemetry.decorationPool.allocations,
                reuses: telemetry.decorationPool.reuses,
                reuseRate: telemetry.decorationPool.reusePercent + '%'
            },
            badgeFlyweight: {
                allocations: telemetry.badgeFlyweight.allocations,
                reuses: telemetry.badgeFlyweight.reuses,
                reuseRate: telemetry.badgeFlyweight.reusePercent + '%'
            },
            readableFlyweight: {
                allocations: telemetry.readableFlyweight.allocations,
                reuses: telemetry.readableFlyweight.reuses,
                reuseRate: telemetry.readableFlyweight.reusePercent + '%'
            },
            summary: {
                totalAllocations,
                totalReuses,
                overallReuseRate: totalAllocations + totalReuses > 0
                    ? ((totalReuses / (totalAllocations + totalReuses)) * 100).toFixed(1) + '%'
                    : '0%'
            },
            decorationsProcessed: provider['_metrics'].totalDecorations,
            cacheHitRate: provider.getMetrics().cacheHitRate
        });
    }
}

module.exports = {
    applyProgressiveLoadingSetting,
    cancelProgressiveWarmupJobs,
    createFallbackWatcher,
    createWatcherWithFallback,
    initializeAdvancedSystems,
    loadBatchProcessorIfNeeded,
    reportAllocationTelemetry,
    scheduleTelemetryReport
};
