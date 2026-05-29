export enum DeploymentMode {
  Standalone = 'standalone',
  Federated = 'federated',
  Kubeflow = 'kubeflow',
  XKS = 'xks',
}

const POLL_INTERVAL = 30000;

export { POLL_INTERVAL };
