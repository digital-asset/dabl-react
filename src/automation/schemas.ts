import {
  Decoder,
  array,
  boolean,
  constant,
  object,
  optional,
  string,
  union,
  oneOf,
} from '@mojotech/json-type-validation';

export enum EntityTag {
  DamlTrigger = 'DamlTrigger',
  LedgerBot = 'LedgerBot',
  Integration = 'Integration',
}

interface AutomationEntity<Tag extends EntityTag, Value> {
  tag: Tag;
  value: {
    entityName: string;
  } & Value;
}

type DamlTrigger = AutomationEntity<
  EntityTag.DamlTrigger,
  {
    metadata: {};
    packageIds: string[];
    sdkVersion: string;
    triggerNames: string[];
  }
>;

const nullable = <T>(decoder: Decoder<T>): Decoder<T | null> => union(decoder, constant(null));

const damlTriggerDecoder: Decoder<DamlTrigger> = object({
  tag: constant(EntityTag.DamlTrigger),
  value: object({
    entityName: string(),
    metadata: constant({}),
    packageIds: array(string()),
    sdkVersion: string(),
    triggerNames: array(string()),
  }),
});

type LedgerBot = AutomationEntity<EntityTag.LedgerBot, { metadata: {}; runtime: string }>;

const ledgerBotDecoder: Decoder<LedgerBot> = object({
  tag: constant(EntityTag.LedgerBot),
  value: object({
    entityName: string(),
    metadata: constant({}),
    runtime: string(),
  }),
});

interface IntegrationTypeFieldInfo {
  id: string;
  name: string;
  description: string;
  fieldType: string;
  helpUrl?: string | null;
  defaultValue?: string | null;
  required?: boolean | null;
  tags: string[];
  fieldContext?: string | null;
}

const integrationTypeFieldInfoDecoder: Decoder<IntegrationTypeFieldInfo> = object({
  id: string(),
  name: string(),
  description: string(),
  fieldType: string(),
  helpUrl: optional(nullable(string())),
  defaultValue: optional(nullable(string())),
  required: optional(nullable(boolean())),
  tags: array(string()),
  fieldContext: optional(nullable(string())),
});

type Integration = AutomationEntity<
  EntityTag.Integration,
  {
    artifactHash?: string | null;
    typeName: string;
    description: string;
    entrypoint: string;
    runtime?: string | null;
    envClass?: string | null;
    fields: IntegrationTypeFieldInfo[];
    helpUrl?: string | null;
    instanceTemplate?: string | null;
    tags: string[];
  }
>;

const integrationDecoder: Decoder<Integration> = object({
  tag: constant(EntityTag.Integration),
  value: object({
    entityName: string(),
    artifactHash: optional(nullable(string())),
    typeName: string(),
    description: string(),
    entrypoint: string(),
    runtime: optional(nullable(string())),
    envClass: optional(nullable(string())),
    fields: array(integrationTypeFieldInfoDecoder),
    helpUrl: optional(nullable(string())),
    instanceTemplate: optional(nullable(string())),
    tags: array(string()),
  }),
});

export type Automation = {
  artifactHash: string;
  ledgerId: string;
  automationEntity: DamlTrigger | LedgerBot | Integration;
  deployers: string[];
  createdAt: string;
  owner: string;
  apiVersion: string;
};

const automationDecoder: Decoder<Automation> = object({
  artifactHash: string(),
  ledgerId: string(),
  automationEntity: union(damlTriggerDecoder, ledgerBotDecoder, integrationDecoder),
  deployers: array(string()),
  createdAt: string(),
  owner: string(),
  apiVersion: string(),
});

export const publicAutomationListDecoder: Decoder<Automation[]> = array(automationDecoder);

type AutomationConfig = {
  tag: 'AutomationC';
  value: {
    name?: string;
    runAs: string;
    configMap: {};
  };
};

const automationConfigDecoder: Decoder<AutomationConfig> = object({
  tag: constant('AutomationC'),
  value: object({
    name: optional(string()),
    runAs: string(),
    configMap: constant({}),
  }),
});

export type Instance = {
  ledgerId: string;
  entityInfo: {
    apiVersion: string;
    artifactHash: string;
    entity: {
      tag: 'Automation';
      value: DamlTrigger | LedgerBot | Integration;
    };
  };
  enabled: boolean;
  deployer: string;
  config: AutomationConfig;
  id: string;
  instanceLabel: string | null;
  createdAt: string;
  owner: string;
};

export const instanceDecoder: Decoder<Instance> = object({
  ledgerId: string(),
  entityInfo: object({
    apiVersion: string(),
    artifactHash: string(),
    entity: object({
      tag: constant('Automation'),
      value: union(damlTriggerDecoder, ledgerBotDecoder, integrationDecoder),
    }),
  }),
  enabled: boolean(),
  deployer: string(),
  config: automationConfigDecoder,
  id: string(),
  instanceLabel: oneOf(string(), constant(null)),
  createdAt: string(),
  owner: string(),
});

export const instanceListDecoder: Decoder<Instance[]> = array(instanceDecoder);

export interface SuccessResponse {
  result: 'success';
}

export const successResponseDecoder: Decoder<SuccessResponse> = object({
  result: constant('success'),
});
