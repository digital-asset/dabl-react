import { createElement, PropsWithChildren, useEffect, useState } from 'react';
import { Decoder, object, string } from '@mojotech/json-type-validation';

import { Party, Template } from '@daml/types';
import Ledger, { Query, StreamCloseEvent } from '@daml/ledger';
import { createLedgerContext, FetchByKeysResult, FetchResult, QueryResult } from '@daml/react';

import { detectAppDomainType, DomainType } from '../utils';

interface PublicTokenResponse {
  access_token: string;
}

const PublicTokenAPIDecoder: Decoder<PublicTokenResponse> = object({
  access_token: string(),
});

export async function fetchPublicToken(): Promise<string | null> {
  try {
    const { hostname: hn } = window.location;
    switch (detectAppDomainType()) {
      case DomainType.APP_DOMAIN:
        const app_response = await fetch(`//${hn}/.hub/v1/public/token`, { method: 'POST' });
        const app_json = await app_response.json();
        const app_public = PublicTokenAPIDecoder.runWithException(app_json);
        return app_public.access_token;
      case DomainType.LEGACY_DOMAIN:
        const ledgerId = window.location.hostname.split('.')[0];
        const legacy_response = await fetch(
          `https://api.${hn.split('.').slice(1).join('.')}/api/ledger/${ledgerId}/public/token`,
          {
            method: 'POST',
          }
        );
        const legacy_json = await legacy_response.json();
        const legacy_public = PublicTokenAPIDecoder.runWithException(legacy_json);
        return legacy_public.access_token;
      default:
        throw new Error('App not running on Daml Hub');
    }
  } catch (error) {
    console.error(`Error fetching public party token: ${JSON.stringify(error)}`);
    return null;
  }
}

const {
  DamlLedger,
  useParty,
  useLedger,
  useQuery,
  useFetchByKey,
  useStreamQuery,
  useStreamQueries,
  useStreamFetchByKey,
  useStreamFetchByKeys,
  useReload,
} = createLedgerContext();

type PublicProp = {
  publicParty: string;
  httpBaseUrl?: string;
  wsBaseUrl?: string;
  defaultToken?: string;
  reconnectThreshold?: number;
};

export function PublicLedger({
  publicParty,
  httpBaseUrl,
  wsBaseUrl,
  defaultToken,
  reconnectThreshold,
  children,
}: PropsWithChildren<PublicProp>) {
  const [publicToken, setPublicToken] = useState<string | undefined>(defaultToken);
  useEffect(() => {
    async function res() {
      const pt = await fetchPublicToken();
      console.log(`The fetched publicToken ${JSON.stringify(pt)}`);
      if (pt !== null) {
        setPublicToken(pt);
      }
    }
    res();
  }, []);

  if (publicToken === undefined) {
    return null;
  } else {
    return createElement(
      DamlLedger,
      { party: publicParty, token: publicToken, httpBaseUrl, wsBaseUrl, reconnectThreshold },
      children
    );
  }
}

export const usePartyAsPublic: () => Party = useParty;
export const useLedgerAsPublic: () => Ledger = useLedger;

export function useQueryAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  queryFactory: () => Query<T>,
  queryDeps: readonly unknown[]
): QueryResult<T, K, I>;
export function useQueryAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>
): QueryResult<T, K, I>;
export function useQueryAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  queryFactory?: () => Query<T>,
  queryDeps?: readonly unknown[]
): QueryResult<T, K, I> {
  return useQuery(template, queryFactory, queryDeps);
}

export function useFetchByKeyAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  keyFactory: () => K,
  keyDeps: readonly unknown[]
): FetchResult<T, K, I> {
  return useFetchByKey(template, keyFactory, keyDeps);
}

/**
 * React Hook to query the ledger, the returned result is updated as the ledger state changes.
 *
 * @deprecated prefer useStreamQueriesAsPublic
 *
 * @typeparam T The contract template type of the query.
 * @typeparam K The contract key type of the query.
 * @typeparam I The template id type.
 *
 * @param template The template of the contracts to match.
 * @param queryFactory A function returning a query. If the query is omitted, all visible contracts of the given template are returned.
 * @param queryDeps The dependencies of the query (for which a change triggers an update of the result).
 * @param closeHandler A callback that will be called if the underlying WebSocket connection fails in an unrecoverable way.
 *
 * @return The matching contracts.
 */
export function useStreamQueryAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  queryFactory?: () => Query<T>,
  queryDeps?: readonly unknown[],
  closeHandler?: (e: StreamCloseEvent) => void
): QueryResult<T, K, I> {
  return useStreamQuery(template, queryFactory, queryDeps, closeHandler);
}

export function useStreamQueriesAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  queryFactory?: () => Query<T>[],
  queryDeps?: readonly unknown[],
  closeHandler?: (e: StreamCloseEvent) => void
): QueryResult<T, K, I> {
  return useStreamQueries(template, queryFactory, queryDeps, closeHandler);
}

/**
 * React Hook to query the ledger. Same as useStreamQueryAsPublic, but query by contract key instead.
 *
 * @deprecated prefer useStreamFetchByKeysAsPublic
 *
 * @typeparam T The contract template type of the query.
 * @typeparam K The contract key type of the query.
 * @typeparam I The template id type.
 *
 * @param template The template of the contracts to match.
 * @param queryFactory A function returning a contract key.
 * @param queryDeps The dependencies of the query (for which a change triggers an update of the result).
 * @param closeHandler A callback that will be called if the underlying WebSocket connection fails in an unrecoverable way.
 *
 * @return The matching (unique) contract, or null.
 */
export function useStreamFetchByKeyAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  keyFactory: () => K,
  keyDeps: readonly unknown[],
  closeHandler: (e: StreamCloseEvent) => void
): FetchResult<T, K, I> {
  return useStreamFetchByKey(template, keyFactory, keyDeps, closeHandler);
}

export function useStreamFetchByKeysAsPublic<T extends object, K, I extends string>(
  template: Template<T, K, I>,
  keyFactory: () => K[],
  keyDeps: readonly unknown[],
  closeHandler: (e: StreamCloseEvent) => void
): FetchByKeysResult<T, K, I> {
  return useStreamFetchByKeys(template, keyFactory, keyDeps, closeHandler);
}

export const useReloadAsPublic = useReload;
