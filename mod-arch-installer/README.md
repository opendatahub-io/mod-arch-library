# mod-arch-installer

`mod-arch-installer` delivers the `install-mod-arch-starter` CLI, making it easy to scaffold a new Modular Architecture project straight from the `mod-arch-starter` reference implementation.

## Usage

```bash
npx mod-arch-installer my-new-module --flavor kubeflow
```

### Options

- `--flavor <kubeflow|default>`: chooses between the Kubeflow-focused experience or the PatternFly-only default flavor (defaults to `kubeflow`).
- `--skip-install`: copies files without running dependency installs.
- `--no-git`: skips initializing a git repository in the destination folder.

## Development

1. Run `npm install` from the repo root to install workspace dependencies.
2. Execute `npm run sync-templates --workspace=mod-arch-installer` to copy the latest starter files into the installer package.
3. Build with `npm run build --workspace=mod-arch-installer`.

> The sync script copies the entire `mod-arch-starter` directory (excluding build outputs) into `mod-arch-installer/templates/`, ensuring the published package always contains the freshest starter snapshot.
