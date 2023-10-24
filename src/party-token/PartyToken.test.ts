// Copyright (c) 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { sign } from 'jsonwebtoken';

import { PartyToken } from './PartyToken';

const expiresIn = new Date().getTime() / 1000 + 24 * 60 * 60;

const validToken = {
  exp: expiresIn,
};

const invalidToken = 'notevenjson!';

function newPartyToken(token: object | string): PartyToken {
  if (typeof token === 'string') {
    return new PartyToken(sign(token, 'secret'));
  } else {
    return new PartyToken(sign(token, 'secret', { noTimestamp: true }));
  }
}

test('access-token - valid', () => {
  expect(() => newPartyToken(validToken)).not.toThrowError();
});

test('access-token - invalid', () => {
  expect(() => newPartyToken(invalidToken)).toThrowError('Access token not in Daml Hub format');
});

test('access-token - payload', () => {
  expect(newPartyToken(validToken).payload).toEqual(validToken);
});

test('access-token - getters', () => {
  const token = newPartyToken(validToken);

  expect(token.isExpired).toBe(false);
});

test('access-token - missing getters', () => {
  let token = newPartyToken(validToken);
  delete token.payload;

  expect(token.isExpired).toBe(true);
});

test('access-token - expiry check', () => {
  const nowInSeconds = new Date().getTime() / 1000;

  const expiredToken = newPartyToken({ ...validToken, exp: nowInSeconds - 10000 });
  expect(expiredToken.isExpired).toBe(true);

  const notYet = newPartyToken({ ...validToken, exp: nowInSeconds + 10000 });
  expect(notYet.isExpired).toBe(false);
});

test('access-token - toString', () => {
  const token = newPartyToken(validToken);
  expect(`${token}`).toBe(sign(validToken, 'secret', { noTimestamp: true }));
  expect(token.token).toBe(sign(validToken, 'secret', { noTimestamp: true }));
});
