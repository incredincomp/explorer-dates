#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createTestMock, createExtensionContext } = require('./helpers/mockVscode');
const { addWarningFilters } = require('./helpers/warningFilters');

addWarningFilters([
    /No built artifact available for chunk/,
    /provider-init: initializeAdvancedSystems failed/,
    /Detected existing explorerDates\.resetToDefaults handler/
]);

async function run() {
    const source = fs.readFileSync(path.join(__dirname, '..', 'extension.js'), 'utf8');
    assert.doesNotMatch(source, /context\.exports\s*=/, 'activation must not assign context.exports');
    assert.doesNotMatch(source, /context\.exportsAsync\s*=/, 'activation must not assign context.exportsAsync');
    const mock = createTestMock({ sampleWorkspace: path.join(__dirname, 'fixtures', 'sample-workspace') });
    const extension = require('../extension');
    const context = createExtensionContext();
    Object.preventExtensions(context);
    try {
        const exportedApi = await extension.activate(context);
        assert.strictEqual(typeof exportedApi, 'function', 'enabled API must be returned as a factory');
        assert.strictEqual(Object.prototype.hasOwnProperty.call(context, 'exports'), false, 'context must not gain exports');
        assert.strictEqual(Object.prototype.hasOwnProperty.call(context, 'exportsAsync'), false, 'context must not gain exportsAsync');
        const api = await exportedApi();
        assert.ok(api && typeof api.registerPlugin === 'function' && api.apiVersion === '1.0.0', 'returned API must preserve its public shape');
        await extension.deactivate();
        console.log('Activation API export contract passed.');
    } finally {
        mock.dispose();
    }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
