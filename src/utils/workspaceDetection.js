const vscode = require('vscode');
const { getLogger } = require('./logger');
const {
    WORKSPACE_SCALE_BALANCED_THRESHOLD,
    WORKSPACE_SCALE_LARGE_THRESHOLD,
    WORKSPACE_SCALE_EXTREME_THRESHOLD,
    WORKSPACE_SCAN_MAX_RESULTS
} = require('../constants');

const logger = getLogger();

// Cache workspace file count to avoid repeated scans during activation
let cachedWorkspaceMetrics = null;

function _getWorkspaceKey(workspaceUri) {
    if (!workspaceUri) return null;
    return workspaceUri.fsPath || workspaceUri.path || null;
}

function setCachedWorkspaceMetrics(workspaceUri, fileCount) {
    const key = _getWorkspaceKey(workspaceUri);
    if (!key || typeof fileCount !== 'number') {
        return;
    }
    cachedWorkspaceMetrics = {
        workspaceKey: key,
        fileCount,
        timestamp: Date.now()
    };
}

function getCachedWorkspaceMetrics(workspaceUri) {
    const key = _getWorkspaceKey(workspaceUri);
    if (!key || !cachedWorkspaceMetrics) {
        return null;
    }
    if (cachedWorkspaceMetrics.workspaceKey !== key) {
        return null;
    }
    return cachedWorkspaceMetrics;
}

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
        const cached = getCachedWorkspaceMetrics(workspaceUri);
        let fileCount;
        if (cached) {
            fileCount = cached.fileCount;
        } else {
            const files = await vscode.workspace.findFiles('**/*', null, WORKSPACE_SCAN_MAX_RESULTS);
            fileCount = files.length;
            setCachedWorkspaceMetrics(workspaceUri, fileCount);
        }
        
        let workspaceSize = 'small';
        if (fileCount >= WORKSPACE_SCALE_EXTREME_THRESHOLD) {
            workspaceSize = 'extreme';
        } else if (fileCount >= WORKSPACE_SCALE_LARGE_THRESHOLD) {
            workspaceSize = 'large';
        } else if (fileCount >= 1000) {
            workspaceSize = 'medium';
        }
        
        // Remote environment detection
        const isRemote = vscode.env.remoteName;
        const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        
        const mediumBalanced = workspaceSize === 'medium' &&
            fileCount >= WORKSPACE_SCALE_BALANCED_THRESHOLD &&
            fileCount < WORKSPACE_SCALE_LARGE_THRESHOLD;

        // Determine profile based on size and environment
        if (workspaceSize === 'extreme' || (workspaceSize === 'large' && (isRemote || isWeb))) {
            return 'minimal';
        } else if (workspaceSize === 'large' || mediumBalanced || isRemote || isWeb) {
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
        const cached = getCachedWorkspaceMetrics(workspaceUri);
        let fileCount;
        if (cached) {
            fileCount = cached.fileCount;
        } else {
            const files = await vscode.workspace.findFiles('**/*', null, WORKSPACE_SCAN_MAX_RESULTS);
            fileCount = files.length;
            setCachedWorkspaceMetrics(workspaceUri, fileCount);
        }
        
        let workspaceSize = 'small';
        if (fileCount >= WORKSPACE_SCALE_EXTREME_THRESHOLD) {
            workspaceSize = 'extreme';
        } else if (fileCount >= WORKSPACE_SCALE_LARGE_THRESHOLD) {
            workspaceSize = 'large';
        } else if (fileCount >= 1000) {
            workspaceSize = 'medium';
        }
        
        const isRemote = !!vscode.env.remoteName;
        const isWeb = vscode.env.uiKind === vscode.UIKind.Web;
        const remoteType = isWeb ? 'web' : isRemote ? 'remote' : 'local';
        
        const mediumBalanced = workspaceSize === 'medium' &&
            fileCount >= WORKSPACE_SCALE_BALANCED_THRESHOLD &&
            fileCount < WORKSPACE_SCALE_LARGE_THRESHOLD;

        return {
            workspaceSize,
            fileCount,
            remoteType,
            isRemoteEnvironment: isRemote || isWeb,
            timestamp: Date.now(),
            mediumBalanced
        };
    } catch (error) {
        logger.error('Workspace environment analysis failed:', error);
        return null;
    }
}

module.exports = {
    generateWorkspaceKey,
    detectWorkspaceProfile,
    analyzeWorkspaceEnvironment,
    setCachedWorkspaceMetrics,
    getCachedWorkspaceMetrics
};
