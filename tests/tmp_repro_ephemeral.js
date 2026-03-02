const { createExtensionContext } = require('./helpers/mockVscode');
const { TeamConfigPersistenceManager } = require('../src/teamConfigPersistence.proxy');

(async () => {
  const context = createExtensionContext();
  const manager = new TeamConfigPersistenceManager(context);
  await manager._ensureImpl();

  const testProfiles = {
    recovery: { name: 'Recovery Profile', settings: { 'explorerDates.enableWorkspaceTemplates': true } }
  };

  const originalWriteFile = manager._fs.writeFile;
  const originalShowWarningMessage = require('vscode').window.showWarningMessage;
  let warningsShown = 0;

  manager._fs.writeFile = async () => {
    const error = new Error('Read-only workspace');
    error.code = 'EACCES';
    throw error;
  };

  require('vscode').window.showWarningMessage = async (message, ...options) => {
    warningsShown += 1;
    return originalShowWarningMessage.call(this, message, ...options);
  };

  try {
    await manager.saveTeamProfiles(testProfiles);
    console.log('after save: ephemeralNoticeShown.size =', manager._ephemeralNoticeShown.size, 'warningsShown =', warningsShown);

    manager._fs.writeFile = async () => { /* succeed */ };
    await manager.saveTeamProfiles(testProfiles);
    console.log('after recovery: ephemeralNoticeShown.size =', manager._ephemeralNoticeShown.size);
  } finally {
    manager._fs.writeFile = originalWriteFile;
    require('vscode').window.showWarningMessage = originalShowWarningMessage;
  }
})();