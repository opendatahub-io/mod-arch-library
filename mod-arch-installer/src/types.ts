export type StarterFlavor = 'kubeflow' | 'default';

export interface InstallOptions {
  projectName: string;
  targetDir: string;
  flavor: StarterFlavor;
  skipInstall: boolean;
  initializeGit: boolean;
}
