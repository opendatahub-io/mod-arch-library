# Modular Architecture Guide

This folder is the entrypoint for anyone building a Modular Architecture module. The north-star goal is clear: **ship module-federated experiences into the RHOAI Dashboard so new teams can contribute quickly, while keeping Kubeflow upstream-first.** Use this guide together with `mod-arch-starter` to stand up a new module in minutes.

## How to use this guide

1. **Read the [Overview](./overview.md)** to understand the why: micro-frontends + BFF + module federation.
2. **Bootstrap the starter** (Kubeflow or default PatternFly flavor) with `npx mod-arch-installer` and skim [`mod-arch-starter/docs/install.md`](../mod-arch-starter/docs/install.md).
3. **Choose your path** (Kubeflow upstream vs. ODH/RHOAI federated) and follow the linked Golden Path and deployment notes below.

## Quick start: mod-arch-starter

```bash
npx mod-arch-installer my-module --flavor kubeflow
# or PatternFly-only
npx mod-arch-installer my-module --flavor default
```

- **Kubeflow flavor**: Includes `mod-arch-kubeflow`, MUI theme provider, and Kubeflow imagery.
- **Default flavor**: Removes Kubeflow dependencies, keeps PatternFly as the source of truth, and is ready for Module Federation in the RHOAI Dashboard.

After the CLI runs, jump into `frontend/` and run `npm run start:dev` (or `npm run start:default`), then hook the Go BFF via `make run` under `bff/`.

## Architecture & Module Federation

- Read [`architecture.md`](./architecture.md) for the stack diagram plus the new "Module Federation Flow" section that explains how `mod-arch-starter` packages `remoteEntry.js`, how the default vs. Kubeflow flavors adjust dependencies, and how the BFF contract ties into Deployment Modes.
- Pair it with [module federation](https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/module-federation.md) when wiring a remote into `odh-dashboard` or explaining the architecture to stakeholders.

## Choose your path

| Path | When to use it | Key steps |
| --- | --- | --- |
| **Kubeflow Upstream** | Contribute new modules directly to Kubeflow. | Scaffold with `--flavor kubeflow`, follow the [Kubeflow track](./golden-path.md#kubeflow-track) in the Golden Path, deploy with the Kubeflow manifests from `mod-arch-starter/manifests/kubeflow`. |
| **ODH/RHOAI Federated** | Deliver modules into the downstream Dashboard using Module Federation. | Scaffold with `--flavor default`, read [Module Federation](https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/module-federation.md) plus the RHOAI section of [Deployment Modes](./deployment-modes.md), then wire the remote entry into `odh-dashboard`. |
| **Standalone / External** | Prototyping or embedding a module outside both dashboards. | Use either flavor, launch the BFF locally, and follow [Deployment Modes](./deployment-modes.md#3-standalone-mode). |

## Essential references

- [Overview](./overview.md) – concise rationale, shared platform responsibilities, and success measures.
- [Architecture](./architecture.md) – system layers, module federation flow, and how the starter enforces BFF + OpenAPI contracts.
- [Deployment Modes](./deployment-modes.md) – compare Kubeflow, Federated (RHOAI), and Standalone expectations.
- [Golden Path](./golden-path.md) – prescriptive checklists for new vs. migration scenarios.
- [Onboard Modular Architecture](onboard-modular-architecture.md) - onboard modular architecture to the dashboard.
- [Module Federation](https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/module-federation.md) – how remote modules register with the dashboard, share deps, and expose extensions.
- [Extensibility](https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/extensibility.md) – surface areas available inside the RHOAI dashboard runtime.
- [Testing](./testing.md) – lightweight strategy for unit, integration, and E2E coverage.

## Additional reading

- Deep-dive proposals live in `reference-docs/` (e.g., [intro](../reference-docs/intro.md) and [module-federation](https://github.com/opendatahub-io/odh-dashboard/blob/main/docs/module-federation.md)).
- ODH Dashboard integration specifics live in [odh-dashboard](https://github.com/opendatahub-io/odh-dashboard).
- Community Q&A happens in the Kubeflow Slack (`#odh-modular-architecture`).

Contributions are welcome—open a PR or drop feedback in the community channel so we can keep this entrypoint sharp and actionable.
