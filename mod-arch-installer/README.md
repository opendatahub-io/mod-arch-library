# mod-arch-installer

`mod-arch-installer` delivers the CLI for scaffolding new Modular Architecture projects straight from the `mod-arch-starter` reference implementation.

## Usage

```bash
# Creates ./my-new-module/ in current directory (PatternFly-only flavor)
npx mod-arch-installer -n my-new-module

# Creates ./packages/my-new-module/
npx mod-arch-installer ./packages -n my-new-module

# With Kubeflow flavor (MUI theme)
npx mod-arch-installer -n my-new-module --flavor kubeflow
```

### Options

| Option | Description | Default |
| --- | --- | --- |
| `-n, --name <module-name>` | Module name in kebab-case (e.g., `auto-rag`, `model-registry`) | Prompted if not provided |
| `-f, --flavor <default\|kubeflow>` | Starter flavor: default (PatternFly-only) or kubeflow (MUI theme) | `default` |
| `--install` | Run `npm install` after copying (skipped by default to avoid monorepo conflicts) | Disabled |
| `--git` | Initialize a git repository after copying | Disabled |

The target directory is automatically created using `[base-directory]/[module-name]`.

## Development

1. Run `npm install` from the repo root to install workspace dependencies.
2. Execute `npm run sync-templates --workspace=mod-arch-installer` to copy the latest starter files into the installer package.
3. Build with `npm run build --workspace=mod-arch-installer`.

> The sync script copies the entire `mod-arch-starter` directory (excluding build outputs) into `mod-arch-installer/templates/`, ensuring the published package always contains the freshest starter snapshot.
