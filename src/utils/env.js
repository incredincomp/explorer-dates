const vscode = require('vscode');

function isWebEnvironment() {
    try {
        const uiKind = vscode?.env?.uiKind;
        const webKind = vscode?.UIKind?.Web;
        return uiKind !== undefined && webKind !== undefined && uiKind === webKind;
    } catch {
        return false;
    }
}

module.exports = {
    isWebEnvironment
};
