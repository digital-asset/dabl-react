import React, {PropsWithChildren, createContext, useEffect, useState } from "react";
import {Decoder, object, string } from '@mojotech/json-type-validation'

/**
 * @param userAdminParty ID of the UserAdmin party on a ledger.
 * @param publicParty ID of the Public party on a ledger.
 */
export type Parties = {
  userAdminParty: string;
  publicParty: string;
}

/**
 * @param parties The party IDs returned by a successful response.
 * @param loading The current status of the response.
 * @param error The error returned by a failed response.
 */
export type WellKnownParties = {
  parties: Parties | null;
  loading: boolean;
  error: string | null;
}

const wellKnownPartiesDecoder: Decoder<Parties> = object({
  userAdminParty: string(),
  publicParty: string(),
})

function wellKnownEndPoint() {
  let url = window.location.host;
  if(!url.endsWith('projectdabl.com')){
    console.warn(`Passed url ${url} does not point to projectdabl.com`);
  }

  return url + '/.well-known/dabl.json';
}

async function fetchWellKnownParties() : Promise<WellKnownParties> {
  try {
    const response = await fetch('//' + wellKnownEndPoint());
    const dablJson = await response.json();
    const parties = wellKnownPartiesDecoder.runWithException(dablJson);
    return { parties, loading: false, error: null }
  } catch(error) {
    console.error(`Error determining well known parties ${JSON.stringify(error)}`);
    return { parties: null, loading: false, error }
  }
}

// This empty default context value does not escape outside of the provider.
const WellKnownPartiesContext = createContext<WellKnownParties | undefined>(undefined);

type WellKnownPartiesProviderProps = {
  defaultWkp? : Parties
}

/**
 * A React context within which you can use the [[useWellKnowParties]] hook.
 *
 * @param defaultWkp An optional [[WellKnownParties]] that will be returned if the fetch fails.
 */
export function WellKnownPartiesProvider({defaultWkp, children}: PropsWithChildren<WellKnownPartiesProviderProps>){
  const [wellKnownParties, setWKP] = useState<WellKnownParties | undefined>({
    parties: defaultWkp || null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function res() {
      setWKP({
        parties: wellKnownParties?.parties || null,
        loading: true,
        error: null
      });
      const wkp = await fetchWellKnownParties();
      console.log(`The fetched well known parties: ${JSON.stringify(wkp)}`);
      setWKP(wkp);
    };
    res();
  },[]);

  if(wellKnownParties === undefined){
    return null;
  } else {
    return React.createElement(WellKnownPartiesContext.Provider, {value:wellKnownParties}, children);
  }
}

/**
 * React hook the Well Known parties.
 */
export function useWellKnownParties(){
  var wkp = React.useContext(WellKnownPartiesContext);
  if(wkp === undefined){
    throw new Error("useWellKnownParties must be within WellKnownPartiesContext Provider");
  }
  return wkp;
}
