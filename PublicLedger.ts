import { createElement, PropsWithChildren, useEffect, useState } from 'react';
import { Party, Template } from '@daml/types';
import Ledger, {Query} from '@daml/ledger';
import { createLedgerContext, FetchResult, QueryResult } from '@daml/react';

function publicPartyEndPoint(ledgerId:string):string {
  return `api.projectdabl.com/api/ledger/${ledgerId}/public/token`;
}

async function fetchPublicPartyToken(ledgerId:string) : Promise<string|null> {
  try {
    const response = await fetch('//' + publicPartyEndPoint(ledgerId), {method:"POST"});
    const json = await response.json();
    return 'access_token' in json ? json.access_token : null;
  } catch(error) {
    console.error(`Error fetching public party token ${JSON.stringify(error)}`);
    return null;
  }
}

const { DamlLedger, useParty, useLedger, useQuery, useFetchByKey, useStreamQuery, useStreamFetchByKey, useReload} = createLedgerContext();

type PublicProp = {
  ledgerId : string,
  publicParty : string,
  httpBaseUrl? : string
  wsBaseUrl? : string
  defaultToken? : string
}

export function PublicLedger({ledgerId, publicParty, httpBaseUrl, wsBaseUrl, defaultToken, children} : PropsWithChildren<PublicProp>) {
  const [publicToken, setPublicToken] = useState<string|undefined>(defaultToken);
  useEffect(() => {
    async function res() {
      const pt = await fetchPublicPartyToken(ledgerId);
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

export function useStreamQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory: () => Query<T>, queryDeps: readonly unknown[]): QueryResult<T, K, I>
export function useStreamQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>): QueryResult<T, K, I>
export function useStreamQueryAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, queryFactory?: () => Query<T>, queryDeps?: readonly unknown[]): QueryResult<T, K, I> {
  return useStreamQuery(template, queryFactory, queryDeps);
}

export function useStreamFetchByKeyAsPublic<T extends object, K, I extends string>(template: Template<T, K, I>, keyFactory: () => K, keyDeps: readonly unknown[]): FetchResult<T, K, I> {
  return useStreamFetchByKey(template, keyFactory, keyDeps);
}

export const useReloadAsPublic = useReload
