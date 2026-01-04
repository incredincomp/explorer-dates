import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@vscode/test-cli';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    files: [path.join(repoRoot, 'tests/smoke-vsix/index.js')],
    workspaceFolder: repoRoot,
    extensionDevelopmentPath: path.join(repoRoot, 'scripts/smoke-harness'),
    installExtensions: [path.join(repoRoot, 'explorer-dates-1.3.0.vsix')],
    mocha: {
        timeout: 20000
    }
});
