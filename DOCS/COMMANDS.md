# Command Palette Reference

Use **Ctrl+Shift+P / Cmd+Shift+P** and type the phrases below to access every Explorer Dates command. Each entry matches the title registered in `package.json`.

## Everyday Commands

| Command Palette Entry | Identifier | What it does |
| --- | --- | --- |
| `Explorer Dates: Toggle Date Decorations` | `explorerDates.toggleDecorations` | Enables or disables all Explorer badges without touching your saved settings. |
| `Explorer Dates: Refresh Date Decorations` | `explorerDates.refreshDateDecorations` | Clears caches and forces VS Code to re-request decorations for every file. |
| `Explorer Dates: Copy File Date` | `explorerDates.copyFileDate` | Copies the currently selected file’s formatted timestamp to the clipboard. |
| `Explorer Dates: Show File Details` | `explorerDates.showFileDetails` | Displays a quick summary (modified time, created time, size, Git attribution) for the focused file. |
| `Explorer Dates: Toggle Fade Old Files` | `explorerDates.toggleFadeOldFiles` | Switches the `fadeOldFiles` setting on/off without opening Settings. |

## Cache & Diagnostics

| Command Palette Entry | Identifier | What it does |
| --- | --- | --- |
| `Explorer Dates: Debug Cache Performance` | `explorerDates.debugCache` | Shows memory/disk cache hit rates, namespace, and sample keys. |
| `Explorer Dates: Show Performance Metrics` | `explorerDates.showMetrics` | Dumps raw provider metrics (counts, cache stats) to an information message. |
| `Explorer Dates: Show Performance Analytics` | `explorerDates.showPerformanceAnalytics` | Opens the interactive dashboard with batch processor stats and latency charts. |
| `Explorer Dates: Run Diagnostics (Fix Missing Decorations)` | `explorerDates.runDiagnostics` | Runs the guided RCA panel that checks VS Code settings, exclusions, badge creation, etc. |
| `Explorer Dates: Quick Fix Common Issues` | `explorerDates.quickFix` | Applies the most common remediation steps (re-enables decorations, refreshes caches, etc.). |
| `Explorer Dates: Monitor VS Code Decoration Requests` | `explorerDates.monitorDecorations` | Instruments the provider so every decoration call + target file is logged for troubleshooting. |
| `Explorer Dates: Test Decoration Provider` | `explorerDates.testDecorations` | Executes the full decoration diagnostics suite and opens the HTML report. |
| `Explorer Dates: Test VS Code Decoration Rendering` | `explorerDates.testVSCodeRendering` | Registers a short-lived dummy provider to confirm badges render correctly in the UI. |

## Configuration & Utilities

| Command Palette Entry | Identifier | What it does |
| --- | --- | --- |
| `Explorer Dates: Show Current Configuration` | `explorerDates.showCurrentConfig` | Displays the effective Explorer Dates configuration (including workspace overrides). |
| `Explorer Dates: Reset to Default Settings` | `explorerDates.resetToDefaults` | Restores every Explorer Dates setting to its default value. |
| `Explorer Dates: Apply Custom Colors` | `explorerDates.applyCustomColors` | Copies the recommended `workbench.colorCustomizations` snippet for the custom color scheme. |
| `Explorer Dates: Open Logs` | `explorerDates.openLogs` | Opens the “Explorer Dates” output channel for real-time logging. |
| `Explorer Dates: Show Keyboard Shortcuts` | `explorerDates.showKeyboardShortcuts` | Lists built-in keybindings such as copy date, refresh, and diagnostics. |
| `Explorer Dates: Show Feature Tour` | `explorerDates.showFeatureTour` | Runs the onboarding carousel that explains badges, caching, and key features. |
| `Explorer Dates: Show Quick Setup Wizard` | `explorerDates.showQuickSetup` | Provides a guided setup experience for choosing color schemes, Git info, etc. |
| `Explorer Dates: Show What's New` | `explorerDates.showWhatsNew` | Highlights release notes for the currently installed version. |
| `Explorer Dates: Show API Information` | `explorerDates.showApiInfo` | Describes the extension API available to other extensions. |

## Workspace Templates & Reporting

| Command Palette Entry | Identifier | What it does |
| --- | --- | --- |
| `Explorer Dates: Open Template Manager` | `explorerDates.openTemplateManager` | Launches the workspace template UI for saving or applying presets. |
| `Explorer Dates: Save Template` | `explorerDates.saveTemplate` | Captures the current configuration as a reusable template. |
| `Explorer Dates: Generate File Modification Report` | `explorerDates.generateReport` | Runs the report/export workflow using the formats enabled in settings. |

## Developer / Internal

| Command Palette Entry | Identifier | What it does |
| --- | --- | --- |
| `Explorer Dates: Show Workspace File Activity` | `explorerDates.showWorkspaceActivity` | Opens the workspace activity webview that lists the most recently changed files. |
| `Explorer Dates: Preview Configuration (Internal)` | `explorerDates.previewConfiguration` | Applies transient preview settings for experiments/onboarding. |
| `Explorer Dates: Clear Configuration Preview (Internal)` | `explorerDates.clearPreview` | Reverts the preview applied by the command above. |

> **Tip:** Commands may hide themselves automatically when the feature they control is disabled (for example, Git-specific entries disappear on `vscode.dev`).
