import type { BuiltInParserName, Plugin } from 'prettier';

export function prettify(code: string, parser?: BuiltInParserName | 'skip'): Promise<string> | string {
  const hasPrettier = import.meta.resolve('prettier');

  if (parser === 'skip' || !hasPrettier) return code;

  return new Promise<string>(async (resolve, reject) => {
    try {
      const prettier = await import('prettier/standalone.js').then(({ default: mod }) => mod);
      const parserTS = await import('prettier/plugins/typescript.js').then(({ default: mod }) => mod);
      const parserEstree = await import('prettier/plugins/estree.js').then(({ default: mod }) => mod);
      const parserGraphQL = await import('prettier/plugins/graphql.js').then(({ default: mod }) => mod);

      const result = await prettier.format(code, {
        parser,
        plugins: [parserGraphQL, parserTS, parserEstree as Plugin],
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 80,
      });

      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}
