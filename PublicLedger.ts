import { createElement, PropsWithChildren, useEffect, useState } from 'react';
import { Party, Template } from '@daml/types';
import Ledger, {Query, StreamCloseEvent} from '@daml/ledger';
import { createLedgerContext, FetchByKeysResult, FetchResult, QueryResult } from '@daml/react';

function publicPartyEndPoint(ledgerId: string, hostname: string):string {
  return `${hostname}/api/ledger/${ledgerId}/public/token`;
}

async function fetchPublicPartyToken(ledgerId: string, httpBaseUrl?: string) : Promise<string|null> {
  try {
    const { hostname } = new URL(httpBaseUrl || 'https://api.projectdabl.com');
    const response = await fetch('//' + publicPartyEndPoint(ledgerId, hostname), {method:"POST"});
    const json = await response.json();
    return 'access_token' in json ? json.access_token : null;
  } catch(error) {
    console.error(`Error fetching public party token ${JSON.stringify(error)}`);
    return null;
  }
}

const { DamlLedger, useParty, useLedger, useQuery, useFetchByKey, useStreamQuery, useStreamQueries, useStreamFetchByKey, useStreamFetchByKeys, useReload} = createLedgerContext();

type PublicProp = {
  ledgerId : string,
  publicParty : string,
  httpBaseUrl? : string,
  wsBaseUrl? : string,
  defaultToken? : string
}

export function PublicLedger({ledgerId, publicParty, httpBaseUrl, wsBaseUrl, defaultToken, children} : PropsWithChildren<PublicProp>) {
  const [publicToken, setPublicToken] = useState<string|undefined>(defaultToken);
  useEffect(() => {
    async function res() {
      const pt = await fetchPublicPartyToken(ledgerId, httpBaseUrl);
      console.log(`The fetched publicToken ${JSON.stringify(pt)}`);
      if(pt !== null){
        setPublicToken(pt);
      }
    };
    res();
  }, []);

  if(publicToken === undefined){
    return null;
  } else {
    return createElement(DamlLedger, {party:publicParty, token:publicToken, httpBaseUrl, wsBaseUrl}, children);
  }
}

export const usePartyAsPublic : () => Party = useParty
export const useLedgerAsPublic : () => Ledger =  useLedger

export function useQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory: () => Query<T>, queryDeps: readonly unknown[]): QueryResult<T, K, I>
export function useQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>): QueryResult<T, K, I>
export function useQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory?: () => Query<T>, queryDeps?: readonly unknown[]): QueryResult<T, K, I> {
  return useQuery(template, queryFactory, queryDeps);
}

export function useFetchByKeyAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, keyFactory: () => K, keyDeps: readonly unknown[]): FetchResult<T, K, I> {
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
export function useStreamQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory: () => Query<T>, queryDeps: readonly unknown[], closeHandler: (e: StreamCloseEvent) => void): QueryResult<T, K, I>
export function useStreamQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>): QueryResult<T, K, I>
export function useStreamQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory?: () => Query<T>, queryDeps?: readonly unknown[], closeHandler?: (e: StreamCloseEvent) => void): QueryResult<T, K, I> {
  return useStreamQuery(template, queryFactory, queryDeps, closeHandler);
}

export function useStreamQueriesAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory: () => Query<T>, queryDeps: readonly unknown[], closeHandler: (e: StreamCloseEvent) => void): QueryResult<T, K, I>
export function useStreamQueriesAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>): QueryResult<T, K, I>
export function useStreamQueriesAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory?: () => Query<T>[], queryDeps?: readonly unknown[], closeHandler?: (e: StreamCloseEvent) => void): QueryResult<T, K, I> {
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
export function useStreamFetchByKeyAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, keyFactory: () => K, keyDeps: readonly unknown[], closeHandler: (e: StreamCloseEvent) => void): FetchResult<T, K, I> {
  return useStreamFetchByKey(template, keyFactory, keyDeps, closeHandler);
}

export function useStreamFetchByKeysAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, keyFactory: () => K[], keyDeps: readonly unknown[], closeHandler: (e: StreamCloseEvent) => void): FetchByKeysResult<T, K, I> {
  return useStreamFetchByKeys(template, keyFactory, keyDeps, closeHandler);
}

export const useReloadAsPublic = useReload
