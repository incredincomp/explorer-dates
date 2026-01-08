require('./warningFilters');

function scheduleExit() {
    const code = typeof process.exitCode === 'number' ? process.exitCode : 0;
    setImmediate(() => process.exit(code));
}

module.exports = {
    scheduleExit
};
