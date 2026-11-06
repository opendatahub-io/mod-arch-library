import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { fileExists, readJSON, writeJSON } from './filesystem.js';
import type { ModulePorts } from '../types.js';

/**
 * Ports the default (federated) flavor templates ship with. They are placeholders: every
 * odh-dashboard module needs unique values, which callers (e.g. the odh-dashboard
 * `/module-onboarding` skill) allocate and pass via --port / --bff-port / --service-port.
 */
export const TEMPLATE_PORTS = {
  frontend: 9103,
  bff: 4000,
  service: 8043,
} as const;

function replaceFrontendPort(content: string, port: number): string {
  return content.replace(new RegExp(`\\b${TEMPLATE_PORTS.frontend}\\b`, 'g'), String(port));
}

function replaceBffPort(content: string, port: number): string {
  // Matches PORT=4000 and PROXY_PORT=4000 (Makefile recipes and package.json scripts).
  return content.replace(new RegExp(`\\b((?:PROXY_)?PORT)=${TEMPLATE_PORTS.bff}\\b`, 'g'), `$1=${port}`);
}

async function rewriteText(filePath: string, transform: (content: string) => string): Promise<void> {
  if (!(await fileExists(filePath))) {
    return;
  }
  const content = await readFile(filePath, 'utf-8');
  const next = transform(content);
  if (next !== content) {
    await writeFile(filePath, next, 'utf-8');
  }
}

/**
 * Apply allocated ports to a scaffolded default-flavor module. Only ports that were provided
 * are rewritten; the rest keep their template placeholder values.
 */
export async function applyModulePorts(targetDir: string, ports: ModulePorts): Promise<void> {
  const { frontend, bff, service } = ports;
  if (frontend === undefined && bff === undefined && service === undefined) {
    return;
  }

  const transform = (content: string) => {
    let result = content;
    if (frontend !== undefined) {
      result = replaceFrontendPort(result, frontend);
    }
    if (bff !== undefined) {
      result = replaceBffPort(result, bff);
    }
    return result;
  };

  // Makefile recipes and frontend scripts carry the ports inline.
  await rewriteText(path.join(targetDir, 'Makefile'), transform);
  await rewriteText(path.join(targetDir, 'frontend', 'package.json'), transform);
  // Cypress mock runs read BASE_URL from here; it must match the cypress:server port.
  await rewriteText(path.join(targetDir, 'frontend', '.env.cypress.mock'), transform);

  // Root package.json: scripts inline + the structured module-federation block.
  const rootPackageJsonPath = path.join(targetDir, 'package.json');
  if (await fileExists(rootPackageJsonPath)) {
    await rewriteText(rootPackageJsonPath, transform);
    const pkg = await readJSON(rootPackageJsonPath);
    const mf = pkg['module-federation'];
    if (mf) {
      if (frontend !== undefined && mf.local) {
        mf.local.port = frontend;
      }
      if (service !== undefined && mf.service) {
        mf.service.port = service;
      }
      await writeJSON(rootPackageJsonPath, pkg);
    }
  }
}

export function parsePort(value: string, flag: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${flag} "${value}". Must be an integer between 1 and 65535.`);
  }
  return port;
}
