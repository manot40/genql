import type { GraphQLEnumType } from 'graphql';
import type { RenderContext } from '../common/RenderContext';

import { typeComment } from '../common/comment';

export const enumType = (type: GraphQLEnumType, ctx: RenderContext) => {
  const values = type.getValues().map((v) => `'${v.name}'`);
  ctx.addCodeBlock(`${typeComment(type)}export type ${type.name} = ${values.join(' | ')}`);
};
