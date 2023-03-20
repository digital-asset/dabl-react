# Development Setup

The following guide will demonstrate how to develop changes to the `@daml/hub-react` Typescript library against another app.

## Assumptions:

- A local copy of `@daml/hub-react`
- A local copy of a Daml application with a UI that imports the library
- A directory structure like:
  - `dabl-react/`
    - `lib/`
    - `src/`
    - `package.json`
  - `my-daml-app/`
    - `ui/`
    - `package.json`
    - `node_modules/`
      - `react/`

## Configuring a react link

`hub-react` uses an internal version of React as a dependency. `my-daml-app` likely also has React as an explicit dependency. By default, what will happen if you try to import the local `hub-react` version from within `my-daml-app` is that the app build will contain duplicate copies of React. This is a problem when using Hooks, and leads to the following error https://reactjs.org/warnings/invalid-hook-call-warning.html#duplicate-react

To avoid the issue, we must link `my-daml-app`'s copy of React to `hub-react`'s copy of the app. To do so, run the following commands:

- `cd ~/my-daml-app/ui/node_modules/react`
- `yarn link`
- `cd ~/dabl-react`
- `yarn link react`

This link is temporary, so you will have to repeat these steps after machine reboots.

## Configuring hub-react

- Install dependencies with `yarn install`
- Make some changes and ensure tests pass with `yarn test`
- Run `yarn link` to set up a global link to the library
- Run `yarn build` to transpile the typescript source to the `lib/` directory

## Configuring a development client application

To try the local development version of the library, open up any Daml application that imports the library as a consumer and follow these steps:

- Modify the app’s `package.json` to include `@daml/hub-react: "file:../../dabl-react"`. Remember to adjust the path accordingly if your directory layout is different.
- Run `yarn link @daml/hub-react` in the same directory as the app’s `package.json`
- Proceed as usual to generate a build artifact for your app’s UI which can be uploaded to Daml Hub and tested.

## After making any hub-react changes...

### Inside `@daml/hub-react`

After making any changes to the library code, you will need to always re-run the command

- `rm -rf lib && yarn build`

to update the library for the client app.

### Inside `my-client-app`

After the lib is rebuilt, you will need to run the command

- `rm yarn.lock && yarn install`

to get the updated lib into your application
