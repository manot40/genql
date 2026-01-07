import type { FieldMap } from '../../runtime/types';
import type { RenderContext } from '../common/RenderContext';
import type { GraphQLUnionType } from 'graphql';

import uniq from 'lodash-es/uniq.js';

export const unionType = (type: GraphQLUnionType, _: RenderContext) => {
  const types = type.getTypes();
  const typeObj: FieldMap<string> = types.reduce<FieldMap<string>>((r, t) => {
    r[`on_${t.name}`] = { type: t.name };
    return r;
  }, {});

  const commonInterfaces = uniq(types.map((x) => x.getInterfaces()).flat());
  commonInterfaces.forEach((t) => {
    typeObj[`on_${t.name}`] = { type: t.name };
  });

  typeObj.__typename = { type: 'String' };

  return typeObj;
};
