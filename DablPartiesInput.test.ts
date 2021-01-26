import { sign } from 'jsonwebtoken';
import { convertPartiesJson } from './index';

const invalidJson = `
~~~!...
`

const invalidFormat = `
{ "one": "two" }
`

const validPartiesJSON = (token: string) => `
[
  {
    "ledgerId": "ledger-id-xyz",
    "owner": "user-grant-abcd",
    "party": "leder-party-1234",
    "partyName": "Frank",
    "token": "${token}"
  }
]
`

test('valid convertPartiesJson', () => {
  const nowInSeconds = ((new Date()).getTime() / 1000) + 120;
  const token = sign({exp: nowInSeconds}, 'secret');

  const [ parties, error ] = convertPartiesJson(validPartiesJSON(token), 'ledger-id-xyz', true);

  expect(error).toBeUndefined();
  expect(parties).toEqual([{
    "ledgerId": "ledger-id-xyz",
    "owner": "user-grant-abcd",
    "party": "leder-party-1234",
    "partyName": "Frank",
    "token": token
  }])
})

test('expired token error convertPartiesJson', () => {
  const nowInSeconds = ((new Date()).getTime() / 1000) - 120;
  const token = sign({exp: nowInSeconds}, 'secret');

  const [ parties, error ] = convertPartiesJson(validPartiesJSON(token), 'ledger-id-xyz', true);

  expect(error).toEqual('Your parties.json file contains expired tokens!');
  expect(parties).toBeUndefined();
})

test('wrong ledger error convertPartiesJson', () => {
  const nowInSeconds = ((new Date()).getTime() / 1000) + 120;
  const token = sign({exp: nowInSeconds}, 'secret');

  const [ parties, error ] = convertPartiesJson(validPartiesJSON(token), 'ledger-id-zzz', true);

  expect(error).toEqual('Your parties.json file is for a different ledger! File uses ledger ledger-id-xyz but app is running on ledger ledger-id-zzz');
  expect(parties).toBeUndefined();
})

test('invalid format convertPartiesJson', () => {
  const [ parties, error ] = convertPartiesJson(invalidFormat, 'ledger-id-xyz', true);

  expect(error).toEqual('Format does not look like parties.json');
  expect(parties).toBeUndefined();
})

test('invalid JSON convertPartiesJson', () => {
  const [ parties, error ] = convertPartiesJson(invalidJson, 'ledger-id-xyz', true);

  expect(error).toEqual('Not a valid JSON file.');
  expect(parties).toBeUndefined();
})
