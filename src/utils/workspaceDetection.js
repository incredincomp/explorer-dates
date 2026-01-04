const vscode = require('vscode');
const { getLogger } = require('./logger');

const logger = getLogger();

/**
 * Generates consistent workspace keys for globalState storage
 * Pattern: workspace-name + path hash + profile-hash
 */
function generateWorkspaceKey(workspaceUri, profileName = 'default') {
    if (!workspaceUri) {
        return `unknown-workspace-${profileName}`;
    }

    const fsPath = workspaceUri.fsPath || workspaceUri.path || '';
    const workspaceName = fsPath.split('/').pop() || 'workspace';
    
    // Create consistent hash from path for deduplication
    const pathHash = Math.abs(fsPath.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0)).toString(36).substr(0, 8);
    
    const profileHash = Math.abs(profileName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0)).toString(36).substr(0, 4);
    
    return `${workspaceName}-${pathHash}-${profileHash}`;
}

/**
 * Detects workspace characteristics for auto-suggestion heuristics
 */
async function detectWorkspaceProfile(workspaceUri) {
    try {
        if (!workspaceUri) return 'unknown';
        
        // File count analysis for size-based recommendations
        const files = await vscode.workspace.findFiles('**/*', null, 50001);
        const fileCount = files.length;
        
        let workspaceSize = 'small';
        if (fileCount >= 50000) {
            workspaceSize = 'extreme';
        } else if (fileCount >= 10000) {
            workspaceSize = 'large';
        } else if (fileCount >= 1000) {
            workspaceSize = 'medium';
        }
        
        // Remote environment detection
        const isRemote = vscode.env.remoteName;
        const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        
        // Determine profile based on size and environment
        if (workspaceSize === 'extreme' || (workspaceSize === 'large' && (isRemote || isWeb))) {
            return 'minimal';
        } else if (workspaceSize === 'large' || isRemote || isWeb) {
            return 'balanced';
        }
        
        // Try to detect project type for more specific recommendations
        try {
            const files = await vscode.workspace.fs.readDirectory(workspaceUri);
            const fileNames = files.map(([name]) => name.toLowerCase());
            
            if (fileNames.includes('package.json') || fileNames.includes('yarn.lock')) {
                return 'web-development';
            }
            if (fileNames.some(name => name.endsWith('.ipynb')) || fileNames.includes('requirements.txt')) {
                return 'data-science';
            }
            if (fileNames.includes('docker-compose.yml') || fileNames.includes('.enterprise')) {
                return 'enterprise';
            }
        } catch (error) {
            logger.debug('Project type detection failed:', error);
        }
        
        return 'full';
    } catch (error) {
        logger.error('Workspace profile detection failed:', error);
        return 'unknown';
    }
}

/**
 * Analyzes workspace environment for profile suggestions
 */
async function analyzeWorkspaceEnvironment(workspaceUri) {
    if (!workspaceUri) return null;
    
    try {
        const files = await vscode.workspace.findFiles('**/*', null, 50001);
        const fileCount = files.length;
        
        let workspaceSize = 'small';
        if (fileCount >= 50000) {
            workspaceSize = 'extreme';
        } else if (fileCount >= 10000) {
            workspaceSize = 'large';
        } else if (fileCount >= 1000) {
            workspaceSize = 'medium';
        }
        
        const isRemote = !!vscode.env.remoteName;
        const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        const remoteType = isWeb ? 'web' : isRemote ? 'remote' : 'local';
        
        return {
            workspaceSize,
            fileCount,
            remoteType,
            isRemoteEnvironment: isRemote || isWeb,
            timestamp: Date.now()
        };
    } catch (error) {
        logger.error('Workspace environment analysis failed:', error);
        return null;
    }
}

module.exports = {
    generateWorkspaceKey,
    detectWorkspaceProfile,
    analyzeWorkspaceEnvironment
};