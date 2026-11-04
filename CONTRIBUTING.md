# Contributing

Thanks for your interest in contributing to Reincharts. We're happy to have you here.

Please take a moment to review this document before submitting your pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

If you need any help, feel free to open a discussion.

## About this repository

This repository is a monorepo for canvas-based interactive and financial charts built with React and TypeScript.

- [pnpm](https://pnpm.io/) workspaces for package management.
- [Turborepo](https://turborepo.com/) for running tasks across packages (with caching).
- [Changesets](https://github.com/changesets/changesets) for versioning and publishing.
- [tsdown](https://tsdown.dev/) for building packages (ESM + type declarations).
- [Vitest](https://vitest.dev/) for unit, component and visual (screenshot) tests.
- [Fumadocs](https://fumadocs.dev/) + Next.js for the documentation site.

## Structure

```
packages/
├── core/         # ChartEngine, <ChartCanvas>, <Pane>, scales, theme, hooks, render loop, events
├── series/       # Chart types: candles, OHLC, line, area, bars, scatter, renko, kagi...
├── indicators/   # Indicator calculators, indicator definitions and <Indicator>
├── axes/         # XAxis, YAxis, Grid
├── coordinates/  # Crosshair, price lines, last value labels
├── tooltip/      # Legend and floating tooltips
├── annotations/  # Markers, labels, watermark, reference lines / areas
├── interactive/  # Drawing tools, editing, undo/redo, persistence, toolbars
├── datafeed/     # Datafeed adapter, realtime, aggregation, replay
├── widget/       # <TradingChart>: batteries-included TradingView-style chart
├── charts/       # "reincharts": re-exports every package
├── testing/      # Internal test helpers (not published)
└── docs/         # Documentation site (not published) → https://reincharts.com
```

Packages export their TypeScript source inside the monorepo, so there is no build step during development: the docs site and tests use the source directly. `publishConfig` points the published packages at the built `dist/` output.

## Development

```bash
git clone https://github.com/your-username/reincharts.git
cd reincharts
pnpm install
pnpm dev          # docs site at http://localhost:3000 with hot reload of every package
```

| Command            | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `pnpm dev`         | Runs the documentation site in development mode                             |
| `pnpm build`       | Builds every package and the docs site                                      |
| `pnpm test`        | Unit and component tests for every package                                  |
| `pnpm test:visual` | Screenshot tests in Chromium (`pnpm exec playwright install chromium` once) |
| `pnpm typecheck`   | Type checks every package                                                   |
| `pnpm lint`        | Lints every package                                                         |
| `pnpm format`      | Formats the repository with Prettier                                        |
| `pnpm changeset`   | Describes a change for the next release                                     |

Run a task for a single package with `pnpm turbo run test --filter=@reincharts/series`, or run Vitest directly inside a package directory.

### Tests

Every package has tests in `packages/<pkg>/test`:

- `*.test.ts(x)`: unit and component tests in happy-dom with a mocked canvas.
- `*.browser.test.tsx`: screenshot tests in real Chromium. Baselines live in `test/__screenshots__` and are platform specific. To update them after an intended visual change, run `pnpm vitest run --project browser --update` inside the package and review the new images.

## Adding components

1. Put the component in the most appropriate package and export it from `src/index.ts`.
2. Build canvas components on the core hooks (`useRenderable`, `useHitTarget`, `useChartEvent`, or `useSeries` for series).
3. Add JSDoc comments to every prop. The docs site generates its API tables from them.
4. Add tests (and a screenshot test for anything visual).
5. Add or update the docs page and its live example in `packages/docs`.

## Code style

TypeScript strict mode, ESLint and Prettier (4 spaces, double quotes, 120 columns). Keep files small and the code simple. Avoid per-frame allocations in draw functions.

## Commit convention

Use `category(scope): message` with one of `feat`, `fix`, `refactor`, `docs`, `build`, `test`, `ci`, `chore`, `style`, `perf`. For example: `feat(series): add baseline series`. See [Conventional Commits](https://www.conventionalcommits.org/).

## Pull requests

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass
- [ ] Visual tests updated when rendering changed
- [ ] Docs page and example updated
- [ ] A changeset is added (`pnpm changeset`) for user-facing changes

## Releasing

All packages are versioned together. When changesets are merged to `main`, the Release workflow opens a "Version Packages" pull request. Merging that pull request builds and publishes the packages to npm. The docs site deploys to GitHub Pages on every push to `main`.

## Getting help

- Check the [documentation](https://reincharts.com/)
- [Open an issue](https://github.com/reincharts/reincharts/issues) for bugs
- [Start a discussion](https://github.com/reincharts/reincharts/discussions) for questions
