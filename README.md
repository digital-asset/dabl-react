**This repo contains sample code to help you get started with DAML. Please bear in mind that it is provided for illustrative purposes only, and as such may not be production quality and/or may not fit your use-cases. You may use the contents of this repo in parts or in whole according to the BSD0 license:**

> Copyright © 2020 Digital Asset (Switzerland) GmbH and/or its affiliates
>
> Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

# @daml/dabl-react

> React functions for DAML applications running on [projectDABL](https://projectdabl.com/).

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
  // This hook will provide this data from DABL.
  let wkp : WellKnownParites = useWellKnownParties();

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

## Source
TODO

## License
TODO
