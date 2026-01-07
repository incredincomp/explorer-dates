#!/usr/bin/env node

/**
 * Isolation harness that forces decoration cache bypass to stress-test
 * flyweight caches and decoration pooling behaviour.
 */

process.env.EXPLORER_DATES_FORCE_CACHE_BYPASS = '1';
process.env.MEMORY_SOAK_LABEL = process.env.MEMORY_SOAK_LABEL || 'forced-cache-bypass';
if (!process.env.MEMORY_WORKSPACE_PROFILE && !process.env.MEMORY_WORKSPACE_PROFILES) {
    process.env.MEMORY_WORKSPACE_PROFILE = '450k';
}

require('./test-memory-soak');
