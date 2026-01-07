import { resolve } from 'node:path';
import { glob, mkdir, rm, readFile, writeFile } from 'node:fs/promises';

export const ensurePath = async (path: string[], clear: boolean = false) => {
  if (clear) await rimraf(resolve(...path));
  await mkdir(resolve(...path), { recursive: true });
};

export const readFileFromPath = (path: string[]) => readFile(resolve(...path)).then((b) => b.toString());

export const writeFileToPath = async (path: string[], content: string) => {
  const folder = resolve(...path, '..');
  await mkdir(folder, { recursive: true });
  await writeFile(resolve(...path), content, 'utf-8');
};

export const readFilesAndConcat = (files: string[]) =>
  Promise.all(files.map((file) => readFileFromPath([file]))).then((contents) => contents.join('\n'));

/**
 * Remove files/directories matching a glob pattern.
 *
 * @param pattern Glob pattern (e.g. "dist/**")
 * @param cwd Optional working directory
 */
export async function rimraf(pattern: string, cwd: string = process.cwd()): Promise<void> {
  const matches = glob(pattern, { cwd });

  for await (const match of matches) {
    const fullPath = resolve(cwd, match);
    await rm(fullPath, { force: true, recursive: true });
  }
}
