import React from 'react';
import { fetchDefaultParties } from '../default-parties/defaultParties';

import { PartyToken } from '../party-token/PartyToken';
import { asyncReader } from '../utils';

type PartyDetails = {
  ledgerId: string;
  owner: string;
  party: string;
  partyName: string;
  token: string;
};

function isPartyDetails(partyDetails: any): partyDetails is PartyDetails {
  return (
    typeof partyDetails.ledgerId === 'string' &&
    typeof partyDetails.owner === 'string' &&
    typeof partyDetails.party === 'string' &&
    typeof partyDetails.partyName === 'string' &&
    typeof partyDetails.token === 'string'
  );
}

function isParties(parties: any): parties is PartyDetails[] {
  if (parties instanceof Array) {
    // True if any element of the array is not a PartyDetails
    const invalidPartyDetail = parties.reduce(
      (invalid, party) => invalid || !isPartyDetails(party),
      false
    );
    return !invalidPartyDetail;
  } else {
    return false;
  }
}

enum PartyErrors {
  InvalidPartiesError,
  InvalidPartyDetailError,
  LedgerMismatchError,
  ExpiredTokenError,
}

class InvalidPartiesError extends Error {
  type: PartyErrors;

  constructor(message: string, type: PartyErrors) {
    super(message);
    this.type = type;
  }
}

function validateParties(parties: PartyDetails[], publicPartyId: string): void {
  // True if any ledgerIds do not match the app's deployed ledger Id
  const givenPublicParty = parties.find(p => p.party.includes('public-'));
  const invalidLedger = givenPublicParty?.party === publicPartyId;

  // True if any token is expired
  const invalidTokens = parties.reduce(
    (valid, party) => valid || new PartyToken(party.token).isExpired,
    false
  );

  if (invalidLedger) {
    const errMessage = `Your parties.json file might be for a different ledger! File uses public party ${givenPublicParty} but app's detected public party is ${publicPartyId}`;

    throw new InvalidPartiesError(errMessage, PartyErrors.LedgerMismatchError);
  }

  if (invalidTokens) {
    throw new InvalidPartiesError(
      'Your parties.json file contains expired tokens!',
      PartyErrors.ExpiredTokenError
    );
  }
}

export function convertPartiesJson(
  partiesJson: string,
  publicPartyId: string,
  validateFile: boolean = true
): PartyToken[] {
  const parsed: PartyDetails[] = JSON.parse(partiesJson);

  if (validateFile) {
    if (!isParties(parsed)) {
      throw new InvalidPartiesError(
        'Format does not look like parties.json',
        PartyErrors.InvalidPartyDetailError
      );
    }

    validateParties(parsed, publicPartyId);
  }

  return parsed.map(p => new PartyToken(p.token));
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
        setParties([]);
        setError(error.message);
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
      asyncReader(file).then(contents => tryPartyConversion(contents));
    }
  }, [file, tryPartyConversion]);

  const handleChange = async (e: any) => {
    if (e.target && e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  return <input id="log-in-with-parties" type="file" value="" onChange={handleChange} />;
};
