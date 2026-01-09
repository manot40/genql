#!/usr/bin/env node
import type { Config } from './config';

import kleur from 'kleur';
import yargs from 'yargs';

import { generate } from './main';
import { validateConfigs } from './tasks/validateConfigs';
import { existsSync, readFileSync } from 'node:fs';
import { parseColonSeparatedStrings } from './helpers/parse';

async function main() {
  const program = await yargs(process.argv.slice(2))
    .option('output', {
      alias: 'o',
      description: 'Output directory',
      required: true,
      type: 'string',
    })
    .option('endpoint', {
      alias: 'e',
      description: 'Graphql endpoint',
      type: 'string',
    })
    .option('get', {
      alias: 'g',
      description: 'use GET for introspection query',
      type: 'boolean',
    })
    .option('schema', {
      alias: 's',
      type: 'string',
      description: 'path to GraphQL schema definition file',
    })
    .option('header', {
      alias: 'H',
      type: 'array',
      string: true,
      description: 'header to use in introspection query',
    })
    .option('scalar', {
      alias: 'S',
      type: 'array',
      string: true,
      description: 'map a scalar to a type, for example `-S DateTime:string` ',
    })

    .option('sort', {
      type: 'boolean',
      default: false,
      description: 'sort object properties to not create diffs after generations',
    })
    .option('verbose', { alias: 'v', type: 'boolean', default: false })
    .example(
      '$0 --output ./generated --endpoint http://localhost:3000  -H "Authorization: Bearer xxx"',
      'generate the client from an endpoint'
    )
    .example('$0 --output ./generated --schema ./schema.graphql', 'generate the client from a schema')
    .help()
    .parse();

  const config: Config = {
    endpoint: program.endpoint,
    useGet: program.get,
    schema: program.schema && readFile(program.schema),
    output: program.output,
    headers: parseColonSeparatedStrings(program.header || []),
    scalarTypes: parseColonSeparatedStrings(program.scalar || []),
    verbose: program.verbose,
    sortProperties: program.sort,
  };

  if (!validateConfigs([config])) {
    process.exit(1);
  }

  try {
    await generate(config);
    console.info();
    console.info(`${kleur.green('Success!')} Generated client code inside '${program.output}'`);
    console.info();
  } catch (e) {
    console.error(kleur.red('Cannot generate, got an error:'));
    console.error(e);
    process.exit(1);
  }
}

function readFile(p) {
  if (!existsSync(p)) {
    console.log(`file '${p}' does not exist`);
    process.exit(1);
  }
  return readFileSync(p).toString();
}

main();
