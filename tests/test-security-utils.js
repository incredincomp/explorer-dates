#!/usr/bin/env node

/**
 * Security Utilities Test Suite
 * Tests path traversal protection, input validation, and other security measures
 */

const assert = require('assert');
const { createMockVscode } = require('./helpers/mockVscode');

// Create mock before importing extension modules
const mock = createMockVscode({});
const { SecurityValidator, SecureFileOperations, detectSecurityEnvironment } = require('../src/utils/securityUtils');

async function testPathTraversalDetection() {
    console.log('🔍 Testing path traversal detection...');
    
    const testCases = [
        // Path traversal attempts
        { path: '../../../etc/passwd', expected: true, description: 'Basic path traversal' },
        { path: '..\\..\\..\\windows\\system32', expected: true, description: 'Windows path traversal' },
        { path: '/safe/path/../../../danger', expected: true, description: 'Mixed safe/unsafe path' },
        { path: 'file:///../../../etc/hosts', expected: true, description: 'URI with path traversal' },
        { path: './normal/../file.txt', expected: true, description: 'Relative path traversal' },
        
        // Safe paths
        { path: '/safe/normal/file.txt', expected: false, description: 'Normal absolute path' },
        { path: './safe/file.txt', expected: false, description: 'Safe relative path' },
        { path: 'filename.txt', expected: false, description: 'Simple filename' },
        { path: '/project/src/utils.js', expected: false, description: 'Normal project path' },
        
        // Edge cases
        { path: '', expected: false, description: 'Empty path' },
        { path: null, expected: false, description: 'Null path' },
        { path: undefined, expected: false, description: 'Undefined path' },
    ];

    for (const test of testCases) {
        const result = SecurityValidator.hasPathTraversal(test.path);
        assert.strictEqual(result, test.expected, 
            `${test.description}: expected ${test.expected}, got ${result} for "${test.path}"`);
    }

    console.log('✅ Path traversal detection tests passed');
}

async function testDangerousCharacterDetection() {
    console.log('🚫 Testing dangerous character detection...');
    
    const testCases = [
        // Dangerous characters
        { path: '/path/with\x00null', expected: true, description: 'Null character' },
        { path: '/path/with<script>', expected: true, description: 'Angle brackets' },
        { path: '/path/with\x22quotes', expected: true, description: 'Double quotes' },
        { path: '/path/with|pipe', expected: true, description: 'Pipe character' },
        { path: '/path/with?question', expected: true, description: 'Question mark' },
        { path: '/path/with*asterisk', expected: true, description: 'Asterisk' },
        { path: '/path/with\tcontrol', expected: true, description: 'Control character' },
        
        // Safe characters
        { path: '/safe/path/file.txt', expected: false, description: 'Normal path' },
        { path: '/path-with-dashes_and_underscores.txt', expected: false, description: 'Safe special chars' },
        { path: '/path with spaces.txt', expected: false, description: 'Spaces (usually safe)' },
        { path: '/path/with.dots.txt', expected: false, description: 'Dots in filename' },
    ];

    for (const test of testCases) {
        const result = SecurityValidator.hasDangerousChars(test.path);
        assert.strictEqual(result, test.expected, 
            `${test.description}: expected ${test.expected}, got ${result} for "${test.path}"`);
    }

    console.log('✅ Dangerous character detection tests passed');
}

async function testWindowsReservedNames() {
    console.log('🪟 Testing Windows reserved name detection...');
    
    const testCases = [
        // Reserved names
        { filename: 'CON', expected: true, description: 'CON reserved name' },
        { filename: 'con.txt', expected: true, description: 'CON with extension' },
        { filename: 'PRN.log', expected: true, description: 'PRN with extension' },
        { filename: 'AUX', expected: true, description: 'AUX reserved name' },
        { filename: 'COM1.dat', expected: true, description: 'COM1 with extension' },
        { filename: 'LPT9.txt', expected: true, description: 'LPT9 with extension' },
        
        // Non-reserved names
        { filename: 'console.txt', expected: false, description: 'Similar but not reserved' },
        { filename: 'mycon.txt', expected: false, description: 'Contains reserved word' },
        { filename: 'CONTACT.txt', expected: false, description: 'Starts with reserved letters' },
        { filename: 'normal-file.txt', expected: false, description: 'Normal filename' },
        
        // Edge cases
        { filename: '', expected: false, description: 'Empty filename' },
        { filename: null, expected: false, description: 'Null filename' },
    ];

    for (const test of testCases) {
        const result = SecurityValidator.isWindowsReservedName(test.filename);
        assert.strictEqual(result, test.expected, 
            `${test.description}: expected ${test.expected}, got ${result} for "${test.filename}"`);
    }

    console.log('✅ Windows reserved name detection tests passed');
}

async function testSuspiciousExtensions() {
    console.log('⚠️ Testing suspicious extension detection...');
    
    const testCases = [
        // Suspicious extensions
        { extension: '.exe', expected: true, description: 'Executable file' },
        { extension: 'exe', expected: true, description: 'Executable without dot' },
        { extension: '.bat', expected: true, description: 'Batch file' },
        { extension: '.vbs', expected: true, description: 'VBScript file' },
        { extension: '.scr', expected: true, description: 'Screen saver executable' },
        { extension: '.msi', expected: true, description: 'Windows installer' },
        
        // Safe extensions  
        { extension: '.txt', expected: false, description: 'Text file' },
        { extension: '.json', expected: false, description: 'JSON file' },
        { extension: '.md', expected: false, description: 'Markdown file' },
        { extension: '.jpg', expected: false, description: 'Image file' },
        { extension: '.ts', expected: false, description: 'TypeScript file' },
        { extension: '.js', expected: false, description: 'JavaScript workspace file' },
        { extension: '.py', expected: false, description: 'Python workspace file' },
        
        // Edge cases
        { extension: '', expected: false, description: 'Empty extension' },
        { extension: null, expected: false, description: 'Null extension' },
    ];

    for (const test of testCases) {
        const result = SecurityValidator.isSuspiciousExtension(test.extension);
        assert.strictEqual(result, test.expected, 
            `${test.description}: expected ${test.expected}, got ${result} for "${test.extension}"`);
    }

    const jsOutsideWorkspace = SecurityValidator.isSuspiciousExtension('.js', { workspaceContext: false });
    assert.strictEqual(jsOutsideWorkspace, true, 'JavaScript extension should be suspicious outside workspace context');

    console.log('✅ Suspicious extension detection tests passed');
}

async function testPathLengthValidation() {
    console.log('📏 Testing path length validation...');
    
    // Test path length
    const longPath = '/very/long/path/' + 'a'.repeat(300);
    const normalPath = '/normal/path/file.txt';
    
    assert.strictEqual(SecurityValidator.isPathTooLong(longPath), true, 'Long path should be detected');
    assert.strictEqual(SecurityValidator.isPathTooLong(normalPath), false, 'Normal path should be fine');
    
    // Test filename length
    const longFilename = 'a'.repeat(300) + '.txt';
    const normalFilename = 'normal-file.txt';
    
    assert.strictEqual(SecurityValidator.isFilenameTooLong(longFilename), true, 'Long filename should be detected');
    assert.strictEqual(SecurityValidator.isFilenameTooLong(normalFilename), false, 'Normal filename should be fine');

    console.log('✅ Path length validation tests passed');
}

async function testComprehensiveValidation() {
    console.log('🛡️ Testing comprehensive path validation...');
    
    const testCases = [
        {
            path: '/safe/normal/file.txt',
            expected: { isValid: true, isSafe: true },
            description: 'Safe normal path'
        },
        {
            path: '../../../etc/passwd',
            expected: { isValid: false, isSafe: false },
            description: 'Path traversal attempt'
        },
        {
            path: '/path/with\x00null.txt',
            expected: { isValid: false, isSafe: false },
            description: 'Path with null character'
        },
        {
            path: '/path/CON.txt',
            expected: { isValid: true, isSafe: false }, // Valid but has warning
            description: 'Windows reserved name'
        },
        {
            path: '/path/virus.exe',
            expected: { isValid: true, isSafe: false }, // Valid but has warning  
            description: 'Suspicious extension'
        }
    ];

    for (const test of testCases) {
        const result = SecurityValidator.validatePath(test.path);
        
        assert.strictEqual(result.isValid, test.expected.isValid, 
            `${test.description}: isValid should be ${test.expected.isValid}`);
        assert.strictEqual(result.isSafe, test.expected.isSafe,
            `${test.description}: isSafe should be ${test.expected.isSafe}`);
    }

    console.log('✅ Comprehensive validation tests passed');
}

async function testPathSanitization() {
    console.log('🧹 Testing path sanitization...');
    
    const testCases = [
        {
            input: '../../../etc/passwd',
            expected: 'etc/passwd',
            description: 'Remove path traversal'
        },
        {
            input: '/path/with\x00null<chars>',
            expected: '/path/withnull_chars_',
            description: 'Replace dangerous characters'
        },
        {
            input: '/path/./to/../file.txt',
            expected: '/path/file.txt',
            description: 'Resolve relative paths'
        },
        {
            input: '/path/CON.txt',
            expected: '/path/CON_safe.txt',
            description: 'Handle Windows reserved name'
        },
        {
            input: '',
            expected: '',
            description: 'Empty path'
        }
    ];

    for (const test of testCases) {
        const result = SecurityValidator.sanitizePath(test.input);
        assert.strictEqual(result, test.expected, 
            `${test.description}: expected "${test.expected}", got "${result}"`);
    }

    console.log('✅ Path sanitization tests passed');
}

async function testWorkspaceBoundaries() {
    console.log('🏠 Testing workspace boundary validation...');
    
    const allowedPaths = [
        '/workspace/project1',
        '/workspace/project2',
        '/safe/workspace'
    ];

    const testCases = [
        {
            path: '/workspace/project1/src/file.txt',
            expected: true,
            description: 'Path within allowed workspace'
        },
        {
            path: '/workspace/project2/docs/readme.md',
            expected: true,
            description: 'Path in different allowed workspace'
        },
        {
            path: '/dangerous/outside/file.txt',
            expected: false,
            description: 'Path outside allowed workspaces'
        },
        {
            path: '/workspace/project1/../../../etc/passwd', 
            expected: false,
            description: 'Traversal outside workspace (should normalize first)'
        }
    ];

    for (const test of testCases) {
        const result = SecurityValidator.isWithinBoundaries(test.path, allowedPaths);
        assert.strictEqual(result, test.expected, 
            `${test.description}: expected ${test.expected}, got ${result}`);
    }

    console.log('✅ Workspace boundary validation tests passed');
}

async function testRegexValidation() {
    console.log('🔄 Testing regex pattern validation...');
    
    const testCases = [
        {
            pattern: '.*\\.txt$',
            expected: true,
            description: 'Simple regex pattern'
        },
        {
            pattern: '^[a-zA-Z0-9]+$',
            expected: true,
            description: 'Safe regex pattern'
        },
        {
            pattern: '(a+)+',
            expected: false,
            description: 'Catastrophic backtracking pattern'
        },
        {
            pattern: '[a-z',
            expected: false,
            description: 'Invalid regex syntax'
        }
    ];

    for (const test of testCases) {
        const result = SecurityValidator.validateRegexPattern(test.pattern);
        assert.strictEqual(result.isValid, test.expected, 
            `${test.description}: expected ${test.expected}, got ${result.isValid}${result.issue ? ` (${result.issue})` : ''}`);
    }

    console.log('✅ Regex pattern validation tests passed');
}

async function testSecureFileOperations() {
    console.log('📁 Testing secure file operations...');
    
    // Create mock VS Code environment
    const mockInstall = createMockVscode({});
    const { VSCodeUri } = mockInstall;

    try {
        // Test URI validation
        const safeUri = VSCodeUri.file('/safe/workspace/file.txt');
        const unsafeUri = VSCodeUri.file('../../../etc/passwd');
        
        const allowedWorkspaces = ['/safe/workspace'];
        
        const safeResult = SecureFileOperations.validateFileUri(safeUri, allowedWorkspaces);
        assert.strictEqual(safeResult.isValid, true, 'Safe URI should be valid');
        
        const unsafeResult = SecureFileOperations.validateFileUri(unsafeUri, allowedWorkspaces);
        assert.strictEqual(unsafeResult.isValid, false, 'Unsafe URI should be invalid');

        const migrationUri = VSCodeUri.file('/migrations/target/file.txt');
        const allowedWithExtras = ['/safe/workspace', '/migrations'];
        const migrationResult = SecureFileOperations.validateFileUri(migrationUri, allowedWithExtras);
        assert.strictEqual(migrationResult.isValid, true, 'Extra allowed path should permit migrations');

        const relaxedResult = SecureFileOperations.validateFileUri(migrationUri, []);
        assert.strictEqual(relaxedResult.isValid, true, 'Empty allowed workspace list should skip boundary enforcement');

        // Test exclusion pattern validation
        const safePatterns = ['*.txt', '**/*.log', 'node_modules/**'];
        const unsafePatterns = ['(a+)+', null, 42];
        
        const safePatternResult = SecureFileOperations.validateExclusionPatterns(safePatterns);
        assert.strictEqual(safePatternResult.isValid, true, 'Safe patterns should be valid');
        
        const unsafePatternResult = SecureFileOperations.validateExclusionPatterns(unsafePatterns);
        assert.strictEqual(unsafePatternResult.isValid, false, 'Unsafe patterns should be invalid');

        console.log('✅ Secure file operations tests passed');
    } finally {
        mockInstall.dispose();
    }
}

async function testIntegrationWithExtension() {
    console.log('🔗 Testing integration with extension...');
    
    // Test that security utils can be used with existing path utilities
    const mockInstall = createMockVscode({
        config: {
            'explorerDates.excludedPatterns': [
                '*.txt',
                '../../../danger/**',  // This should be flagged
                '**/*.log'
            ]
        }
    });

    try {
        const config = mockInstall.vscode.workspace.getConfiguration('explorerDates');
        const patterns = config.get('excludedPatterns', []);
        
        const validation = SecureFileOperations.validateExclusionPatterns(patterns);
        
        // Should detect the dangerous pattern
        assert.strictEqual(validation.isValid, true, 'Basic patterns should validate');
        
        // Test individual pattern validation
        const dangerousPattern = '../../../danger/**';
        const hasDanger = SecurityValidator.hasPathTraversal(dangerousPattern);
        assert.strictEqual(hasDanger, true, 'Should detect path traversal in exclusion pattern');

        console.log('✅ Integration tests passed');
    } finally {
        mockInstall.dispose();
    }
}

async function testSecurityEnvironmentDetection() {
    console.log('🧪 Testing security environment detection...');

    const originalNodeEnv = process.env.NODE_ENV;
    const originalTestMode = process.env.EXPLORER_DATES_TEST_MODE;
    const originalVscodeTest = process.env.VSCODE_TEST;
    const originalDevMode = process.env.EXPLORER_DATES_DEV_MODE;

    try {
        process.env.EXPLORER_DATES_TEST_MODE = '1';
        assert.strictEqual(detectSecurityEnvironment(), 'test', 'EXPLORER_DATES_TEST_MODE should force test environment');

        delete process.env.EXPLORER_DATES_TEST_MODE;
        process.env.NODE_ENV = 'test';
        assert.strictEqual(detectSecurityEnvironment(), 'test', 'NODE_ENV=test should result in test environment');

        process.env.NODE_ENV = 'development';
        delete process.env.VSCODE_TEST;
        assert.strictEqual(detectSecurityEnvironment(), 'development', 'NODE_ENV=development should result in development environment');

        process.env.NODE_ENV = 'production';
        delete process.env.EXPLORER_DATES_DEV_MODE;
        assert.strictEqual(detectSecurityEnvironment(), 'production', 'Default should be production');

        process.env.EXPLORER_DATES_DEV_MODE = '1';
        assert.strictEqual(detectSecurityEnvironment(), 'development', 'EXPLORER_DATES_DEV_MODE=1 should result in development environment');

        process.env.VSCODE_TEST = '1';
        assert.strictEqual(detectSecurityEnvironment(), 'test', 'VSCODE_TEST=1 should result in test environment');
    } finally {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.EXPLORER_DATES_TEST_MODE = originalTestMode;
        process.env.VSCODE_TEST = originalVscodeTest;
        process.env.EXPLORER_DATES_DEV_MODE = originalDevMode;
    }

    console.log('✅ Security environment detection tests passed');
}

async function testStrictBoundaryEnforcement() {
    console.log('🚧 Testing strict workspace boundary enforcement...');

    const originalNodeEnv = process.env.NODE_ENV;
    const originalTestMode = process.env.EXPLORER_DATES_TEST_MODE;
    const originalVscodeTest = process.env.VSCODE_TEST;
    const originalDevMode = process.env.EXPLORER_DATES_DEV_MODE;

    const mockInstall = createMockVscode({});
    const { VSCodeUri, vscode } = mockInstall;

    try {
        delete process.env.EXPLORER_DATES_TEST_MODE;
        delete process.env.VSCODE_TEST;
        delete process.env.EXPLORER_DATES_DEV_MODE;
        process.env.NODE_ENV = 'production';

        const env = detectSecurityEnvironment();
        assert.strictEqual(env, 'production', 'Strict mode should report production environment');

        const allowed = [vscode.workspace.workspaceFolders[0].uri.fsPath];
        const outside = VSCodeUri.file('/outside/workspace/file.txt');
        const validation = SecureFileOperations.validateFileUri(outside, allowed);

        assert.strictEqual(
            validation.isValid,
            false,
            'Strict mode should block URIs outside allowed workspaces'
        );
    } finally {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.EXPLORER_DATES_TEST_MODE = originalTestMode;
        process.env.VSCODE_TEST = originalVscodeTest;
        process.env.EXPLORER_DATES_DEV_MODE = originalDevMode;
        mockInstall.dispose();
    }

    console.log('✅ Strict workspace boundary enforcement tests passed');
}

async function main() {
    console.log('🛡️ Starting Security Utils Test Suite...\n');

    try {
        await testPathTraversalDetection();
        await testDangerousCharacterDetection();
        await testWindowsReservedNames();
        await testSuspiciousExtensions();
        await testPathLengthValidation();
        await testComprehensiveValidation();
        await testPathSanitization();
        await testWorkspaceBoundaries();
        await testRegexValidation();
        await testSecureFileOperations();
        await testIntegrationWithExtension();
        await testSecurityEnvironmentDetection();
        await testStrictBoundaryEnforcement();

        console.log('\n🎉 All security utility tests passed!');
        console.log('\n📊 Security Test Coverage:');
        console.log('   ✅ Path traversal detection');
        console.log('   ✅ Dangerous character filtering');
        console.log('   ✅ Windows reserved name handling');
        console.log('   ✅ Suspicious extension detection');
        console.log('   ✅ Path length validation');
        console.log('   ✅ Comprehensive security validation');
        console.log('   ✅ Path sanitization');
        console.log('   ✅ Workspace boundary enforcement');
        console.log('   ✅ Regex pattern safety validation');
        console.log('   ✅ Secure file operations');
        console.log('   ✅ Extension integration');
        console.log('   ✅ Environment detection');

    } catch (error) {
        console.error('\n❌ Security utility tests failed:', error);
        console.error('Stack:', error.stack);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
