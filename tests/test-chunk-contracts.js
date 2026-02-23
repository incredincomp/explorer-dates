#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const { scheduleExit } = require('./helpers/forceExit');
const {
    CHUNK_EXPORT_CONTRACTS,
    normalizeModuleExports,
    listExportKeys,
    matchesExpectedKind,
    formatMissingExportsError
} = require('./helpers/chunk-contracts');

function resolveAvailableDistPath(candidates = []) {
    for (const candidate of candidates) {
        if (candidate && fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function normalizeExportDescriptor(entry) {
    if (typeof entry === 'string') {
        return { name: entry, kinds: [] };
    }
    return entry;
}

function validateExports(contract, moduleExports, modulePath) {
    const normalized = normalizeModuleExports(moduleExports);
    const exportKeys = listExportKeys(normalized.flat);
    const missing = [];

    const required = (contract.requiredExports || []).map(normalizeExportDescriptor);
    for (const entry of required) {
        const value = normalized.flat ? normalized.flat[entry.name] : undefined;
        if (!matchesExpectedKind(value, entry.kinds || [])) {
            missing.push({ name: entry.name, kinds: entry.kinds || [] });
        }
    }

    if (contract.requiredAnyOf && contract.requiredAnyOf.length) {
        const anySatisfied = contract.requiredAnyOf.some((group) => {
            return group.every((rawEntry) => {
                const entry = normalizeExportDescriptor(rawEntry);
                const value = normalized.flat ? normalized.flat[entry.name] : undefined;
                return matchesExpectedKind(value, entry.kinds || []);
            });
        });
        if (!anySatisfied) {
            const names = contract.requiredAnyOf.flat().map(normalizeExportDescriptor);
            for (const entry of names) {
                missing.push({ name: entry.name, kinds: entry.kinds || [] });
            }
        }
    }

    if (missing.length) {
        const errorMessage = formatMissingExportsError({
            modulePath,
            missing,
            available: exportKeys,
            contractName: contract.name
        });
        assert.fail(errorMessage);
    }
}

function validateOptionalExports(contract, moduleExports) {
    if (!contract.optionalExports || !contract.optionalExports.length) return;
    const normalized = normalizeModuleExports(moduleExports);
    const exportKeys = listExportKeys(normalized.flat);

    const mismatches = [];
    for (const rawEntry of contract.optionalExports) {
        const entry = normalizeExportDescriptor(rawEntry);
        if (!(entry.name in (normalized.flat || {}))) {
            continue;
        }
        const value = normalized.flat[entry.name];
        if (value == null) {
            continue;
        }
        if (!matchesExpectedKind(value, entry.kinds || [])) {
            mismatches.push({ name: entry.name, kinds: entry.kinds || [] });
        }
    }

    if (mismatches.length) {
        const errorMessage = formatMissingExportsError({
            modulePath: `(optional exports) ${contract.name}`,
            missing: mismatches,
            available: exportKeys,
            contractName: contract.name
        });
        assert.fail(errorMessage);
    }
}

async function run() {
    for (const contract of CHUNK_EXPORT_CONTRACTS) {
        const sourceModule = require(contract.sourcePath);
        validateExports(contract, sourceModule, contract.sourcePath);
        validateOptionalExports(contract, sourceModule);

        const distPath = resolveAvailableDistPath(contract.distPathCandidates || []);
        if (!distPath) {
            console.log(`ℹ️  Skipping dist validation for ${contract.name} (no dist chunk found)`);
            continue;
        }

        const distModule = require(distPath);
        validateExports(contract, distModule, distPath);
        validateOptionalExports(contract, distModule);
    }
}

run()
    .catch((error) => {
        process.exitCode = 1;
        throw error;
    })
    .finally(() => {
        scheduleExit();
    });
