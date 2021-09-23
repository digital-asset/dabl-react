import React from 'react';

import { array, Decoder, object, string } from '@mojotech/json-type-validation';

import { fetchDefaultParties } from '../default-parties/defaultParties';
import { PartyToken } from '../party-token/PartyToken';

import log from '../log';
import { asyncFileReader } from '../utils';

type PartyDetails = {
  ledgerId: string;
  party: string;
  partyName: string;
  token: string;
};

const partyDetailsDecoder: Decoder<PartyDetails> = object({
  ledgerId: string(),
  party: string(),
  partyName: string(),
  token: string(),
});

const partiesJsonDecoder: Decoder<PartyDetails[]> = array(partyDetailsDecoder);

/**
 * A set of different possible errors that could occur during parties.json validation
 */
export enum PartiesInputErrors {
  InvalidPartiesError,
  InvalidPartyDetailError,
  LedgerMismatchError,
  ExpiredTokenError,
  MissingPublicParty,
  EmptyPartiesList,
}

/**
 * A custom error class to contain PartiesInputErrors
 */
export class InvalidPartiesError extends Error {
  type: PartiesInputErrors;

  constructor(message: string, type: PartiesInputErrors) {
    super(message);
    this.type = type;
    this.name = 'InvalidPartiesError';
    Object.setPrototypeOf(this, InvalidPartiesError.prototype);
  }
}

function validateParties(parties: PartyDetails[], publicPartyId: string): void {
  // No parties supplied
  if (parties.length === 0) {
    throw new InvalidPartiesError('Empty parties list', PartiesInputErrors.EmptyPartiesList);
  }

  // True if any ledgerIds do not match the app's deployed ledger Id
  const givenPublicParty = parties.find(p => p.party.includes('public-'));

  if (!givenPublicParty) {
    throw new InvalidPartiesError(
      'Public party missing in parties.json',
      PartiesInputErrors.MissingPublicParty
    );
  }

  if (givenPublicParty.party !== publicPartyId) {
    const errMessage = `Your parties.json file might be for a different ledger! File uses public party ${givenPublicParty.party} but app's detected public party is ${publicPartyId}`;

    throw new InvalidPartiesError(errMessage, PartiesInputErrors.LedgerMismatchError);
  }

  // True if any token is expired
  const invalidTokens = parties.reduce(
    (valid, party) => valid || new PartyToken(party.token).isExpired,
    false
  );

  if (invalidTokens) {
    throw new InvalidPartiesError(
      'Your parties.json file contains expired tokens!',
      PartiesInputErrors.ExpiredTokenError
    );
  }
}

export function convertPartiesJson(
  partiesJson: string,
  publicPartyId: string,
  validateFile: boolean = true
): PartyToken[] {
  const parsed = JSON.parse(partiesJson);
  const parties = partiesJsonDecoder.run(parsed);

  if (!parties.ok) {
    log('parties-input').error('ERROR: ' + JSON.stringify(parties.error));
    throw new InvalidPartiesError(
      'Format does not look like parties.json',
      PartiesInputErrors.InvalidPartyDetailError
    );
  }

  if (validateFile) {
    validateParties(parties.result, publicPartyId);
  }

  return parties.result.map(p => new PartyToken(p.token));
}

type PartiesInputProps = {
  partiesJson?: string;
  validateFile?: boolean;
  onPartiesLoad: (credentials: PartyToken[], error?: string) => void;
};

export const PartiesInput = ({
  partiesJson,
  validateFile = true,
  onPartiesLoad,
}: PartiesInputProps) => {
  const [parties, setParties] = React.useState<PartyToken[]>([]);
  const [error, setError] = React.useState<string>();
  const [file, setFile] = React.useState<File>();

  const tryPartyConversion = React.useCallback(
    (contents: string) => {
      try {
        fetchDefaultParties().then(parties => {
          const publicParty = parties[0];
          if (publicParty) {
            const parties = convertPartiesJson(contents, publicParty, validateFile);
            setParties(parties);
          }
        });
      } catch (error) {
        if (error instanceof InvalidPartiesError) {
          if (error?.type === PartiesInputErrors.EmptyPartiesList) {
            log('parties-input').warn('Attempted to load an empty parties.json');
          } else {
            setParties([]);
            setError(error.message);
          }
        } else {
          log('parties-input').error(`An unknown error occurred: ${JSON.stringify(error)}`);
          setError(JSON.stringify(error));
          throw error;
        }
      }
    },
    [validateFile, setParties, setError]
  );

  React.useEffect(() => {
    if (partiesJson) tryPartyConversion(partiesJson);
  }, [partiesJson, tryPartyConversion]);

  React.useEffect(() => onPartiesLoad(parties, error), [parties, error]);

  React.useEffect(() => {
    if (file) {
      asyncFileReader(file).then(contents => tryPartyConversion(contents));
    }
  }, [file, tryPartyConversion]);

  const handleChange = async (e: any) => {
    if (e.target && e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  return <input id="log-in-with-parties" type="file" value="" onChange={handleChange} />;
};
