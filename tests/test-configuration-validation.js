#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const pkg = require(path.join(__dirname, '..', 'package.json'));

function scenario(name, runner) {
    return runner().then(() => console.log(`✅ ${name}`)).catch(err => { console.error(`❌ ${name}:`, err && err.message ? err.message : err); throw err; });
}

(async function main() {
    // Basic schema integrity checks
    await scenario('Configuration schema basic integrity', async () => {
        const config = pkg?.contributes?.configuration;
        assert.ok(config && config.properties, 'package.json must export configuration.properties');

        const properties = config.properties;
        const keys = Object.keys(properties);
        assert.ok(keys.length > 0, 'Configuration must contain at least one property');

        // Ensure our strict validation flag exists and is boolean default
        const strictKey = 'explorerDates.strictPersistentCacheValidation';
        assert.ok(Object.prototype.hasOwnProperty.call(properties, strictKey), `${strictKey} must be present in schema`);
        const strictSchema = properties[strictKey];
        assert.strictEqual(strictSchema.type, 'boolean', `${strictKey} should be boolean`);
        assert.strictEqual(strictSchema.default, false, `${strictKey} default should be false`);

        // Validate numeric bounds are sensible where present
        for (const [key, schema] of Object.entries(properties)) {
            if (schema.type === 'number') {
                assert.ok(Object.prototype.hasOwnProperty.call(schema, 'default'), `${key} (number) should have a default`);
                const def = schema.default;
                if (Object.prototype.hasOwnProperty.call(schema, 'minimum')) {
                    assert.ok(def >= schema.minimum, `${key} default must be >= minimum`);
                }
                if (Object.prototype.hasOwnProperty.call(schema, 'maximum')) {
                    assert.ok(def <= schema.maximum, `${key} default must be <= maximum`);
                }
            }

            // Objects may be free-form; at minimum they should have a default object when declared as object
            if (schema.type === 'object') {
                if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
                    assert.strictEqual(typeof schema.default, 'object', `${key} declared as object should have object default`);
                }
            }

            // enums should have default in enum if default provided
            if (schema.enum && Object.prototype.hasOwnProperty.call(schema, 'default')) {
                assert.ok(schema.enum.includes(schema.default), `${key} default must be one of enum values`);
            }
        }
    });

    // Ensure important keys are typed as expected
    await scenario('Key type expectations', async () => {
        const properties = pkg.contributes.configuration.properties;
        assert.strictEqual(properties['explorerDates.persistentCache'].type, 'boolean', 'persistentCache must be boolean');
        assert.strictEqual(properties['explorerDates.maxMemoryUsage'].type, 'number', 'maxMemoryUsage must be number');
        assert.strictEqual(properties['explorerDates.enableContextMenu'].type, 'boolean', 'enableContextMenu must be boolean');
        assert.strictEqual(properties['explorerDates.showStatusBar'].type, 'boolean', 'showStatusBar must be boolean');
    });

    console.log('\nConfiguration schema validation tests passed');
})();