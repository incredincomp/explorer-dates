const { getFeatureFlagsGlobal } = require('../utils/featureFlagsBridge');

function ensureProgressiveJobSet(provider) {
    let jobs = provider['_progressiveLoadingJobs'];
    if (!(jobs instanceof Set)) {
        jobs = new Set(jobs && typeof jobs[Symbol.iterator] === 'function' ? jobs : []);
        provider['_progressiveLoadingJobs'] = jobs;
    }
    return jobs;
}

async function loadBatchProcessorIfNeeded(provider) {
    if (provider['_performanceMode']) return null;
    const featureFlags = getFeatureFlagsGlobal();
    if (!featureFlags || typeof featureFlags.batchProcessor !== 'function') {
        provider['_logger']?.debug?.('BatchProcessor feature flags not available');
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
    if (progressiveJobs.size === 0) return;

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
    try {
        const vscode = (() => {
            try { return require('vscode'); } catch { return null; }
        })();
        const config = vscode ? vscode.workspace.getConfiguration('explorerDates') : { get: () => true };
        const enabled = config.get('progressiveLoading', true);

        if (!enabled) {
            provider['_logger']?.info?.('Progressive loading disabled via explorerDates.progressiveLoading - BatchProcessor will not be loaded');
            provider['_progressiveLoadingEnabled'] = false;
            if (provider['_batchProcessor']) {
                try { provider['_batchProcessor'].dispose(); } catch (e) { provider['_logger']?.debug?.('BatchProcessor dispose failed', e); }
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

        const workspaceFolders = (typeof vscode !== 'undefined' && vscode && vscode.workspace) ? vscode.workspace.workspaceFolders : provider['_workspaceFolders'];
        if (!workspaceFolders || workspaceFolders.length === 0) return;

        cancelProgressiveWarmupJobs(provider);
        const progressiveJobs = ensureProgressiveJobSet(provider);

        workspaceFolders.forEach((folder) => {
            const jobId = provider['_batchProcessor'].processDirectoryProgressively(
                folder.uri,
                async (uri) => {
                    try { await provider.provideFileDecoration(uri); } catch (error) { provider['_logger']?.debug?.('Progressive warmup processor failed', error); }
                },
                { background: true, priority: 'low', maxFiles: 500 }
            );
            if (jobId) progressiveJobs.add(jobId);
        });

        provider['_logger']?.info?.(`Progressive loading queued for ${workspaceFolders.length} workspace folder(s).`);
    } catch (err) {
        provider['_logger']?.debug?.('applyProgressiveLoadingSetting failed', err);
        return;
    }
}

module.exports = {
    loadBatchProcessorIfNeeded,
    applyProgressiveLoadingSetting,
    cancelProgressiveWarmupJobs
};
