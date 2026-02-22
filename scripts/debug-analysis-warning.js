const path = require('path');
const { createTestMock, createExtensionContext } = require('../tests/helpers/mockVscode');
const { scheduleExit } = require('../tests/helpers/forceExit');

function clearCaches() {
    const path = require('path');
    for (const key of Object.keys(require.cache)) {
        if (
            key.includes(`${path.sep}extension.js`) ||
            key.includes(`${path.sep}src${path.sep}featureFlags`) ||
            key.includes(`${path.sep}src${path.sep}commands${path.sep}analysisCommands`)
        ) {
            delete require.cache[key];
        }
    }
}

function infoMessages(mock) {
    return mock.infoLog.filter((entry) => typeof entry === 'string');
}

(async function(){
    clearCaches();
    const mock = createTestMock({ config: { 'explorerDates.enableAnalysisCommands': false } });
    const { activate } = require('../extension.js');
    const context = createExtensionContext({extensionPath: path.resolve(__dirname, '..')});
    await activate(context);
    console.log('After first activate, info messages:', infoMessages(mock));

    mock.resetLogs();
    clearCaches();
    const { activate: activateAgain } = require('../extension.js');
    await activateAgain(context);
    console.log('After second activate, info messages:', infoMessages(mock));

    mock.dispose();
    scheduleExit();
})();