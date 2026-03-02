// Prefer shared utils chunk when available
let normalizePath, getRelativePath, getFileName;
try { const shared = require('../chunks/utils-shared-chunk'); if (shared) { normalizePath = shared.normalizePath; getRelativePath = shared.getRelativePath; getFileName = shared.getFileName; } } catch { /* ignore */ }
if (!normalizePath) {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            try {
                const pathUtils = dynamicRequire('../utils/pathUtils');
                normalizePath = normalizePath || pathUtils.normalizePath;
                getRelativePath = getRelativePath || pathUtils.getRelativePath;
                getFileName = getFileName || pathUtils.getFileName;
            } catch { /* ignore */ }
        }
    } catch { /* ignore */ }
    if (!normalizePath) normalizePath = (input='') => (input||'').toString().replace(/\\/g, '/');
    if (!getRelativePath) getRelativePath = (b,t) => { const bn = (b||'')+''; const tn=(t||'')+''; if (!bn) return tn; if (tn.startsWith(bn)) return tn.substring(bn.length).replace(/^\/+/, ''); return tn; };
    if (!getFileName) getFileName = (s) => { const str = String(s||''); const idx = str.replace(/\\/g,'/').lastIndexOf('/'); return idx === -1 ? str : str.substring(idx+1); };
} 

async function scanForExclusionCandidates(workspaceUri, workspacePath, fileSystem, logger, maxDepth = 2) {
    const candidates = [];

    const scanDirectory = async (dirUri, currentDepth = 0) => {
        if (currentDepth > maxDepth) return;

        try {
            const entries = await fileSystem.readdir(dirUri, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullUri = require('vscode').Uri.joinPath(dirUri, entry.name);
                    const fullPath = normalizePath(fullUri.fsPath || fullUri.path);
                    const relativePath = getRelativePath(workspacePath, fullPath);

                    // Common exclusion check caller is expected to provide
                    // Collect size for decision making
                    const size = await _getDirectorySize(fileSystem, fullUri, logger);

                    candidates.push({
                        name: entry.name,
                        path: relativePath,
                        type: 'directory',
                        size
                    });

                    // Recursively scan subdirectories
                    await scanDirectory(fullUri, currentDepth + 1);
                }
            }
        } catch (error) {
            // Skip directories we can't access
            logger && logger.debug && logger.debug('Skipping directory during scan', error && error.message);
        }
    };
    await scanDirectory(workspaceUri);
    return candidates;
}

async function _getDirectorySize(dirUri, fs, logger) {
    // compatibility where args were reversed in calls
    let fileSystem = fs;
    if (typeof dirUri === 'object' && dirUri && typeof dirUri.fsPath === 'string' && !fs) {
        fileSystem = require('../filesystem/FileSystemAdapter').fileSystem;
    }

    try {
        const entries = await fileSystem.readdir(dirUri, { withFileTypes: true });
        let size = 0;
        let fileCount = 0;

        for (const entry of entries) {
            if (fileCount > 100) break;
            if (entry.isFile()) {
                try {
                    const fileUri = require('vscode').Uri.joinPath(dirUri, entry.name);
                    const stat = await fileSystem.stat(fileUri);
                    size += stat.size;
                    fileCount++;
                } catch (e) {
                    // Skip files we can't access
                    logger && logger.debug && logger.debug('Skipping file in size calc', e && e.message);
                }
            }
        }

        return size;
    } catch {
        return 0;
    }
}

module.exports = {
    scanForExclusionCandidates
};