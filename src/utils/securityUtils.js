const { normalizePath, getUriPath } = require('./pathUtils');
const { getLogger } = require('./logger');

/**
 * Security utilities for safe file path handling and input validation
 */

const logger = getLogger();

// Maximum safe path length (Windows MAX_PATH is 260, but we'll be more conservative)
const MAX_SAFE_PATH_LENGTH = 240;

// Maximum safe file name length  
const MAX_SAFE_FILENAME_LENGTH = 255;

// Dangerous characters that should not appear in file paths
const DANGEROUS_PATH_CHARS = /[\x00-\x1f\x7f<>:"|?*]/g;
const DANGEROUS_PATH_CHARS_TEST = /[\x00-\x1f\x7f<>:"|?*]/;

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
    /\.\./,           // Directory traversal
    /\.\.[\\/]/,      // Directory traversal with separator
    /[\\/]\.\./,      // Directory traversal after separator
    /^\.\.$/,         // Exact match for '..'
    /^\.\.[\\/]/,     // Starting with traversal
    /[\\/]\.\.$/, // Ending with traversal
];

// Reserved Windows file names (case insensitive)
const WINDOWS_RESERVED_NAMES = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
]);

// Suspicious file extensions that might indicate malicious content
const SUSPICIOUS_EXTENSIONS = new Set([
    '.exe', '.scr', '.bat', '.cmd', '.pif', '.vbs', '.js', '.jar', 
    '.com', '.msi', '.dll', '.dmg', '.pkg', '.deb', '.rpm'
]);

// Development-oriented extensions that are common inside workspace repos
const WORKSPACE_SAFE_EXTENSIONS = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.rb', '.rs', '.go', '.php', '.java', '.kt', '.swift',
    '.cs', '.c', '.cpp', '.h', '.hpp',
    '.html', '.css', '.scss', '.less',
    '.json', '.jsonc', '.md', '.mdx', '.txt',
    '.sh', '.bash', '.yml', '.yaml'
]);

const detectSecurityEnvironment = () => {
    if (
        process.env.EXPLORER_DATES_TEST_MODE === '1' ||
        process.env.NODE_ENV === 'test' ||
        process.env.VSCODE_TEST === '1'
    ) {
        return 'test';
    }
    if (
        process.env.EXPLORER_DATES_DEV_MODE === '1' ||
        process.env.NODE_ENV === 'development'
    ) {
        return 'development';
    }
    return 'production';
};

/**
 * Validate and sanitize file paths to prevent security issues
 */
class SecurityValidator {
    /**
     * Check if a path contains path traversal attempts
     * @param {string|object} input - Path string or URI object
     * @returns {boolean} True if path traversal is detected
     */
    static hasPathTraversal(input) {
        const path = this._extractPath(input);
        if (!path || typeof path !== 'string') {
            return false;
        }

        // Normalize and check for traversal patterns
        const normalized = normalizePath(path);
        return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(normalized));
    }

    /**
     * Check if a path contains dangerous characters
     * @param {string|object} input - Path string or URI object
     * @returns {boolean} True if dangerous characters are found
     */
    static hasDangerousChars(input) {
        const path = this._extractPath(input);
        if (!path || typeof path !== 'string') {
            return false;
        }

        // Use non-global regex for testing
        return DANGEROUS_PATH_CHARS_TEST.test(path);
    }

    /**
     * Check if a filename is a Windows reserved name
     * @param {string} filename - File name to check
     * @returns {boolean} True if it's a reserved name
     */
    static isWindowsReservedName(filename) {
        if (!filename || typeof filename !== 'string') {
            return false;
        }

        // Remove extension and check base name
        const baseName = filename.split('.')[0].toUpperCase();
        return WINDOWS_RESERVED_NAMES.has(baseName);
    }

    /**
     * Check if a file extension is potentially suspicious
     * @param {string} extension - File extension (with or without dot)
     * @returns {boolean} True if extension is suspicious
     */
    static isSuspiciousExtension(extension, options = {}) {
        const {
            workspaceContext = true
        } = options;

        if (!extension || typeof extension !== 'string') {
            return false;
        }

        const normalized = extension.toLowerCase();
        const withDot = normalized.startsWith('.') ? normalized : `.${normalized}`;

        if (workspaceContext && WORKSPACE_SAFE_EXTENSIONS.has(withDot)) {
            return false;
        }

        return SUSPICIOUS_EXTENSIONS.has(withDot);
    }

    /**
     * Check if a path exceeds safe length limits
     * @param {string|object} input - Path string or URI object  
     * @returns {boolean} True if path is too long
     */
    static isPathTooLong(input) {
        const path = this._extractPath(input);
        if (!path || typeof path !== 'string') {
            return false;
        }

        return path.length > MAX_SAFE_PATH_LENGTH;
    }

    /**
     * Check if a filename exceeds safe length limits
     * @param {string} filename - File name to check
     * @returns {boolean} True if filename is too long
     */
    static isFilenameTooLong(filename) {
        if (!filename || typeof filename !== 'string') {
            return false;
        }

        return filename.length > MAX_SAFE_FILENAME_LENGTH;
    }

    /**
     * Comprehensive security validation of a file path
     * @param {string|object} input - Path string or URI object
     * @param {object} options - Validation options
     * @returns {object} Validation result with details
     */
    static validatePath(input, options = {}) {
        const {
            allowSuspiciousExtensions = false,
            allowWindowsReservedNames = false,
            strictLength = true,
            workspaceContext = true
        } = options;

        const path = this._extractPath(input);
        const issues = [];
        const warnings = [];

        if (!path || typeof path !== 'string') {
            return {
                isValid: false,
                path: path,
                issues: ['Invalid or empty path'],
                warnings: [],
                isSafe: false
            };
        }

        // Critical security checks
        if (this.hasPathTraversal(path)) {
            issues.push('Path contains directory traversal attempts');
        }

        if (this.hasDangerousChars(path)) {
            issues.push('Path contains dangerous characters');
        }

        // Length checks
        if (strictLength && this.isPathTooLong(path)) {
            issues.push(`Path exceeds maximum length (${MAX_SAFE_PATH_LENGTH})`);
        }

        // Extract filename for additional checks
        const filename = path.split(/[/\\]/).pop() || '';
        
        if (strictLength && this.isFilenameTooLong(filename)) {
            issues.push(`Filename exceeds maximum length (${MAX_SAFE_FILENAME_LENGTH})`);
        }

        // Warning-level checks
        if (!allowWindowsReservedNames && this.isWindowsReservedName(filename)) {
            warnings.push('Filename is a Windows reserved name');
        }

        const extension = filename.includes('.') ? filename.split('.').pop() : '';
        if (!allowSuspiciousExtensions && this.isSuspiciousExtension(extension, { workspaceContext })) {
            warnings.push('File extension is potentially suspicious');
        }

        return {
            isValid: issues.length === 0,
            path: path,
            filename: filename,
            extension: extension,
            issues: issues,
            warnings: warnings,
            isSafe: issues.length === 0 && warnings.length === 0
        };
    }

    /**
     * Sanitize a path by removing or encoding dangerous characters
     * @param {string|object} input - Path string or URI object
     * @param {object} options - Sanitization options
     * @returns {string} Sanitized path
     */
    static sanitizePath(input, options = {}) {
        const {
            replacementChar = '_',
            preserveExtension = true
        } = options;

        let path = this._extractPath(input);
        if (!path || typeof path !== 'string') {
            return '';
        }

        // Remove null characters
        path = path.replace(/\x00/g, '');

        // Resolve path traversal by removing .. segments
        const isAbsolute = path.startsWith('/');
        const segments = normalizePath(path).split('/').filter(Boolean);
        const cleanSegments = [];
        
        for (const segment of segments) {
            if (segment === '..') {
                // Remove previous segment if it exists
                if (cleanSegments.length > 0) {
                    cleanSegments.pop();
                }
                // Skip the .. segment entirely
                continue;
            }
            if (segment !== '.') {
                cleanSegments.push(segment);
            }
        }

        path = (isAbsolute ? '/' : '') + cleanSegments.join('/');

        // Replace dangerous characters
        path = path.replace(DANGEROUS_PATH_CHARS, replacementChar);

        // Handle Windows reserved names
        if (preserveExtension) {
            const parts = path.split('/');
            const lastPart = parts[parts.length - 1];
            
            if (lastPart && this.isWindowsReservedName(lastPart)) {
                const fileParts = lastPart.split('.');
                fileParts[0] = fileParts[0] + '_safe';
                parts[parts.length - 1] = fileParts.join('.');
                path = parts.join('/');
            }
        }

        // Truncate if too long
        if (path.length > MAX_SAFE_PATH_LENGTH) {
            path = path.substring(0, MAX_SAFE_PATH_LENGTH);
            logger.warn('Path truncated due to length:', path);
        }

        return path;
    }

    /**
     * Check if a path is within allowed workspace boundaries
     * @param {string|object} targetPath - Path to check
     * @param {string[]} allowedPaths - Array of allowed root paths  
     * @returns {boolean} True if path is within boundaries
     */
    static isWithinBoundaries(targetPath, allowedPaths = []) {
        const path = this._extractPath(targetPath);
        if (!path || !Array.isArray(allowedPaths) || allowedPaths.length === 0) {
            return false;
        }

        // Resolve path traversals properly by splitting and reconstructing
        const pathSegments = path.split('/').filter(Boolean);
        const resolvedSegments = [];
        
        for (const segment of pathSegments) {
            if (segment === '..') {
                if (resolvedSegments.length > 0) {
                    resolvedSegments.pop();
                }
                // If we have no segments to pop, we're going outside the root
                // This is handled by checking if the result matches allowed paths
            } else if (segment !== '.') {
                resolvedSegments.push(segment);
            }
        }
        
        const resolvedPath = '/' + resolvedSegments.join('/');
        
        return allowedPaths.some(allowedPath => {
            const normalizedAllowed = normalizePath(allowedPath);
            return resolvedPath.startsWith(normalizedAllowed);
        });
    }

    /**
     * Validate a regex pattern for safety (prevent ReDoS)
     * @param {string} pattern - Regex pattern string
     * @returns {object} Validation result
     */
    static validateRegexPattern(pattern) {
        if (!pattern || typeof pattern !== 'string') {
            return { isValid: false, issue: 'Invalid pattern' };
        }

        // Check for catastrophic backtracking patterns
        const dangerousPatterns = [
            /\([^)]*\+[^)]*\)\+/,        // (a+)+ - nested quantifiers
            /\([^)]*\*[^)]*\)\*/,        // (a*)* - nested quantifiers  
            /\([^)]*\+[^)]*\)\*/,        // (a+)* - nested quantifiers
            /\([^)]*\*[^)]*\)\+/,        // (a*)+ - nested quantifiers
            /\+.*\*|{\d+,}.*\*/,         // Multiple greedy quantifiers
            /\([^|]*\|[^)]*\)\*/,        // Alternation with star
        ];

        for (const dangerous of dangerousPatterns) {
            if (dangerous.test(pattern)) {
                return { 
                    isValid: false, 
                    issue: 'Pattern may cause catastrophic backtracking (ReDoS)'
                };
            }
        }

        try {
            new RegExp(pattern);
            return { isValid: true };
        } catch (error) {
            return { 
                isValid: false, 
                issue: `Invalid regex syntax: ${error.message}` 
            };
        }
    }

    /**
     * Extract path string from various input types
     * @private
     */
    static _extractPath(input) {
        if (!input) return '';
        if (typeof input === 'string') return input;
        
        // Try various path extraction methods
        try {
            return getUriPath(input);
        } catch {
            return String(input);
        }
    }
}

/**
 * Security-focused file operation wrapper
 */
class SecureFileOperations {
    /**
     * Validate file URI before operations
     * @param {object} uri - VS Code URI object
     * @param {string[]} allowedWorkspaces - Allowed workspace paths
     * @returns {object} Validation result
     */
    static validateFileUri(uri, allowedWorkspaces = []) {
        if (!uri || typeof uri !== 'object') {
            return { 
                isValid: false, 
                issue: 'Invalid URI object' 
            };
        }

        // Check URI scheme
        if (uri.scheme !== 'file' && uri.scheme !== 'vscode-vfs') {
            return { 
                isValid: false, 
                issue: `Unsupported URI scheme: ${uri.scheme}` 
            };
        }

        // Validate path
        const pathValidation = SecurityValidator.validatePath(uri);
        if (!pathValidation.isValid) {
            return {
                isValid: false,
                issue: `Path validation failed: ${pathValidation.issues.join(', ')}`
            };
        }

        // Check workspace boundaries
        if (allowedWorkspaces.length > 0) {
            if (!SecurityValidator.isWithinBoundaries(uri, allowedWorkspaces)) {
                return {
                    isValid: false,
                    issue: 'Path is outside allowed workspace boundaries'
                };
            }
        }

        return { 
            isValid: true,
            warnings: pathValidation.warnings
        };
    }

    /**
     * Create a secure exclusion pattern validator
     * @param {string[]} patterns - Array of exclusion patterns
     * @returns {object} Validation results
     */
    static validateExclusionPatterns(patterns) {
        if (!Array.isArray(patterns)) {
            return { isValid: false, issue: 'Patterns must be an array' };
        }

        const results = [];
        const issues = [];

        for (const pattern of patterns) {
            if (typeof pattern !== 'string') {
                issues.push(`Invalid pattern type: ${typeof pattern}`);
                continue;
            }

            // Convert glob to regex for validation
            const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');

            const regexValidation = SecurityValidator.validateRegexPattern(regexPattern);
            
            results.push({
                pattern: pattern,
                isValid: regexValidation.isValid,
                issue: regexValidation.issue
            });

            if (!regexValidation.isValid) {
                issues.push(`Pattern "${pattern}": ${regexValidation.issue}`);
            }
        }

        return {
            isValid: issues.length === 0,
            results: results,
            issues: issues
        };
    }
}

module.exports = {
    SecurityValidator,
    SecureFileOperations,
    detectSecurityEnvironment,
    
    // Constants for external use
    MAX_SAFE_PATH_LENGTH,
    MAX_SAFE_FILENAME_LENGTH,
    DANGEROUS_PATH_CHARS,
    WINDOWS_RESERVED_NAMES: Array.from(WINDOWS_RESERVED_NAMES),
    SUSPICIOUS_EXTENSIONS: Array.from(SUSPICIOUS_EXTENSIONS)
};
