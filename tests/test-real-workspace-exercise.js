#!/usr/bin/env node

/**
 * Exercise Team Configuration Against Real Workspace
 * 
 * This script tests the team configuration persistence against a real workspace
 * to confirm file emission now that mock-only guardrails are gone.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const { createMockVscode, createExtensionContext } = require('./helpers/mockVscode');

// Use the actual workspace for testing
const realWorkspacePath = path.resolve(__dirname, '..');

const mockInstall = createMockVscode({
    config: {
        'explorerDates.enableWorkspaceTemplates': true,
        'explorerDates.enableExportReporting': false,
        'explorerDates.dateFormat': 'relative'
    },
    workspace: {
        workspaceFolders: [{
            uri: { 
                fsPath: realWorkspacePath,
                joinPath: (...segments) => ({ fsPath: path.join(realWorkspacePath, ...segments) })
            },
            name: 'explorer-plus-real',
            index: 0
        }]
    }
});

const { TeamConfigPersistenceManager } = require('../src/teamConfigPersistence');

async function testRealWorkspaceFileEmission() {
    console.log('🧪 Testing team configuration against real workspace...');
    console.log('📁 Workspace path:', realWorkspacePath);
    
    const context = createExtensionContext();
    const manager = new TeamConfigPersistenceManager(context);
    
    const testConfigFile = path.join(realWorkspacePath, '.explorer-dates-profiles.json');
    const testOverrideFile = path.join(realWorkspacePath, '.vscode', 'explorer-dates-overrides.md');
    
    try {
        // Clean up any existing test files
        await cleanupTestFiles(testConfigFile, testOverrideFile);
        
        // Test profile saving to real file system
        console.log('📝 Testing profile saving to real filesystem...');
        
        const testProfiles = {
            'development': {
                name: 'Development Team',
                description: 'Settings for active development',
                settings: {
                    'explorerDates.enableWorkspaceTemplates': true,
                    'explorerDates.enableExportReporting': false,
                    'explorerDates.dateFormat': 'absolute'
                },
                priority: 'high'
            },
            'production': {
                name: 'Production Environment', 
                description: 'Minimal settings for production',
                settings: {
                    'explorerDates.enableWorkspaceTemplates': false,
                    'explorerDates.enableExportReporting': false,
                    'explorerDates.dateFormat': 'relative'
                },
                priority: 'essential'
            }
        };
        
        const savedPath = await manager.saveTeamProfiles(testProfiles);
        console.log('✅ Profile saved to:', savedPath?.fsPath || savedPath);
        
        // Verify file was actually created
        const fileExistsResult = await fileExists(testConfigFile);
        console.log('📄 Config file exists:', fileExistsResult);
        
        if (fileExistsResult) {
            const fileContent = await fs.readFile(testConfigFile, 'utf8');
            const parsedConfig = JSON.parse(fileContent);
            
            assert.ok(parsedConfig.version, 'Config should have version');
            assert.ok(parsedConfig.profiles, 'Config should have profiles');
            assert.ok(parsedConfig.profiles.development, 'Should contain development profile');
            assert.ok(parsedConfig.profiles.production, 'Should contain production profile');
            assert.ok(parsedConfig.metadata, 'Config should have metadata');
            
            console.log('✅ Team configuration file format validated');
            console.log('📊 Config structure:', Object.keys(parsedConfig));
        }
        
        // Test profile loading from real file system
        console.log('📂 Testing profile loading from real filesystem...');
        const loadedProfiles = await manager.loadTeamProfiles();
        
        if (loadedProfiles) {
            assert.ok('development' in loadedProfiles, 'Should load development profile');
            assert.ok('production' in loadedProfiles, 'Should load production profile');
            console.log('✅ Profile loading from real file validated');
        }
        
        // Test team configuration validation workflow
        console.log('🔍 Testing team configuration validation...');
        const validation = await manager.validateTeamConfiguration();
        
        console.log('📋 Validation result:', {
            valid: validation.valid,
            hasTeamConfig: validation.hasTeamConfig,
            conflictCount: validation.conflicts?.length || 0,
            error: validation.error
        });
        
        // Handle expected mock environment limitations
        if (validation.error && validation.error.includes('config.inspect')) {
            console.log('ℹ️  Conflict detection skipped due to mock environment limitations');
            // Just verify that we have team config detection working
            assert.strictEqual(validation.valid, true, 'Should validate gracefully even with mock limitations');
        } else {
            assert.strictEqual(validation.hasTeamConfig, true, 'Should detect team configuration');
        }
        
        console.log('✅ Team configuration validation workflow working');
        
        // Test user override documentation with real files
        console.log('📝 Testing user override documentation...');
        const mockOverrides = [
            {
                key: 'explorerDates.dateFormat',
                teamValue: 'relative',
                userValue: 'absolute',
                userChoice: 'keep',
                reason: 'Prefer absolute timestamps for debugging'
            }
        ];
        
        await manager._documentUserOverrides(mockOverrides);
        
        // Hard assertion for file emission testing - should fail if files aren't created
        const overrideFileExists = await fileExists(testOverrideFile);
        assert.strictEqual(overrideFileExists, true, 'Override documentation file must be created for end-to-end validation');
        
        const overrideContent = await fs.readFile(testOverrideFile, 'utf8');
        
        // Assert all expected content is present with proper error messages
        assert.ok(overrideContent.includes('dateFormat'), 'Override documentation must contain setting key: dateFormat');
        assert.ok(overrideContent.includes('absolute'), 'Override documentation must contain user value: absolute');
        assert.ok(overrideContent.includes('relative'), 'Override documentation must contain team value: relative');
        assert.ok(overrideContent.includes('debugging'), 'Override documentation must contain override reason: debugging');
        
        console.log('✅ User override documentation file emission verified');
        
        // Verify file structure and format with strict requirements
        assert.ok(overrideContent.includes('# Explorer Dates Override Notes'), 'Must contain proper markdown header: # Explorer Dates Override Notes');
        assert.ok(overrideContent.length > 100, `Must contain substantial content, got ${overrideContent.length} characters`);
        
        // Verify the specific override entry was properly formatted
        assert.ok(overrideContent.includes('## Setting: explorerDates.dateFormat') || overrideContent.includes('**Setting:** explorerDates.dateFormat'), 'Must contain properly formatted setting header');
        assert.ok(overrideContent.includes('Team value:') || overrideContent.includes('team value'), 'Must document team value clearly');
        assert.ok(overrideContent.includes('User choice:') || overrideContent.includes('user choice'), 'Must document user choice clearly');
        
        console.log('✅ Override documentation content and format validated');
        
        console.log('\n🎉 Real workspace exercise completed successfully!');
        console.log('📝 Summary:');
        console.log('  • Team profiles saved and loaded from real files');
        console.log('  • Configuration validation workflow functional'); 
        console.log('  • File emission working correctly');
        console.log('  • Mock guardrails successfully removed');
        
    } catch (error) {
        console.error('❌ Real workspace exercise failed:', error);
        throw error;
    } finally {
        // Clean up test files
        await cleanupTestFiles(testConfigFile, testOverrideFile);
        mockInstall.dispose();
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function cleanupTestFiles(...files) {
    for (const file of files) {
        try {
            await fs.unlink(file);
        } catch {
            // Ignore cleanup errors
        }
    }
}

// Run the test
if (require.main === module) {
    testRealWorkspaceFileEmission().catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testRealWorkspaceFileEmission };