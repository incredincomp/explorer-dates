const Mocha = require('mocha');
const path = require('path');

async function run() {
    const mocha = new Mocha({ ui: 'tdd', timeout: 30000, color: true });
    mocha.addFile(path.join(__dirname, 'show-file-details.test.js'));
    return new Promise((resolve, reject) => mocha.run(failures => failures ? reject(new Error(`${failures} extension-host test(s) failed`)) : resolve()));
}

module.exports = { run };
