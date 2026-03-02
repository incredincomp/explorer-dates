#!/usr/bin/env node

const assert = require('assert');

const { DEFAULT_WARNING_PATTERNS } = require('./helpers/warningFilters');

function findFreshnessPattern() {
    return DEFAULT_WARNING_PATTERNS.find((pattern) =>
        pattern instanceof RegExp && String(pattern).includes('Freshness source unavailable, falling back to unknown')
    );
}

function main() {
    const freshnessPattern = findFreshnessPattern();
    assert(freshnessPattern, 'Expected freshness warning filter pattern to be registered');

    const shouldAllowGit = 'Freshness source unavailable, falling back to unknown {"reason":"no-source","policy":"git","uri":"/tmp/a"}';
    const shouldAllowGithub = 'Freshness source unavailable, falling back to unknown {"reason":"no-source","policy":"github","uri":"/tmp/a"}';
    const shouldRejectAuto = 'Freshness source unavailable, falling back to unknown {"reason":"no-source","policy":"auto","uri":"/tmp/a"}';
    const shouldRejectOther = 'Freshness source unavailable, falling back to unknown {"reason":"other","policy":"gitlab","uri":"/tmp/a"}';
    const shouldRejectDifferentWarning = 'Security warning: Something else happened';

    assert(freshnessPattern.test(shouldAllowGit), 'Pattern should match strict git policy warnings');
    assert(freshnessPattern.test(shouldAllowGithub), 'Pattern should match strict github policy warnings');
    assert(!freshnessPattern.test(shouldRejectAuto), 'Pattern should not match auto policy warnings');
    assert(!freshnessPattern.test(shouldRejectOther), 'Pattern should not match non-git/non-github policies');
    assert(!freshnessPattern.test(shouldRejectDifferentWarning), 'Pattern should not match unrelated warnings');

    console.log('✅ Warning filter scope tests passed');
}

main();
