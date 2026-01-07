#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createMockVscode } = require('./helpers/mockVscode');

function loadThemeIntegration() {
    const modulePath = path.join(__dirname, '..', 'src', 'themeIntegration.js');
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
}

async function runTest(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}: ${error.message}`);
        throw error;
    }
}

function createManager(options = {}) {
    const mockInstall = createMockVscode({
        themeKind: options.themeKind,
        config: options.config,
        workspaceConfig: options.workspaceConfig
    });
    const { ThemeIntegrationManager } = loadThemeIntegration();
    const manager = new ThemeIntegrationManager();
    return { manager, mockInstall };
}

async function testAdaptiveColorsPerTheme() {
    await runTest('Adaptive colors respond to theme kind', async () => {
        const expectations = [
            { kind: 1, description: 'Light', recent: 'list.warningForeground', css: 'symbolIcon.colorForeground' },
            { kind: 2, description: 'Dark', recent: 'charts.yellow', css: 'charts.purple' },
            { kind: 3, description: 'High Contrast', recent: 'list.warningForeground', css: 'list.warningForeground' }
        ];

        for (const scenario of expectations) {
            const { manager, mockInstall } = createManager({
                themeKind: scenario.kind
            });
            try {
                const colors = manager.getAdaptiveColors();
                assert.strictEqual(colors.recent.id, scenario.recent, `${scenario.description}: recent color mismatch`);
                assert.strictEqual(colors.css.id, scenario.css, `${scenario.description}: css color mismatch`);
            } finally {
                manager.dispose();
                mockInstall.dispose();
            }
        }
    });
}

async function testThemeChangeNotifications() {
    await runTest('Theme change notifications update listeners', async () => {
        const { manager, mockInstall } = createManager({ themeKind: 2 });
        try {
            let callCount = 0;
            let previousKind = null;
            manager.onThemeChange((theme, oldKind) => {
                callCount++;
                previousKind = oldKind;
                assert.ok(theme && typeof theme.kind === 'number', 'Theme change should pass theme object');
            });

            mockInstall.fireThemeChange(1);
            const info = manager.getCurrentThemeInfo();
            assert.strictEqual(info.kind, 1, 'Theme info should update to Light');
            assert.strictEqual(callCount, 1, 'Listener should fire once for a single change');
            assert.strictEqual(previousKind, 2, 'Listener should receive previous kind');
        } finally {
            manager.dispose();
            mockInstall.dispose();
        }
    });
}

async function testAutoConfigureForTheme() {
    await runTest('Auto-configure applies suggested schemes and opens settings', async () => {
        const { manager, mockInstall } = createManager({
            themeKind: 1,
            config: {
                'explorerDates.colorScheme': 'none'
            }
        });
        try {
            await manager.autoConfigureForTheme();
            const update = mockInstall.appliedUpdates.find((entry) => entry.key === 'explorerDates.colorScheme');
            assert.ok(update, 'Color scheme update should be applied');
            assert.strictEqual(update.value, 'vibrant', 'Light themes should map to vibrant scheme');
            assert.strictEqual(update.target, 'global', 'Auto-config should write to global scope');
            const commandLog = mockInstall.infoLog.filter((entry) => entry.includes('executeCommand:workbench.action.openSettings'));
            assert.ok(commandLog.length > 0, 'Auto-config should prompt settings command when user chooses Customize');
        } finally {
            manager.dispose();
            mockInstall.dispose();
        }
    });
}

async function testAdaptiveSchemeRespectsFileType() {
    await runTest('Adaptive scheme prioritizes file type colors', async () => {
        const { manager, mockInstall } = createManager({ themeKind: 2 });
        try {
            const adaptive = manager.applyThemeAwareColorScheme('adaptive', '/workspace/sample.js', 1000);
            assert.ok(adaptive instanceof mockInstall.vscode.ThemeColor, 'Adaptive scheme should return ThemeColor');
            assert.strictEqual(adaptive.id, 'symbolIcon.functionForeground', 'JS files should map to function foreground in dark theme');

            const fallback = manager.applyThemeAwareColorScheme('adaptive', '/workspace/unknown.ext', 2 * 60 * 60 * 1000);
            assert.ok(fallback instanceof mockInstall.vscode.ThemeColor, 'Adaptive scheme should fall back to recency colors');
            assert.strictEqual(fallback.id, 'charts.yellow', 'Fallback should use recency colors for recent files in dark theme');
        } finally {
            manager.dispose();
            mockInstall.dispose();
        }
    });
}

async function testIconThemeRecommendations() {
    await runTest('Icon theme recommendations align with workbench settings', async () => {
        const { manager, mockInstall } = createManager({
            themeKind: 2,
            config: {
                'workbench.iconTheme': 'material-icon-theme'
            }
        });
        try {
            const integration = manager.getIconThemeIntegration();
            assert.strictEqual(integration.iconTheme, 'material-icon-theme', 'Should read icon theme from workbench config');
            const suggestion = integration.suggestions['material-icon-theme'];
            assert.ok(suggestion, 'Material icon theme suggestion should exist');
            assert.strictEqual(suggestion.recommendedColorScheme, 'subtle', 'Material icon theme should recommend subtle scheme');
        } finally {
            manager.dispose();
            mockInstall.dispose();
        }
    });
}

async function testListenerDisposalPreventsNotifications() {
    await runTest('Theme listener disposables stop receiving events', async () => {
        const { manager, mockInstall } = createManager({ themeKind: 2 });
        try {
            let callCount = 0;
            const disposable = manager.onThemeChange(() => {
                callCount++;
            });

            mockInstall.fireThemeChange(1);
            assert.strictEqual(callCount, 1, 'Listener should fire for the first change');

            disposable.dispose();
            mockInstall.fireThemeChange(3);
            assert.strictEqual(callCount, 1, 'Disposed listener should not fire again');
        } finally {
            manager.dispose();
            mockInstall.dispose();
        }
    });
}

async function testMultiWindowReuseLifecycle() {
    await runTest('Multiple managers reuse theme subscriptions safely', async () => {
        const mockInstall = createMockVscode({ themeKind: 2 });
        const { ThemeIntegrationManager } = loadThemeIntegration();
        const managerA = new ThemeIntegrationManager();
        const managerB = new ThemeIntegrationManager();

        let callsA = 0;
        let callsB = 0;
        managerA.onThemeChange(() => {
            callsA++;
        });
        managerB.onThemeChange(() => {
            callsB++;
        });

        mockInstall.fireThemeChange(1);
        assert.strictEqual(callsA, 1, 'Primary manager should receive theme change events');
        assert.strictEqual(callsB, 1, 'Secondary manager should also receive events');

        managerA.dispose();
        mockInstall.fireThemeChange(3);
        assert.strictEqual(callsA, 1, 'Disposed manager should stop receiving theme changes');
        assert.strictEqual(callsB, 2, 'Active manager should continue receiving theme changes');

        managerB.dispose();
        mockInstall.fireThemeChange(2);
        assert.strictEqual(callsB, 2, 'Disposing last manager should unsubscribe from theme changes');
        assert.strictEqual(mockInstall.getThemeListenerCount(), 0, 'Theme emitter should have no listeners after all managers dispose');

        mockInstall.dispose();
    });
}

async function main() {
    try {
        await testAdaptiveColorsPerTheme();
        await testThemeChangeNotifications();
        await testAutoConfigureForTheme();
        await testAdaptiveSchemeRespectsFileType();
        await testIconThemeRecommendations();
        await testListenerDisposalPreventsNotifications();
        await testMultiWindowReuseLifecycle();
        console.log('\n🎨 Theme integration tests completed successfully');
    } catch (error) {
        console.error('\n❌ Theme integration tests failed:', error);
        process.exitCode = 1;
    }
}

main();
