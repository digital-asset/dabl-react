import decodeJwt from 'jwt-decode';

import { Decoder, number, object } from '@mojotech/json-type-validation';

interface PartyTokenPayload {
  exp: number;
}

const partyTokenDecoder: Decoder<PartyTokenPayload> = object({
  exp: number(),
});

/**
 * A class for parsing and interacting with Daml Hub ledger access tokens.
 */
export class PartyToken {
  token: string;
  payload?: PartyTokenPayload;

  constructor(token: string) {
    this.token = token;

    try {
      const decoded = partyTokenDecoder.runWithException(decodeJwt(token));
      this.payload = decoded;
    } catch (err) {
      throw new Error(`Access token not in Daml Hub format: ${token}.\n
      \t${err}`);
    }
  }

  /**
   * Daml Hub access tokens expire every 24 hours.
   */
  get isExpired(): boolean {
    const asSeconds = this.payload?.exp;
    if (asSeconds === undefined) {
      return true;
    } else {
      const timeNow = new Date().getTime() / 1000;
      return asSeconds - timeNow <= 0;
    }
  }

  toJSON() {
    return {
      token: this.token,
      isExpired: this.isExpired,
    };
  }

  toString() {
    return `${this.token}`;
  }
}
