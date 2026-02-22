const { createTestMock } = require('./helpers/mockVscode');

console.log('creating mock');
createTestMock();
console.log('mock created');

try {
    const p = require('../src/fileDateDecorationProvider');
    console.log('required provider successfully', !!p);
} catch (e) {
    console.error('require failed', e && e.message);
    require('./helpers/forceExit').scheduleExit(0, 1);
}
