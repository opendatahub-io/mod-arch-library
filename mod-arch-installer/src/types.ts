export type StarterFlavor = 'kubeflow' | 'default';

export interface ModuleNames {
  /** kebab-case: auto-rag */
  kebabCase: string;
  /** camelCase: autoRag */
  camelCase: string;
  /** PascalCase: AutoRag */
  pascalCase: string;
  /** Title Case: Auto Rag */
  titleCase: string;
  /** snake_case: auto_rag */
  snakeCase: string;
  /** UPPER_SNAKE_CASE: AUTO_RAG */
  upperSnakeCase: string;
}

export interface ModulePorts {
  /** Frontend dev server / Module Federation local port (module-federation.local.port). */
  frontend?: number;
  /** BFF port used for local development (Makefile PORT / PROXY_PORT). */
  bff?: number;
  /** Production service port (module-federation.service.port). */
  service?: number;
}

export interface InstallOptions {
  projectName: string;
  moduleName: ModuleNames;
  targetDir: string;
  flavor: StarterFlavor;
  skipInstall: boolean;
  initializeGit: boolean;
  ports?: ModulePorts;
}
