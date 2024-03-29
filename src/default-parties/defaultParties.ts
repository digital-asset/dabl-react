import { array, boolean, Decoder, number, object, string } from '@mojotech/json-type-validation';

import log from '../log';

const PUBLIC_DISPLAY_NAME = 'Public';
const USER_ADMIN_DISPLAY_NAME = 'UserAdmin';

interface PartyDetails {
  displayName: string;
  identifier: string;
  isLocal: boolean;
}

interface AppAPIResponse {
  result: PartyDetails[];
  status: number;
}

const appAPIDecoder: Decoder<AppAPIResponse> = object({
  result: array(
    object({
      displayName: string(),
      identifier: string(),
      isLocal: boolean(),
    })
  ),
  status: number(),
});

export type DefaultParties = [string | undefined, string | undefined];

function getPartyIdByName(list: PartyDetails[], displayName: string): string | undefined {
  return list.find(p => p.displayName === displayName)?.identifier;
}

export async function fetchDefaultParties(): Promise<DefaultParties> {
  try {
    const { hostname: hn } = window.location;
    const app_response = await fetch(`//${hn}/.hub/v1/default-parties`);
    const app_json = await app_response.json();
    const app_parties = appAPIDecoder.runWithException(app_json);
    return [
      getPartyIdByName(app_parties.result, PUBLIC_DISPLAY_NAME),
      getPartyIdByName(app_parties.result, USER_ADMIN_DISPLAY_NAME),
    ];
  } catch (error) {
    log('default-parties').error(`Error determining well known parties ${JSON.stringify(error)}`);
    throw error;
  }
}
