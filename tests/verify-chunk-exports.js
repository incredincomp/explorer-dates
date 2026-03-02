const fs = require('fs');
const path = require('path');

function scanChunkExports(chunksDir) {
    const assignRe = /module\.exports\s*=/g;
    const propRe = /module\.exports\.[A-Za-z0-9_$]+\s*=/g;
    const issues = [];

    const entries = fs.readdirSync(chunksDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.js')) {
            continue;
        }
        const filePath = path.join(chunksDir, entry.name);
        const data = fs.readFileSync(filePath, 'utf8');
        const positions = [];

        let match;
        while ((match = assignRe.exec(data)) !== null) {
            positions.push({ kind: 'assign', index: match.index });
        }
        while ((match = propRe.exec(data)) !== null) {
            positions.push({ kind: 'prop', index: match.index });
        }
        positions.sort((a, b) => a.index - b.index);

        let sawProp = false;
        for (const pos of positions) {
            if (pos.kind === 'prop') {
                sawProp = true;
                continue;
            }
            if (pos.kind === 'assign' && sawProp) {
                issues.push(filePath);
                break;
            }
        }
    }

    return issues;
}

try {
    console.log('🔍 Verifying dist/chunks export ordering...');
    const chunksDir = path.join(__dirname, '..', 'dist', 'chunks');
    if (!fs.existsSync(chunksDir)) {
        throw new Error(`dist/chunks not found at ${chunksDir}. Run the build before this check.`);
    }

    const issues = scanChunkExports(chunksDir);
    if (issues.length > 0) {
        console.error('❌ Found module.exports overwrite risks in chunk files:');
        for (const filePath of issues) {
            console.error(`- ${filePath}`);
        }
        require('./helpers/forceExit').scheduleExit(0, 1);
        return;
    }

    console.log('✅ No module.exports overwrite risks detected in dist/chunks.');
} catch (error) {
    console.error('❌ Chunk export verification failed:', error.message);
    require('./helpers/forceExit').scheduleExit(0, 1);
}
