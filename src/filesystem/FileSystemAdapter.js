const vscode = require('vscode');
const { isWebEnvironment } = require('../utils/env');
const { normalizePath } = require('../utils/pathUtils');

const isWebBuild = process.env.VSCODE_WEB === 'true';
let nodeFs = null;
if (!isWebBuild) {
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

        if (target instanceof vscode.Uri) {
            return target.fsPath || target.path;
        }

        return String(target);
    }

    _toUri(target) {
        if (target instanceof vscode.Uri) {
            return target;
        }

        if (typeof target === 'string') {
            return vscode.Uri.file(target);
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
            mtime: new Date(stat.mtime),
            ctime: new Date(stat.ctime),
            birthtime: new Date(stat.ctime),
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
        if (!this.isWeb && nodeFs) {
            return nodeFs.writeFile(this._toPath(target), data, encoding);
        }

        const uri = this._toUri(target);
        const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        await vscode.workspace.fs.writeFile(uri, buffer);
    }

    async mkdir(target, options = { recursive: true }) {
        if (!this.isWeb && nodeFs) {
            return nodeFs.mkdir(this._toPath(target), options);
        }

        const uri = this._toUri(target);
        await vscode.workspace.fs.createDirectory(uri);
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
}

const fileSystem = new FileSystemAdapter();

module.exports = {
    FileSystemAdapter,
    fileSystem
};
