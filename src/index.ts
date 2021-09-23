import { DamlHub } from './context/DamlHub';

export { Automation, Instance } from './automation/automation';
export {
  useAdminParty,
  useAutomationInstances,
  useAutomations,
  useDefaultParties,
  usePublicParty,
  usePublicToken,
} from './context/DamlHub';
export { DefaultParties } from './default-parties/defaultParties';
export { fetchPublicToken } from './default-parties/publicToken';
export { DamlHubLogin, damlHubLogout } from './login/DamlHubLogin';
export { convertPartiesJson, InvalidPartiesError, PartiesInputErrors } from './login/PartiesInput';
export { PartyToken } from './party-token/PartyToken';

export { damlHubEnvironment, isRunningOnHub } from './utils';

export default DamlHub;
