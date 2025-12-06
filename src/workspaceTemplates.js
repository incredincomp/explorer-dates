const vscode = require('vscode');
const { getLogger } = require('./logger');
const { fileSystem } = require('./filesystem/FileSystemAdapter');
const { GLOBAL_STATE_KEYS } = require('./constants');

const logger = getLogger();

/**
 * Workspace Templates Manager
 * Handles saving/loading decoration configurations, team sharing, and preset templates
 */
class WorkspaceTemplatesManager {
    constructor(context) {
        this._context = context;
        this._storage = context?.globalState || null;
        this._storageKey = GLOBAL_STATE_KEYS.TEMPLATE_STORE;
        this._fs = fileSystem;
        this.templatesPath = null;
        this.builtInTemplates = this.getBuiltInTemplates();
        logger.info('Workspace Templates Manager initialized');
    }

    _getStoredTemplates() {
        if (!this._storage) {
            return {};
        }
        return this._storage.get(this._storageKey, {});
    }

    async _saveStoredTemplates(templates) {
        if (!this._storage) {
            throw new Error('Template storage unavailable');
        }
        await this._storage.update(this._storageKey, templates);
    }

    _getTemplate(templateId) {
        if (this.builtInTemplates[templateId]) {
            return this.builtInTemplates[templateId];
        }

        const storedTemplates = this._getStoredTemplates();
        return storedTemplates[templateId];
    }

    getBuiltInTemplates() {
        return {
            'web-development': {
                name: 'Web Development',
                description: 'Optimized for web projects with focus on source files',
                settings: {
                    'explorerDates.showDateDecorations': true,
                    'explorerDates.dateDecorationFormat': 'relative-short',
                    'explorerDates.colorScheme': 'file-type',
                    'explorerDates.showFileSize': true,
                    'explorerDates.fadeOldFiles': true,
                    'explorerDates.fadeThreshold': 14,
                    'explorerDates.excludePatterns': [
                        '**/node_modules/**',
                        '**/dist/**',
                        '**/build/**',
                        '**/.next/**',
                        '**/coverage/**'
                    ],
                    'explorerDates.enableContextMenu': true,
                    'explorerDates.showGitInfo': 'author'
                }
            },
            'data-science': {
                name: 'Data Science',
                description: 'Focused on notebooks and data files with detailed timestamps',
                settings: {
                    'explorerDates.showDateDecorations': true,
                    'explorerDates.dateDecorationFormat': 'absolute-long',
                    'explorerDates.colorScheme': 'none',
                    'explorerDates.showFileSize': true,
                    'explorerDates.showGitInfo': 'none',
                    'explorerDates.highContrastMode': false,
                    'explorerDates.excludePatterns': [
                        '**/__pycache__/**',
                        '**/.ipynb_checkpoints/**',
                        '**/data/raw/**'
                    ],
                    'explorerDates.badgePriority': 'size'
                }
            },
            'documentation': {
                name: 'Documentation',
                description: 'Clean display for documentation projects',
                settings: {
                    'explorerDates.showDateDecorations': true,
                    'explorerDates.dateDecorationFormat': 'smart',
                    'explorerDates.colorScheme': 'subtle',
                    'explorerDates.showFileSize': false,
                    'explorerDates.excludePatterns': [
                        '**/node_modules/**',
                        '**/.git/**'
                    ],
                    'explorerDates.fadeOldFiles': false,
                    'explorerDates.enableContextMenu': false
                }
            },
            'enterprise': {
                name: 'Enterprise',
                description: 'Full feature set with Git integration and analytics',
                settings: {
                    'explorerDates.showDateDecorations': true,
                    'explorerDates.dateDecorationFormat': 'smart',
                    'explorerDates.colorScheme': 'recency',
                    'explorerDates.showFileSize': true,
                    'explorerDates.showGitInfo': 'author',
                    'explorerDates.enableContextMenu': true,
                    'explorerDates.showStatusBar': true,
                    'explorerDates.smartExclusions': true,
                    'explorerDates.progressiveLoading': true,
                    'explorerDates.persistentCache': true,
                    'explorerDates.enableReporting': true
                }
            },
            'minimal': {
                name: 'Minimal',
                description: 'Clean, distraction-free setup',
                settings: {
                    'explorerDates.showDateDecorations': true,
                    'explorerDates.dateDecorationFormat': 'relative-short',
                    'explorerDates.colorScheme': 'none',
                    'explorerDates.showFileSize': false,
                    'explorerDates.badgePriority': 'time',
                    'explorerDates.enableContextMenu': false,
                    'explorerDates.progressiveLoading': false
                }
            }
        };
    }

    async saveCurrentConfiguration(templateName, description = '') {
        try {
            const config = vscode.workspace.getConfiguration('explorerDates');
            const settings = {};
            
            // Extract all explorer-dates settings
            const inspect = config.inspect();
            if (inspect) {
                for (const [key, value] of Object.entries(inspect)) {
                    if (value && typeof value === 'object' && 'workspaceValue' in value) {
                        settings[`explorerDates.${key}`] = value.workspaceValue;
                    } else if (value && typeof value === 'object' && 'globalValue' in value) {
                        settings[`explorerDates.${key}`] = value.globalValue;
                    }
                }
            }

            const template = {
                name: templateName,
                description: description,
                createdAt: new Date().toISOString(),
                version: '1.0.0',
                settings: settings
            };

            const templateId = templateName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const storedTemplates = this._getStoredTemplates();
            storedTemplates[templateId] = template;
            await this._saveStoredTemplates(storedTemplates);

            // Optional sync to filesystem for desktop users
            const syncPath = config.get('templateSyncPath', '');
            if (syncPath && !this._fs.isWeb) {
                try {
                    const targetPath = `${syncPath.replace(/[/\\]?$/, '')}/${templateId}.json`;
                    await this._fs.writeFile(targetPath, JSON.stringify(template, null, 2));
                    logger.info(`Synced template to ${targetPath}`);
                } catch (syncError) {
                    logger.warn('Failed to sync template to disk path', syncError);
                }
            }
            
            vscode.window.showInformationMessage(`Template "${templateName}" saved successfully!`);
            logger.info(`Saved workspace template: ${templateName}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to save template:', error);
            vscode.window.showErrorMessage(`Failed to save template: ${error.message}`);
            return false;
        }
    }

    async loadTemplate(templateId) {
        try {
            const template = this._getTemplate(templateId);
            if (!template) {
                throw new Error(`Template "${templateId}" not found`);
            }

            // Apply settings
            const config = vscode.workspace.getConfiguration();
            for (const [key, value] of Object.entries(template.settings)) {
                await config.update(key, value, vscode.ConfigurationTarget.Workspace);
            }

            vscode.window.showInformationMessage(`Template "${template.name}" applied successfully!`);
            logger.info(`Applied workspace template: ${template.name}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to load template:', error);
            vscode.window.showErrorMessage(`Failed to load template: ${error.message}`);
            return false;
        }
    }

    async getAvailableTemplates() {
        const templates = [];
        
        // Add built-in templates
        for (const [id, template] of Object.entries(this.builtInTemplates)) {
            templates.push({
                id: id,
                name: template.name,
                description: template.description,
                type: 'built-in',
                createdAt: null
            });
        }

        // Add custom templates from storage
        try {
            const storedTemplates = this._getStoredTemplates();
            for (const [id, template] of Object.entries(storedTemplates)) {
                templates.push({
                    id,
                    name: template.name,
                    description: template.description,
                    type: 'custom',
                    createdAt: template.createdAt
                });
            }
        } catch (error) {
            logger.error('Failed to load custom templates:', error);
        }

        return templates;
    }

    async deleteTemplate(templateId) {
        try {
            if (this.builtInTemplates[templateId]) {
                vscode.window.showErrorMessage('Cannot delete built-in templates');
                return false;
            }

            const storedTemplates = this._getStoredTemplates();
            if (!storedTemplates[templateId]) {
                throw new Error(`Template "${templateId}" not found`);
            }

            delete storedTemplates[templateId];
            await this._saveStoredTemplates(storedTemplates);
            
            vscode.window.showInformationMessage(`Template "${templateId}" deleted successfully!`);
            logger.info(`Deleted workspace template: ${templateId}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to delete template:', error);
            vscode.window.showErrorMessage(`Failed to delete template: ${error.message}`);
            return false;
        }
    }

    async exportTemplate(templateId, exportTarget) {
        try {
            const template = this._getTemplate(templateId);
            if (!template) {
                throw new Error(`Template "${templateId}" not found`);
            }

            const payload = JSON.stringify(template, null, 2);

            if (this._fs.isWeb) {
                const encoded = encodeURIComponent(payload);
                await vscode.env.openExternal(vscode.Uri.parse(`data:application/json;charset=utf-8,${encoded}`));
                vscode.window.showInformationMessage('Template download triggered in browser');
                return true;
            }

            const targetPath = exportTarget instanceof vscode.Uri ? exportTarget.fsPath : exportTarget;
            await this._fs.writeFile(targetPath, payload);
            
            vscode.window.showInformationMessage(`Template exported to ${targetPath}`);
            logger.info(`Exported template ${templateId} to ${targetPath}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to export template:', error);
            vscode.window.showErrorMessage(`Failed to export template: ${error.message}`);
            return false;
        }
    }

    async importTemplate(importTarget) {
        try {
            const target = importTarget instanceof vscode.Uri ? importTarget : vscode.Uri.file(importTarget);
            const templateData = await this._fs.readFile(target, 'utf8');
            const template = JSON.parse(templateData);
            
            // Validate template structure
            if (!template.name || !template.settings) {
                throw new Error('Invalid template format');
            }

            const templateName = template.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const storedTemplates = this._getStoredTemplates();
            storedTemplates[templateName] = template;
            await this._saveStoredTemplates(storedTemplates);
            
            vscode.window.showInformationMessage(`Template "${template.name}" imported successfully!`);
            logger.info(`Imported template: ${template.name}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to import template:', error);
            vscode.window.showErrorMessage(`Failed to import template: ${error.message}`);
            return false;
        }
    }

    async showTemplateManager() {
        try {
            const templates = await this.getAvailableTemplates();
            
            const panel = vscode.window.createWebviewPanel(
                'templateManager',
                'Explorer Dates - Template Manager',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = this.getTemplateManagerHtml(templates);
            
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'loadTemplate':
                        await this.loadTemplate(message.templateId);
                        break;
                    case 'deleteTemplate': {
                        await this.deleteTemplate(message.templateId);
                        // Refresh templates list
                        const updatedTemplates = await this.getAvailableTemplates();
                        panel.webview.postMessage({ command: 'refreshTemplates', templates: updatedTemplates });
                        break;
                    }
                    case 'exportTemplate': {
                        const result = await vscode.window.showSaveDialog({
                            defaultUri: vscode.Uri.file(`${message.templateId}.json`),
                            filters: { 'JSON': ['json'] }
                        });
                        if (result) {
                            await this.exportTemplate(message.templateId, result);
                        }
                        break;
                    }
                    case 'saveConfig': {
                        await this.saveCurrentConfiguration(message.name, message.description);
                        const updatedTemplates = await this.getAvailableTemplates();
                        panel.webview.postMessage({ command: 'refreshTemplates', templates: updatedTemplates });
                        break;
                    }
                    case 'importTemplate': {
                        const result = await vscode.window.showOpenDialog({
                            canSelectMany: false,
                            filters: { 'JSON': ['json'] }
                        });
                        if (result && result[0]) {
                            await this.importTemplate(result[0]);
                            const updatedTemplates = await this.getAvailableTemplates();
                            panel.webview.postMessage({ command: 'refreshTemplates', templates: updatedTemplates });
                        }
                        break;
                    }
                }
            });

            logger.info('Template Manager opened');
        } catch (error) {
            logger.error('Failed to show template manager:', error);
            vscode.window.showErrorMessage('Failed to open Template Manager');
        }
    }

    getTemplateManagerHtml(templates) {
        const templateItems = templates.map(template => `
            <div class="template-item ${template.type}">
                <div class="template-header">
                    <h3>${template.name}</h3>
                    <span class="template-type">${template.type}</span>
                </div>
                <p class="template-description">${template.description}</p>
                ${template.createdAt ? `<small>Created: ${new Date(template.createdAt).toLocaleDateString()}</small>` : ''}
                <div class="template-actions">
                    <button onclick="loadTemplate('${template.id}')">Apply</button>
                    <button onclick="exportTemplate('${template.id}')">Export</button>
                    ${template.type === 'custom' ? `<button onclick="deleteTemplate('${template.id}')" class="delete">Delete</button>` : ''}
                </div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Template Manager</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                .header {
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                .template-item {
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    background-color: var(--vscode-editor-background);
                }
                .template-item.built-in {
                    border-left: 4px solid var(--vscode-charts-blue);
                }
                .template-item.custom {
                    border-left: 4px solid var(--vscode-charts-green);
                }
                .template-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .template-header h3 {
                    margin: 0;
                    color: var(--vscode-foreground);
                }
                .template-type {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }
                .template-description {
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 15px;
                }
                .template-actions {
                    display: flex;
                    gap: 10px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                button.delete {
                    background-color: var(--vscode-errorForeground);
                    color: white;
                }
                button.delete:hover {
                    background-color: var(--vscode-errorForeground);
                    opacity: 0.8;
                }
                .actions {
                    margin-bottom: 30px;
                }
                .actions button {
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎨 Explorer Dates Template Manager</h1>
                <p>Apply, manage, and share your decoration configurations</p>
            </div>
            
            <div class="actions">
                <button onclick="saveCurrentConfig()">💾 Save Current Config</button>
                <button onclick="importTemplate()">📥 Import Template</button>
            </div>

            <div class="templates-grid">
                ${templateItems}
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function loadTemplate(templateId) {
                    vscode.postMessage({ command: 'loadTemplate', templateId: templateId });
                }
                
                function deleteTemplate(templateId) {
                    if (confirm('Are you sure you want to delete this template?')) {
                        vscode.postMessage({ command: 'deleteTemplate', templateId: templateId });
                    }
                }
                
                function exportTemplate(templateId) {
                    vscode.postMessage({ command: 'exportTemplate', templateId: templateId });
                }
                
                function saveCurrentConfig() {
                    const name = prompt('Enter template name:');
                    if (name) {
                        const description = prompt('Enter description (optional):') || '';
                        vscode.postMessage({ command: 'saveConfig', name: name, description: description });
                    }
                }
                
                function importTemplate() {
                    vscode.postMessage({ command: 'importTemplate' });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'refreshTemplates') {
                        location.reload();
                    }
                });
            </script>
        </body>
        </html>`;
    }
}

module.exports = { WorkspaceTemplatesManager };
