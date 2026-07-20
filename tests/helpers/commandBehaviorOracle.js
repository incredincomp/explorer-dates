'use strict';

const { OUTCOME_CATEGORIES, isCommandOutcome } = require('../../src/utils/commandOutcome');

async function observeCommand({ invoke, getOutcome, getRecordedResult, errorsLogged = [], errorsShown = [], expectedSideEffect, actualSideEffect, timeoutMs = 1000 }) {
    let state = 'pending';
    let result;
    let error;
    let timedOut = false;
    const pending = Promise.resolve().then(invoke);
    let timeoutHandle;
    try {
        result = await Promise.race([pending, new Promise((_, reject) => { timeoutHandle = setTimeout(() => { const timeout = new Error('oracle timeout'); timeout.code = 'COMMAND_ORACLE_TIMEOUT'; reject(timeout); }, timeoutMs); })]);
        state = 'fulfilled';
    } catch (caught) {
        state = 'rejected'; error = caught; timedOut = caught?.code === 'COMMAND_ORACLE_TIMEOUT';
    } finally {
        clearTimeout(timeoutHandle);
    }
    const outcome = typeof getOutcome === 'function' ? getOutcome() : null;
    const recorded = typeof getRecordedResult === 'function' ? getRecordedResult() : null;
    let classification = 'unsupported';
    if (timedOut) classification = 'timeout';
    else if (outcome?.category === OUTCOME_CATEGORIES.HANDLED_COMMAND_FAILURE) classification = 'handled-command-failure';
    else if (outcome?.category === OUTCOME_CATEGORIES.EXPECTED_CANCELLATION) classification = 'expected-cancellation';
    else if (outcome?.category === OUTCOME_CATEGORIES.EXPECTED_EMPTY_RESULT) classification = 'expected-empty-result';
    else if (state === 'rejected') classification = 'unhandled-command-failure';
    else if (errorsShown.length > 1) classification = 'swallowed-product-failure';
    else if (errorsShown.length || errorsLogged.length || (expectedSideEffect !== undefined && actualSideEffect !== expectedSideEffect)) classification = 'false-success';
    else if (outcome?.category === OUTCOME_CATEGORIES.BEHAVIORAL_SUCCESS || state === 'fulfilled') classification = 'behavioral-success';
    return { promiseState: state, result, error: error?.message || null, explicitOutcome: isCommandOutcome(outcome) ? outcome.category : null, recordedResult: recorded, errorsLogged, errorsShown, expectedSideEffect, actualSideEffect, timedOut, classification };
}

module.exports = { observeCommand };
