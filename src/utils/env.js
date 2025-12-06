const vscode = require('vscode');

function isWebEnvironment() {
    try {
        return vscode?.env?.uiKind === vscode?.UIKind?.Web;
    } catch {
        return false;
    }
}

module.exports = {
    isWebEnvironment
};
