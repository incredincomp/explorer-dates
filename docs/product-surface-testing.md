# Public product-surface and mutation contracts

The public extension surface is recorded in `tests/product-surface/product-surface.json`. Regenerate it only from the pinned repository state with `npm run generate:product-surface`, then validate declarations, source registrations, settings, menus, keybindings, internal command IDs, and referenced contract tests with `npm run test:product-surface-contract`.

`tests/product-surface/mutation-manifest.json` is an intentionally small detector calibration set. It contains exactly four source mutations. Run `npm run test:mutation-foundation` to execute each mutation in a disposable archived worktree. A mutation is successful only when its named detector fails for the recorded reason; syntax errors, timeouts, cleanup failures, unexpected passes, and authoritative worktree changes fail the harness.

The runtime parity contract compares the pinned source hashes with the committed desktop and web artifacts. This is a source-to-artifact freshness guard; it does not rebuild or alter runtime artifacts during the contract run.
