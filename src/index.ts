import { DamlHub } from './context/DamlHub';

export {
  useDefaultParties,
  useAdminParty,
  usePublicParty,
  usePublicToken,
} from './context/DamlHub';

export { PartyToken } from './party-token/PartyToken';

export { fetchPublicToken } from './default-parties/publicToken';
export { DefaultParties } from './default-parties/defaultParties';

export { Automation, Instance } from './automation/schemas';
export { useAutomations, useAutomationInstances } from './automation/context';

export { convertPartiesJson, InvalidPartiesError, PartiesInputErrors } from './login/PartiesInput';
export { DamlHubLogin, damlHubLogout } from './login/DamlHubLogin';

export { isRunningOnHub, damlHubEnvironment } from './utils';

export default DamlHub;
