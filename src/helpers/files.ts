import { resolve } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { mkdirp } from 'mkdirp';
import { rimraf } from 'rimraf';

export const ensurePath = async (path: string[], clear: boolean = false) => {
  if (clear) await rimraf(resolve(...path));

  await mkdirp(resolve(...path));
};

export const readFileFromPath = (path: string[]) => readFile(resolve(...path)).then((b) => b.toString());

export const writeFileToPath = async (path: string[], content: string) => {
  const folder = resolve(...path, '..');
  await mkdir(folder, { recursive: true });
  await writeFile(resolve(...path), content, 'utf-8');
};

export const readFilesAndConcat = (files: string[]) =>
  Promise.all(files.map((file) => readFileFromPath([file]))).then((contents) => contents.join('\n'));
