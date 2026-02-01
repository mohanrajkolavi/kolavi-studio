import { GraphQLClient } from "graphql-request";
import { WP_GRAPHQL_URL } from "@/lib/constants";

const client = new GraphQLClient(WP_GRAPHQL_URL, {
  headers: {},
});

export async function request<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    return await client.request<T>(query, variables);
  } catch (error) {
    console.error("GraphQL request error:", error);
    throw error;
  }
}
