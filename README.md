# @daml/hub-react

> React functions for Daml applications running on [Daml Hub](https://hub.daml.com/).

Copyright 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All Rights Reserved. SPDX-License-Identifier: Apache-2.0

![npm](https://img.shields.io/npm/v/@daml/hub-react?color=red&label=npm)

## Documentation

This library aims to complement [@daml/react](`https://www.npmjs.com/package/@daml/react),
to make it easier to write [React](https://reactjs.org/) applications on Daml Hub specifically.

The @daml/hub-react library can only be used with user interfaces hosted on Daml Hub, it is not supported for local development.

This library exports Typescript declarations, and should work in a Typescript project out of the box.

See the [DA Marketplace](https://github.com/digital-asset/da-marketplace) app as a reference for more advanced usage of this library.

## Usage

### Login

Any app that runs on Daml Hub needs to authenticate to the ledger. Authentication is done via stateless access tokens that are signed and distributed by Daml Hub, provided in the JSON Web Token format. These tokens expire every 24 hours.

Typically, authentication forwards the user through an interactive sign-in flow then redirects back to the application. The user's access token is then made available to the app via the `DAMLHUB_LEDGER_ACCESS_TOKEN` cookie.

This library provides the `<DamlHubLogin .../>` component which handles the redirect flow and cookie extraction automatically. The only required prop is `onLogin`, which is a callback that gives the party's credentials after a successful login. If there were any errors with authentication, they are provided in the optional second argument of the callback.

Example:

```tsx
<DamlHubLogin onLogin={(credential, error) => {
  if (credential) {
    /* handle credentials. the application may cache the token and use it for subsequent API calls. */
    const { party, token } = credential;
    console.log(party, token);
  }
  else { /* handle error */  }
}}>
```

The `credential` object returned in the callback is an instance of the `PartyToken` class. The application may check the validity of a token at a later point by using the getter `credential.isExpired`.

#### Login Methods

For development purposes, it may be wise to test the application with multiple different parties with different roles. In this case, it is possible to specify alternate login methods. There are three methods altogether, with short-form props that can be used to enable them in a mix-and-match fashion:

1. `withButton`: The primary simple button login, recommended for production applications. Upon clicking, the user is taken through interactive user login flow as described above, for production applications. The login button is used by default if no other props are given. Note that if either of the two other method props are supplied, the button is not displayed unless the `withButton` prop is also supplied.

2. `withFile`: Login with a `parties.json` file. This is a file containing a list of all the parties (and associated ledger access tokens) that you've created under your Daml Hub account for the ledger. It can be downloaded from Daml Hub.

This prop exposes a file input that accepts the JSON file (and validates its fields for correctness, bubbling up any errors to the app). The file is never sent anywhere over the network - it is only parsed via client-side JavaScript, with the aid of the [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader).

When using this prop, the extra prop `onPartiesLoad` must be supplied as a callback to retrieve the entire list of credentials for each party into your application.

```tsx
<DamlHubLogin
  withFile
  onPartiesLoad={(credentials, error) => {
    if (credentials) {
      credentials.forEach(cred => {
        console.log(cred.party, cred.token);
      });
    } else {
      /* handle error */
    }
  }}
/>
```

3. `withToken`: Allow the user to type or paste in an encoded JWT token string directly in a form input, which is then passed back to your app as an instance of `PartyToken`.

```tsx
// Enabling all three login methods
<DamlHubLogin
  onLogin={/* ... */}
  withButton // The default button flow described above
  withToken // Exposes a text input to paste in a JWT directly
  withFile // Exposes a button to load in a parties.json file
  onPartiesLoad={/* ... */} // Get the results from the file loader
/>
```

#### Customization

Some support for customizing the login components is possible. This is obtained by foregoing the short-form props above (`withButton`, `withFile`, `withToken`) and instead using the more generic `options` prop.

When customizing the file login method, the component supplied is expected to be a `<label>`. See this [StackOverflow post](https://stackoverflow.com/a/25825731) for more details about styling HTML file inputs.

Example:

```tsx
<DamlHubLogin
  onLogin={/* ... */}
  onPartiesLoad={/* ... */} // Get the results from the file loader
  options={{
    method: {
      button: {
        render: () => <MyButton myProp1={/**/} myProp2={/**/} />
        text: 'My Login Button Text',
      },
      file: {
        render: () => <label>{/* ... */}</label>,
      },
    },
  }}
/>
```

#### Logout

Import and call the function `damlHubLogout()` to log out the user. This function will delete the cookies
set by Daml Hub on the application page.

### API Hooks

`@daml/hub-react` exposes a context with which you should wrap around your entire application, `<DamlHub token='...'> {/* ... */} </DamlHub>`.

Within this context, React hooks become available for interacting with Hub-specific APIs, outlined below. The APIs request/responses are documented in an OpenAPI specification, and are readable on the official [API reference page](https://hub.daml.com/docs/api).

APIs that retrieve data are polled and updated every 5 seconds by default. The polling interval can be overridden globally via the `<DamlHub ... interval={x}>` prop, where `x` is a number of milliseconds. Use `0` to disable polling.

#### Default Parties

Daml Hub provides two 'default parties' that are available for lookup by any unauthenticated client. These are `Public` and `UserAdmin`. The `UserAdmin` party is not allocated automatically - this party must first be allocated via the Daml Hub console before showing up.

The party identifiers may be fetched individually as below.

```tsx
const publicParty = usePublicParty();

if (!publicParty) {
  // Still loading
} else {
  console.log(publicParty);
}

const adminParty = useAdminParty();

if (!userAdminParty) {
  // Still loading, or UserAdmin is yet to be allocated
} else {
  console.log(userAdminParty);
}
```

The hook `useDefaultParties` is the same as the above two, but returns both parties at once as an array
tuple. This is a helpful shortcut if making heavy usage of both parties.

```tsx
const [publicParty, userAdminParty] = useDefaultParties();

if (!publicParty || !userAdminParty) {
  // Still loading, UserAdmin is yet to be allocated, or something went wrong
} else {
  console.log(publicParty, userAdminParty);
}
```

#### Public Party Token

To retrieve the public party _token_ on the ledger (a read-only token that can be used to stream publicly visible contracts), use the following hook:

```tsx
const publicToken = usePublicToken();

if (!publicToken) {
  // Still loading, or something went wrong
} else {
  console.log(publicToken);
}
```

#### Automations

Daml Hub supports [automations](https://hub.daml.com/docs/api#tag/Automation) to execute ledger actions automatically. There are three varieties - Daml triggers, Python bots, and integrations. APIs exist to view available automations, deploy instances, and delete running instances.

When deploying instances, they run under the authorization of the logged in party (the token specified in the `DamlHub` context `token` prop).

```tsx
const { automations, undeployAutomation } = useAutomations();
const { instances, deployAutomation, deleteInstance } = useAutomationInstances();

console.log(automations);
console.log(instances);

React.useEffect(() => {
  // Start a running instance of the specified automation by hash
  const { id: instance0 } = await deployAutomation(
    automations[0].artifactHash,
    automations[0].owner
  );

  // Start an instance of a trigger-type automation by name
  const { id: instance1 } = await deployAutomation(
    automations[1].artifactHash,
    automations[1].owner,
    automations[1].automationEntity.value.triggerNames[2]
  );

  // Undeploy a specific instance
  deleteInstance(instance1, automations[1].owner);

  // Remove all instances of a certain automation
  undeployAutomation(automations[0].artifactHash);
}, []);
```

### Token Utilities

Ledger access tokens come in the form of JSON Web Tokens. The built-in `PartyToken` class can be used to extract useful data from them. For example:

```typescript
const token = new PartyToken('eyJ0eXAiOiJKV1QiLCJh...');

let userParty = token.party;
let usersPartyName = token.partyName;
let needToResetLogin = token.isExpired;

// The original JWT string
let jwt = token.token;

```

### Using hub-react with a custom domain

If you are using this library with a domain that is not provided to you by Daml Hub, you must set `nonHubDomain` to `true` in the `DamlHub` context:
```tsx
<DamlHub token='...' nonHubDomain>{/ ... /}</DamlHub>
```

You must also indicate this by passing `true` into `isRunningOnHub` if calling it directly.

## Build

### Releases

To cut a release:

1. Bump the version in `package.json`, and merge that to `main`
2. Create a GitHub release. The presence of the tag will trigger a CircleCI run that deploys to npm.
