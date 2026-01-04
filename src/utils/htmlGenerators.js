const { templateStore } = require('./templateStore');
const { ensureDate } = require('./dateHelpers');

const HTML_ESCAPE_LOOKUP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
};

const PLACEHOLDER_PATTERN = /{{([A-Z0-9_]+)}}/g;

const STATUS_CLASS_MAP = {
    OK: { section: 'test-ok', status: 'status-ok' },
    ISSUES_FOUND: { section: 'test-warning', status: 'status-warning' },
    FAILED: { section: 'test-error', status: 'status-error' }
};

const DEFAULT_STATUS_CLASSES = { section: 'test-warning', status: 'status-warning' };
const textFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

const formatDateTime = (value) => {
    try {
        const date = ensureDate(value);
        return date.toLocaleString();
    } catch {
        return 'N/A';
    }
};

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_LOOKUP[char] || char);

const fillTemplate = (template, replacements = {}) => template.replace(PLACEHOLDER_PATTERN, (_, key) => replacements[key] ?? '');

const formatFileSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024) return `${textFormatter.format(kilobytes)} KB`;
    const megabytes = kilobytes / 1024;
    return `${textFormatter.format(megabytes)} MB`;
};

const formatDetailedBytes = (bytes = 0) => {
    if (!bytes) {
        return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    if (exponent <= 0) {
        return `${bytes} B`;
    }
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(2)} ${units[exponent]}`;
};

const asNumber = (value, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const asPercentLabel = (value, digits = 0) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return digits > 0 ? Number(0).toFixed(digits) : '0';
    }
    return value.toFixed(digits);
};

const buildTableRows = (entries = []) => entries.join('') || '<tr><td colspan="3">No data collected yet.</td></tr>';

const normalizeArrayValue = (value = []) => value.length ? value.map(escapeHtml).join(', ') : 'None';

const normalizeDisplayValue = (value) => {
    if (Array.isArray(value)) {
        return normalizeArrayValue(value);
    }
    if (value == null) {
        return 'N/A';
    }
    if (typeof value === 'object') {
        return escapeHtml(JSON.stringify(value));
    }
    return escapeHtml(value);
};

const renderDiagnosticsSections = (diagnostics = {}) => Object.entries(diagnostics).map(([title, data]) => {
    const rows = Object.entries(data).map(([key, value]) => `
        <tr>
            <td><strong>${escapeHtml(key)}:</strong></td>
            <td>${normalizeDisplayValue(value)}</td>
        </tr>
    `).join('');

    return `
        <div class="diagnostic-section">
            <h3>🔍 ${escapeHtml(title)}</h3>
            <table>${rows}</table>
        </div>
    `;
}).join('');

const formatIssue = (issue = '') => {
    const trimmed = issue.trim();
    const isCritical = trimmed.startsWith('CRITICAL:');
    const cssClass = isCritical ? 'issue-critical' : 'issue-warning';
    return `<div class="${cssClass}">⚠️ ${escapeHtml(trimmed)}</div>`;
};

const renderTestSection = ([testName, testResult = {}]) => {
    const sectionClasses = STATUS_CLASS_MAP[testResult.status] || DEFAULT_STATUS_CLASSES;

    const issuesBlock = Array.isArray(testResult.issues) && testResult.issues.length
        ? `
            <h3>Issues Found</h3>
            ${testResult.issues.map(formatIssue).join('')}
        `
        : '';

    const settingsBlock = testResult.settings
        ? `<h3>Settings Snapshot</h3><pre>${escapeHtml(JSON.stringify(testResult.settings, null, 2))}</pre>`
        : '';

    const fileTestsBlock = Array.isArray(testResult.testFiles) && testResult.testFiles.length
        ? `
            <h3>File Tests</h3>
            ${testResult.testFiles.map((file) => `
                <div class="file-test">
                    📄 ${escapeHtml(file.file || 'Unknown')}:
                    ${file.exists ? '✅ exists' : '❌ missing'} |
                    ${file.excluded ? '🚫 excluded' : '✅ included'} |
                    ${file.hasDecoration ? `🏷️ badge: ${escapeHtml(file.badge || 'n/a')}` : '❌ no decoration'}
                </div>
            `).join('')}
        `
        : '';

    const testResultsBlock = Array.isArray(testResult.tests) && testResult.tests.length
        ? `
            <h3>Test Results</h3>
            ${testResult.tests.map((test) => `
                <div class="badge-test">
                    ${test.success ? '✅' : '❌'} ${escapeHtml(test.name || 'Unnamed')}
                    ${test.error ? ` - ${escapeHtml(test.error)}` : ''}
                </div>
            `).join('')}
        `
        : '';

    const metricsBlock = testResult.metrics
        ? `<h3>Performance Metrics</h3><pre>${escapeHtml(JSON.stringify(testResult.metrics, null, 2))}</pre>`
        : '';

    const prettyName = escapeHtml(testName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()));

    return `
        <div class="test-section ${sectionClasses.section}">
            <h2>🧪 ${prettyName}</h2>
            <p class="${sectionClasses.status}">Status: ${escapeHtml(testResult.status || 'UNKNOWN')}</p>
            ${issuesBlock}
            ${settingsBlock}
            ${fileTestsBlock}
            ${testResultsBlock}
            ${metricsBlock}
        </div>
    `;
};

const renderSummaryBlock = (results = {}) => {
    const recommendations = Array.isArray(results.recommendations) && results.recommendations.length
        ? `
            <h3>🎯 Recommendations</h3>
            <ul>${results.recommendations.map((rec) => `<li>${escapeHtml(rec)}</li>`).join('')}</ul>
        `
        : '';

    return `
        <div class="summary">
            <h2>📋 Summary</h2>
            <p><strong>Total Tests:</strong> ${Object.keys(results.tests || {}).length}</p>
            <p><strong>Status:</strong> ${escapeHtml(results.summary || 'Unknown')}</p>
            <p><strong>Performance:</strong> ${escapeHtml(results.performance || 'Not recorded')}</p>
            ${recommendations}
        </div>
    `;
};

/*#__PURE__*/ async function getApiInformationHtml(api = {}) {
    const template = await templateStore.getTemplate('api-info');
    return fillTemplate(template, {
        VERSION: escapeHtml(api.version || 'unknown'),
        API_VERSION: escapeHtml(api.apiVersion || 'unknown')
    });
}

/*#__PURE__*/ async function generateWorkspaceActivityHTML(files = []) {
    const template = await templateStore.getTemplate('workspace-activity');
    const sortedFiles = [...files].sort((a, b) => (b.modified?.getTime?.() || 0) - (a.modified?.getTime?.() || 0));
    const rows = buildTableRows(sortedFiles.slice(0, 50).map((file) => `
        <tr>
            <td>${escapeHtml(file.path || 'unknown')}</td>
            <td>${formatDateTime(file.modified)}</td>
            <td>${formatFileSize(file.size)}</td>
        </tr>
    `));

    return fillTemplate(template, {
        TOTAL_FILES: sortedFiles.length,
        MOST_RECENT: sortedFiles.length ? formatDateTime(sortedFiles[0].modified) : 'N/A',
        ROWS: rows
    });
}

/*#__PURE__*/ async function generateDiagnosticsHTML(diagnostics = {}) {
    const template = await templateStore.getTemplate('diagnostics');
    return fillTemplate(template, {
        SECTIONS: renderDiagnosticsSections(diagnostics)
    });
}

/*#__PURE__*/ async function generateDiagnosticsWebview(results = {}) {
    const template = await templateStore.getTemplate('diagnostics-webview');
    const tests = Object.entries(results.tests || {}).map(renderTestSection).join('');

    return fillTemplate(template, {
        VS_CODE_VERSION: escapeHtml(results.vscodeVersion || 'Unknown'),
        EXTENSION_VERSION: escapeHtml(results.extensionVersion || 'Unknown'),
        GENERATED_AT: formatDateTime(results.timestamp || Date.now()),
        TEST_SECTIONS: tests,
        SUMMARY_BLOCK: renderSummaryBlock(results)
    });
}

async function renderBasicMetricsCard(metrics = {}) {
    const template = await templateStore.getTemplate('performance-card-basic');
    return fillTemplate(template, {
        TOTAL_DECORATIONS: (metrics.totalDecorations ?? 0).toString(),
        CACHE_HIT_RATE: metrics.cacheHitRate || '0%'
    });
}

async function renderAdvancedCacheCard(advancedCache = null) {
    if (!advancedCache) {
        return templateStore.getTemplate('performance-card-advanced-empty');
    }
    const template = await templateStore.getTemplate('performance-card-advanced');
    const usagePercent = asNumber(advancedCache.memoryUsagePercent, 0);
    return fillTemplate(template, {
        MEMORY_ITEMS: (advancedCache.memoryItems ?? 0).toString(),
        MEMORY_USAGE: formatDetailedBytes(advancedCache.memoryUsage || 0),
        MEMORY_USAGE_PERCENT: usagePercent.toString(),
        MEMORY_USAGE_PERCENT_LABEL: asPercentLabel(usagePercent, 2),
        MEMORY_HIT_RATE: advancedCache.memoryHitRate || '0%',
        DISK_HIT_RATE: advancedCache.diskHitRate || '0%'
    });
}

async function renderBatchProcessorCard(batchProcessor = null) {
    if (!batchProcessor) {
        return '';
    }
    const template = await templateStore.getTemplate('performance-card-batch');
    const status = batchProcessor.isProcessing ? 'Active' : 'Idle';
    const averageTime = asNumber(batchProcessor.averageBatchTime, 0).toFixed(2);
    const currentProgress = typeof batchProcessor.currentProgress === 'number'
        ? `${Math.max(0, Math.min(100, batchProcessor.currentProgress * 100)).toFixed(0)}%`
        : '0%';
    return fillTemplate(template, {
        TOTAL_BATCHES: (batchProcessor.totalBatches ?? 0).toString(),
        AVERAGE_BATCH_TIME: averageTime,
        CURRENT_STATUS: status,
        QUEUE_LENGTH: (batchProcessor.queueLength ?? 0).toString(),
        CURRENT_PROGRESS: currentProgress
    });
}

async function renderPerformanceSummaryCard(metrics = {}) {
    const template = await templateStore.getTemplate('performance-card-summary');
    return fillTemplate(template, {
        CACHE_HITS: (metrics.cacheHits ?? 0).toString(),
        CACHE_MISSES: (metrics.cacheMisses ?? 0).toString(),
        ERROR_COUNT: (metrics.errors ?? 0).toString()
    });
}

async function renderPerformanceTimingCard(performanceTiming = null) {
    if (!performanceTiming) {
        return '';
    }
    const template = await templateStore.getTemplate('performance-card-timing');
    return fillTemplate(template, {
        AVG_GIT_BLAME: `${asNumber(performanceTiming.avgGitBlameMs, 0)}ms`,
        GIT_CALLS: (performanceTiming.gitBlameCalls ?? 0).toString(),
        AVG_FILE_STAT: `${asNumber(performanceTiming.avgFileStatMs, 0)}ms`,
        FILE_STAT_CALLS: (performanceTiming.fileStatCalls ?? 0).toString(),
        TOTAL_GIT_TIME: `${asNumber(performanceTiming.totalGitBlameTimeMs, 0)}ms`,
        TOTAL_FILE_STAT_TIME: `${asNumber(performanceTiming.totalFileStatTimeMs, 0)}ms`
    });
}

/*#__PURE__*/ async function generatePerformanceAnalyticsHTML(metrics = {}) {
    const template = await templateStore.getTemplate('performance-analytics');
    const cards = await Promise.all([
        renderBasicMetricsCard(metrics),
        renderAdvancedCacheCard(metrics.advancedCache),
        renderBatchProcessorCard(metrics.batchProcessor),
        renderPerformanceSummaryCard(metrics),
        renderPerformanceTimingCard(metrics.performanceTiming)
    ]);

    return fillTemplate(template, {
        CARDS: cards.filter(Boolean).join('\n')
    });
}

module.exports = {
    getApiInformationHtml,
    generateWorkspaceActivityHTML,
    generateDiagnosticsHTML,
    generateDiagnosticsWebview,
    generatePerformanceAnalyticsHTML
};
