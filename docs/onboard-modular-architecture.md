# Onboarding a New Modular Architecture Module

This guide outlines the steps to create and onboard a new modular architecture module into the ODH Dashboard.

## Prerequisites

- Node.js >= 22.18.0 and pnpm 11.22.0 (the ODH Dashboard pins pnpm via `packageManager`; run `corepack enable` to pick it up).
- Access to the ODH Dashboard repository.

> **Tip:** The ODH Dashboard repository ships a `/module-onboarding` Claude skill that automates every step below (port allocation, scaffolding, workspace registration, and feature flag/area registration). The manual steps are documented here for reference.

## Steps

### 1. Navigate to the Packages Directory

Open your terminal and navigate to the `packages` folder within the repository:

```bash
cd packages
```

### 2. Choose Unique Ports

The default flavor template ships with placeholder ports that every module must override with unique values:

| Flag | Purpose | Template default |
| ---- | ------- | ---------------- |
| `--port <n>` | Frontend dev server / Module Federation local port (`module-federation.local.port`) | `9103` |
| `--bff-port <n>` | BFF local development port (`PORT=` / `PROXY_PORT=` in the `Makefile` and `package.json` scripts) | `4000` |
| `--service-port <n>` | Production service port (`module-federation.service.port`) | `8043` |

Run `pnpm run validate:ports` from the ODH Dashboard root to list the frontend and production ports already in use (BFF ports are inline in each `packages/*/Makefile`), and pick values that no other module uses. Do not keep the template defaults: they are already taken by existing modules.

### 3. Initialize the Module

Start a new modular architecture project using the installer. Replace `<your-module-name>` with the desired name for your module (in kebab-case) and pass the ports chosen above.

```bash
pnpm dlx mod-arch-installer -n <your-module-name> --port <frontend-port> --bff-port <bff-port> --service-port <service-port>
```

This creates a `./<your-module-name>/` directory with the full starter template (PatternFly-only flavor by default), rewrites the template ports to the values you passed, and replaces the template's `mod-arch` / `modArch` identifiers with your module name (review `package.json`, `frontend/src/odh/extensions.ts`, and `Makefile` for anything left over). The default flavor never installs dependencies itself (`--install` is rejected for it): the module installs as a member of the ODH Dashboard pnpm workspace.

### 4. Register the Module in the Workspace

Add the module's frontend to the `packages` list in the root `pnpm-workspace.yaml` of the ODH Dashboard repository:

```yaml
packages:
  # ... existing entries
  - packages/<your-module-name>/frontend
```

Then install from the repository root:

```bash
cd ..   # back to the ODH Dashboard root
pnpm install
```

### 5. Register the Area and Feature Flag

To enable your module in the main dashboard, register a `SupportedArea` and a feature flag in the host. Use `UPPER_SNAKE_CASE` and `camelCase` variants of your module name (e.g. `my-module` → `MY_MODULE` / `myModule`):

1. `packages/plugin-core/src/areas/types.ts` — add `PLUGIN_<UPPER_SNAKE> = 'plugin-<your-module-name>'` to the `SupportedArea` enum.
2. `packages/k8s-core/src/k8sTypes.ts` — add `<camelCase>?: boolean;` to `DashboardCommonConfig`.
3. `frontend/src/concepts/areas/const.ts` — add the flag default to the appropriate group (e.g. `techPreviewFlags`) and an entry for the new area in `SupportedAreasStateMap`:

   ```typescript
   export const techPreviewFlags = {
     // ... existing flags
     // yourModuleName: true, // Set to true to enable by default in tech preview, or false otherwise
   } satisfies Partial<DashboardCommonConfig>;
   ```

4. `manifests/base/crd/odhdashboardconfigs.opendatahub.io.crd.yaml` — add the flag to the `dashboardConfig` properties so the `OdhDashboardConfig` CRD accepts it.

### 6. Run the Application

Now that your project is configured, you can run the entire stack (backend, frontend, and your new module).

From the root of the repository, run:

```bash
pnpm run dev:frontend
```

And in other terminal

```bash
pnpm run dev:backend
```

And once you have that in another terminal run

```bash
cd packages/<your-module>
make dev-start-federated
```

This command will start:

- The Dashboard Backend
- The Dashboard Frontend (Shell)
- Your new Modular Architecture Module (Federated)

Access the dashboard in your browser (usually at `http://localhost:4010`, the `FRONTEND_PORT` configured for the shell in `.env.development`) and verify that your module is loaded.
