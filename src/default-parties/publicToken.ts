import { Decoder, object, string } from '@mojotech/json-type-validation';

import log from '../log';

interface PublicTokenResponse {
  access_token: string;
}

const publicTokenDecoder: Decoder<PublicTokenResponse> = object({
  access_token: string(),
});

export async function fetchPublicToken(): Promise<string | null> {
  try {
    const { hostname: hn } = window.location;
    const app_response = await fetch(`//${hn}/.hub/v1/public/token`, { method: 'POST' });
    const app_json = await app_response.json();
    const app_public = publicTokenDecoder.runWithException(app_json);
    return app_public.access_token;
  } catch (error) {
    log('public-token').error(`Error fetching public party token: ${JSON.stringify(error)}`);
    throw error;
  }
}
