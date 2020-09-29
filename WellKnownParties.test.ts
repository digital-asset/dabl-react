
// Copyright (c) 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { enableFetchMocks } from 'jest-fetch-mock';
enableFetchMocks()
import fetchMock from 'jest-fetch-mock';
import React, { ComponentType } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { WellKnownPartiesProvider, useWellKnownParties } from './index';

beforeEach(() => {
  fetchMock.resetMocks()
});

const testWellKnownParties = {
  userAdminParty: 'UserAdmin',
  publicParty: 'Public'
};

test('WellKnownPartiesProvider', async () => {

  fetchMock.mockResponse(JSON.stringify(testWellKnownParties));
  const defaultWkp = { userAdminParty: 'Foo', publicParty: 'Bar' };
  const wrapper: ComponentType = ({children}) => React.createElement(WellKnownPartiesProvider, {defaultWkp}, children);
  const {result, waitForValueToChange} = renderHook(() => { return useWellKnownParties(); }, {wrapper});
  expect(fetchMock.mock.calls.length).toEqual(1);
  expect(result.current).toEqual({ parties: defaultWkp, loading: true, error: null });
  await waitForValueToChange(() => result.current);
  expect(result.current).toEqual({ parties: testWellKnownParties, loading: false, error: null });
});
