function activate() {
    // Harness extension does nothing: it exists so the VS Code test runner has a
    // development extension to load while we validate the packaged VSIX.
    return undefined;
}

function deactivate() {
    // No-op
}

module.exports = {
    activate,
    deactivate
};
