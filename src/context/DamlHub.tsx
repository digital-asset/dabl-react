import React, { createContext } from 'react';

import { AutomationsProvider } from '../automation/context';
import { DefaultParties, fetchDefaultParties } from '../default-parties/defaultParties';
import { fetchPublicToken } from '../default-parties/publicToken';
import { PartyToken } from '../party-token/PartyToken';

import { usePolling, isRunningOnHub } from '../utils';

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds

interface DamlHubCtx {
  partyToken?: PartyToken;
  publicToken?: PartyToken;
  publicParty?: string;
  userAdminParty?: string;
}

interface DamlHubProps {
  token?: PartyToken | string; // Not all APIs require a token
  interval?: number;
  nonHubDomain?: boolean;
}

// This empty default context value does not escape outside of the provider.
const DamlHubContext = createContext<DamlHubCtx | undefined>(undefined);

export const DamlHub: React.FC<DamlHubProps> = ({
  children,
  token,
  interval: _i,
  nonHubDomain = false,
}) => {
  const [partyToken, setPartyToken] = React.useState<PartyToken>();
  const [publicToken, setPublicToken] = React.useState<PartyToken>();
  const [publicParty, setPublicParty] = React.useState<string>();
  const [userAdminParty, setUserAdminParty] = React.useState<string>();
  const interval = _i || DEFAULT_POLL_INTERVAL;

  React.useEffect(() => {
    if (token && !partyToken && isRunningOnHub(nonHubDomain)) {
      const partyToken: PartyToken = typeof token === 'string' ? new PartyToken(token) : token;
      setPartyToken(partyToken);
    }
  }, [token, partyToken, setPartyToken]);

  const pollPublicToken = React.useCallback(async () => {
    // No need to poll unless there is no token, or it is expired
    if (!publicToken || publicToken.isExpired) {
      const pt = await fetchPublicToken();
      pt && setPublicToken(new PartyToken(pt));
    }
  }, [publicToken, setPublicToken]);
  usePolling(pollPublicToken, interval, nonHubDomain);

  const pollDefaultParties = React.useCallback(async () => {
    // No need to keep polling default parties after both have been found.
    if (!publicParty || !userAdminParty) {
      const [p, ua] = await fetchDefaultParties();

      !publicParty && setPublicParty(p);
      !userAdminParty && setUserAdminParty(ua);
    }
  }, [publicParty, userAdminParty, setPublicParty, setUserAdminParty]);
  usePolling(pollDefaultParties, interval, nonHubDomain);

  return (
    <DamlHubContext.Provider
      value={{
        partyToken,
        publicToken,
        publicParty,
        userAdminParty,
      }}
    >
      <AutomationsProvider interval={interval} partyToken={partyToken} publicToken={publicToken}>
        {children}
      </AutomationsProvider>
    </DamlHubContext.Provider>
  );
};

/* === Public Hook Definitions === */

/**
 * React hook to get the default parties.
 */
export function useDefaultParties(): DefaultParties {
  var ctx = React.useContext(DamlHubContext);
  if (ctx === undefined) {
    throw new Error('useDefaultParties must be within a DamlHub Provider');
  }

  return [ctx.publicParty, ctx.userAdminParty];
}

/**
 * React hook to get the UserAdmin party ID.
 */
export function useAdminParty(): string | undefined {
  var ctx = React.useContext(DamlHubContext);
  if (ctx === undefined) {
    throw new Error('useAdminParty must be within a DamlHub Provider');
  }

  return ctx.userAdminParty;
}

/**
 * React hook to get the Public party ID.
 */
export function usePublicParty(): string | undefined {
  var ctx = React.useContext(DamlHubContext);
  if (ctx === undefined) {
    throw new Error('usePublicParty must be within a DamlHub Provider');
  }

  return ctx.publicParty;
}

/**
 * React hook to get the public party token.
 */
export function usePublicToken(): PartyToken | undefined {
  var ctx = React.useContext(DamlHubContext);
  if (ctx === undefined) {
    throw new Error('usePublicToken must be within a DamlHub Provider');
  }

  return ctx.publicToken;
}
