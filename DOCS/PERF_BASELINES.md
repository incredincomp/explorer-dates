# Performance Baselines

Keep local chunk-load tests aligned with the last CI run by pairing the performance regression suite with CI artifacts.

## Files & Locations

| Path | Purpose |
| --- | --- |
| `logs/chunk-load-baseline.json` | Automatically written after every local run of `npm run test:performance-regression`. Stores the latest local chunk timings for comparison on the next run. |
| `tests/artifacts/performance/baseline-trend.json` | Produced by `npm run test:performance-baselines`. Captures bundle sizes and decoration/file-stat latencies for local comparisons. |
| `ci-artifacts/chunk-load-baseline.json` | Optional CI chunk baseline snapshot (downloaded when a `chunk-load-baseline` artifact exists). |
| `ci-artifacts/performance-metrics.json` | Latest CI metrics export (`performance-metrics` artifact) containing bundle sizes, decoration/file-stat latencies, and other BaselineManager data. |
| `ci-artifacts/performance-baseline-trend.json` | CI trend history (`performance-baseline-trend` artifact) with the most recent decoration/bundle snapshot. |

Both files are JSON snapshots with a `metrics` map (chunk timings, heap usage) plus metadata.

## Downloading the Latest CI Baseline

Use the helper script to grab the latest CI artifacts (chunk baseline, performance metrics, and trend files):

```bash
GITHUB_TOKEN=<token with actions:read> npm run fetch:ci-baseline
```

Environment variables:

- `GITHUB_REPOSITORY` (defaults to `incredincomp/explorer-dates`)
- `EXPLORER_DATES_CI_BASELINE_ARTIFACT` (defaults to `chunk-load-baseline`)
- `EXPLORER_DATES_CI_BASELINE_PATH` (defaults to `ci-artifacts/chunk-load-baseline.json`)
- `GITHUB_TOKEN` or `EXPLORER_DATES_GITHUB_TOKEN` must include `actions:read` scope.

The script now attempts to download three artifacts (chunk baseline, performance metrics, performance trend). Each artifact is optional—missing entries simply log a warning. When a CI snapshot is present, `npm run test:performance-regression` loads it and prints per-metric comparisons alongside the local measurements.

## Updating Baselines

Local runs always overwrite `logs/chunk-load-baseline.json` with the latest measurements. To propagate new numbers upstream (e.g., to GitHub environment variables), set:

```bash
EXPLORER_DATES_UPDATE_PERF_BASELINES=1 npm run test:performance-regression
```

When this flag is set inside CI, the suite will also push updated values to the configured GitHub Actions variables.
Run `npm run test:performance-baselines` whenever you need a fresh local snapshot of decoration/file-stat latency or bundle sizes. `npm run test:performance-regression` automatically merges the latest chunk measurements into that snapshot and uses it for comparisons.
