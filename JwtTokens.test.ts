
// Copyright (c) 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { sign } from 'jsonwebtoken';
import { expiredToken, partyNameFromJwtToken } from './index';

test('publicName', () => {
  const name = 'Frank';
  const pn = partyNameFromJwtToken(sign({partyName:name}, 'secret'));
  expect(pn).toBe(name);
});

test('expiredToken', () => {
  const nowInSeconds = (new Date()).getTime() / 1000;
  const expired = expiredToken(sign({exp:(nowInSeconds - 10)}, 'secret'));
  expect(expired).toBeTruthy();

  const notYet = expiredToken(sign({exp:(nowInSeconds + 10)}, 'secret'));
  expect(notYet).toBeFalsy();
});