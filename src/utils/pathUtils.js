function normalizePath(input = '') {
    if (!input) {
        return '';
    }
    return input.replace(/\\/g, '/');
}

function getSegments(input = '') {
    const normalized = normalizePath(input);
    return normalized ? normalized.split('/').filter(Boolean) : [];
}

function getFileName(input = '') {
    const segments = getSegments(input);
    return segments.length ? segments[segments.length - 1] : '';
}

function getExtension(input = '') {
    const fileName = getFileName(input);
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex <= 0) {
        return '';
    }
    return fileName.substring(dotIndex).toLowerCase();
}

function getDirectory(input = '') {
    const normalized = normalizePath(input);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === -1) {
        return '';
    }
    return normalized.substring(0, lastSlash);
}

function joinPath(...segments) {
    return normalizePath(segments.filter(Boolean).join('/')).replace(/\/+/g, '/');
}

function getCacheKey(input = '') {
    return normalizePath(input).toLowerCase();
}

function getUriPath(target = '') {
    if (!target) {
        return '';
    }
    if (typeof target === 'string') {
        return target;
    }
    if (typeof target.fsPath === 'string' && target.fsPath.length > 0) {
        return target.fsPath;
    }
    if (typeof target.path === 'string' && target.path.length > 0) {
        return target.path;
    }
    if (typeof target.toString === 'function') {
        try {
            return target.toString(true);
        } catch {
            return target.toString();
        }
    }
    return String(target);
}

function getRelativePath(base = '', target = '') {
    const normalizedBase = normalizePath(base);
    const normalizedTarget = normalizePath(target);
    if (!normalizedBase) {
        return normalizedTarget;
    }

    if (normalizedTarget.startsWith(normalizedBase)) {
        return normalizedTarget.substring(normalizedBase.length).replace(/^\/+/, '');
    }

    return normalizedTarget;
}

module.exports = {
    normalizePath,
    getFileName,
    getExtension,
    getDirectory,
    joinPath,
    getCacheKey,
    getUriPath,
    getRelativePath
};
