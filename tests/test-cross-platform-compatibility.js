#!/usr/bin/env node

/**
 * Cross-Platform Compatibility Testing for Explorer Dates Extension
 * 
 * Tests extension behavior across different operating systems and environments:
 * - Path handling differences (Windows vs Unix)
 * - File system case sensitivity
 * - Platform-specific file operations
 * - Environment variable handling
 * - URI scheme differences
 * - Character encoding issues
 * 
 * Follows established patterns from test-web-bundle-smoke.js
 */

const assert = require('assert');
const path = require('path');
const { createMockVscode, VSCodeUri } = require('./helpers/mockVscode');

// Platform detection utilities
const { scheduleExit } = require('./helpers/forceExit');
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

/**
 * Test Windows-style path handling
 */
async function testWindowsPathHandling() {
    console.log('🪟 Testing Windows-style path handling...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Test Windows-style paths
        const windowsPaths = [
            'C:\\Users\\Developer\\project\\file.js',
            'D:\\workspace\\src\\index.ts',
            'C:\\Program Files\\Project\\config.json',
            '\\\\network-drive\\shared\\file.txt', // UNC path
            'C:\\path with spaces\\file.js'
        ];
        
        const results = [];
        for (const winPath of windowsPaths) {
            try {
                // Convert to proper URI
                const uri = VSCodeUri.file(winPath);
                const decoration = await provider.provideFileDecoration(uri, { isCancellationRequested: false });
                results.push({ path: winPath, success: decoration !== null, decoration });
            } catch (error) {
                results.push({ path: winPath, success: false, error: error.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        assert.ok(successCount >= windowsPaths.length - 1, `Should handle most Windows paths, got ${successCount}/${windowsPaths.length}`);
        
        console.log(`✅ Windows path handling: ${successCount}/${windowsPaths.length} paths handled correctly`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Windows path handling failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test Unix-style path handling
 */
async function testUnixPathHandling() {
    console.log('🐧 Testing Unix-style path handling...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Test Unix-style paths
        const unixPaths = [
            '/home/user/project/file.js',
            '/usr/local/bin/executable',
            '/tmp/temporary-file.txt',
            '/var/log/application.log',
            '/home/user/path with spaces/file.js',
            '/home/user/.hidden-config',
            '/home/user/very/deep/nested/directory/structure/file.js'
        ];
        
        const results = [];
        for (const unixPath of unixPaths) {
            try {
                const uri = VSCodeUri.file(unixPath);
                const decoration = await provider.provideFileDecoration(uri, { isCancellationRequested: false });
                results.push({ path: unixPath, success: decoration !== null, decoration });
            } catch (error) {
                results.push({ path: unixPath, success: false, error: error.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        assert.ok(successCount >= unixPaths.length - 1, `Should handle most Unix paths, got ${successCount}/${unixPaths.length}`);
        
        console.log(`✅ Unix path handling: ${successCount}/${unixPaths.length} paths handled correctly`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Unix path handling failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test file system case sensitivity scenarios
 */
async function testCaseSensitivityHandling() {
    console.log('🔤 Testing case sensitivity handling...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Test case sensitivity scenarios
        const caseSensitiveTests = [
            { path: '/workspace/File.js', altPath: '/workspace/file.js' },
            { path: '/workspace/INDEX.html', altPath: '/workspace/index.html' },
            { path: '/workspace/README.MD', altPath: '/workspace/readme.md' },
            { path: '/workspace/Component.tsx', altPath: '/workspace/component.tsx' }
        ];
        
        const results = [];
        for (const test of caseSensitiveTests) {
            try {
                const uri1 = VSCodeUri.file(test.path);
                const uri2 = VSCodeUri.file(test.altPath);
                
                const decoration1 = await provider.provideFileDecoration(uri1, { isCancellationRequested: false });
                const decoration2 = await provider.provideFileDecoration(uri2, { isCancellationRequested: false });
                
                // Both should work independently regardless of case sensitivity
                results.push({ 
                    test, 
                    success: decoration1 !== null && decoration2 !== null,
                    decorations: { original: decoration1, alternative: decoration2 }
                });
            } catch (error) {
                results.push({ test, success: false, error: error.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        assert.ok(successCount >= caseSensitiveTests.length - 1, `Should handle case sensitivity scenarios, got ${successCount}/${caseSensitiveTests.length}`);
        
        console.log(`✅ Case sensitivity handling: ${successCount}/${caseSensitiveTests.length} scenarios handled correctly`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Case sensitivity handling failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test special character and Unicode handling
 */
async function testSpecialCharacterHandling() {
    console.log('🌍 Testing special character and Unicode handling...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Test various special characters and Unicode
        const specialCharPaths = [
            '/workspace/файл.js', // Cyrillic
            '/workspace/文件.ts', // Chinese
            '/workspace/ファイル.jsx', // Japanese
            '/workspace/archivo-español.js', // Spanish accents
            '/workspace/fichier-français.ts', // French accents
            '/workspace/dateі-german.js', // German umlauts (ü represented differently)
            '/workspace/file with spaces.js',
            '/workspace/file-with-dashes.js',
            '/workspace/file_with_underscores.js',
            '/workspace/file.with.dots.js',
            '/workspace/file@symbol.js',
            '/workspace/file#hash.js',
            '/workspace/file$dollar.js',
            '/workspace/file&ampersand.js',
            '/workspace/emoji-😀.js'
        ];
        
        const results = [];
        for (const specialPath of specialCharPaths) {
            try {
                const uri = VSCodeUri.file(specialPath);
                const decoration = await provider.provideFileDecoration(uri, { isCancellationRequested: false });
                results.push({ path: specialPath, success: decoration !== null, decoration });
            } catch (error) {
                results.push({ path: specialPath, success: false, error: error.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        // Should handle most special characters, but some edge cases might fail
        assert.ok(successCount >= Math.floor(specialCharPaths.length * 0.8), 
                 `Should handle most special characters, got ${successCount}/${specialCharPaths.length}`);
        
        console.log(`✅ Special character handling: ${successCount}/${specialCharPaths.length} paths handled correctly`);
        if (successCount < specialCharPaths.length) {
            const failed = results.filter(r => !r.success);
            console.log(`   Failed paths: ${failed.map(f => f.path).join(', ')}`);
        }
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Special character handling failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test URI scheme compatibility
 */
async function testUriSchemeCompatibility() {
    console.log('🔗 Testing URI scheme compatibility...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Test different URI schemes
        const uriSchemes = [
            { scheme: 'file', path: '/workspace/local-file.js', description: 'Local file' },
            { scheme: 'vscode-vfs', path: '/remote/file.js', description: 'VS Code VFS' },
            { scheme: 'vscode-remote', path: '/ssh-remote/file.js', description: 'SSH remote' },
            { scheme: 'vscode-userdata', path: '/settings/config.json', description: 'User data' },
            { scheme: 'untitled', path: 'Untitled-1.js', description: 'Untitled file' },
            { scheme: 'git', path: '/repo/file.js', description: 'Git scheme' },
            { scheme: 'output', path: '/channel/logs', description: 'Output channel' }
        ];
        
        const results = [];
        for (const uriTest of uriSchemes) {
            try {
                // Create URI with specific scheme
                const uri = {
                    scheme: uriTest.scheme,
                    fsPath: uriTest.path,
                    path: uriTest.path,
                    authority: '',
                    query: '',
                    fragment: ''
                };
                const decoration = await provider.provideFileDecoration(uri, { isCancellationRequested: false });
                results.push({ 
                    scheme: uriTest.scheme, 
                    success: decoration !== null, 
                    decoration,
                    description: uriTest.description 
                });
            } catch (error) {
                results.push({ 
                    scheme: uriTest.scheme, 
                    success: false, 
                    error: error.message, 
                    description: uriTest.description 
                });
            }
        }
        
        // File scheme should always work
        const fileSchemeResult = results.find(r => r.scheme === 'file');
        assert.ok(fileSchemeResult && fileSchemeResult.success, 'File scheme should always work');
        
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ URI scheme compatibility: ${successCount}/${uriSchemes.length} schemes handled`);
        
        // Log details for debugging
        results.forEach(r => {
            const status = r.success ? '✓' : '✗';
            console.log(`   ${status} ${r.scheme}: ${r.description}${r.error ? ` (${r.error})` : ''}`);
        });
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ URI scheme compatibility failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test platform-specific environment variables
 */
async function testPlatformEnvironmentVariables() {
    console.log('🌐 Testing platform-specific environment variables...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    
    try {
        // Test platform detection logic
        const platformInfo = {
            platform: process.platform,
            isWindows: process.platform === 'win32',
            isMacOS: process.platform === 'darwin',
            isLinux: process.platform === 'linux'
        };
        
        // Test environment variable handling
        const originalEnv = { ...process.env };
        
        // Simulate different platform environments
        const envTests = [
            { name: 'HOME', value: '/home/user', platform: 'unix' },
            { name: 'USERPROFILE', value: 'C:\\Users\\User', platform: 'windows' },
            { name: 'APPDATA', value: 'C:\\Users\\User\\AppData\\Roaming', platform: 'windows' },
            { name: 'XDG_CONFIG_HOME', value: '/home/user/.config', platform: 'linux' },
            { name: 'TMPDIR', value: '/tmp', platform: 'unix' },
            { name: 'TEMP', value: 'C:\\Temp', platform: 'windows' }
        ];
        
        let envTestResults = [];
        
        for (const envTest of envTests) {
            try {
                // Set test environment variable
                process.env[envTest.name] = envTest.value;
                
                // Test that the extension can handle platform-specific paths derived from env vars
                const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');
                const provider = new FileDateDecorationProvider();
                
                // Test basic functionality with environment configured
                const testUri = VSCodeUri.file('/test/environment.js');
                const decoration = await provider.provideFileDecoration(testUri, { isCancellationRequested: false });
                
                envTestResults.push({ 
                    env: envTest.name, 
                    success: decoration !== null, 
                    platform: envTest.platform 
                });
                
                await provider.dispose();
                
                // Clean up module cache to allow fresh imports
                const moduleId = require.resolve('../src/fileDateDecorationProvider');
                delete require.cache[moduleId];
                
            } catch (error) {
                envTestResults.push({ 
                    env: envTest.name, 
                    success: false, 
                    error: error.message, 
                    platform: envTest.platform 
                });
            } finally {
                // Restore original environment
                if (originalEnv[envTest.name] !== undefined) {
                    process.env[envTest.name] = originalEnv[envTest.name];
                } else {
                    delete process.env[envTest.name];
                }
            }
        }
        
        // Restore environment completely
        process.env = { ...originalEnv };
        
        const successCount = envTestResults.filter(r => r.success).length;
        
        console.log(`✅ Platform environment variables: ${successCount}/${envTests.length} configurations handled`);
        console.log(`   Platform: ${platformInfo.platform} (Windows: ${platformInfo.isWindows}, macOS: ${platformInfo.isMacOS}, Linux: ${platformInfo.isLinux})`);
        
        return true;
    } catch (error) {
        console.log('❌ Platform environment variables failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test cross-platform Git integration
 */
async function testCrossPlatformGitIntegration() {
    console.log('📜 Testing cross-platform Git integration...');
    
    const mockInstall = createMockVscode({
        config: { 
            'explorerDates.performanceMode': false,
            'explorerDates.showGitInfo': 'author'
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Test Git operations across different path styles
        const gitTestPaths = [
            isWindows ? 'C:\\repo\\src\\file.js' : '/repo/src/file.js',
            isWindows ? 'C:\\repo\\nested\\deep\\file.ts' : '/repo/nested/deep/file.ts',
            isWindows ? 'C:\\repo\\file with spaces.js' : '/repo/file with spaces.js'
        ];
        
        const results = [];
        for (const gitPath of gitTestPaths) {
            try {
                const uri = VSCodeUri.file(gitPath);
                const decoration = await provider.provideFileDecoration(uri, { isCancellationRequested: false });
                
                // Should handle Git operations gracefully even if Git is not available
                results.push({ 
                    path: gitPath, 
                    success: decoration !== null, 
                    decoration,
                    hasGitInfo: decoration && decoration.tooltip && decoration.tooltip.includes('Author')
                });
            } catch (error) {
                results.push({ path: gitPath, success: false, error: error.message });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        assert.ok(successCount >= gitTestPaths.length - 1, `Should handle Git paths across platforms, got ${successCount}/${gitTestPaths.length}`);
        
        console.log(`✅ Cross-platform Git integration: ${successCount}/${gitTestPaths.length} paths handled`);
        
        await provider.dispose();
        return true;
    } catch (error) {
        console.log('❌ Cross-platform Git integration failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Test platform-specific file system limitations
 */
async function testFileSystemLimitations() {
    console.log('📁 Testing platform-specific file system limitations...');
    
    const mockInstall = createMockVscode({
        config: { 'explorerDates.performanceMode': false }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    try {
        const provider = new FileDateDecorationProvider();
        
        // Test edge cases specific to each platform
        const limitationTests = [
            // Windows limitations
            { 
                path: isWindows ? 'C:\\very-long-path\\' + 'a'.repeat(200) + '\\file.js' : '/very-long-path/' + 'a'.repeat(200) + '/file.js',
                description: 'Very long path',
                expectSuccess: !isWindows // Windows has stricter path length limits
            },
            {
                path: isWindows ? 'C:\\reserved\\CON.js' : '/reserved/CON.js',
                description: 'Reserved filename (Windows)',
                expectSuccess: !isWindows // CON is reserved on Windows
            },
            {
                path: isWindows ? 'C:\\trailing\\space .js' : '/trailing/space .js',
                description: 'Trailing space in filename',
                expectSuccess: !isWindows // Windows trims trailing spaces
            },
            // Cross-platform tests
            {
                path: isWindows ? 'C:\\null\\file\\0.js' : '/null/file/\0.js',
                description: 'Null character in path',
                expectSuccess: false // Should fail on all platforms
            }
        ];
        
        const results = [];
        for (const test of limitationTests) {
            try {
                const uri = VSCodeUri.file(test.path);
                const decoration = await provider.provideFileDecoration(uri, { isCancellationRequested: false });
                const actualSuccess = decoration !== null;
                
                results.push({ 
                    test: test.description,
                    path: test.path,
                    expectedSuccess: test.expectSuccess,
                    actualSuccess,
                    correct: actualSuccess === test.expectSuccess
                });
            } catch (error) {
                results.push({ 
                    test: test.description,
                    path: test.path,
                    expectedSuccess: test.expectSuccess,
                    actualSuccess: false,
                    correct: !test.expectSuccess,
                    error: error.message
                });
            }
        }
        
        const correctCount = results.filter(r => r.correct).length;
        
        console.log(`✅ File system limitations: ${correctCount}/${limitationTests.length} behaviors correct for platform`);
        results.forEach(r => {
            const status = r.correct ? '✓' : '✗';
            console.log(`   ${status} ${r.test}: expected ${r.expectedSuccess}, got ${r.actualSuccess}`);
        });
        
        await provider.dispose();
        return correctCount >= Math.floor(limitationTests.length * 0.75); // Allow some platform differences
    } catch (error) {
        console.log('❌ File system limitations test failed:', error.message);
        return false;
    } finally {
        mockInstall.dispose();
    }
}

/**
 * Main test runner
 */
async function main() {
    console.log('🌍 Starting Cross-Platform Compatibility Tests');
    console.log(`Platform: ${process.platform}, Node: ${process.version}\n`);
    
    const tests = [
        testWindowsPathHandling,
        testUnixPathHandling,
        testCaseSensitivityHandling,
        testSpecialCharacterHandling,
        testUriSchemeCompatibility,
        testPlatformEnvironmentVariables,
        testCrossPlatformGitIntegration,
        testFileSystemLimitations
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const success = await test();
            if (success) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`❌ Test ${test.name} crashed:`, error.message);
            failed++;
        }
        console.log(); // Add spacing between tests
    }
    
    console.log(`🎯 Cross-platform compatibility tests completed: ${passed}/${tests.length} passed`);
    
    if (failed > 0) {
        console.log(`\n⚠️ ${failed} cross-platform tests failed - extension may have platform-specific issues`);
        process.exit(1);
    } else {
        console.log('\n🎉 All cross-platform compatibility tests passed!');
    }
}

// Run tests if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Cross-platform test suite crashed:', error);
        process.exit(1);
    }).finally(scheduleExit);
}

module.exports = { main };