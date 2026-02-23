# Tests Overview

## Contract Guardrails
The chunk and provider contract tests catch regressions where chunk exports drift or command code calls provider methods that no longer exist.

- Chunk contracts live in `tests/helpers/chunk-contracts.js`.
- Provider method checks scan `src/commands/**/*.js` and validate against the runtime provider.

Run with:
- `npm run test:extras`
- `npm run test:contracts`

Note: dist chunk validation is skipped automatically when `dist/` is absent.

## Contract Failure Playbook
- Missing chunk export: update the contract in `tests/helpers/chunk-contracts.js` or restore the export in the chunk module.
- Missing provider method: either add the method to the provider implementation or update command usage; contract checks come from `src/commands/**/*.js`.
- Dist-only failures: rebuild the bundle or verify the dist chunk resolver; dist checks are skipped when `dist/` is absent.
