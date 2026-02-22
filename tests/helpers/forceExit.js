require('./warningFilters');

/**
 * Schedule a process exit.
 * @param {number} [timeoutMs=0] Delay in milliseconds before exiting (0 schedules on next tick)
 * @param {number} [code] Optional exit code. If omitted, uses process.exitCode if set, otherwise 0.
 */
function scheduleExit(timeoutMs = 0, code) {
    const exitCode = typeof code === 'number' ? code : (typeof process.exitCode === 'number' ? process.exitCode : 0);
    if (typeof timeoutMs === 'number' && timeoutMs > 0) {
        setTimeout(() => process.exit(exitCode), timeoutMs);
    } else {
        setImmediate(() => process.exit(exitCode));
    }
}

module.exports = {
    scheduleExit
};
