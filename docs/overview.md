# Overview

Modular Architecture is our plan to make Kubeflow and RHOAI scale: let every team ship independently, but land together through module federation. This page keeps the narrative short so you can move straight to the starter and Golden Path.

![Modular Architecture Overview](meta/mod-arch-overview.png)

## What we are building

| Layer | Purpose |
| --- | --- |
| **Micro-frontend** | React app that renders a bounded business capability (Model Registry, Gen AI, etc.). |
| **BFF** | Small Go service that terminates auth, talks to Kubernetes, and exposes a focused OpenAPI contract. |
| **Module Federation Runtime** | The RHOAI Dashboard consumes remoteEntry files at runtime, while Kubeflow keeps the same code as a native component. |

Every module starts from `mod-arch-starter`: same repo structure, same tooling, repeatable setup via `npx mod-arch-installer`. You choose the flavor:

- **Kubeflow** flavor keeps the `mod-arch-kubeflow` theme provider and matches upstream UX.
- **Default** flavor drops Kubeflow dependencies, keeps PatternFly as the only theme, and is optimized for ODH/RHOAI federated remotes.

## Why this matters for teams

1. **Module Federation first** – RHOAI Dashboard stays lean and loads modules when needed. New teams can iterate in their own repo without waiting for the monolith.
2. **Upstream-first Kubeflow** – The same code base powers the Kubeflow experience. We keep the Kubeflow flavor in sync so upstream reviewers only see relevant changes.
3. **Golden Paths over tribal knowledge** – The starter + docs encode env setup, scripts, and conventions, so teams spend time on product logic, not plumbing.

## Start a module in two scenarios

### Kubeflow (upstream flow)

1. Scaffold with `npx mod-arch-installer -n <name> --flavor kubeflow`.
2. Define your OpenAPI surface in `api/openapi/` and stub the BFF handlers.
3. Build UI routes under `frontend/src/app/pages` and wire them through `AppRoutes`.
4. Use the Kubeflow manifests in `manifests/kubeflow/` to test inside the central dashboard.
5. Upstream the feature following Kubeflow governance (OWNERS, docs, tests).
6. Bring the upstream project to the main dashboard through the `update-subtree` script.
7. Configure the repo following hte steps below for federated module.

### ODH/RHOAI (federated module)

1. Scaffold with `npx mod-arch-installer -n <name>` (default flavor removes `mod-arch-kubeflow`), then remove the `TODOs` to adapt the code to the dashboard.
2. Configure `module-federation` metadata in `frontend/package.json` and expose `./extensions`.
3. Register API proxies in the Module Federation config so the dashboard can route to your BFF.
4. Deploy the remote entry to OpenShift and register it in `odh-dashboard` via CR or config map.
5. Ship telemetry/metrics hooks so the platform team can observe the module in production.

## Platform commitments

- **Shared libraries**: `mod-arch-core`, `mod-arch-shared`, and `mod-arch-kubeflow` stay versioned together (see `.github/workflows/publish.yml`).
- **Starter updates**: `mod-arch-installer` bundles the latest starter snapshot; the sync script keeps the CLI current.
- **Docs as contracts**: `docs/` stays concise and links to the deeper references under `reference-docs/` when needed.
