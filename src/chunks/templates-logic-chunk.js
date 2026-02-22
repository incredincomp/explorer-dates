const { WorkspaceTemplatesManager } = require('../workspaceTemplates');

module.exports = {
    WorkspaceTemplatesManager,
    createWorkspaceTemplatesManager: (context) => new WorkspaceTemplatesManager(context)
};