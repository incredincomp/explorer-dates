try { require('vscode'); } catch { }
const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
let diagLog = null;
let isWebDiagnosticsEnabled = () => false;
try {
    const webDiag = require('../utils/webDiagnostics');
    if (webDiag) {
        diagLog = webDiag.diagLog;
        isWebDiagnosticsEnabled = webDiag.isWebDiagnosticsEnabled || (() => false);
    }
} catch { /* ignore */ }

function isWebRuntime() {
    try {
        const { isWebEnvironment } = require('../utils/env');
        return isWebEnvironment();
    } catch {
        return env.VSCODE_WEB === 'true';
    }
}

function getWebChunkRegistry() {
    try {
        const { WEB_CHUNK_GLOBAL_KEY, LEGACY_WEB_CHUNK_GLOBAL_KEY } = require('../constants');
        if (typeof globalThis !== 'undefined') {
            return globalThis[WEB_CHUNK_GLOBAL_KEY] || globalThis[LEGACY_WEB_CHUNK_GLOBAL_KEY] || null;
        }
    } catch { /* ignore */ }
    if (typeof globalThis !== 'undefined') {
        return globalThis.explorerDatesChunks || globalThis.__explorerDatesChunks || null;
    }
    return null;
}

function resolveProviderModuleFromWebRegistry() {
    const registry = getWebChunkRegistry();
    if (!registry) return null;
    const candidates = [
        registry.fileDateProviderImplExport,
        registry.fileDateProviderImpl,
        registry['fileDateProviderImplExport'],
        registry['fileDateProviderImpl'],
        registry['file-date-provider-impl-export'],
        registry['file-date-provider-impl']
    ].filter(Boolean);
    return candidates.length > 0 ? candidates[0] : null;
}

function normalizeModuleExports(mod) {
    if (!mod) return null;
    const direct = mod && typeof mod === 'object' ? mod : { default: mod };
    const def = (direct && typeof direct === 'object' && direct.default) ? direct.default : null;
    if (def && typeof def === 'object') {
        return { ...direct, ...def };
    }
    return direct;
}

async function hydrateProviderOptionalSystems(provider) {
    // Defensive: don't throw; just attempt to hydrate optional heavy systems
    try {
        // Hydrate localization
        try {
            const mod = await import('./localization-core.js');
            const real = mod.getLocalization();
            provider._l10n.getString = (...args) => real.getString(...args);
            provider._l10n.formatDate = (...args) => real.formatDate(...args);
            provider._l10n.getCurrentLocale = () => real.getCurrentLocale();
            const originalDispose = provider._l10n.dispose;
            provider._l10n.dispose = () => { try { real.dispose(); } catch {} ; originalDispose(); };
        } catch (e) {
            provider._logger?.debug('provider-init: localization hydrate failed', e);
        }

        // Preload decoration logic (non-blocking)
        try {
            const mod = await import('./decoration-logic-chunk.js');
            if (mod && typeof mod.createDecorationLogic === 'function') {
                provider._decorationLogic = mod.createDecorationLogic(provider);
            }
        } catch (e) {
            provider._logger?.debug('provider-init: preload decoration logic failed', e);
        }

        // Preload decoration provider helpers (non-blocking)
        try {
            const mod = await import('./decoration-provide-chunk.js');
            const helpers = mod && (typeof mod.createDecorationProviderHelpers === 'function' ? mod.createDecorationProviderHelpers(provider) : mod);
            provider._decorationProviderHelpers = helpers;
        } catch (e) {
            provider._logger?.debug('provider-init: preload decoration provider helpers failed', e);
        }

        // Initialize advanced systems via existing chunk loader if available
        try {
            const adv = await provider._getDecorationsAdvancedChunk();
            if (adv && typeof adv.initializeAdvancedSystems === 'function') {
                await adv.initializeAdvancedSystems(provider);
            }
        } catch (e) {
            provider._logger?.debug('provider-init: initializeAdvancedSystems failed', e);
        }

        // Kick off telemetry scheduling (the advanced chunk may have scheduled this already)
        try {
            const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
            if (typeof dynamicRequire === 'function') {
                const t = dynamicRequire('./decoration-telemetry-chunk');
                if (t && typeof t.scheduleTelemetryReport === 'function' && provider._allocationTelemetryEnabled) {
                    t.scheduleTelemetryReport(provider);
                }
            }
        } catch (e) {
            provider._logger?.debug('provider-init: scheduling telemetry failed', e);
        }

    } catch (error) {
        try { provider._logger?.debug('provider-init: hydration failed', error); } catch {};
    }

}

// Expose a factory so other chunks (or the extension) can create a provider
function createFileDateDecorationProvider(context) {
    try {
        // Prefer chunked provider impl in production builds
        let ProviderClass = null;
        const webRuntime = isWebRuntime();
        if (webRuntime) {
            const registry = getWebChunkRegistry();
            const moduleCandidates = [
                registry?.fileDateProviderImplExport,
                registry?.fileDateProviderImpl,
                registry?.['fileDateProviderImplExport'],
                registry?.['fileDateProviderImpl'],
                registry?.['file-date-provider-impl-export'],
                registry?.['file-date-provider-impl']
            ].filter(Boolean);
            const webModule = moduleCandidates[0] || resolveProviderModuleFromWebRegistry();
            if (!registry && isWebDiagnosticsEnabled()) {
                diagLog?.('warn', 'Provider registry missing in web runtime');
            } else if (!webModule && isWebDiagnosticsEnabled()) {
                diagLog?.('warn', 'Provider module missing from web registry', {
                    hasRegistry: !!registry,
                    availableKeys: Object.keys(registry || {}),
                    candidateCount: moduleCandidates.length
                });
            }
            let resolved = null;
            for (const candidate of moduleCandidates) {
                const normalized = normalizeModuleExports(candidate);
                const cls = normalized && (normalized.FileDateDecorationProvider || normalized.FileDateDecorationProviderImpl || normalized.default);
                if (cls) {
                    resolved = cls;
                    break;
                }
                if (isWebDiagnosticsEnabled()) {
                    diagLog?.('warn', 'Provider exports missing expected class', {
                        availableExportKeys: Object.keys(normalized || {})
                    });
                }
            }
            ProviderClass = resolved;
            if (!ProviderClass && isWebDiagnosticsEnabled() && moduleCandidates.length > 0) {
                diagLog?.('warn', 'Provider class unresolved from registry entries', {
                    candidateCount: moduleCandidates.length,
                    availableRegistryKeys: Object.keys(registry || {})
                });
            }
        }
        try {
            if (!webRuntime) {
                const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
                if (typeof dynamicRequire === 'function') {
                let mod = null;
                try { mod = dynamicRequire('./fileDateProviderImplExport'); } catch { /* ignore */ }
                if (!mod) {
                    try { mod = dynamicRequire('./fileDateProviderImpl'); } catch { /* ignore */ }
                }
                ProviderClass = mod && (mod.FileDateDecorationProvider || mod.FileDateDecorationProviderImpl || mod.default);
                }
            }
        } catch { /* ignore */ }

        // Dev fallback: use the local source provider
        if (!ProviderClass && !webRuntime) {
            const { FileDateDecorationProvider } = require('../fileDateDecorationProvider');
            ProviderClass = FileDateDecorationProvider;
        }

        if (!ProviderClass) {
            if (isWebDiagnosticsEnabled()) {
                diagLog?.('warn', 'Provider class unavailable', {
                    webRuntime,
                    registryKeys: Object.keys(getWebChunkRegistry() || {})
                });
            }
            return null;
        }

        const provider = new ProviderClass();
        if (isWebDiagnosticsEnabled()) {
            diagLog?.('info', 'Provider class resolved', { className: ProviderClass?.name || 'unknown' });
        }
        // Initialize heavy subsystems in background via existing hydration logic
        (async () => {
            try { await provider.initializeAdvancedSystems(context); } catch (e) { provider._logger?.debug('provider-init: provider factory init failed', e); }
        })();
        return { createFileDateDecorationProvider: () => provider };
    } catch {
        // Fallback: return null factory
        return null;
    }
}

module.exports = {
    hydrateProviderOptionalSystems,
    createFileDateDecorationProvider
};
