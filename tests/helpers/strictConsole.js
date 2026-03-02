const { DEFAULT_WARNING_PATTERNS, getActiveWarningPatterns } = require('./warningFilters');

const originalWarn = console.warn;
const originalError = console.error;

const violations = [];

function coerceMessage(args) {
    return args.map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error && typeof arg.message === 'string') return arg.message;
        try {
            return JSON.stringify(arg);
        } catch {
            return String(arg);
        }
    }).join(' ');
}

function buildAllowlist() {
    const patterns = [
        ...DEFAULT_WARNING_PATTERNS,
        ...getActiveWarningPatterns()
    ];
    if (Array.isArray(globalThis.__strictConsoleAllowlist)) {
        for (const entry of globalThis.__strictConsoleAllowlist) {
            if (entry) patterns.push(entry);
        }
    }
    return patterns.filter(Boolean).map((pattern) => (
        pattern instanceof RegExp ? pattern : new RegExp(String(pattern))
    ));
}

function isAllowed(message) {
    const allowlist = buildAllowlist();
    return allowlist.some((pattern) => pattern.test(message));
}

function recordViolation(level, message) {
    violations.push({ level, message });
    process.exitCode = 1;
}

function isHarnessNoise(message) {
    // Diagnostics and watchdog outputs are instrumentation noise, not application warnings.
    return message.startsWith('[DIAG]') || message.startsWith('[TEST-WATCHDOG]');
}

console.warn = (...args) => {
    const message = coerceMessage(args);
    if (isHarnessNoise(message)) {
        return originalWarn(...args);
    }
    if (!isAllowed(message)) {
        recordViolation('warn', message);
    }
    return originalWarn(...args);
};

console.error = (...args) => {
    const message = coerceMessage(args);
    if (isHarnessNoise(message)) {
        return originalError(...args);
    }
    if (!isAllowed(message)) {
        recordViolation('error', message);
    }
    return originalError(...args);
};

process.on('exit', () => {
    if (!violations.length) return;
    const summary = violations.slice(0, 6).map((item) => `- ${item.level}: ${item.message}`).join('\n');
    originalError('\n[STRICT-CONSOLE] Unexpected console output detected:\n' + summary);
    if (violations.length > 6) {
        originalError(`[STRICT-CONSOLE] ${violations.length - 6} more suppressed.`);
    }
});
