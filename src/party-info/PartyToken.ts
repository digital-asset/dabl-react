import { decode } from 'jsonwebtoken';

interface PartyTokenPayload {
  exp: number;
  'https://daml.com/ledger-api': {
    applicationId: string;
    ledgerId: string;
    actAs: string[];
    readAs: string[];
  };
  ledgerId: string;
  owner: string;
  party: string;
  partyName: string;
}

function isPartyTokenPayload(
  payload: { [key: string]: any } | null | string
): payload is PartyTokenPayload {
  if (!payload || typeof payload === 'string') {
    return false;
  }

  const { exp, ledgerId, owner, party, partyName } = payload;
  const ledger_api = payload['https://daml.com/ledger-api'];

  return (
    !!exp &&
    !!ledgerId &&
    !!owner &&
    !!party &&
    !!partyName &&
    !!ledger_api.applicationId &&
    !!ledger_api.ledgerId &&
    !!ledger_api.actAs &&
    !!ledger_api.readAs
  );
}

/**
 * A class for parsing and interacting with Daml Hub ledger access tokens.
 */
export class PartyToken {
  token: string;
  payload?: PartyTokenPayload;

  constructor(token: string) {
    this.token = token;

    const decoded = decode(token);

    if (isPartyTokenPayload(decoded)) {
      this.payload = decoded;
    } else {
      throw new Error(`Access token not in Daml Hub format: ${token}`);
    }
  }

  /**
   * Extract the name of the party, as supplied when that Party authenticates
   * themselves with Daml Hub, from an access token.
   */
  get partyName(): string {
    const partyName = this.payload?.partyName;
    if (partyName) {
      return partyName;
    } else {
      throw new Error('Party name not found in token.');
    }
  }

  /**
   * Extract the party identifier from an access token.
   */
  get party(): string {
    const party = this.payload?.party;
    if (party) {
      return party;
    } else {
      throw new Error('Party identifier not found in token.');
    }
  }

  /**
   * Extract the ledger identifier from an access token.
   */
  get ledgerId(): string {
    const ledgerId = this.payload?.ledgerId;
    if (ledgerId) {
      return ledgerId;
    } else {
      throw new Error('Ledger identifier not found in token.');
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
      party: this.party,
      partyName: this.partyName,
      ledgerId: this.ledgerId,
      isExpired: this.isExpired,
    };
  }

  toString() {
    return `${this.token}`;
  }
}
