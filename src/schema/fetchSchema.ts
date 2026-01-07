import type { GraphQLSchemaValidationOptions } from 'graphql/type/schema';

import { buildClientSchema, getIntrospectionQuery, type ExecutionResult } from 'graphql';

export interface SchemaFetcher {
  (query: string, fetchImpl: typeof fetch): Promise<ExecutionResult>;
}

export interface QueryFetch {
  endpoint: string;
  usePost?: boolean;
  timeout?: number;
  headers?: Record<string, string>;
  options?: GraphQLSchemaValidationOptions;
}

export const fetchSchema = async (queryFetchOptions: QueryFetch) => {
  const { headers, endpoint, usePost = true, timeout = 20 * 1000, options } = queryFetchOptions;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const query = new URLSearchParams({ query: getIntrospectionQuery() });

  const fetchOptions: RequestInit = { signal: controller.signal, headers };

  if (usePost) {
    fetchOptions.headers = { ...headers, 'Content-Type': 'application/json' };
    fetchOptions.method = 'POST';
    fetchOptions.body = JSON.stringify({ query: getIntrospectionQuery() });
  }

  const res = await fetch(usePost ? endpoint : `${endpoint}?${query.toString()}`, fetchOptions);

  clearTimeout(id);

  if (!res.ok) {
    throw new Error(`Introspection for ${endpoint} failed, ${res.status} ${res.statusText}`);
  }

  const result = await res.json().catch(() => {
    const contentType = res.headers.get('Content-Type');
    throw new Error(
      `Endpoint '${endpoint}' did not return valid json, content type is ${contentType}, check that your endpoint points to a valid graphql API`
    );
  });

  if (!result.data) {
    throw new Error(`introspection for ${endpoint} failed: ${JSON.stringify(result).slice(0, 400)}...`);
  }

  return buildClientSchema(result.data, options);
};

export function fetchSchemaWithRetry(args: QueryFetch) {
  for (const usePost of [true, false]) {
    try {
      return fetchSchema({ ...args, usePost });
    } catch (e) {
      console.log(e?.['message']);
    }
  }
  return null;
}
