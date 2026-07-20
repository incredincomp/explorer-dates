const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { suite, test } = require('mocha');

suite('Show File Details extension-host contract', () => {
    test('selected file and active editor fallback complete without errors', async () => {
        const extension = vscode.extensions.getExtension('incredincomp.explorer-dates');
        assert(extension, 'Explorer Dates extension must be available in the host');
        await extension.activate();
        const root = vscode.workspace.workspaceFolders?.[0]?.uri;
        assert(root, 'extension-host workspace must be open');
        const selected = vscode.Uri.joinPath(root, 'host-selected.txt');
        await vscode.workspace.fs.writeFile(selected, Buffer.from('host smoke\n'));
        await vscode.commands.executeCommand('explorerDates.showFileDetails', selected);
        const document = await vscode.workspace.openTextDocument(selected);
        await vscode.window.showTextDocument(document, { preview: false });
        await vscode.commands.executeCommand('explorerDates.showFileDetails');
        const diagnostics = require(path.join(extension.extensionPath, 'src', 'utils', 'webDiagnostics'));
        const state = diagnostics.getWebDiagnosticsState();
        const commandErrors = state.errors.filter(entry => entry.commandId === 'explorerDates.showFileDetails');
        assert.strictEqual(commandErrors.length, 0, JSON.stringify(commandErrors));
        const completions = state.logs.filter(entry => entry.message === 'Command completed' && entry.meta?.commandId === 'explorerDates.showFileDetails');
        assert.strictEqual(completions.length, 2);
        assert(completions.every(entry => entry.meta.outcomeCategory === 'behavioral-success'));
        const source = fs.readFileSync(path.join(extension.extensionPath, 'src', 'commands', 'coreCommands.js'), 'utf8');
        assert(!source.includes('_formatFileSize'));
        fs.writeFileSync(process.env.HOST_RESULT_PATH, JSON.stringify({ selected: true, activeEditorFallback: true, commandErrors: commandErrors.length, completions: completions.length, privateFormatter: false }));
    });
});
