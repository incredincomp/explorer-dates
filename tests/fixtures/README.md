# Test Fixtures

## sample-workspace
- Path: `tests/fixtures/sample-workspace`
- Represents a minimal VS Code workspace with a `.vscode/explorer-dates-exclusions.json` file and multi-root subfolders (`workspaceA`, `workspaceB`).
 - Use this workspace by calling `createTestMock(options)` (preferred) or passing `sampleWorkspace: path.join(__dirname, 'fixtures', 'sample-workspace')` to `createMockVscode`.
- Keeps SmartExclusionManager quiet during tests that activate the real extension.

### workspaceA
- Located at `tests/fixtures/sample-workspace/workspaceA`.
- Contains `.vscode/explorer-dates-exclusions.json` with folder-level overrides.
- Useful for multi-root scenarios where one folder disables analysis commands or exclusions.

### workspaceB
- Located at `tests/fixtures/sample-workspace/workspaceB`.
- Provides a clean workspace entry with its own exclusions file.

> Add new shared fixture data here so future suites can discover and reuse the canonical workspace layout.
