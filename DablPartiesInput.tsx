import React from 'react';

import { expiredToken } from './JwtTokens';

export type PartyDetails = {
  ledgerId: string,
  owner: string,
  party: string,
  partyName: string,
  token: string,
}

function isPartyDetails(partyDetails: any): partyDetails is PartyDetails {
  return  typeof partyDetails.ledgerId === 'string' &&
          typeof partyDetails.owner === 'string' &&
          typeof partyDetails.party === 'string' &&
          typeof partyDetails.partyName === 'string' &&
          typeof partyDetails.token === 'string'
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
  ExpiredTokenError
}

class InvalidPartiesError extends Error {
  type: PartyErrors

  constructor(message: string, type: PartyErrors) {
    super(message);
    this.type = type;
  }
};

function validateParties(parties: PartyDetails[], ledgerId: string): void {
  // True if any ledgerIds do not match the app's deployed ledger Id
  const invalidLedger = parties.reduce((valid, party) => valid || (party.ledgerId !== ledgerId), false);

  // True if any token is expired
  const invalidTokens = parties.reduce((valid, party) => valid || expiredToken(party.token), false);

  if (invalidLedger) {
    const fileLedgerId = parties.find(p => p.ledgerId !== ledgerId)?.ledgerId;
    const errMessage = `Your parties.json file is for a different ledger! File uses ledger ${fileLedgerId} but app is running on ledger ${ledgerId}`;

    throw new InvalidPartiesError(errMessage, PartyErrors.LedgerMismatchError)
  }

  if (invalidTokens) {
    throw new InvalidPartiesError('Your parties.json file contains expired tokens!', PartyErrors.ExpiredTokenError)
  }
}

type PartiesOrError = [ PartyDetails[] | undefined, string | undefined ];

export function convertPartiesJson(partiesJson: string, ledgerId: string, validateFile: boolean = true): PartiesOrError {
  try {
    const parsed = JSON.parse(partiesJson);

    if (validateFile) {
      if (!isParties(parsed)) {
        throw new InvalidPartiesError('Format does not look like parties.json', PartyErrors.InvalidPartyDetailError)
      }

      validateParties(parsed, ledgerId);
    }

    return [ parsed, undefined ];
  } catch (err) {
    let message = 'Not a valid JSON file.';

    if (!!err.type) {
      message = err.message;
    }

    return [ undefined, message ]
  }
}

type DablPartiesInputProps = {
  ledgerId: string;
  partiesJson?: string;
  validateFile?: boolean;
  onLoad: (parties: PartyDetails[]) => void;
  onError: (error: string) => void;
}

export const DablPartiesInput = ({
  ledgerId,
  partiesJson,
  validateFile = true,
  onError,
  onLoad
}: DablPartiesInputProps) => {
  const [ parties, setParties] = React.useState<PartyDetails[]>();
  const [ error, setError ] = React.useState<string>();

  React.useEffect(() => {
    if (partiesJson) {
      const [ parties, error ] = convertPartiesJson(partiesJson, ledgerId, validateFile);
      if (parties) {
        setParties(parties);
      }

      if (error) {
        setError(error);
      }
    }
  }, [partiesJson, ledgerId, validateFile]);

  React.useEffect(() => {
    if (parties) {
      onLoad(parties);
    }
  }, [parties]);

  React.useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error]);

  const handleFileUpload = (contents: string) => {
    const [ parties, error ] = convertPartiesJson(contents, ledgerId, validateFile);

    if (parties) {
      setParties(parties);
    }

    if (error) {
      setError(error);
    }
  }

  return (
    <input type='file' value='' onChange={e => {
      const reader = new FileReader();

      reader.onload = function(event) {
        if (event.target && typeof event.target.result === 'string') {
          handleFileUpload(event.target.result);
        }
      };

      if (e.target && e.target.files) {
        reader.readAsText(e.target.files[0]);
      }
    }}/>
  );
}
