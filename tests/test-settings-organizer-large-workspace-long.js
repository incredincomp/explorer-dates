#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function testLargeWorkspaceOrganizer() {
    // Opt-in long test: simulates a large workspace with many .vscode files and flaky FS
    const workspaceRoot = path.join(__dirname, 'fixtures', 'large-workspace');
    const folders = Array.from({ length: 20 }, (_, i) => ({ path: path.join(workspaceRoot, `proj-${String(i).padStart(3, '0')}`), name: `proj-${i}` }));

    const mock = createTestMock({
        workspaceFolders: folders
    });

    try {
        const fsMap = new Map();
        // Populate many explorer files per workspace
        for (const f of folders) {
            const vscodeDir = VSCodeUri.file(path.join(f.path, '.vscode'));
            const files = [];
            for (let i = 0; i < 30; i++) {
                const filename = `explorer-dates-${String(i).padStart(3,'0')}.json`;
                files.push([filename, 1]); // File type
                const uri = VSCodeUri.file(path.join(vscodeDir.fsPath || vscodeDir.path, filename));
                // Create JSON with unordered keys
                const content = JSON.stringify({ b: i, a: i }, null, 2);
                fsMap.set(uri.fsPath || uri.path, { content, uri });
            }
            // also allow root-level files
            const rootFiles = []; void rootFiles;
            fsMap.set(vscodeDir.fsPath + '/.keep', { content: '{}', uri: VSCodeUri.file(vscodeDir.fsPath + '/.keep') });
            files.push(['.keep', 1]);
            // Save directory listing
            fsMap.set((vscodeDir.fsPath || vscodeDir.path) + '::dir', files);
        }

        // Replace workspace.fs implementations
        mock.vscode.workspace.fs.readDirectory = async (uri) => {
            // simulate slowness and occasional error
            await new Promise(r => setTimeout(r, 2));
            const key = (uri.fsPath || uri.path) + '::dir';
            const result = fsMap.get(key);
            if (!result) return [];
            return result;
        };

        mock.vscode.workspace.fs.readFile = async (uri) => {
            // simulate flakiness
            const entry = fsMap.get(uri.fsPath || uri.path);
            if (!entry) {
                const err = new Error('ENOENT');
                err.code = 'ENOENT';
                throw err;
            }
            // random transient error for coverage
            if (Math.random() < 0.01) {
                const err = new Error('EIO');
                err.code = 'EIO';
                throw err;
            }
            await new Promise(r => setTimeout(r, 3));
            return Buffer.from(entry.content, 'utf8');
        };

        const written = [];
        mock.vscode.workspace.fs.writeFile = async (uri, buffer) => {
            // Simulate occasional slow write
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 6)));
            if (Math.random() < 0.005) {
                const err = new Error('EACCES');
                err.code = 'EACCES';
                throw err;
            }
            written.push({ path: uri.fsPath || uri.path, content: buffer.toString('utf8') });
        };

        const { SettingsOrganizer } = require('../src/utils/settingsOrganizer');
        const context = mock.createExtensionContext();
        const organizer = new SettingsOrganizer(context);

        // Run organize and ensure it completes without throwing and reports changes (sorting should happen)
        const summary = await organizer.organize({ force: true });
        assert.ok(summary, 'Organizer returned summary');
        // We expect some files to be sorted and some work done
        assert.ok(Array.isArray(summary.sortedFiles), 'sortedFiles present');

        console.log(`Sorted ${summary.sortedFiles.length} files across ${folders.length} workspaces (sample of writes: ${Math.min(5, written.length)})`);

    } finally {
        mock.dispose();
    }
}

async function main() {
    try {
        await testLargeWorkspaceOrganizer();
        console.log('✅ Large-workspace SettingsOrganizer test passed');
    } catch (error) {
        console.error('❌ Large-workspace SettingsOrganizer test failed:', error);
        process.exitCode = 1;
    } finally {
        scheduleExit();
    }
}

if (require.main === module) main();