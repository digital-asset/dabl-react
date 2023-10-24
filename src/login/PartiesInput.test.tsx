import { sign } from 'jsonwebtoken';

import React from 'react';
import { act, create } from 'react-test-renderer';

import { delay } from '../utils';
import { convertPartiesJson, PartiesInput } from './PartiesInput';

const ledgerId = 'ledger-id-xyz';
const publicPartyId = 'public-id-xyz';
const mockHostname = `${ledgerId}.daml.app`;

// @ts-ignore
delete window.location;

// @ts-ignore
window.location = new URL(`https://${mockHostname}`);

// TO-DO: Replace with jest-fetch-mock
// @ts-ignore
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        result: [
          {
            identifier: publicPartyId,
            displayName: 'Public',
            isLocal: false,
          },
          {
            identifier: 'ledger-party-admin-id',
            displayName: 'UserAdmin',
            isLocal: false,
          },
        ],
        status: 200,
      }),
  })
);

const expiresIn = new Date().getTime() / 1000 + 24 * 60 * 60;
const payload = {
  exp: expiresIn,
  'https://daml.com/ledger-api': {
    applicationId: 'damlhub',
    ledgerId,
    actAs: ['ledger-party-abcd'],
    readAs: [],
  },
  ledgerId,
  owner: 'user-grant-1111',
  party: 'ledger-party-abcd',
  partyName: 'Frank',
};
const token = sign(payload, 'secret');

const publicParty = {
  ledgerId,
  owner: '',
  party: publicPartyId,
  partyName: 'Public',
  token: sign({ ...payload, party: publicPartyId, partyName: 'Public' }, 'secret'),
};

const validParties = [
  publicParty,
  {
    ledgerId,
    owner: 'user-grant-abcd',
    party: 'leder-party-1234',
    partyName: 'Frank',
    token,
  },
];
const validPartiesJSON = JSON.stringify(validParties);

const invalidParties = [
  {
    ledgerId: 42, // Invalid type
    owner: 'user-grant-abcd',
    party: 'leder-party-1234',
    partyName: 'Frank',
    token,
  },
];
const invalidPartiesJSON = JSON.stringify(invalidParties);

const expiredTokens = [
  ...validParties,
  {
    ledgerId,
    owner: 'user-grant-efgh',
    party: 'ledger-party-5678',
    partyName: 'Penelope',
    token: sign({ ...payload, exp: new Date().getTime() / 1000 - 100 }, 'secret'),
  },
];
const expiredTokensJSON = JSON.stringify(expiredTokens);

const invalidFormat = `
{ "one": "two" }
`;

test('parties-input - valid file', () => {
  expect(() => convertPartiesJson(validPartiesJSON, publicPartyId)).not.toThrow();
});

test('parties-input - invalid formats', () => {
  expect(() => convertPartiesJson(invalidPartiesJSON, publicPartyId)).toThrow(
    'Format does not look like parties.json'
  );

  expect(() => convertPartiesJson(invalidFormat, publicPartyId)).toThrow(
    'Format does not look like parties.json'
  );
});

test('parties-input - expired tokens', () => {
  expect(() => convertPartiesJson(expiredTokensJSON, publicPartyId)).toThrow(
    'Your parties.json file contains expired tokens!'
  );
});

test('parties-input - ledger mismatch', () => {
  expect(() => convertPartiesJson(validPartiesJSON, 'public-id-zzz')).toThrow(
    "Your parties.json file might be for a different ledger! File uses public party public-id-xyz but app's detected public party is public-id-zzz"
  );
});

const partiesJSONFile = new File([Buffer.from(validPartiesJSON)], 'parties.json');
// const invalidPartiesJSONFile = new File([Buffer.from(invalidPartiesJSON)], 'parties.json');

test('parties-input - component', async () => {
  const partiesLoader = jest.fn();
  const renderer = create(<PartiesInput onPartiesLoad={partiesLoader} />);

  await act(async () => {
    renderer.root.findByType('input').props.onChange({
      target: {
        files: [partiesJSONFile],
      },
    });

    // Wait for state changes to settle
    await delay(10);
  });

  expect(partiesLoader).toHaveBeenCalled();
  expect(partiesLoader.mock.calls.pop()[0].map((pd: any) => pd.partyName)).toEqual([
    'Public',
    'Frank',
  ]);

  // await act(async () => {
  //   renderer.root.findByType('input').props.onChange({
  //     target: {
  //       files: [invalidPartiesJSONFile],
  //     },
  //   });

  //   // Wait for state changes to settle
  //   await delay(5);
  // });

  expect(partiesLoader).toHaveBeenCalled();
  // expect(partiesLoader).toHaveBeenCalledWith([], 'Format does not look like parties.json');
});
