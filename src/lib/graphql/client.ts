import { GraphQLClient } from "graphql-request";
import { WP_GRAPHQL_URL } from "@/lib/constants";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 500;

// Lazy-initialize so we never create a client with empty URL when WP is unset.
let client: GraphQLClient | null = null;

function getClient(): GraphQLClient {
  const url = WP_GRAPHQL_URL?.trim();
  if (!url) {
    throw new Error(
      "WPGraphQL URL is not set (NEXT_PUBLIC_WP_GRAPHQL_URL). Do not call request() when using sample data."
    );
  }
  if (!client) {
    // Auth or custom headers can be added here when/if WP is locked down.
    client = new GraphQLClient(url, { headers: {} });
  }
  return client;
}

/**
 * Request with timeout and retries for transient failures.
 * Only call when NEXT_PUBLIC_WP_GRAPHQL_URL is set; blog/data guards this.
 * Auth or custom headers can be added in getClient() when/if WP is locked down.
 */
export async function request<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const graphqlClient = getClient();
  let lastError: unknown;
  let delayMs = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const result = await graphqlClient.request<T>({
        document: query,
        variables: variables ?? {},
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt === MAX_RETRIES) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }

  console.error("GraphQL request error:", lastError);
  throw lastError;
}
