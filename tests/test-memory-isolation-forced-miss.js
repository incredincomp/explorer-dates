#!/usr/bin/env node

/**
 * Isolation harness that forces decoration cache bypass to stress-test
 * flyweight caches and decoration pooling behaviour.
 */

process.env.EXPLORER_DATES_FORCE_CACHE_BYPASS = '1';
process.env.MEMORY_SOAK_LABEL = process.env.MEMORY_SOAK_LABEL || 'forced-cache-bypass';

require('./test-memory-soak');
