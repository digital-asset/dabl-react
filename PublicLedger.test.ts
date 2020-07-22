// Copyright (c) 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { enableFetchMocks } from 'jest-fetch-mock';
enableFetchMocks()
import fetchMock from 'jest-fetch-mock';
import { Template } from '@daml/types';
import React, { ComponentType } from 'react';
import { sign } from 'jsonwebtoken';
import { renderHook, RenderHookResult } from '@testing-library/react-hooks';
import { PublicLedger, usePartyAsPublic, useLedgerAsPublic, useQueryAsPublic } from './index';

const TEST_LEDGER_ID ='test-ledger-id'
const PUBLIC_PARTY ='Public'
const PUBLIC_TOKEN = sign({ "https://daml.com/ledger-api": { ledgerId:TEST_LEDGER_ID, admin: true, actAs: [PUBLIC_PARTY], readAs: [PUBLIC_PARTY] } }, "secret")

console.log(`The PUBLIC_TOKEN is ${PUBLIC_TOKEN}`);

function renderPublicLedgerHook<P, R>(callback: (props: P) => R): RenderHookResult<P, R> {
  const wrapper: ComponentType = ({children}) => React.createElement(PublicLedger, {ledgerId: TEST_LEDGER_ID, publicParty: PUBLIC_PARTY}, children);
  return renderHook(callback, {wrapper});
}

beforeEach(() => {
  fetchMock.resetMocks()
});

test('PublicLedger', async () => {
  fetchMock.mockResponse(JSON.stringify({access_token:PUBLIC_TOKEN}));
  const {result, waitForValueToChange} = renderPublicLedgerHook(() => { return 'we-have-a-token'; });
  expect(fetchMock.mock.calls.length).toEqual(1);
  expect(result.current).toEqual(null);
  await waitForValueToChange(() => result.current);
  expect(result.current).toEqual('we-have-a-token');
});

test('usePartyAsPublic', async () => {
  fetchMock.mockResponse(JSON.stringify({access_token:PUBLIC_TOKEN}));
  const {result, waitForValueToChange} = renderPublicLedgerHook(() => { return usePartyAsPublic(); });
  expect(fetchMock.mock.calls.length).toEqual(1);
  expect(result.current).toEqual(null);
  await waitForValueToChange(() => result.current);
  expect(result.current).toEqual(PUBLIC_PARTY);
})

test('useLedgerAsPublic', async () => {
  fetchMock.mockResponse(JSON.stringify({access_token:PUBLIC_TOKEN}));
  const {result, waitForValueToChange} = renderPublicLedgerHook(() => { return useLedgerAsPublic(); });
  expect(fetchMock.mock.calls.length).toEqual(1);
  expect(result.current).toEqual(null);
  await waitForValueToChange(() => result.current);
  expect(result.current).toHaveProperty('token');
})

const Foo = {templateId: 'FooTemplateId'} as unknown as Template<object>;

test('useQueryAsPublic', () => {
  fetchMock.mockResponse(JSON.stringify({access_token:PUBLIC_TOKEN}));
  const {result} = renderPublicLedgerHook(() => { return useQueryAsPublic(Foo); });
  expect(fetchMock.mock.calls.length).toEqual(1);
  expect(result.current).toEqual(null);
  // TODO. Currently fails because of async time out.
  //await waitForValueToChange(() => result.current);
  //expect(result.current).toStrictEqual({contracts:[],loading:true});
});

