#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createWebVscodeMock } = require('./helpers/createWebVscodeMock');

async function runGitRecencyWebTest() {
    const extensionRoot = path.join(__dirname, '..');
    const fileA = path.join(extensionRoot, 'tests', 'fixtures', 'sample-workspace', 'package.json');
    const fileB = path.join(extensionRoot, 'tests', 'fixtures', 'sample-workspace', '.explorer-dates-profiles.json');
    const now = Date.now();
    const timestampMap = new Map([
        ['package.json', now - (2 * 24 * 60 * 60 * 1000)],
        ['.explorer-dates-profiles.json', now - (12 * 24 * 60 * 60 * 1000)]
    ]);

    const repo = {
        rootUri: { path: extensionRoot },
        async log({ path: targetPath }) {
            const key = targetPath && targetPath.includes('package.json')
                ? 'package.json'
                : '.explorer-dates-profiles.json';
            const ts = timestampMap.get(key);
            return [{ commitDate: new Date(ts).toISOString() }];
        }
    };

    const gitExtension = {
        isActive: true,
        exports: {
            getAPI() {
                return {
                    getRepository() { return repo; },
                    repositories: [repo]
                };
            }
        }
    };

    const harness = createWebVscodeMock({
        extensionPath: extensionRoot,
        configValues: {
            colorScheme: 'recency',
            showDateDecorations: true
        },
        extensions: {
            'vscode.git': gitExtension
        }
    });

    try {
        const { FileDateDecorationProviderImpl } = require('../src/chunks/file-date-provider-impl.js');
        const { createDecorationProviderHelpers } = require('../src/chunks/decoration-provide-chunk.js');
        const provider = new FileDateDecorationProviderImpl();
        const helpers = createDecorationProviderHelpers(provider);

        const uriA = harness.vscode.Uri.file(fileA).with({ scheme: 'vscode-vfs' });
        const uriB = harness.vscode.Uri.file(fileB).with({ scheme: 'vscode-vfs' });

        const decorationA = await helpers.provideDecoration(uriA);
        const decorationB = await helpers.provideDecoration(uriB);

        assert.ok(decorationA, 'Expected decoration for file A');
        assert.ok(decorationB, 'Expected decoration for file B');
        assert.notStrictEqual(
            decorationA.badge,
            decorationB.badge,
            'Git-derived recency should produce differing badges'
        );

        const failingRepo = {
            rootUri: { path: extensionRoot },
            async log() {
                throw new Error('git-log-failed');
            }
        };
        const failingGitExtension = {
            isActive: true,
            exports: {
                getAPI() {
                    return {
                        getRepository() { return failingRepo; },
                        repositories: [failingRepo]
                    };
                }
            }
        };
        const fallbackHarness = createWebVscodeMock({
            extensionPath: extensionRoot,
            configValues: {
                colorScheme: 'recency',
                showDateDecorations: true
            },
            extensions: {
                'vscode.git': failingGitExtension
            }
        });
        try {
            delete require.cache[require.resolve('../src/chunks/file-date-provider-impl.js')];
            const { FileDateDecorationProviderImpl: FallbackProvider } = require('../src/chunks/file-date-provider-impl.js');
            const providerFallback = new FallbackProvider();
            const timestampInfo = await providerFallback._resolveTimestampForUri(uriA, { mtime: new Date() });
            assert.ok(
                ['fs-stat', 'fs-stat-suspect'].includes(timestampInfo.source),
                `Expected fallback timestamp source, got ${timestampInfo.source}`
            );
        } finally {
            fallbackHarness.restore();
        }

        const errorHarness = createWebVscodeMock({
            extensionPath: extensionRoot,
            configValues: {
                colorScheme: 'recency',
                showDateDecorations: true
            },
            extensions: {
                'vscode.git': gitExtension
            }
        });
        try {
            delete require.cache[require.resolve('../src/chunks/file-date-provider-impl.js')];
            delete require.cache[require.resolve('../src/chunks/decoration-provide-chunk.js')];
            const { FileDateDecorationProviderImpl: ErrorProvider } = require('../src/chunks/file-date-provider-impl.js');
            const { createDecorationProviderHelpers: createHelpers } = require('../src/chunks/decoration-provide-chunk.js');
            const providerError = new ErrorProvider();
            providerError._getGitRecencyTimestamp = async () => { throw new Error('git-recency-boom'); };
            const helpersError = createHelpers(providerError);
            await helpersError.provideDecoration(uriA);
            const diagState = globalThis.__explorerDatesWebDiagnostics;
            const sample = (diagState?.logs || []).filter((entry) =>
                entry.message === 'Decoration return sample' &&
                entry.meta?.scheme === 'vscode-vfs' &&
                entry.meta?.gitRecencyError
            ).pop();
            assert.ok(sample, 'Expected diagnostic sample after git recency error');
            assert.ok(
                ['fs-stat', 'fs-stat-suspect', 'none'].includes(sample.meta.timestampSource),
                `Expected fallback timestampSource, got ${sample.meta.timestampSource}`
            );
            assert.ok(
                sample.meta.gitRecencyError,
                'Expected gitRecencyError to be populated on git recency failure'
            );
        } finally {
            errorHarness.restore();
        }
    } catch (error) {
        console.error('❌ Git recency web test failed:', error);
        process.exitCode = 1;
    } finally {
        harness.restore();
        try {
            const { scheduleExit } = require('./helpers/forceExit');
            scheduleExit(0, process.exitCode ?? 0);
        } catch {
            require('./helpers/forceExit').scheduleExit(0, process.exitCode ?? 0);
        }
    }
}

runGitRecencyWebTest();
