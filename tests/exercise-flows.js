#!/usr/bin/env node

/**
 * Exercises the workspace templates, reporting flows, and web bundle readiness
 * using lightweight VS Code API shims so we can run the logic in Node.
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { createMockVscode, InMemoryMemento } = require('./helpers/mockVscode');

const mockInstall = createMockVscode();
const { infoLog, appliedUpdates, workspaceRoot } = mockInstall;
const artifactsDir = path.join(__dirname, 'artifacts');

async function ensureArtifactsDir() {
    await fsp.mkdir(artifactsDir, { recursive: true });
}

async function runTemplateFlow() {
    const { WorkspaceTemplatesManager } = require('../src/workspaceTemplates');
    const manager = new WorkspaceTemplatesManager({ globalState: new InMemoryMemento() });

    const templateName = 'Script Template';
    const templateDescription = 'Automatically generated during flow tests';
    const saved = await manager.saveCurrentConfiguration(templateName, templateDescription);
    if (!saved) {
        throw new Error('Failed to save template via manager');
    }

    const templates = await manager.getAvailableTemplates();
    const templateEntry = templates.find(item => item.name === templateName);
    if (!templateEntry) {
        throw new Error('Saved template not present in available templates list');
    }

    const exportPath = path.join(artifactsDir, 'script-template.json');
    await manager.exportTemplate(templateEntry.id, exportPath);

    const exported = JSON.parse(await fsp.readFile(exportPath, 'utf8'));
    if (exported.name !== templateName) {
        throw new Error('Exported template payload mismatch');
    }

    const importResult = await manager.importTemplate(exportPath);
    return {
        templateId: templateEntry.id,
        exportPath,
        importResult,
        templatesCount: templates.length
    };
}

async function runReportingFlow() {
    const { ExportReportingManager } = require('../src/exportReporting');
    const manager = new ExportReportingManager();
    const reportPath = path.join(artifactsDir, 'file-report.json');

    const reportContent = await manager.generateFileModificationReport({
        format: 'json',
        includeDeleted: false,
        outputPath: reportPath
    });

    if (!reportContent) {
        throw new Error('Report generation returned empty payload');
    }

    const parsed = typeof reportContent === 'string' ? JSON.parse(reportContent) : reportContent;
    return {
        summary: parsed.summary,
        fileCount: parsed.files.length,
        reportPath
    };
}

async function exerciseWebBundle() {
    const bundlePath = path.join(workspaceRoot, 'dist', 'extension.web.js');
    if (!fs.existsSync(bundlePath)) {
        throw new Error('Web bundle has not been built yet');
    }

    const bundle = require(bundlePath);
    const hasActivate = typeof bundle.activate === 'function';
    const hasDeactivate = typeof bundle.deactivate === 'function';

    if (!hasActivate) {
        throw new Error('Web bundle is missing an activate() export');
    }

    return {
        bundlePath,
        hasActivate,
        hasDeactivate,
        exportKeys: Object.keys(bundle)
    };
}

async function main() {
    try {
        await ensureArtifactsDir();

        const templateResults = await runTemplateFlow();
        const reportingResults = await runReportingFlow();
        const webBundleResults = await exerciseWebBundle();

        console.log('✅ Template flow exercised:', templateResults);
        console.log('✅ Reporting flow exercised:', reportingResults);
        console.log('✅ Web bundle exercised:', webBundleResults);
        console.log('ℹ️ Config updates applied:', appliedUpdates.slice(-5));
        console.log('ℹ️ Info messages:', infoLog.slice(-5));

    } catch (error) {
        console.error('❌ Flow exercise failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main();
