/**
 * Workspace templates chunk - lazy loaded module  
 */

let WorkspaceTemplatesManager = null;
let _createWorkspaceTemplatesManager = null;

async function _ensureTemplatesLogic() {
    if (WorkspaceTemplatesManager && _createWorkspaceTemplatesManager) return;
    try {
        const chunk = await import('./templates-logic-chunk.js');
        WorkspaceTemplatesManager = chunk.WorkspaceTemplatesManager;
        _createWorkspaceTemplatesManager = chunk.createWorkspaceTemplatesManager;
    } catch {
        try {
            const mod = await import('../workspaceTemplates.js');
            WorkspaceTemplatesManager = mod.WorkspaceTemplatesManager;
            _createWorkspaceTemplatesManager = (context) => new WorkspaceTemplatesManager(context);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = {
    WorkspaceTemplatesManager,
    createWorkspaceTemplatesManager: async (context) => {
        await _ensureTemplatesLogic();
        return _createWorkspaceTemplatesManager(context);
    }
};
