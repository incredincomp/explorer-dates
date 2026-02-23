# Tests Overview

## Contract Guardrails
The chunk and provider contract tests catch regressions where chunk exports drift or command code calls provider methods that no longer exist.

- Chunk contracts live in `tests/helpers/chunk-contracts.js`.
- Provider method checks scan `src/commands/**/*.js` and validate against the runtime provider.

Run with:
- `npm run test:extras`

Note: dist chunk validation is skipped automatically when `dist/` is absent.
