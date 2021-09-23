import { Decoder, constant, object } from '@mojotech/json-type-validation';

import log from '../log';

import {
  Automation,
  publicAutomationListDecoder,
  Instance,
  instanceDecoder,
  instanceListDecoder,
} from './schemas';

/** ======================== List Public Automations ======================== */

export const listPublishedAutomations = async (
  publicToken: string
): Promise<Automation[] | null> => {
  const headers = {
    Authorization: `Bearer ${publicToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const result = await fetch(`/.hub/v1/published`, { headers, method: 'GET' });
    const json = await result.json();
    const automations = publicAutomationListDecoder.runWithException(json);

    return automations;
  } catch (error) {
    log('automation').error(`Error fetching automation list: ${JSON.stringify(error)}`);
    throw error;
  }
};

/** ======================== List Automation Instances ======================== */

export const listAutomationInstances = async (token: string): Promise<Instance[] | null> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const result = await fetch(`/.hub/v1/published/instance`, { headers, method: 'GET' });
    const json = await result.json();
    const instances = instanceListDecoder.runWithException(json);

    return instances;
  } catch (error) {
    log('automation').error(`Error fetching automation instances: ${JSON.stringify(error)}`);
    throw error;
  }
};

/** ==================== Deploying New Automation Instances ==================== */

export const deployAutomation = async (
  token: string,
  automations: Automation[],
  artifactHash: string,
  trigger?: string
): Promise<Instance | null> => {
  try {
    const artifact = automations?.find(a => a.artifactHash === artifactHash);
    if (artifact) {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const body = JSON.stringify({
        artifactHash: artifact.artifactHash,
        owner: artifact.owner,
        name: trigger,
      });

      const response = await fetch(`/.hub/v1/published/deploy`, { method: 'POST', headers, body });
      const json = await response.json();
      const instance = instanceDecoder.runWithException(json);

      return instance;
    } else {
      throw new Error('Artifact hash does not exist in list of automations');
    }
  } catch (error) {
    log('automation').error(
      `Error attempting to deploy an automation instance: ${JSON.stringify(error)}`
    );
    throw error;
  }
};

/** ==================== Deleting an Automation Instances ==================== */

interface SuccessResponse {
  result: 'success';
}

const successResponse: Decoder<SuccessResponse> = object({
  result: constant('success'),
});

export const deleteInstance = async (
  token: string,
  instanceId: string,
  owner: string
): Promise<SuccessResponse> => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const body = JSON.stringify({ instanceId, owner });

    const url = `/.hub/v1/published/instance/delete`;
    const response = await fetch(url, { method: 'POST', headers, body });

    const json = await response.json();

    return successResponse.runWithException(json);
  } catch (error) {
    log('automation').error(
      `Error attempting to delete an automation instance: ${JSON.stringify(error)}`
    );
    throw error;
  }
};

/** ==================== Undeploying all Automation Instances ==================== */

export const undeployAutomation = async (
  token: string,
  artifactHash: string
): Promise<SuccessResponse> => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const url = `/.hub/v1/published/undeploy/${artifactHash}`;

    const response = await fetch(url, { method: 'POST', headers });
    const json = await response.json();

    return successResponse.runWithException(json);
  } catch (error) {
    log('automation').error(
      `Error attempting to delete an automation instance: ${JSON.stringify(error)}`
    );
    throw error;
  }
};
