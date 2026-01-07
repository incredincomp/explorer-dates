#!/usr/bin/env node

/**
 * Alphabetically sorts the keys in a VS Code settings JSON file.
 * Usage: node scripts/sort-settings.js [.vscode/settings.json]
 */
const fs = require('fs');
const path = require('path');

function sortObject(value) {
    if (Array.isArray(value)) {
        return value.map(sortObject);
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
            .sort((a, b) => a.localeCompare(b))
            .reduce((acc, key) => {
                acc[key] = sortObject(value[key]);
                return acc;
            }, {});
    }

    return value;
}

function main() {
    const targetPath = process.argv[2] || '.vscode/settings.json';
    const absolutePath = path.resolve(process.cwd(), targetPath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        process.exit(1);
    }

    const raw = fs.readFileSync(absolutePath, 'utf8');
    let parsed;

    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        console.error(`Failed to parse JSON in ${absolutePath}: ${error.message}`);
        process.exit(1);
    }

    const sorted = sortObject(parsed);
    const output = JSON.stringify(sorted, null, 4) + '\n';
    fs.writeFileSync(absolutePath, output);
    console.log(`Sorted settings written to ${targetPath}`);
}

main();
