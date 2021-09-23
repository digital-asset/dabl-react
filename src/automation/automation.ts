import {
  array,
  boolean,
  constant,
  Decoder,
  object,
  oneOf,
  optional,
  string,
} from '@mojotech/json-type-validation';

import log from '../log';

type AutomationValue = {
  packageIds?: string[];
  entityName: string;
  metadata: {};
  sdkVersion?: string;
  runtime?: string;
  triggerNames?: string[];
};

const automationValue: Decoder<AutomationValue> = object({
  packageIds: optional(array(string())),
  entityName: string(),
  metadata: object(),
  sdkVersion: optional(string()),
  runtime: optional(string()),
  triggerNames: optional(array(string())),
});

/** ======================== List Public Automations ======================== */

export type Automation = {
  artifactHash: string;
  ledgerId: string;
  automationEntity: {
    tag: string;
    value: AutomationValue;
  };
  deployers: string[];
  createdAt: string;
  owner: string;
  apiVersion: string;
};

const publicAutomation: Decoder<Automation> = object({
  artifactHash: string(),
  ledgerId: string(),
  automationEntity: object({
    tag: string(),
    value: automationValue,
  }),
  deployers: array(string()),
  createdAt: string(),
  owner: string(),
  apiVersion: string(),
});

const publicAutomationList: Decoder<Automation[]> = array(publicAutomation);

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
    const automations = publicAutomationList.runWithException(json);

    return automations;
  } catch (error) {
    log('automation').error(`Error fetching automation list: ${JSON.stringify(error)}`);
    throw error;
  }
};

/** ======================== List Automation Instances ======================== */

export type Instance = {
  ledgerId: string;
  entityInfo: {
    apiVersion: string;
    artifactHash: string;
    entity: {
      tag: string;
      value: {
        tag: string;
        value: AutomationValue;
      };
    };
  };
  enabled: boolean;
  deployer: string;
  config: {
    tag: string;
    value: {
      name: string;
      runAs: string;
      configMap: {};
    };
  };
  id: string;
  instanceLabel: string | null;
  createdAt: string;
  owner: string;
};

const publishedInstance: Decoder<Instance> = object({
  ledgerId: string(),
  entityInfo: object({
    apiVersion: string(),
    artifactHash: string(),
    entity: object({
      tag: string(),
      value: object({
        tag: string(),
        value: automationValue,
      }),
    }),
  }),
  enabled: boolean(),
  deployer: string(),
  config: object({
    tag: string(),
    value: object({
      name: string(),
      runAs: string(),
      configMap: object(),
    }),
  }),
  id: string(),
  instanceLabel: oneOf(string(), constant(null)),
  createdAt: string(),
  owner: string(),
});

const listInstances: Decoder<Instance[]> = array(publishedInstance);
export const listAutomationInstances = async (token: string): Promise<Instance[] | null> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const result = await fetch(`/.hub/v1/published/instance`, { headers, method: 'GET' });
    const json = await result.json();
    const instances = listInstances.runWithException(json);

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
      const instance = publishedInstance.runWithException(json);

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
): Promise<boolean | null> => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const body = JSON.stringify({ instanceId, owner });

    const url = `/.hub/v1/published/instance/delete`;
    const response = await fetch(url, { method: 'POST', headers, body });

    const json = await response.json();
    const result = successResponse.runWithException(json).result;

    return result === 'success';
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
): Promise<boolean | null> => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const url = `/.hub/v1/published/undeploy/${artifactHash}`;

    const response = await fetch(url, { method: 'POST', headers });
    const json = await response.json();

    const result = successResponse.runWithException(json).result;
    return result === 'success';
  } catch (error) {
    log('automation').error(
      `Error attempting to delete an automation instance: ${JSON.stringify(error)}`
    );
    throw error;
  }
};
