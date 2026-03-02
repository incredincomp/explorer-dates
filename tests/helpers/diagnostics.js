const fs = require('fs');
const path = require('path');

function installUnhandledRejectionGuard() {
    let seen = false;
    function onUnhandled(reason) {
        seen = true;
        console.error('[DIAG] UnhandledRejection detected:', reason);
    }
    process.on('unhandledRejection', onUnhandled);
    return function remove() {
        process.removeListener('unhandledRejection', onUnhandled);
        return seen;
    };
}

function dumpActiveHandles(testName, iteration) {
    const getHandles = process._getActiveHandles ? process._getActiveHandles : () => [];
    const handles = getHandles().map((h) => {
        try {
            return { type: h.constructor && h.constructor.name ? h.constructor.name : typeof h };
        } catch {
            return { type: 'unknown' };
        }
    });
    const out = {
        timestamp: new Date().toISOString(),
        test: testName,
        iteration,
        count: handles.length,
        handles
    };
    const logsDir = path.join(__dirname, '../../logs');
    try { fs.mkdirSync(logsDir, { recursive: true }); } catch {}
    const file = path.join(logsDir, `diag-${testName.replace(/[^a-z0-9.-]/gi, '_')}-${iteration}-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(out, null, 2));
    console.error('[DIAG] Wrote handle dump to', file);
    return file;
}

module.exports = {
    installUnhandledRejectionGuard,
    dumpActiveHandles
};
