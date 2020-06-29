import { createElement, PropsWithChildren, useEffect, useState } from 'react';
import { createLedgerContext, LedgerContext } from '@daml/react';

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

export const usePartyAsPublic = useParty
//  This format is necessary to correctly assign the type.
export const useLedgerAsPublic : LedgerContext["useLedger"] = useLedger
export const useQueryAsPublic : LedgerContext["useQuery"] = useQuery
export const useFetchByKeyAsPublic : LedgerContext["useFetchByKey"] = useFetchByKey
export const useStreamQueryAsPublic : LedgerContext["useStreamQuery"]= useStreamQuery
export const useStreamFetchByKeyAsPublic : LedgerContext["useStreamFetchByKey"]= useStreamFetchByKey
export const useReloadAsPublic = useReload
