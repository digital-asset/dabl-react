import React, {PropsWithChildren, createContext, useEffect, useState } from "react";
import {Decoder, object, string } from '@mojotech/json-type-validation'

export type WellKnownParties = {
  userAdminParty : string
  publicParty : string
}

const wellKnownPartiesDecoder: Decoder<WellKnownParties> = object({
  userAdminParty: string(),
  publicParty: string(),
})

function wellKnownEndPoint() {
  let url = window.location.host;
  if(!url.endsWith('projectdabl.com')){
    console.log(`Passed url ${url} does not point to projectdabl.com`);
  }

  return url + '/.well-known/dabl.json';
}

async function fetchWellKnownParties() : Promise<WellKnownParties|null> {
  try {
    const response = await fetch('//' + wellKnownEndPoint());
    const dablJson = await response.json();
    return wellKnownPartiesDecoder.runWithException(dablJson)
  } catch(error) {
    console.log(`Error determining well known parties ${JSON.stringify(error)}`);
    return null;
  }
}

// This empty default context value does not escape outside of the provider.
const WellKnownPartiesContext = createContext<WellKnownParties | undefined>(undefined);

type WellKnownPartiesProviderProps = {
  defaultWkp? : WellKnownParties
}

export function WellKnownPartiesProvider({defaultWkp, children}: PropsWithChildren<WellKnownPartiesProviderProps>){
  const [wellKnownParties, setWKP] = useState<WellKnownParties | undefined>(defaultWkp);
  useEffect(() => {
    async function res() {
      const wkp = await fetchWellKnownParties();
      console.log(`The fetched wkp: ${JSON.stringify(wkp)}`);
      if(wkp !== null){
        setWKP(wkp);
      }
    };
    res();
  },[]);

  if(wellKnownParties === undefined){
    return null;
  } else {
    return (
      <WellKnownPartiesContext.Provider value={wellKnownParties}>
        {children}
      </WellKnownPartiesContext.Provider>
    )
  }
}

export function useWellKnownParties(){
  var wkp = React.useContext(WellKnownPartiesContext);
  if(wkp === undefined){
    throw new Error("useWellKnownParties must be within WellKnownPartiesContext Provider");
  }
  return wkp;
}
