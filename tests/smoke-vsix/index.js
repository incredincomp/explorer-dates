const assert = require('assert');
const path = require('path');
const vscode = require('vscode');

suite('VSIX Smoke Test', () => {
    test('activates packaged extension', async () => {
        const extension = vscode.extensions.getExtension('incredincomp.explorer-dates');
        assert.ok(extension, 'Packaged extension was not found');

        await extension.activate();

        const expectedInstallRoot = `${path.sep}.vscode-test${path.sep}extensions${path.sep}`;
        assert.ok(
            extension.extensionPath.includes(expectedInstallRoot),
            `Expected extension path ${extension.extensionPath} to point to the VSIX install dir`
        );

        assert.ok(extension.isActive, 'Extension failed to activate');
    });
});
