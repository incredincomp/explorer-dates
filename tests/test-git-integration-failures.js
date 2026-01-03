#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createMockVscode, VSCodeUri } = require('./helpers/mockVscode');

async function main() {
    const mockInstall = createMockVscode({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.featureLevel': 'enhanced',
            'explorerDates.showGitInfo': 'both'
        }
    });
    const { vscode } = mockInstall;
    const { FileDateDecorationProvider } = require('../src/fileDateDecorationProvider');

    let testsRun = 0;
    let testsPassed = 0;

    async function runTest(name, testFn) {
        testsRun++;
        try {
            await testFn();
            console.log(`✅ ${name}`);
            testsPassed++;
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
            throw error;
        }
    }

    try {
        await runTest('Git Command Not Found', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const gitFileUri = VSCodeUri.file('/home/user/project/README.md');
                
                // Mock filesystem to return valid file
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 123,
                    isFile: () => true
                });

                // Mock git command to fail with ENOENT (git not found)
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        const error = new Error('git: command not found');
                        error.code = 'ENOENT';
                        error.errno = -2;
                        throw error;
                    }
                };

                const decoration = await provider.provideFileDecoration(gitFileUri);
                
                // Should still provide decoration without git info
                assert.ok(decoration, 'Should provide decoration when git unavailable');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Git Repository Corruption', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const corruptRepoUri = VSCodeUri.file('/corrupted-repo/file.js');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 456,
                    isFile: () => true
                });

                // Mock git blame to fail with repository corruption
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        const error = new Error('fatal: not a git repository (or any of the parent directories): .git');
                        error.code = 'ENOTDIR';
                        throw error;
                    }
                };

                const decoration = await provider.provideFileDecoration(corruptRepoUri);
                
                // Should still work without git info
                assert.ok(decoration, 'Should provide decoration with corrupted repo');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Git Command Timeout', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const slowRepoUri = VSCodeUri.file('/slow-repo/large-file.txt');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 789,
                    isFile: () => true
                });

                // Mock git blame to timeout
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                const error = new Error('Command timeout');
                                error.code = 'TIMEOUT';
                                reject(error);
                            }, 50);
                        });
                    }
                };

                const decoration = await provider.provideFileDecoration(slowRepoUri);
                
                // Should handle timeout gracefully
                assert.ok(decoration, 'Should provide decoration on git timeout');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Invalid Git Blame Output', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const invalidBlameUri = VSCodeUri.file('/weird-repo/binary-file.bin');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 1024,
                    isFile: () => true
                });

                // Mock git blame with malformed output
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        // Return malformed git blame data
                        return {
                            author: '', // Empty author
                            date: 'invalid-date-string',
                            authorInitials: null,
                            commit: 'malformed-commit-hash-that-is-way-too-long-and-invalid'
                        };
                    }
                };

                const decoration = await provider.provideFileDecoration(invalidBlameUri);
                
                // Should handle invalid git data gracefully
                assert.ok(decoration, 'Should provide decoration with invalid git data');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Git Subprocess Crash', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const crashingRepoUri = VSCodeUri.file('/crashing-repo/unstable.py');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 2048,
                    isFile: () => true
                });

                // Mock git subprocess to crash
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        const error = new Error('git subprocess crashed');
                        error.code = 'ECONNRESET';
                        error.signal = 'SIGSEGV';
                        throw error;
                    }
                };

                const decoration = await provider.provideFileDecoration(crashingRepoUri);
                
                // Should handle subprocess crashes gracefully
                assert.ok(decoration, 'Should provide decoration on git subprocess crash');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Mixed Git and Non-Git Files', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                let callCount = 0;
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 512,
                    isFile: () => true
                });

                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        callCount++;
                        if (callCount === 1) {
                            // First file has valid git info
                            return {
                                author: 'John Doe',
                                date: new Date(),
                                authorInitials: 'JD',
                                commit: 'abc123'
                            };
                        } else {
                            // Second file is outside git repo
                            const error = new Error('fatal: not a git repository');
                            error.code = 'ENOENT';
                            throw error;
                        }
                    }
                };

                const gitFileUri = VSCodeUri.file('/repo/tracked-file.js');
                const nonGitFileUri = VSCodeUri.file('/home/untracked-file.txt');
                
                const gitDecoration = await provider.provideFileDecoration(gitFileUri);
                const nonGitDecoration = await provider.provideFileDecoration(nonGitFileUri);
                
                // Both should get decorations, git file might have additional info
                assert.ok(gitDecoration, 'Git file should get decoration');
                assert.ok(nonGitDecoration, 'Non-git file should get decoration');
                assert.ok(gitDecoration.badge, 'Git file should have badge');
                assert.ok(nonGitDecoration.badge, 'Non-git file should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Git Permission Denied', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const restrictedRepoUri = VSCodeUri.file('/restricted-repo/secret.txt');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 128,
                    isFile: () => true
                });

                // Mock git to fail with permission error
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        const error = new Error('fatal: could not open .git/config: Permission denied');
                        error.code = 'EACCES';
                        error.errno = -13;
                        throw error;
                    }
                };

                const decoration = await provider.provideFileDecoration(restrictedRepoUri);
                
                // Should handle git permission errors gracefully
                assert.ok(decoration, 'Should provide decoration on git permission error');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Partial Git Information Available', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const partialGitUri = VSCodeUri.file('/partial-repo/new-file.js');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 256,
                    isFile: () => true
                });

                // Mock git to return partial/incomplete information
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        return {
                            author: undefined, // Missing author
                            date: new Date(),
                            authorInitials: '', // Empty initials
                            commit: null // No commit info
                        };
                    }
                };

                const decoration = await provider.provideFileDecoration(partialGitUri);
                
                // Should handle partial git info gracefully
                assert.ok(decoration, 'Should provide decoration with partial git info');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Git in Detached HEAD State', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const detachedHeadUri = VSCodeUri.file('/detached-repo/old-file.c');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 1536,
                    isFile: () => true
                });

                // Mock git in detached HEAD state
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        const error = new Error('HEAD detached at abc123');
                        error.code = 'DETACHED_HEAD';
                        throw error;
                    }
                };

                const decoration = await provider.provideFileDecoration(detachedHeadUri);
                
                // Should handle detached HEAD gracefully
                assert.ok(decoration, 'Should provide decoration in detached HEAD state');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Git Large File Warning', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const largeFileUri = VSCodeUri.file('/repo/huge-file.bin');
                
                provider._fileSystem.stat = async () => ({
                    mtime: new Date(),
                    birthtime: new Date(),
                    size: 100 * 1024 * 1024, // 100MB file
                    isFile: () => true
                });

                // Mock git to warn about large file
                provider._gitIntegration = {
                    ...provider._gitIntegration,
                    async getGitBlameInfo(filePath) {
                        const error = new Error('warning: file is larger than 100 MB');
                        error.code = 'LARGE_FILE';
                        throw error;
                    }
                };

                const decoration = await provider.provideFileDecoration(largeFileUri);
                
                // Should handle large file warnings gracefully
                assert.ok(decoration, 'Should provide decoration for large files');
                assert.ok(decoration.badge, 'Should have badge');
            } finally {
                await provider.dispose();
            }
        });

        console.log(`\n🎉 Git integration error handling tests completed: ${testsPassed}/${testsRun} passed`);
        
    } catch (error) {
        console.error('❌ Git integration error tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main().catch((error) => {
    console.error('❌ Git integration error tests crashed:', error);
    process.exitCode = 1;
});