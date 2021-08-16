// Copyright (c) 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { sign } from 'jsonwebtoken';
import { AccessToken } from './AccessToken';

const expiresIn = new Date().getTime() / 1000 + 24 * 60 * 60;

const validToken = {
  exp: expiresIn,
  'https://daml.com/ledger-api': {
    applicationId: 'damlhub',
    ledgerId: 'ledger-abc',
    actAs: ['ledger-party-abcd'],
    readAs: [],
  },
  ledgerId: 'ledger-abc',
  owner: 'user-grant-1111',
  party: 'ledger-party-abcd',
  partyName: 'Frank',
};

const invalidToken1 = 'notevenjson!';
const invalidToken2 = {
  exp: expiresIn,
  'https://daml.com/ledger-api': {
    applicationId: 'damlhub',
    ledgerId: 'ledger-abc',
    actAs: ['ledger-party-abcd'],
    readAs: [],
  },
};

function newAccessToken(token: object | string): AccessToken {
  if (typeof token === 'string') {
    return new AccessToken(sign(token, 'secret'));
  } else {
    return new AccessToken(sign(token, 'secret', { noTimestamp: true }));
  }
}

test('access-token - valid', () => {
  expect(() => newAccessToken(validToken)).not.toThrowError();
});

test('access-token - invalid', () => {
  expect(() => newAccessToken(invalidToken1)).toThrowError('Access token not in Daml Hub format');
  expect(() => newAccessToken(invalidToken2)).toThrowError('Access token not in Daml Hub format');
});

test('access-token - payload', () => {
  expect(newAccessToken(validToken).payload).toEqual(validToken);
});

test('access-token - getters', () => {
  const token = newAccessToken(validToken);

  expect(token.party).toBe('ledger-party-abcd');
  expect(token.partyName).toBe('Frank');
  expect(token.ledgerId).toBe('ledger-abc');
  expect(token.isExpired).toBe(false);
});

test('access-token - missing getters', () => {
  let token = newAccessToken(validToken);
  delete token.payload;

  expect(() => token.party).toThrowError('Party identifier not found in token');
  expect(() => token.partyName).toThrowError('Party name not found in token');
  expect(() => token.ledgerId).toThrowError('Ledger identifier not found in token');
  expect(token.isExpired).toBe(true);
});

test('access-token - expiry check', () => {
  const nowInSeconds = new Date().getTime() / 1000;

  const expiredToken = newAccessToken({ ...validToken, exp: nowInSeconds - 10000 });
  expect(expiredToken.isExpired).toBe(true);

  const notYet = newAccessToken({ ...validToken, exp: nowInSeconds + 10000 });
  expect(notYet.isExpired).toBe(false);
});

test('access-token - toString', () => {
  const token = newAccessToken(validToken);
  expect(`${token}`).toBe(sign(validToken, 'secret', { noTimestamp: true }));
  expect(token.token).toBe(sign(validToken, 'secret', { noTimestamp: true }));
});
