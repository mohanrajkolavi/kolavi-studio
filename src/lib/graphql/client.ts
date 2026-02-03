import { GraphQLClient } from "graphql-request";
import { WP_GRAPHQL_URL } from "@/lib/constants";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 500;

// Auth or custom headers can be added here when/if WP is locked down.
const client = new GraphQLClient(WP_GRAPHQL_URL, {
  headers: {},
});

/**
 * Request with timeout and retries for transient failures.
 * Auth or custom headers can be added here when/if WP is locked down.
 */
export async function request<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  let lastError: unknown;
  let delayMs = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const result = await client.request<T>({
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
