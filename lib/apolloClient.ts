import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: `${process.env.NEXT_PUBLIC_URL}/api/graphql`,
});

// Apollo Client instance
export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
