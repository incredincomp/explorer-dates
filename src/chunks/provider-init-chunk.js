try { require('vscode'); } catch { }

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
        try {
            const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
            if (typeof dynamicRequire === 'function') {
                let mod = null;
                try { mod = dynamicRequire('./fileDateProviderImplExport'); } catch { /* ignore */ }
                if (!mod) {
                    try { mod = dynamicRequire('./fileDateProviderImpl'); } catch { /* ignore */ }
                }
                ProviderClass = mod && (mod.FileDateDecorationProvider || mod.FileDateDecorationProviderImpl || mod.default);
            }
        } catch { /* ignore */ }

        // Dev fallback: use the local source provider
        if (!ProviderClass) {
            const { FileDateDecorationProvider } = require('../fileDateDecorationProvider');
            ProviderClass = FileDateDecorationProvider;
        }

        const provider = new ProviderClass();
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
