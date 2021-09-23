import React, { createContext } from 'react';

import {
  Automation,
  deleteInstance,
  deployAutomation,
  Instance,
  listAutomationInstances,
  listPublishedAutomations,
  undeployAutomation,
} from '../automation/automation';
import { DefaultParties, fetchDefaultParties } from '../default-parties/defaultParties';
import { fetchPublicToken } from '../default-parties/publicToken';
import { PartyToken } from '../party-token/PartyToken';

import { usePolling } from '../utils';

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds

interface DamlHubCtx {
  partyToken?: PartyToken;
  publicToken?: PartyToken;
  publicParty?: string;
  userAdminParty?: string;
  automations?: Automation[];
  instances?: Instance[];
}

const initialDamlHubCtx = {
  partyToken: undefined,
  publicToken: undefined,
  publicParty: undefined,
  userAdminParty: undefined,
  automations: undefined,
  instances: undefined,
};

enum ActionType {
  SET_PARTY_TOKEN = 'set-party-token',
  SET_PUBLIC_TOKEN = 'set-public-token',
  SET_PUBLIC_PARTY = 'set-public-party',
  SET_USERADMIN_PARTY = 'set-useradmin-party',
  SET_AUTOMATIONS = 'set-automations',
  SET_INSTANCES = 'set-instances',
}

type Action =
  | { type: ActionType.SET_PARTY_TOKEN; partyToken: PartyToken }
  | { type: ActionType.SET_PUBLIC_TOKEN; publicToken: PartyToken }
  | { type: ActionType.SET_PUBLIC_PARTY; publicParty?: string }
  | { type: ActionType.SET_USERADMIN_PARTY; userAdminParty?: string }
  | { type: ActionType.SET_AUTOMATIONS; automations: Automation[] }
  | { type: ActionType.SET_INSTANCES; instances: Instance[] };

const reducer = (state: DamlHubCtx, action: Action): DamlHubCtx => {
  // Clone the `action` object, excluding the 'type' key
  const newState: DamlHubCtx = (({ type, ...o }) => o)(action);
  return { ...state, ...newState };
};

interface DamlHubProps {
  token?: PartyToken | string; // Not all APIs require a token
  interval?: number;
}

// This empty default context value does not escape outside of the provider.
const DamlHubContext = createContext<DamlHubCtx | undefined>(undefined);

export const DamlHub: React.FC<DamlHubProps> = ({ children, token, interval: _i }) => {
  const [ctx, dispatch] = React.useReducer(reducer, initialDamlHubCtx);
  const { partyToken, publicToken, publicParty, userAdminParty } = ctx;

  React.useEffect(() => {
    if (token && !partyToken) {
      const partyToken: PartyToken = typeof token === 'string' ? new PartyToken(token) : token;
      dispatch({ type: ActionType.SET_PARTY_TOKEN, partyToken });
    }
  }, [token]);

  const interval = _i || DEFAULT_POLL_INTERVAL;

  const hubAPIFetches = React.useCallback(async () => {
    // No need to poll unless there is no token, or it is expired
    if (!publicToken || publicToken.isExpired) {
      const pt = await fetchPublicToken();
      pt && dispatch({ type: ActionType.SET_PUBLIC_TOKEN, publicToken: new PartyToken(pt) });
    }

    // No need to keep polling default parties after both have been found.
    if (!publicParty || !userAdminParty) {
      const [p, ua] = await fetchDefaultParties();

      !publicParty && dispatch({ type: ActionType.SET_PUBLIC_PARTY, publicParty: p });
      !userAdminParty && dispatch({ type: ActionType.SET_USERADMIN_PARTY, userAdminParty: ua });
    }

    // List published automations
    if (publicToken) {
      const automations = await listPublishedAutomations(publicToken.token);
      !!automations && dispatch({ type: ActionType.SET_AUTOMATIONS, automations });
    }

    // List running automation instances
    if (partyToken) {
      const instances = await listAutomationInstances(partyToken.token);
      !!instances && dispatch({ type: ActionType.SET_INSTANCES, instances });
    }
  }, [partyToken, publicToken, publicParty, userAdminParty]);

  usePolling(hubAPIFetches, interval);

  return React.createElement(DamlHubContext.Provider, { value: ctx }, children);
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

/**
 * React hook to manage automations and create deployments.
 */
export function useAutomations() {
  var ctx = React.useContext(DamlHubContext);
  if (ctx === undefined) {
    throw new Error('useAutomations must be within a DamlHub Provider');
  }

  const { automations, partyToken } = ctx;

  const undeployAutomationWrapper = !!partyToken
    ? async (artifactHash: string) => {
        undeployAutomation(partyToken.token, artifactHash);
      }
    : undefined;

  return { automations, undeployAutomation: undeployAutomationWrapper };
}

/**
 * React hook to manage instances of running automations.
 */
export function useAutomationInstances() {
  var ctx = React.useContext(DamlHubContext);
  if (ctx === undefined) {
    throw new Error('useAutomationInstances must be within a DamlHub Provider');
  }

  const { instances, automations, partyToken } = ctx;

  const deployAutomationWrapper =
    typeof automations !== 'undefined'
      ? async (artifactHash: string, trigger?: string, token?: string) => {
          if (!!token) {
            deployAutomation(token, automations, artifactHash, trigger);
          } else if (!!partyToken) {
            deployAutomation(partyToken.token, automations, artifactHash, trigger);
          } else {
            Promise.reject('No token available for deploy automation call');
          }
        }
      : undefined;

  const deleteInstanceWrapper = !!partyToken
    ? async (instanceId: string, owner: string, token?: string) => {
        if (token) {
          deleteInstance(token, instanceId, owner);
        } else {
          deleteInstance(partyToken.token, instanceId, owner);
        }
      }
    : undefined;

  return {
    instances,
    deployAutomation: deployAutomationWrapper,
    deleteInstance: deleteInstanceWrapper,
  };
}
