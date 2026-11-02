# Apollo Client: useQuery stays loading when skip turns on during a request

`useQuery` never leaves `loading: true` if `skip` becomes `true` (or the options become `skipToken`) while the request is still in flight.

The hook keeps `loading: true` and `networkStatus: 1` forever. The docs say a skipped query returns `loading: false`.

If the request has already finished, `skip` works as expected.

## Run it

```sh
npm install
npm test
```

Output with `@apollo/client` 4.3.5:

```
× leaves loading when skip becomes true while the request is in flight
× leaves loading when the options become skipToken while the request is in flight
✓ leaves loading when skip becomes true after the request has finished

AssertionError: expected { loading: true, networkStatus: 1 } to deeply equal { loading: false, networkStatus: 7 }
```

All tests are in `src/skipInFlight.test.tsx`. Each test renders the hook, rerenders it with `skip: true` (or `skipToken`), and waits for `loading: false`. The mocked response has a delay of 100 ms, so in the first two tests the request is still in flight when `skip` changes.

## What else I checked

- The same steps with `@apollo/client` 3.14.1 pass: `loading` becomes `false` right away.
- It fails with `fetchPolicy` `cache-first`, `network-only` and `no-cache`, and with `notifyOnNetworkStatusChange` `true` and `false`.
- If `skip` becomes `false` again, the query fetches again and `loading` is correct after that.

## What I see in the code

- In 4.x, `useQuery` sets `fetchPolicy: "standby"` when `skip` is `true`, and the hook takes its value from `observable.getCurrentResult()`.
- `ObservableQuery` does not emit values while it is in `standby`, and the in-flight request does not finish the loading state. So the last value stays: the loading one.
- In 3.14, `useQuery` returned a fixed `skipStandbyResult` (`loading: false`) while `skip` was `true`, so it did not depend on the `ObservableQuery` value.

This may be related to [#13499](https://github.com/apollographql/apollo-client/issues/13499). That issue is about the opposite move (from `skipToken` back to options) and also involves `standby`.

## Versions

| Package | Version |
| --- | --- |
| @apollo/client | 4.3.5 |
| graphql | 17.0.2 |
| react | 19.3.1 |
| @testing-library/react | 16.3.3 |
| vitest | 5.0.5 |
