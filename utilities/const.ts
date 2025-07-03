export enum Theme {
  Patternfly = 'patternfly-theme',
  MUI = 'mui-theme',
  // Future themes can be added here
}

export enum DeploymentMode {
  Standalone = 'standalone',
  Federated = 'federated',
  Kubeflow = 'kubeflow',
}

const POLL_INTERVAL = 30000;

export { POLL_INTERVAL };

export const FindAdministratorOptions = [
  'The person who gave you your username, or who helped you to log in for the first time',
  'Someone in your IT department or help desk',
  'A project manager or developer',
];
