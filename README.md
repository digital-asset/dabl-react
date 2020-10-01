# @daml/dabl-react

> React functions for DAML applications running on [projectDABL](https://projectdabl.com/).

Copyright 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All Rights Reserved. SPDX-License-Identifier: Apache-2.0

## Documentation

This library aims to complement [@daml/react](`https://www.npmjs.com/package/@daml/react),
to make it easier to write [React](https://reactjs.org/) applications on DABL specifically.
To that end we provide for convenience.

## Usage

### Well Known End point

DABL provides an `.well-known` endpoint ([see](https://docs.projectdabl.com/api/onboarding/#listening-for-new-users)), that provides the identity of Party's who can run automation or
observe common information for your application.

```typescript
// Within a
<WellKnownPartiesProvider>
  ...
  // This hook will provide well known parties from DABL, as well as status information regarding the request.
  let { parties, loading, error } = useWellKnownParties();

</WellKnownPartiesProvider>
```

### Public Party

One of the Well Known parties, is the **Public** party that can be used to disclose information via contracts to all participants.
```typescript
// Within a
<PublicLedger ledgerId={ledgerId}>
  ...
  // The standard hooks provided by @daml/react have an analog "AsPublic" method.
  // Eg. instead of useStreamQuery one can write:
  var contracts = useStreamQueryAsPublic(Contract);

</PublicLedger>
```

### Information within the JWT.

```typescript
let usersPartyName = partyName(token);
let needToResetLogin = expiredToken(token);
```
