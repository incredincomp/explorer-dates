/**
 * Async execution utility for running shell commands
 */

const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
const isWebEnvironment = env.VSCODE_WEB === 'true';

let execAsync = null;

if (!isWebEnvironment) {
    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        execAsync = promisify(exec);
    } catch {
        execAsync = null;
    }
}

module.exports = {
    execAsync
};
