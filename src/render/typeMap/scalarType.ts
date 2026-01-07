import type { Type } from '../../runtime/types';

import { GraphQLEnumType, GraphQLScalarType } from 'graphql';
import { RenderContext } from '../common/RenderContext';

export const scalarType = (type: GraphQLScalarType | GraphQLEnumType, _: RenderContext): Type<string> => ({});
