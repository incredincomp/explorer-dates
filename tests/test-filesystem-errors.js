#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const { createTestMock, VSCodeUri } = require('./helpers/mockVscode');
const { scheduleExit } = require('./helpers/forceExit');

async function main() {
    const mockInstall = createTestMock({
        config: {
            'explorerDates.performanceMode': false,
            'explorerDates.featureLevel': 'standard'
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
        await runTest('EACCES (Permission Denied)', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const permissionDeniedUri = VSCodeUri.file('/root/forbidden-file.txt');
                
                // Mock filesystem to throw EACCES
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('EACCES: permission denied');
                    error.code = 'EACCES';
                    error.errno = -13;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(permissionDeniedUri);
                
                // Should return undefined and not crash
                assert.strictEqual(decoration, undefined, 'EACCES should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('ENOENT (File Not Found)', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const missingFileUri = VSCodeUri.file('/nonexistent/missing-file.txt');
                
                // Mock filesystem to throw ENOENT
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('ENOENT: no such file or directory');
                    error.code = 'ENOENT';
                    error.errno = -2;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(missingFileUri);
                
                // Should return undefined and not crash
                assert.strictEqual(decoration, undefined, 'ENOENT should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('EPERM (Operation Not Permitted)', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const systemFileUri = VSCodeUri.file('/sys/kernel/debug/system-file');
                
                // Mock filesystem to throw EPERM
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('EPERM: operation not permitted');
                    error.code = 'EPERM';
                    error.errno = -1;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(systemFileUri);
                
                // Should return undefined and not crash
                assert.strictEqual(decoration, undefined, 'EPERM should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('File Operation Timeout', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const slowFileUri = VSCodeUri.file('/network/slow-file.txt');
                
                // Mock filesystem to hang for a long time
                provider._fileSystem.stat = async (uri) => {
                    return new Promise((resolve, reject) => {
                        // Simulate a very slow network operation
                        setTimeout(() => {
                            const error = new Error('Operation timed out');
                            error.code = 'TIMEOUT';
                            reject(error);
                        }, 50); // Short timeout for test performance
                    });
                };

                const decoration = await provider.provideFileDecoration(slowFileUri);
                
                // Should handle timeout gracefully
                assert.strictEqual(decoration, undefined, 'Timeout should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Network Drive Unavailable', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const networkFileUri = VSCodeUri.file('//server/share/file.txt');
                
                // Mock filesystem to throw network error
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('ENETUNREACH: network is unreachable');
                    error.code = 'ENETUNREACH';
                    error.errno = -51;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(networkFileUri);
                
                // Should handle network errors gracefully
                assert.strictEqual(decoration, undefined, 'Network error should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Symlink Resolution Failure', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const brokenSymlinkUri = VSCodeUri.file('/tmp/broken-symlink');
                
                // Mock filesystem to throw on broken symlink
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('ELOOP: too many symbolic links encountered');
                    error.code = 'ELOOP';
                    error.errno = -40;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(brokenSymlinkUri);
                
                // Should handle symlink errors gracefully
                assert.strictEqual(decoration, undefined, 'Symlink error should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('File Locked by Another Process', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const lockedFileUri = VSCodeUri.file('/tmp/locked-file.txt');
                
                // Mock filesystem to throw file locked error
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('EBUSY: resource busy or locked');
                    error.code = 'EBUSY';
                    error.errno = -16;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(lockedFileUri);
                
                // Should handle locked file gracefully
                assert.strictEqual(decoration, undefined, 'Locked file should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Invalid File Descriptor', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const invalidFileUri = VSCodeUri.file('/proc/invalid-fd');
                
                // Mock filesystem to throw invalid file descriptor
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('EBADF: bad file descriptor');
                    error.code = 'EBADF';
                    error.errno = -9;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(invalidFileUri);
                
                // Should handle invalid descriptor gracefully
                assert.strictEqual(decoration, undefined, 'Invalid file descriptor should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Filesystem Corruption', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                const corruptFileUri = VSCodeUri.file('/mnt/corrupt-disk/file.txt');
                
                // Mock filesystem to throw corruption error
                provider._fileSystem.stat = async (uri) => {
                    const error = new Error('EIO: I/O error');
                    error.code = 'EIO';
                    error.errno = -5;
                    throw error;
                };

                const decoration = await provider.provideFileDecoration(corruptFileUri);
                
                // Should handle I/O errors gracefully
                assert.strictEqual(decoration, undefined, 'I/O error should return undefined decoration');
            } finally {
                await provider.dispose();
            }
        });

        await runTest('Partial Success with Mixed Errors', async () => {
            const provider = new FileDateDecorationProvider();
            try {
                // Test that good files still work when some fail
                let callCount = 0;
                provider._fileSystem.stat = async (uri) => {
                    callCount++;
                    if (callCount === 1) {
                        // First call succeeds
                        return {
                            mtime: new Date(),
                            birthtime: new Date(), 
                            size: 123,
                            isFile: () => true
                        };
                    } else {
                        // Second call fails
                        const error = new Error('EACCES: permission denied');
                        error.code = 'EACCES';
                        throw error;
                    }
                };

                const goodFileUri = VSCodeUri.file('/home/user/good-file.txt');
                const badFileUri = VSCodeUri.file('/root/bad-file.txt');
                
                const goodDecoration = await provider.provideFileDecoration(goodFileUri);
                const badDecoration = await provider.provideFileDecoration(badFileUri);
                
                // Good file should get decoration, bad file should return undefined
                assert.ok(goodDecoration, 'Good file should get decoration');
                assert.strictEqual(badDecoration, undefined, 'Bad file should return undefined');
            } finally {
                await provider.dispose();
            }
        });

        console.log(`\n🎉 Filesystem error handling tests completed: ${testsPassed}/${testsRun} passed`);
        
    } catch (error) {
        console.error('❌ Filesystem error tests failed:', error);
        process.exitCode = 1;
    } finally {
        mockInstall.dispose();
    }
}

main().catch((error) => {
    console.error('❌ Filesystem error tests crashed:', error);
    process.exitCode = 1;
}).finally(scheduleExit);