const vscode = require('vscode');

let fs = null;
let path = null;
try {
    if (typeof process !== 'undefined' && process.versions?.node && process.env.VSCODE_WEB !== 'true') {
        fs = eval('require')('fs');
        path = eval('require')('path');
    }
} catch {
    fs = null;
    path = null;
}

const textDecoder = typeof globalThis.TextDecoder === 'function'
    ? new globalThis.TextDecoder('utf-8')
    : new (require('util').TextDecoder)('utf-8');

class TemplateStore {
    constructor() {
        this._cache = new Map();
        this._extensionUri = null;
    }

    initialize(context) {
        this._extensionUri = context?.extensionUri ?? null;
    }

    async getTemplate(templateName) {
        if (this._cache.has(templateName)) {
            return this._cache.get(templateName);
        }

        const content = await this._loadTemplate(templateName);
        this._cache.set(templateName, content);
        return content;
    }

    async _loadTemplate(templateName) {
        const fileName = `${templateName}.html`;

        if (this._extensionUri) {
            const templateUri = vscode.Uri.joinPath(this._extensionUri, 'assets', 'templates', fileName);
            const data = await vscode.workspace.fs.readFile(templateUri);
            return textDecoder.decode(data);
        }

        if (fs && path) {
            const fallbackPath = path.resolve(__dirname, '..', '..', 'assets', 'templates', fileName);
            return await fs.promises.readFile(fallbackPath, 'utf8');
        }

        throw new Error(`TemplateStore: Unable to load template "${templateName}" (missing extension context)`);
    }
}

const templateStore = new TemplateStore();

module.exports = {
    templateStore,
    initializeTemplateStore: (context) => templateStore.initialize(context)
};
