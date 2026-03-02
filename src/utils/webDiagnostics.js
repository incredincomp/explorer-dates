const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
const PREFIX = '[ExplorerDates][WebDiag]';
const STATE_KEY = '__explorerDatesWebDiagnostics';

let cachedEnabled;

function isWebRuntime() {
    try {
        const vscode = require('vscode');
        return vscode?.env?.uiKind === vscode?.UIKind?.Web;
    } catch {
        return env.VSCODE_WEB === 'true';
    }
}

function isWebDiagnosticsEnabled() {
    if (cachedEnabled !== undefined) return cachedEnabled;
    cachedEnabled = env.EXPLORER_DATES_WEB_DIAG === '1' || isWebRuntime();
    return cachedEnabled;
}

function createState() {
    return {
        enabled: isWebDiagnosticsEnabled(),
        logs: [],
        logOnce: new Set(),
        commandsRegistered: new Set(),
        commandsInvoked: [],
        errors: [],
        chunkLoads: [],
        provider: {
            created: false,
            registered: false,
            hydrated: false,
            decorationCalls: 0,
            refreshCalls: 0,
            lastEvent: null
        }
    };
}

let localState = createState();

function getWebDiagnosticsState() {
    if (typeof globalThis !== 'undefined') {
        if (!globalThis[STATE_KEY]) {
            globalThis[STATE_KEY] = createState();
        }
        return globalThis[STATE_KEY];
    }
    return localState;
}

function safeStringify(value) {
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function diagLog(level, message, meta) {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    const entry = {
        ts: new Date().toISOString(),
        level,
        message,
        meta: meta || null
    };
    state.logs.push(entry);
    if (state.logs.length > 400) {
        state.logs.shift();
    }
    const line = meta ? `${PREFIX} ${message} ${safeStringify(meta)}` : `${PREFIX} ${message}`;
    const consoleFn = console[level] || console.info;
    try {
        consoleFn(line);
    } catch {
        try { console.info(line); } catch { /* ignore */ }
    }
}

function diagLogOnce(key, level, message, meta) {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    if (state.logOnce.has(key)) return;
    state.logOnce.add(key);
    diagLog(level, message, meta);
}

function recordCommandRegistration(commandId) {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    state.commandsRegistered.add(commandId);
    diagLog('info', 'Command registered', { commandId });
}

function recordCommandInvocation(commandId) {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    state.commandsInvoked.push({ commandId, ts: Date.now() });
    diagLog('info', 'Command invoked', { commandId });
}

function recordCommandResult(commandId, ok, error) {
    if (!isWebDiagnosticsEnabled()) return;
    if (ok) {
        diagLog('info', 'Command completed', { commandId });
    } else {
        diagLog('error', 'Command failed', { commandId, error: error?.message, stack: error?.stack });
        const state = getWebDiagnosticsState();
        state.errors.push({ commandId, error: error?.message, stack: error?.stack });
    }
}

function recordChunkEvent(chunkName, stage, error) {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    state.chunkLoads.push({
        chunkName,
        stage,
        ts: Date.now(),
        error: error ? (error.message || String(error)) : null
    });
    diagLog(error ? 'warn' : 'info', `Chunk ${stage}`, { chunkName, error: error?.message });
}

function recordProviderEvent(event, meta) {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    state.provider.lastEvent = { event, ts: Date.now(), meta: meta || null };
    if (event === 'created') state.provider.created = true;
    if (event === 'registered') state.provider.registered = true;
    if (event === 'hydrated') state.provider.hydrated = true;
    diagLog('info', `Provider ${event}`, meta);
}

function recordDecorationCall() {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    state.provider.decorationCalls += 1;
    if (state.provider.decorationCalls <= 3) {
        diagLog('info', 'Decoration request observed', { count: state.provider.decorationCalls });
    }
}

function recordRefreshCall() {
    if (!isWebDiagnosticsEnabled()) return;
    const state = getWebDiagnosticsState();
    state.provider.refreshCalls += 1;
}

module.exports = {
    isWebDiagnosticsEnabled,
    getWebDiagnosticsState,
    diagLog,
    diagLogOnce,
    recordCommandRegistration,
    recordCommandInvocation,
    recordCommandResult,
    recordChunkEvent,
    recordProviderEvent,
    recordDecorationCall,
    recordRefreshCall
};
