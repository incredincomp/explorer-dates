# 🔧 Explorer Dates Troubleshooting (v1.3.x)

This guide replaces the legacy v1.2.x wiki page and reflects the new module-federated architecture, team configuration system, and diagnostic tooling shipped in Explorer Dates v1.3.0. Follow the quick triage flow first, then jump to the playbook that matches your symptoms.

---

## 1. Quick Triage Checklist

1. **Confirm prerequisites**
   - VS Code 1.105.0+ (`Help → About`)
   - Explorer Dates v1.3.x (hover the extension in the Extensions panel)
   - Run `Explorer Dates: Show Chunk Status` to ensure the `fileDecorations` chunk is loaded. If a chunk is disabled, re‑enable it or apply the `Developer` preset via `Explorer Dates: Apply Configuration Preset`.
2. **Use the guided fix flow (two minutes)**
   1. `Explorer Dates: Run Diagnostics (Fix Missing Decorations)` – `Ctrl+Shift+H`
   2. `Explorer Dates: Quick Fix Common Issues`
   3. `Explorer Dates: Refresh Date Decorations`
3. **Validate configuration**
   - Run `Explorer Dates: Validate Configuration`
   - If you're on a shared profile, also run `Explorer Dates: Validate Team Configuration`
   - Resolve anything flagged as “invalid”, “deprecated”, or “overridden by team config”
4. **Collect logs if symptoms persist**
   - Toggle `explorerDates.enableTroubleShootingMode`
   - Open *Output → Explorer Dates* or run `Explorer Dates: Monitor VS Code Decoration Requests`
   - Keep this information handy if you need to file an issue

If decorations still misbehave, use the playbooks below.

---

## 2. Symptom Playbooks

### 2.1 No decorations anywhere in the Explorer

| Checklist | Why it matters |
| --- | --- |
| `Explorer Dates: Toggle Date Decorations` → ensure it reports “enabled” | Decorations can be globally disabled without changing your settings |
| `Explorer Dates: Monitor VS Code Decoration Requests` | Confirms whether VS Code is even asking the provider for badges |
| `Explorer Dates: Test VS Code Decoration Rendering` | Registers a dummy provider; if this fails, VS Code itself is blocking decorations |
| `Explorer Dates: Validate Configuration` | Catches invalid exclusions, conflicting badge priorities, or missing chunk flags |
| `Explorer Dates: Reset to Default Settings` (only if diagnostics show a corrupted config) | Resets settings while preserving team profiles |

**Settings to inspect**
```json
{
  "explorerDates.showDateDecorations": true,
  "explorerDates.badgePriority": "time",
  "explorerDates.forceShowForFileTypes": [],
  "explorerDates.excludedPatterns": [
    "**/.git/**",
    "**/node_modules/**",
    "**/*.tmp",
    "**/*.log"
  ]
}
```

If `excludedPatterns` contains `**/*`, `*.*`, or file-specific globs (e.g., `**/*.jpg`) the badges will disappear for those files. Remove or narrow them and rerun `Explorer Dates: Refresh Date Decorations`.

### 2.2 Only some file types (e.g., JPG/PNG) or folders show badges

1. Open Settings (`Ctrl+,`) → search “Explorer Dates”.
2. Under **Force Show For File Types** add the extensions you need:
   ```json
   [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".pdf", ".mp4", ".mov"]
   ```
3. Ensure `explorerDates.smartExclusions` or `explorerDates.workspaceIntelligence` haven’t auto-excluded the folder. Use `Explorer Dates: Show Workspace File Activity` to see what the smart exclusion system is ignoring.
4. If your workspace applies a team template, open `.vscode/explorer-dates-team.json` (or the path shown in the notification) and confirm no `excludedPatterns` or `excludedFolders` entries conflict with your needs. If they do, re-run `Explorer Dates: Organize Settings` to split user vs workspace overrides cleanly and then adjust your personal settings.

### 2.3 Decorations are stale or update slowly

| Action | Notes |
| --- | --- |
| `Explorer Dates: Refresh Date Decorations` | Clears caches and forces VS Code to request fresh badges |
| `Explorer Dates: Debug Cache Performance` (`Ctrl+Shift+M`) | Look for < 80% hit rate or repeated “stale entry” warnings |
| Check `explorerDates.periodicRefreshInterval` | Large values (>900s) delay automatic updates |
| Enable incremental workers: `"explorerDates.enableIncrementalWorkers": true` | Background worker keeps metadata current on large repos |
| Verify file system events are flowing | `Explorer Dates: Show Performance Analytics` highlights watcher drops. If you see repeated `fswatcher_throttled`, enable `"explorerDates.smartFileWatching": true` or fall back to manual refresh |

When working over remote/SSH, VS Code sometimes queues file events. Switching `explorerDates.featureLevel` to `"balanced"` or `"minimal"` reduces watcher pressure.

### 2.4 Performance issues (CPU spikes, fans, laggy Explorer)

1. Enable `Explorer Dates: Performance Mode` or set:
   ```json
   {
     "explorerDates.performanceMode": true,
     "explorerDates.showGitInfo": "none",
     "explorerDates.showFileSize": false,
     "explorerDates.progressiveLoading": false
   }
   ```
2. Use `Explorer Dates: Optimize Bundle Size` → accept the suggested preset to unload unused chunks (onboarding, reporting, templates, etc.).
3. For large mono-repos:
   ```json
   {
     "explorerDates.featureLevel": "balanced",
     "explorerDates.smartFileWatching": true,
     "explorerDates.maxTrackedActivityFiles": 2500,
     "explorerDates.enableIncrementalWorkers": false
   }
   ```
4. Disable status bar + analytics if unnecessary:
   ```json
   {
     "explorerDates.showStatusBar": false,
     "explorerDates.enableExportReporting": false,
     "explorerDates.enableAnalysisCommands": false
   }
   ```

Symptoms such as “Extension Host using >100% CPU” or “Explorer scroll lag” typically mean too many features are loaded for the current workspace. The optimization command generates a before/after bundle summary so you can verify improvements immediately.

### 2.5 Team configuration or migration conflicts

When multiple people share settings via templates or `.vscode/settings.json`, conflicts can suppress decorations silently.

1. Run `Explorer Dates: Validate Team Configuration`.
2. If conflicts are reported, choose **View Conflicts** to open the diff between team vs user settings.
3. Run `Explorer Dates: Organize Settings` to rehydrate misplaced files (the `settingsCoordinator` moves stray `explorer-dates-*.json` files into `.vscode/explorer-dates/` and updates references automatically).
4. For legacy settings (pre-v1.3), run:
   - `Explorer Dates: Migrate Settings`
   - `Explorer Dates: Clean Legacy Settings`
5. Confirm the final effective configuration via `Explorer Dates: Show Current Configuration`.

### 2.6 Read-only workspaces or disk-full warnings (team presets revert after reload)

Symptoms:

- Repeated warning: “Explorer Dates team configuration could not be saved … Changes will be kept in memory”.
- `.explorer-dates-profiles.json` never updates and team presets disappear after restarting VS Code.
- Workspace recently switched to read-only, mounted over SSH/Containers, or the disk ran out of space.

What’s happening:

- Explorer Dates now falls back to **in-memory team configuration snapshots** whenever writes throw `EACCES`, `EPERM`, `EROFS`, or `ENOSPC`.
- You can keep working—`Explorer Dates: Validate Team Configuration` and decorations still read the cached profiles—but nothing persists to disk until the filesystem accepts writes again.

How to recover:

1. **Fix the root cause**  
   - Re-enable write permissions on the repo folder, remount the share as read/write, or free disk space if `ENOSPC` triggered the warning.
2. **Flush the cached profile to disk**  
   - Run `Explorer Dates: Validate Team Configuration` or `Explorer Dates: Save Team Profiles` once the workspace is writable. The extension automatically retries the write, clears the warning throttle, and removes the in-memory snapshot.
3. **Verify persistence**  
   - Reopen `.explorer-dates-profiles.json` (or run `Explorer Dates: Validate Team Configuration`) to confirm the file exists on disk and no warning banner appears on the next save.

Until the filesystem is writable again, assume the team configuration is **ephemeral**. If you must capture the temporary changes, copy the JSON shown in the warning dialog to a safe location or export via `Explorer Dates: Save Current Configuration as Template` before restarting VS Code.

---

## 3. Command Reference for Troubleshooting

| Command | Shortcut | Purpose |
| --- | --- | --- |
| `Explorer Dates: Run Diagnostics (Fix Missing Decorations)` | `Ctrl+Shift+H` | Guided RCA with auto-remediations |
| `Explorer Dates: Quick Fix Common Issues` | — | Re-enables decorations, fixes exclusions, refreshes caches |
| `Explorer Dates: Refresh Date Decorations` | `Ctrl+Shift+R` | Forces VS Code to re-request every badge |
| `Explorer Dates: Monitor VS Code Decoration Requests` | — | Streams decoration requests to the Output channel |
| `Explorer Dates: Test VS Code Decoration Rendering` | — | Confirms VS Code can render badges at all |
| `Explorer Dates: Debug Cache Performance` | `Ctrl+Shift+M` | Shows cache stats and stale/expired entries |
| `Explorer Dates: Validate Configuration` | — | Detects invalid settings, deprecated keys, scope conflicts |
| `Explorer Dates: Validate Team Configuration` | — | Verifies shared templates and conflict resolution |
| `Explorer Dates: Show Chunk Status` | — | Lists loaded/disabled modules + bundle sizes |
| `Explorer Dates: Optimize Bundle Size` | — | Generates per-feature performance recommendations |

Keep this table handy when coaching teammates through issues—every command here records enough telemetry (locally) to attach to a support ticket.

---

## 4. Logging & Support Checklist

When you need to open a GitHub issue, include:

1. VS Code version + Explorer Dates version (`Explorer Dates: Show What's New`)
2. Workspace type (local, WSL, SSH, Codespaces, vscode.dev/github.dev)
3. Output from:
   - `Explorer Dates: Run Diagnostics` (copy the report)
   - `Explorer Dates: Show Chunk Status`
   - `Explorer Dates: Validate Configuration`
4. Relevant log lines from *Output → Explorer Dates* (enable troubleshooting mode first)
5. Snippet of your `settings.json` (user), workspace `.vscode/settings.json`, and any `explorer-dates-*.json` template in play

Support template:
```markdown
### Environment
- VS Code: 1.105.1
- Explorer Dates: 1.3.0
- Workspace: Local Windows 11

### Symptoms
- No badges after pulling changes
- `Validate Configuration` flags `excludedPatterns` = "**/*"

### Diagnostics
- Run Diagnostics: `Provider Active = false`
- Chunk Status: `fileDecorations` disabled

### Logs
```
<paste relevant lines>
```
```

---

## 5. FAQ – Why Decorations Fail

1. **Decorations chunk disabled** – Feature gating (module federation) lets you unload large chunks; if the `fileDecorations` chunk is off, nothing renders. Re-enable via `Show Chunk Status`.
2. **Team template overrides** – Shared configs can force exclusions or disable badges; validate team configuration to spot silent overrides.
3. **Provider throttled by VS Code** – Certain VS Code builds throttle decoration providers after too many errors. Use `Test VS Code Decoration Rendering` and `Monitor VS Code Decoration Requests` to confirm.
4. **Cache poisoning** – The cache can store “no decoration” results for excluded files; `Debug Cache Performance` + manual refresh clears these entries.
5. **Other extensions** – File explorer replacements and Git decorators sometimes consume the decoration budget. Disable them temporarily or use `Developer: Set Log Level` → Trace to confirm conflicts.

Remember: every troubleshooting command listed here is available in both desktop VS Code and the web bundle (`vscode.dev`, `github.dev`). If a command is hidden, the corresponding feature chunk is disabled—enable it in `Show Chunk Status` first.

---

## 6. Security Validation Suite

Run these npm scripts before merging any path-handling or file-system change (and whenever the provider feels “off” after refactors):

- `npm run test:security-utils` – targeted suite that exercises traversal detection, dangerous character filtering, sanitization, workspace boundary enforcement, and ReDoS guards.
- `npm run test:suite` – full regression pack (includes the security suite at the end) for release candidates or when you need end-to-end assurance.

CI runs `npm run test:security-utils` on every PR/push to `main`/`develop`, so local failures will block your build anyway—save time by running it before pushing.

Need to loosen the new security guardrails for migrations or harnesses? Use the runtime settings (via Settings UI or `settings.json`):

- `explorerDates.security.enforceWorkspaceBoundaries` – master switch; leave on for normal workspaces, flip off only when sandboxing already handled elsewhere.
- `explorerDates.security.enableBoundaryEnforcement` – preferred version of the setting above; when left untouched it stays on in production builds but relaxes automatically in dev/test environments.
- `explorerDates.security.allowedExtraPaths` – absolute paths Explorer Dates should treat as trusted (e.g., temp migration directories or fixture roots).
- `explorerDates.security.allowTestPaths` – keeps test runners happy by relaxing boundary checks automatically when `EXPLORER_DATES_TEST_MODE=1` or `NODE_ENV=test`.
- `explorerDates.security.logThrottleWindowMs` – de-duplicate repetitive warnings by raising/lowering the throttle window (default 5000 ms).
- `explorerDates.security.maxWarningsPerFile` – cap how many warnings a single file can emit per session (default 1; set to 0 for unlimited auditing).

You can also set `EXPLORER_DATES_SECURITY_EXTRA_PATHS=/tmp/fixtures:/var/migrations` (use `;` on Windows) to append additional roots without touching workspace settings.
