import {
  deleteInstance,
  deployAutomation,
  listAutomationInstances,
  listPublishedAutomations,
  undeployAutomation,
} from '../automation/automation';
import { Automation, Instance, SuccessResponse } from '../automation/schemas';
import { PartyToken } from '../party-token/PartyToken';
import { usePolling } from '../utils';
import React, { createContext } from 'react';

interface AutomationsCtx {
  automations?: Automation[];
  instances?: Instance[];
  undeployAutomation?: (artifactHash: string) => Promise<SuccessResponse>;
  deployAutomation?: (artifactHash: string, trigger?: string, token?: string) => Promise<Instance>;
  deleteInstance?: (instanceId: string, owner: string, token?: string) => Promise<SuccessResponse>;
}

interface AutomationsProviderProps {
  publicToken?: PartyToken | string;
  partyToken?: PartyToken | string;
  interval: number;
}

// This empty default context value does not escape outside of the provider.
const AutomationsContext = createContext<AutomationsCtx | undefined>(undefined);

export const AutomationsProvider: React.FC<AutomationsProviderProps> = ({
  children,
  partyToken,
  publicToken,
  interval,
}) => {
  const [automations, setAutomations] = React.useState<Automation[]>();
  const [instances, setInstances] = React.useState<Instance[]>();

  const pollAutomations = React.useCallback(async () => {
    // List published automations
    if (publicToken) {
      const automations = await listPublishedAutomations(`${publicToken}`);
      setAutomations(automations);
    }
  }, [publicToken, setAutomations]);
  usePolling(pollAutomations, interval);

  const pollInstances = React.useCallback(async () => {
    // List running automation instances
    if (partyToken) {
      const instances = await listAutomationInstances(`${partyToken}`);
      setInstances(instances);
    }
  }, [partyToken, setInstances]);
  usePolling(pollInstances, interval);

  const undeployAutomationWrapper = !!partyToken
    ? async (artifactHash: string) => {
        return undeployAutomation(`${partyToken}`, artifactHash);
      }
    : undefined;

  const deployAutomationWrapper =
    typeof automations !== 'undefined'
      ? async (artifactHash: string, trigger?: string, token?: string) => {
          if (!!token) {
            return deployAutomation(token, automations, artifactHash, trigger);
          } else if (!!partyToken) {
            return deployAutomation(`${partyToken}`, automations, artifactHash, trigger);
          } else {
            return Promise.reject('No token available for deploy automation call');
          }
        }
      : undefined;

  const deleteInstanceWrapper = !!partyToken
    ? async (instanceId: string, owner: string, token?: string) => {
        if (token) {
          return deleteInstance(token, instanceId, owner);
        } else {
          return deleteInstance(`${partyToken}`, instanceId, owner);
        }
      }
    : undefined;

  return React.createElement(
    AutomationsContext.Provider,
    {
      value: {
        automations,
        instances,
        undeployAutomation: undeployAutomationWrapper,
        deployAutomation: deployAutomationWrapper,
        deleteInstance: deleteInstanceWrapper,
      },
    },
    children
  );
};

/* === Public Hook Definitions === */

/**
 * React hook to manage automations and create deployments.
 */
export function useAutomations() {
  var ctx = React.useContext(AutomationsContext);
  if (ctx === undefined) {
    throw new Error('useAutomations must be within a DamlHub Provider');
  }

  return {
    automations: ctx.automations,
    deployAutomation: ctx.deployAutomation,
  };
}

/**
 * React hook to manage instances of running automations.
 */
export function useAutomationInstances() {
  var ctx = React.useContext(AutomationsContext);
  if (ctx === undefined) {
    throw new Error('useAutomationInstances must be within a DamlHub Provider');
  }

  return {
    instances: ctx.instances,
    deployAutomation: ctx.deployAutomation,
    deleteInstance: ctx.deleteInstance,
  };
}
