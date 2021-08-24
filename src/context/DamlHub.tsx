import React, { createContext } from 'react';

import { usePolling } from '../utils';
import { PartyToken } from '../party-token/PartyToken';
import { fetchPublicToken, PublicLedger } from '../public-streams/PublicLedger';
import { DefaultParties, fetchDefaultParties } from '../default-parties/defaultParties';

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds

interface DamlHubCtx {
  publicToken?: PartyToken;
  publicParty?: string;
  userAdminParty?: string;
}

const initialDamlHubCtx = {
  publicToken: undefined,
  publicParty: undefined,
  userAdminParty: undefined,
};

enum ActionType {
  SET_PUBLIC_TOKEN = 'set-public-token',
  SET_PUBLIC_PARTY = 'set-public-party',
  SET_USERADMIN_PARTY = 'set-useradmin-party',
}

type Action =
  | { type: ActionType.SET_PUBLIC_TOKEN; token: PartyToken }
  | { type: ActionType.SET_PUBLIC_PARTY; party?: string }
  | { type: ActionType.SET_USERADMIN_PARTY; party?: string };

const reducer = (state: DamlHubCtx, action: Action): DamlHubCtx => {
  switch (action.type) {
    case ActionType.SET_PUBLIC_TOKEN:
      return { ...state, publicToken: action.token };
    case ActionType.SET_PUBLIC_PARTY:
      return { ...state, publicParty: action.party };
    case ActionType.SET_USERADMIN_PARTY:
      return { ...state, userAdminParty: action.party };
  }
};

interface DamlHubProps {
  token?: PartyToken | string; // Not all APIs require a token
  interval?: number;
}

// This empty default context value does not escape outside of the provider.
const DamlHubContext = createContext<DamlHubCtx | undefined>(undefined);

export const DamlHub: React.FC<DamlHubProps> = ({ children, interval: _i }) => {
  const [ctx, dispatch] = React.useReducer(reducer, initialDamlHubCtx);
  const { publicToken, publicParty, userAdminParty } = ctx;

  const interval = _i || DEFAULT_POLL_INTERVAL;

  const hubAPIFetches = React.useCallback(async () => {
    // No need to poll unless there is no token, or it is expired
    if (!publicToken || publicToken.isExpired) {
      const pt = await fetchPublicToken();
      pt && dispatch({ type: ActionType.SET_PUBLIC_TOKEN, token: new PartyToken(pt) });
    }

    // No need to keep polling default parties after both have been found.
    if (!publicParty || !userAdminParty) {
      const [p, ua] = await fetchDefaultParties();

      !publicParty && dispatch({ type: ActionType.SET_PUBLIC_PARTY, party: p });
      !userAdminParty && dispatch({ type: ActionType.SET_USERADMIN_PARTY, party: ua });
    }
  }, [publicToken, publicParty, userAdminParty]);

  usePolling(hubAPIFetches, interval);

  return React.createElement(
    DamlHubContext.Provider,
    { value: ctx },
    publicParty ? <PublicLedger publicParty={publicParty}>{children}</PublicLedger> : children
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
