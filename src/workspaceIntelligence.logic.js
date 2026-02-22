const vscode = require('vscode');
let getLogger = () => {
    try {
        const dynamicRequire = typeof eval === 'function' ? eval('require') : null;
        if (typeof dynamicRequire === 'function') {
            const chunk = dynamicRequire('./chunks/logger-chunk');
            if (chunk && typeof chunk.getLogger === 'function') { getLogger = chunk.getLogger; return getLogger(); }
        }
    } catch { /* ignore */ }
    try { const base = require('./utils/logger'); getLogger = base.getLogger; return getLogger(); } catch { getLogger = () => ({ debug: console.debug?.bind(console) || console.log, info: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) }); return getLogger(); }
};
const logger = getLogger();

function scorePatterns(candidates, projectType) {
    return candidates.map(candidate => {
        let score = 0;
        let riskLevel = 'low';

        // Base score for common exclusions
        if (candidate.type === 'common') {
            score += 0.8;
        }

        // Score based on size (larger = more likely to exclude)
        if (candidate.size > 100 * 1024 * 1024) { // > 100MB
            score += 0.9;
            riskLevel = 'high';
        } else if (candidate.size > 10 * 1024 * 1024) { // > 10MB
            score += 0.5;
            riskLevel = 'medium';
        }

        // Project-specific scoring
        switch (projectType) {
            case 'javascript':
                if (['node_modules', '.npm', 'coverage', 'dist', 'build'].includes(candidate.name)) {
                    score += 0.9;
                }
                break;
            case 'python':
                if (['__pycache__', '.pytest_cache', 'venv', '.env'].includes(candidate.name)) {
                    score += 0.9;
                }
                break;
            case 'java':
                if (['target', 'build', '.gradle'].includes(candidate.name)) {
                    score += 0.9;
                }
                break;
        }

        // Never suggest excluding source directories
        const sourcePatterns = ['src', 'lib', 'app', 'components', 'pages'];
        if (sourcePatterns.includes(candidate.name.toLowerCase())) {
            score = 0;
            riskLevel = 'none';
        }

        return {
            pattern: candidate.name,
            path: candidate.path,
            score: Math.min(score, 1.0),
            riskLevel,
            size: candidate.size,
            type: candidate.type
        };
    });
}

function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}

function generateReviewHTML(reviewEntries) {
    const renderTable = (entry) => {
        const analysis = entry.analysis;
        const suggestionRows = (analysis?.detectedPatterns || []).map((pattern) => `
            <tr>
                <td>${escapeHtml(pattern.name)}</td>
                <td>${escapeHtml(pattern.path)}</td>
                <td>${formatSize(pattern.size)}</td>
                <td>${escapeHtml(pattern.type)}</td>
                <td>
                    <input type="checkbox" data-workspace="${escapeHtml(entry.workspaceKey)}" data-name="${escapeHtml(pattern.name)}" ${analysis?.suggestedExclusions?.includes(pattern.name) ? 'checked' : ''}>
                </td>
            </tr>
        `).join('');

        return `
            <section class="workspace">
                <header>
                    <h2>${escapeHtml(entry.workspaceName)}</h2>
                    <div class="project-info">
                        <div><strong>Project Type:</strong> ${escapeHtml(analysis?.projectType || 'unknown')}</div>
                    </div>
                </header>
                <table>
                    <thead><tr><th>Name</th><th>Path</th><th>Size</th><th>Type</th><th>Include</th></tr></thead>
                    <tbody>${suggestionRows}</tbody>
                </table>
            </section>
        `;
    };

    const html = `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>body{font-family: sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}</style>
    </head>
    <body>
        ${reviewEntries.map(renderTable).join('')}
        <script>
            const vscode = acquireVsCodeApi();
            document.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', (e) => {
                const workspace = e.target.getAttribute('data-workspace');
                const name = e.target.getAttribute('data-name');
                const checked = e.target.checked;
                vscode.postMessage({ type: 'save', workspaceKey: workspace, name, checked });
            }));
        </script>
    </body>
    </html>`;

    return html;
}

function _createPanel(title) {
    const panel = vscode.window.createWebviewPanel('exclusionReview', title, vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
    return panel;
}

async function showExclusionReviewSingle(manager, analysis) {
    try {
        const panel = _createPanel('Smart Exclusion Review');
        panel.webview.html = generateReviewHTML([{ workspaceKey: 'single-workspace', workspaceName: 'Workspace', analysis, previous: [] }]);
    } catch (error) {
        logger.error('Failed to show single exclusion review', error);
        throw error;
    }
}

async function showExclusionReviewBulk(manager, reviewEntries) {
    try {
        if (!Array.isArray(reviewEntries) || reviewEntries.length === 0) return;
        const panel = _createPanel('Smart Exclusion Review');

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message?.type === 'save' && message.workspaceKey && message.name) {
                // Build new exclusions for the workspace by toggling the presence
                const entry = reviewEntries.find(e => e.workspaceKey === message.workspaceKey);
                if (!entry?.workspaceUri) return;

                // Reconstruct the current suggestions and toggle the specific name
                const current = entry.analysis?.suggestedExclusions || [];
                const updated = new Set(current);
                if (message.checked) updated.add(message.name); else updated.delete(message.name);

                await manager.saveWorkspaceExclusions(entry.workspaceUri, Array.from(updated));
                panel.webview.postMessage({ type: 'saved', workspaceKey: message.workspaceKey });
            }
        });

        panel.webview.html = generateReviewHTML(reviewEntries);
    } catch (error) {
        logger.error('Failed to show bulk exclusion review', error);
        throw error;
    }
}

module.exports = {
    scorePatterns,
    generateReviewHTML,
    showExclusionReviewSingle,
    showExclusionReviewBulk
};