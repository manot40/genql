import type { Config } from '../config';

import fs from 'node:fs/promises';
import url from 'node:url';
import path from 'node:path';

import { type ListrTask, Listr } from 'listr2';
import { type GraphQLSchema, type GraphQLEnumType, isEnumType } from 'graphql';

import { camelCase, capitalize } from '../utils';
import { ensurePath, writeFileToPath } from '../helpers/files';
import { renderClientEsm } from '../render/client/renderClient';
import { excludedTypes } from '../render/common/excludedTypes';
import { RenderContext } from '../render/common/RenderContext';
import { renderRequestTypes } from '../render/requestTypes/renderRequestTypes';
import { renderResponseTypes } from '../render/responseTypes/renderResponseTypes';
import { renderSchema } from '../render/schema/renderSchema';
import { renderTypeGuards } from '../render/typeGuards/renderTypeGuards';
import { renderTypeMap } from '../render/typeMap/renderTypeMap';

const typeMapFileEsm = 'types.ts';
const schemaTypesFile = 'schema.ts';
const schemaGqlFile = 'schema.graphql';

const cliRoot = path.dirname(url.fileURLToPath(import.meta.url));
const runtimeFolderPath = path.resolve(cliRoot, 'runtime');

export const clientTasks = (config: Config): ListrTask[] => {
  const clientFileEsm = 'index.ts';

  if (!config.output) throw new Error('`output` must be defined in the config');

  const output = config.output;

  const tasks: ListrTask[] = [
    {
      title: `writing ${schemaGqlFile}`,
      async task(ctx) {
        const renderCtx = new RenderContext(ctx.schema, config);
        renderSchema(ctx.schema, renderCtx);
        await writeFileToPath([output, schemaGqlFile], await renderCtx.toCode('graphql'));
      },
    },
    {
      title: `copy runtime files`,
      async task() {
        const files = await fs.readdir(runtimeFolderPath);
        const target = path.resolve(output, 'runtime');
        const exists = await fs
          .access(target)
          .then(() => true)
          .catch(() => false);

        if (!exists) await fs.mkdir(target, { recursive: true });

        for (const file of files) {
          const raw = await fs.readFile(path.resolve(runtimeFolderPath, file), 'utf-8');
          await fs.writeFile(path.resolve(output, 'runtime', file), `// @ts-nocheck\n${raw};`, 'utf-8');
        }
      },
    },
    {
      title: `writing ${schemaTypesFile}`,
      async task(ctx) {
        const renderCtx = new RenderContext(ctx.schema, config);

        renderResponseTypes(ctx.schema, renderCtx);
        renderRequestTypes(ctx.schema, renderCtx);
        renderTypeGuards(ctx.schema, renderCtx);
        renderEnumsMaps(ctx.schema, renderCtx);

        const code = await renderCtx.toCode('typescript');

        await writeFileToPath(
          [output, schemaTypesFile],
          '// @ts-nocheck\n/* istanbul ignore file */\n/* tslint:disable */\n/* eslint-disable */\n\n' + code
        );
      },
    },

    {
      title: `writing types map`,
      async task(ctx) {
        const renderCtx = new RenderContext(ctx.schema, config);

        renderTypeMap(ctx.schema, renderCtx);

        const code = await renderCtx.toCode();

        await writeFileToPath([output, typeMapFileEsm], `export default ${code}`);
      },
    },

    {
      title: `writing ${clientFileEsm}`,
      async task(ctx) {
        const renderCtx = new RenderContext(ctx.schema, config);

        renderClientEsm(ctx.schema, renderCtx);

        const code = await renderCtx.toCode('typescript', true);

        await writeFileToPath([output, clientFileEsm], '// @ts-nocheck\n' + code);
      },
    },
  ];

  return [
    {
      title: 'preparing client directory',
      task: () => ensurePath([output], true),
    },
    {
      title: `writing files`,
      task() {
        const filteredTasks = tasks.filter((x) => Boolean(x));
        return new Listr(filteredTasks, { concurrent: true });
      },
    },
  ];
};

function renderEnumsMaps(schema: GraphQLSchema, ctx: RenderContext) {
  let typeMap = schema.getTypeMap();

  const enums: GraphQLEnumType[] = [];
  for (const name in typeMap) {
    if (excludedTypes.includes(name)) continue;

    const type = typeMap[name];

    if (isEnumType(type)) {
      enums.push(type);
    }
  }
  if (enums.length === 0) return;

  ctx.addCodeBlock(
    enums
      .map(
        (type) =>
          `export const ${'enum' + capitalize(camelCase(type.name))} = {\n` +
          type
            .getValues()
            .map((v) => {
              if (!v?.name) {
                return '';
              }
              return `   ${v.name}: '${v.name}' as const`;
            })
            .join(',\n') +
          `\n}\n`
      )
      .join('\n')
  );
}
