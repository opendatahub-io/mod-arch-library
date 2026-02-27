[Local deployment]: ./local-deployment-guide.md
[Local deployment UI]: ./local-deployment-guide-ui.md
[Kubeflow development]: ./kubeflow-development-guide.md
[Starter install]: ./install.md
[Contributing]: ../CONTRIBUTING.md

# Mod Arch UI Docs

This directory contains documentation for the Mod Arch UI.

## Quick Start

For local development, run:

```bash
make dev-install-dependencies
make dev-start
```

This starts the application in **mock mode** (recommended) with `user_token` authentication and a mocked Kubernetes client. No cluster connection required.

See the [Contributing Guide][Contributing] for detailed development modes including:

- `dev-start` - Mock mode (recommended for local development)
- `dev-start-federated` - Tap into a real ODH/RHOAI cluster
- `dev-start-kubeflow` - Kubeflow Central Dashboard development

## Deployment Guides

- [Local Deployment Guide][Local deployment]
- [Local Deployment Guide UI][Local deployment UI]
- [Kubeflow Development Guide][Kubeflow development]
- [Install the Starter][Starter install]
