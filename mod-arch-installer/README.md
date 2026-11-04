# mod-arch-installer

`mod-arch-installer` delivers the CLI for scaffolding new Modular Architecture projects straight from the `mod-arch-starter` reference implementation.

## Usage

```bash
# Default (federated, PatternFly-only) flavor — run from odh-dashboard packages/
# Creates ./my-new-module/ with unique ports for this module
pnpm dlx mod-arch-installer -n my-new-module --port 9150 --bff-port 4050 --service-port 8143

# Creates ./packages/my-new-module/ (a base directory is used as-is unless it already ends in the module name)
pnpm dlx mod-arch-installer ./packages/my-new-module -n my-new-module

# Kubeflow flavor (MUI theme), standalone, installing frontend dependencies with pnpm
pnpm dlx mod-arch-installer -n my-new-module --flavor kubeflow --install
```

### Options

| Option | Description | Default |
| --- | --- | --- |
| `[base-directory]` | Directory to scaffold into. When omitted, `./<module-name>/` is created | `.` |
| `-n, --name <module-name>` | Module name in kebab-case (e.g., `auto-rag`, `model-registry`) | Prompted if not provided |
| `-f, --flavor <default\|kubeflow>` | Starter flavor: default (PatternFly-only) or kubeflow (MUI theme) | `default` |
| `--port <port>` | Frontend dev / Module Federation local port (`module-federation.local.port`). Default flavor only | `9103` (template) |
| `--bff-port <port>` | BFF local development port (`PORT=` / `PROXY_PORT=` in the `Makefile` and `package.json` scripts). Default flavor only | `4000` (template) |
| `--service-port <port>` | Production service port (`module-federation.service.port`). Default flavor only | `8043` (template) |
| `--install` | Run `pnpm install` after copying. Kubeflow flavor only — rejected for the federated `default` flavor, which installs as part of the odh-dashboard workspace | Disabled |
| `--git` | Initialize a git repository after copying | Disabled |

The port flags are ignored (with a warning) for the `kubeflow` flavor. The template ports are placeholders: every odh-dashboard module needs unique values, so always pass `--port`, `--bff-port`, and `--service-port` when scaffolding the default flavor.

### Default flavor next steps (odh-dashboard)

1. Add `packages/<module-name>/frontend` to the root `pnpm-workspace.yaml`.
2. Run `pnpm install` from the odh-dashboard root.
3. Register the area and feature flag in the host (`packages/plugin-core/src/areas/types.ts`, `packages/k8s-core/src/k8sTypes.ts`, `frontend/src/concepts/areas/const.ts`, and `manifests/base/crd/odhdashboardconfigs.opendatahub.io.crd.yaml`).

The odh-dashboard `/module-onboarding` Claude skill automates all of the above, including port allocation. See [`docs/onboard-modular-architecture.md`](../docs/onboard-modular-architecture.md) for the manual walkthrough.

## Development

1. Run `npm install` from the repo root to install workspace dependencies.
2. Execute `npm run sync-templates --workspace=mod-arch-installer` to copy the latest starter files into the installer package.
3. Build with `npm run build --workspace=mod-arch-installer`.

> The sync script copies the entire `mod-arch-starter` directory (excluding build outputs) into `mod-arch-installer/templates/`, ensuring the published package always contains the freshest starter snapshot.
