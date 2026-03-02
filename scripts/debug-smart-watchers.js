const { createTestMock, VSCodeUri } = require('../tests/helpers/mockVscode');
(async function main(){
  createTestMock({
    workspaceFolders: [{ uri: VSCodeUri.file('/tmp/project'), name: 'project' }],
    config: { 'explorerDates.performanceMode': false, 'explorerDates.smartWatcherMaxPatterns': 5 }
  });
  const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
  const provider = new FileDateDecorationProvider();
  provider._fileSystem.readdir = async () => ['src','apps','tests','node_modules','.git'].map(n => ({ name: n, isDirectory: () => true }));

  const targets = await provider._buildSmartWatcherTargets((require('vscode').workspace.workspaceFolders || []), { maxPatterns: 5 });
  console.log('buildSmartWatcherTargets =>', targets.map(t => ({ label: t.label, pattern: (t.pattern && t.pattern.pattern) || t.pattern })) );

  process.exit(0);
})();
