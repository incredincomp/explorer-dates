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
    getRelativePath
};
