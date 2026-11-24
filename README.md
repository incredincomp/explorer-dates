# Explorer Dates

See which files changed recently without leaving VS Code Explorer. Compact badges show file freshness; hover for the exact timestamp when one is available.

[Install from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=incredincomp.explorer-dates)

## What you can do

<!-- features:start -->
Feature list for source version 1.3.2.

- **Spot recent work.** Read compact freshness badges beside files in Explorer.
- **Check the details.** Hover for the timestamp or run **Explorer Dates: Show File Details**. Timestamp sources depend on the workspace.
- **Reduce background work.** Turn on `explorerDates.performanceMode` to keep basic date decorations in large workspaces.
- **Choose a neutral newest-file badge.** Turn on `explorerDates.freshnessUseNeutralNowBadge` to show `T` instead of `!!` without changing the tooltip.
- **Use your usual workspace.** Runs on desktop, Remote SSH, [vscode.dev](https://vscode.dev), and [github.dev](https://github.dev). Some features depend on the host.
<!-- features:end -->

## Get started

1. Install Explorer Dates and open a workspace.
2. Look for badges in Explorer. If decorations are off, run **Explorer Dates: Toggle Date Decorations**.
3. Search for **Explorer Dates** in Settings. To pick a starting configuration, run **Explorer Dates: Apply Configuration Preset**.

## What the badges mean

| Badge | Default meaning |
| --- | --- |
| `!!` | Modified within the past hour. This is not a warning. |
| `T` | Modified within the past 24 hours, or within the newest bucket when the neutral-now badge is enabled. |
| `2d` | Modified within the past two days. |
| `1w` | Modified within the past week. |
| `~~` | Older than a week. |
| `?` | No reliable timestamp available. |

**Prefer a neutral badge?** In versions with the new option, set `explorerDates.freshnessUseNeutralNowBadge` to `true` to show `T` instead of `!!` for the newest files. The exact timestamp and freshness label in the tooltip are unchanged. This option is off by default.

## More information

[Settings guide](./DOCS/SETTINGS_GUIDE.md) · [Commands](./DOCS/COMMANDS.md) · [Troubleshooting](./DOCS/TROUBLESHOOTING.md) · [Release notes](./CHANGELOG.md) · [Report an issue](https://github.com/incredincomp/explorer-dates/issues)

Published Free releases are licensed under the [MIT License](./LICENSE).
