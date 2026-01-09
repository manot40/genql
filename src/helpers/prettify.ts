import type { BuiltInParserName, Plugin } from 'prettier';

type AllowedValues = BuiltInParserName | 'skip';
type FormatResult<T extends AllowedValues> = T extends 'skip' ? string : Promise<string>;

export function prettify<Parser extends AllowedValues>(code: string, parser?: Parser): FormatResult<Parser> {
  if (parser === 'skip' || !hasPrettier()) return code as FormatResult<Parser>;
  else return runPrettier(code, parser) as FormatResult<Parser>;
}

function hasPrettier() {
  try {
    import.meta.resolve('prettier');
    return true;
  } catch {
    return false;
  }
}

async function runPrettier(code: string, parser?: BuiltInParserName) {
  const prettier = await import('prettier/standalone.js').then(({ default: mod }) => mod);
  const parserTS = await import('prettier/plugins/typescript.js').then(({ default: mod }) => mod);
  const parserEstree = await import('prettier/plugins/estree.js').then(({ default: mod }) => mod);
  const parserGraphQL = await import('prettier/plugins/graphql.js').then(({ default: mod }) => mod);

  const getConfig = await import('prettier').then((mod) => mod.resolveConfig);
  const userConfig = (await getConfig('')) ?? {
    semi: false,
    printWidth: 80,
    singleQuote: true,
    trailingComma: 'all',
  };

  const result = await prettier.format(code, {
    ...userConfig,
    parser,
    plugins: [parserGraphQL, parserTS, parserEstree as Plugin],
  });

  return result;
}
