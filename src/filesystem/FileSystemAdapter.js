const vscode = require('vscode');
const { isWebEnvironment } = require('../utils/env');
const { normalizePath } = require('../utils/pathUtils');
const { ExtensionError, ERROR_CODES, isPermissionError } = require('../utils/errors');
const { ensureDate } = require('../utils/dateHelpers');

const isWebBuild = process.env.VSCODE_WEB === 'true';
const forceWorkspaceFs = process.env.EXPLORER_DATES_FORCE_VSCODE_FS === '1';
let nodeFs = null;
if (!isWebBuild && !forceWorkspaceFs) {
    try {
        nodeFs = require('fs').promises;
    } catch {
        nodeFs = null;
    }
}

class FileSystemAdapter {
    constructor() {
        this.isWeb = isWebBuild || isWebEnvironment();
    }

    _toPath(target) {
        if (!target) {
            return '';
        }

        if (typeof target === 'string') {
            return target;
        }

        // Duck typing check for Uri instead of instanceof
        if (target && typeof target === 'object' && typeof target.fsPath === 'string') {
            return target.fsPath;
        }
        
        if (target && typeof target === 'object' && typeof target.path === 'string') {
            return target.path;
        }

        if (typeof target === 'object') {
            if (typeof target.fsPath === 'string') {
                return target.fsPath;
            }
            if (typeof target.path === 'string') {
                return target.path;
            }
        }

        return String(target);
    }

    _toUri(target) {
        // Duck typing check for Uri instead of instanceof
        if (target && typeof target === 'object' && 
            typeof target.scheme === 'string' && 
            typeof target.path === 'string') {
            return target;
        }

        if (typeof target === 'string') {
            return vscode.Uri.file(target);
        }

        if (target && typeof target === 'object') {
            if (target.uri && target.uri !== target) {
                try {
                    return this._toUri(target.uri);
                } catch {
                    // Fall through to additional shapes
                }
            }

            if (typeof target.fsPath === 'string' && target.fsPath.length > 0) {
                return vscode.Uri.file(target.fsPath);
            }

            if (typeof target.path === 'string' && target.path.length > 0) {
                return vscode.Uri.file(target.path);
            }

            if (typeof target.href === 'string' && target.href.length > 0) {
                return vscode.Uri.parse(target.href);
            }

            if (typeof target.scheme === 'string') {
                return vscode.Uri.from({
                    scheme: target.scheme,
                    authority: target.authority || '',
                    path: target.path || target.fsPath || '',
                    query: target.query || '',
                    fragment: target.fragment || ''
                });
            }

            if (typeof target.toString === 'function') {
                try {
                    const asString = target.toString(true);
                    if (asString && asString !== '[object Object]') {
                        return vscode.Uri.parse(asString);
                    }
                } catch {
                    const fallbackString = target.toString();
                    if (fallbackString && fallbackString !== '[object Object]') {
                        return vscode.Uri.parse(fallbackString);
                    }
                }
            }
        }

        throw new Error(`Unsupported target type: ${typeof target}`);
    }

    async stat(target) {
        if (!this.isWeb && nodeFs) {
            return nodeFs.stat(this._toPath(target));
        }

        const uri = this._toUri(target);
        const stat = await vscode.workspace.fs.stat(uri);
        return {
            ...stat,
            mtime: ensureDate(stat.mtime),
            ctime: ensureDate(stat.ctime),
            birthtime: ensureDate(stat.ctime),
            isFile: () => stat.type === vscode.FileType.File,
            isDirectory: () => stat.type === vscode.FileType.Directory
        };
    }

    async readFile(target, encoding = 'utf8') {
        if (!this.isWeb && nodeFs) {
            return nodeFs.readFile(this._toPath(target), encoding);
        }

        const uri = this._toUri(target);
        const data = await vscode.workspace.fs.readFile(uri);
        if (encoding === null || encoding === 'binary') {
            return data;
        }

        const decoder = new TextDecoder(encoding);
        return decoder.decode(data);
    }

    async writeFile(target, data, encoding = 'utf8') {
        const targetPath = this._toPath(target);
        try {
            if (!this.isWeb && nodeFs) {
                return nodeFs.writeFile(targetPath, data, encoding);
            }

            const uri = this._toUri(target);
            const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
            await vscode.workspace.fs.writeFile(uri, buffer);
        } catch (error) {
            this._handleFsError('write file', targetPath, error);
        }
    }

    async mkdir(target, options = { recursive: true }) {
        const targetPath = this._toPath(target);
        try {
            if (!this.isWeb && nodeFs) {
                return nodeFs.mkdir(targetPath, options);
            }

            const uri = this._toUri(target);
            await vscode.workspace.fs.createDirectory(uri);
        } catch (error) {
            this._handleFsError('create directory', targetPath, error);
        }
    }

    async readdir(target, options = { withFileTypes: false }) {
        if (!this.isWeb && nodeFs) {
            return nodeFs.readdir(this._toPath(target), options);
        }

        const uri = this._toUri(target);
        const entries = await vscode.workspace.fs.readDirectory(uri);

        if (options.withFileTypes) {
            return entries.map(([name, type]) => ({
                name,
                isDirectory: () => type === vscode.FileType.Directory,
                isFile: () => type === vscode.FileType.File
            }));
        }

        return entries.map(([name]) => name);
    }

    async delete(target, options = { recursive: false }) {
        if (!this.isWeb && nodeFs) {
            const fsPath = this._toPath(target);
            if (options.recursive) {
                return nodeFs.rm ? nodeFs.rm(fsPath, options) : nodeFs.rmdir(fsPath, options);
            }
            return nodeFs.unlink(fsPath);
        }

        const uri = this._toUri(target);
        await vscode.workspace.fs.delete(uri, options);
    }

    async exists(target) {
        try {
            await this.stat(target);
            return true;
        } catch {
            return false;
        }
    }

    async ensureDirectory(target) {
        const normalized = normalizePath(this._toPath(target));
        await this.mkdir(normalized, { recursive: true });
    }

    _handleFsError(operation, targetPath, error) {
        if (isPermissionError(error)) {
            throw new ExtensionError(
                ERROR_CODES.FILE_PERMISSION_DENIED,
                `Permission denied while attempting to ${operation}`,
                {
                    path: targetPath,
                    code: error.code
                }
            );
        }
        throw error;
    }
}

const fileSystem = new FileSystemAdapter();

module.exports = {
    FileSystemAdapter,
    fileSystem
};
