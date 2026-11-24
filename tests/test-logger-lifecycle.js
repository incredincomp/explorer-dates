#!/usr/bin/env node

const assert = require('assert');
const { createTestMock } = require('./helpers/mockVscode');

const GLOBAL_LOGGER_KEY = '__explorerDatesLogger';
const previousLogger = global[GLOBAL_LOGGER_KEY];
const mock = createTestMock();

delete global[GLOBAL_LOGGER_KEY];

try {
    const { getLogger } = require('../src/utils/logger');
    const facade = getLogger();
    const context = { subscriptions: [facade] };

    assert.strictEqual(
        typeof facade.dispose,
        'function',
        'LoggerFacade must be disposable when registered as a VS Code subscription'
    );

    const { getOrCreateLogger } = require('../src/chunks/logger-impl-chunk');
    assert.strictEqual(
        getOrCreateLogger(),
        facade,
        'Logger implementation should hydrate the registered facade'
    );
    assert.strictEqual(typeof facade._impl?.dispose, 'function');

    assert.doesNotThrow(() => context.subscriptions.forEach((subscription) => subscription.dispose()));
    assert.strictEqual(facade._impl, null, 'Disposing the facade should release the logger implementation');
    assert.strictEqual(global[GLOBAL_LOGGER_KEY], null, 'Disposing the facade should clear the shared logger');

    console.log('Logger lifecycle tests passed');
} finally {
    mock.dispose();
    if (previousLogger === undefined) {
        delete global[GLOBAL_LOGGER_KEY];
    } else {
        global[GLOBAL_LOGGER_KEY] = previousLogger;
    }
}
