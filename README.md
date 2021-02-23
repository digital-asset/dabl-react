# @daml/hub-react

> React functions for Daml applications running on [projectDABL](https://projectdabl.com/).

Copyright 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All Rights Reserved. SPDX-License-Identifier: Apache-2.0

## Documentation

This library aims to complement [@daml/react](`https://www.npmjs.com/package/@daml/react),
to make it easier to write [React](https://reactjs.org/) applications on DABL specifically.
To that end we provide for convenience.

This library exports Typescript declarations, and should work in a Typescript project out of the box.

## Usage

### Well Known End point

DABL provides an `.well-known` endpoint ([see](https://docs.projectdabl.com/api/iam/#listening-for-new-users)), that provides the identity of Parties who can run automation or
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

### Parties Login

For standard applications, we recommend using the login with button endpoint, a simple anchor tag that links to the DABL login endpoint (as described [here](https://docs.projectdabl.com/api/iam/#the-login-in-with-dabl-button)). The endpoint will redirect back to your application with a JWT access token and party ID, and is the right way for **real production users** to log in to your application.

For development purposes, it may be useful to be able to supply a list of party credentials for easy login, to test your app from the point-of-view of different parties. You can do so with the `DablPartiesInput` component, which allows you to load in the `parties.json` file. This file can be downloaded from the Users tab of the ledger in the project:DABL management console.

The file is not uploaded anywhere, but is parsed in-browser via the [FileReader APIs](https://developer.mozilla.org/en-US/docs/Web/API/FileReader). Note that access tokens expire every 24 hours.

```typescript
<DablPartiesInput
  ledgerId='ledger-xyz'
  onLoad={
    parties => parties.map(p => console.log(`Party ID: ${p.party}, party token: ${p.token}`))
  }
/>
```

### JWT Utilities.

Ledger access tokens come in the form of JSON Web Tokens, and this library provides functions to extract information out of issued JWTs.

```typescript
let usersPartyName = partyName(token);
let needToResetLogin = expiredToken(token);
```