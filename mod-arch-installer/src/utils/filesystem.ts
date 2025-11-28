import fs from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function copyDirectory(source: string, destination: string) {
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

export async function ensureEmptyDirectory(destination: string) {
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
}

export async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function readJSON(filePath: string) {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeJSON(filePath: string, data: unknown) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(filePath, content, 'utf-8');
}

export async function listFilesRecursively(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursively(entryPath);
      }
      return entryPath;
    }),
  );
  return files.flat();
}

export function copyFileSync(source: string, destination: string) {
  fs.copyFileSync(source, destination);
}
