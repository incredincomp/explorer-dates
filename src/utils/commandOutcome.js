'use strict';

const COMMAND_OUTCOME = Symbol('explorerDates.commandOutcome');
const OUTCOME_CATEGORIES = Object.freeze({
    BEHAVIORAL_SUCCESS: 'behavioral-success',
    EXPECTED_CANCELLATION: 'expected-cancellation',
    EXPECTED_EMPTY_RESULT: 'expected-empty-result',
    HANDLED_COMMAND_FAILURE: 'handled-command-failure',
    UNHANDLED_COMMAND_FAILURE: 'unhandled-command-failure'
});
function createOutcome(category, value, error, errorContext) {
    return Object.freeze({ [COMMAND_OUTCOME]: true, category, value, error, errorContext: errorContext || null });
}
const commandSuccess = value => createOutcome(OUTCOME_CATEGORIES.BEHAVIORAL_SUCCESS, value);
const commandCancellation = value => createOutcome(OUTCOME_CATEGORIES.EXPECTED_CANCELLATION, value);
const commandEmpty = value => createOutcome(OUTCOME_CATEGORIES.EXPECTED_EMPTY_RESULT, value);
const commandFailure = (error, context) => createOutcome(OUTCOME_CATEGORIES.HANDLED_COMMAND_FAILURE, undefined, error, context);
const isCommandOutcome = value => Boolean(value && value[COMMAND_OUTCOME] === true);
module.exports = { COMMAND_OUTCOME, OUTCOME_CATEGORIES, commandSuccess, commandCancellation, commandEmpty, commandFailure, isCommandOutcome };
