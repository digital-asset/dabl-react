import React from 'react';
import { create, act } from 'react-test-renderer';
import { sign } from 'jsonwebtoken';

import { convertPartiesJson, PartiesInput } from './PartiesInput';
import { delay } from '../utils';

const ledgerId = 'ledger-id-xyz';

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

const validParties = [
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
  expect(() => convertPartiesJson(validPartiesJSON, ledgerId)).not.toThrow();
  expect(convertPartiesJson(validPartiesJSON, ledgerId).map(pd => pd.partyName)).toEqual(['Frank']);
});

test('parties-input - invalid formats', () => {
  expect(() => convertPartiesJson(invalidPartiesJSON, ledgerId)).toThrow(
    'Format does not look like parties.json'
  );

  expect(() => convertPartiesJson(invalidFormat, ledgerId)).toThrow(
    'Format does not look like parties.json'
  );
});

test('parties-input - expired tokens', () => {
  expect(() => convertPartiesJson(expiredTokensJSON, ledgerId)).toThrow(
    'Your parties.json file contains expired tokens!'
  );
});

test('parties-input - ledger mismatch', () => {
  expect(() => convertPartiesJson(validPartiesJSON, 'ledger-id-zzz')).toThrow(
    'Your parties.json file is for a different ledger! File uses ledger ledger-id-xyz but app is running on ledger ledger-id-zzz'
  );
});

const partiesJSONFile = new File([Buffer.from(validPartiesJSON)], 'parties.json');
const invalidPartiesJSONFile = new File([Buffer.from(invalidPartiesJSON)], 'parties.json');

// @ts-ignore
delete window.location;

// @ts-ignore
window.location = new URL(`https://${ledgerId}.daml.app`);

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
    await delay(5);
  });

  expect(partiesLoader).toHaveBeenCalled();
  expect(partiesLoader.mock.calls.pop()[0].map((pd: any) => pd.partyName)).toEqual(['Frank']);

  await act(async () => {
    renderer.root.findByType('input').props.onChange({
      target: {
        files: [invalidPartiesJSONFile],
      },
    });

    // Wait for state changes to settle
    await delay(5);
  });

  expect(partiesLoader).toHaveBeenCalled();
  expect(partiesLoader).toHaveBeenCalledWith([], 'Format does not look like parties.json');
});
