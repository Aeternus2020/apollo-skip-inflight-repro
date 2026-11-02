import { gql, NetworkStatus } from "@apollo/client";
import { skipToken, useQuery } from "@apollo/client/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it } from "vitest";

const GREETING = gql`
  query Greeting {
    greeting
  }
`;

function createWrapper() {
  const mocks = [
    {
      request: { query: GREETING },
      result: { data: { greeting: "Hello" } },
      delay: 100,
    },
  ];

  return ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );
}

function getStatus(result: { loading: boolean; networkStatus: NetworkStatus }) {
  return { loading: result.loading, networkStatus: result.networkStatus };
}

it("leaves loading when skip becomes true while the request is in flight", async () => {
  const { result, rerender } = renderHook(
    ({ skip }: { skip: boolean }) => useQuery(GREETING, { skip }),
    { wrapper: createWrapper(), initialProps: { skip: false } },
  );
  expect(result.current.loading).toBe(true);

  rerender({ skip: true });

  await waitFor(() =>
    expect(getStatus(result.current)).toEqual({
      loading: false,
      networkStatus: NetworkStatus.ready,
    }),
  );
});

it("leaves loading when the options become skipToken while the request is in flight", async () => {
  const { result, rerender } = renderHook(
    ({ skip }: { skip: boolean }) => useQuery(GREETING, skip ? skipToken : {}),
    { wrapper: createWrapper(), initialProps: { skip: false } },
  );
  expect(result.current.loading).toBe(true);

  rerender({ skip: true });

  await waitFor(() =>
    expect(getStatus(result.current)).toEqual({
      loading: false,
      networkStatus: NetworkStatus.ready,
    }),
  );
});

it("leaves loading when skip becomes true after the request has finished", async () => {
  const { result, rerender } = renderHook(
    ({ skip }: { skip: boolean }) => useQuery(GREETING, { skip }),
    { wrapper: createWrapper(), initialProps: { skip: false } },
  );
  await waitFor(() => expect(result.current.data).toEqual({ greeting: "Hello" }));

  rerender({ skip: true });

  await waitFor(() =>
    expect(getStatus(result.current)).toEqual({
      loading: false,
      networkStatus: NetworkStatus.ready,
    }),
  );
});
