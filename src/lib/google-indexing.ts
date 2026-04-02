/**
 * Google Instant Indexing API client.
 *
 * Requires a Google Cloud service account with the "Indexing API" enabled.
 * The service account email must be added as an owner in Google Search Console
 * for every property you want to index.
 *
 * Env: GOOGLE_SERVICE_ACCOUNT_JSON — the full JSON key as a string.
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IndexingAction = "URL_UPDATED" | "URL_DELETED";

export interface IndexingResult {
  url: string;
  action: IndexingAction;
  success: boolean;
  /** Raw response from Google (on success) or error message */
  response?: Record<string, unknown>;
  error?: string;
}

export interface IndexingStatusResult {
  url: string;
  success: boolean;
  latestUpdate?: {
    url: string;
    type: string;
    notifyTime: string;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Auth helpers — build a short-lived OAuth2 access token from the SA key
// ---------------------------------------------------------------------------

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function getServiceAccount(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON env variable is not set. " +
        "Set it to the full JSON content of your Google Cloud service account key."
    );
  }
  try {
    return JSON.parse(raw) as ServiceAccountKey;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
}

// Token cache — avoid fetching a new token for every single request.
// Google OAuth2 tokens are valid for 1 hour; we cache for 50 minutes.
let cachedToken: { token: string; expiresAt: number } | null = null;
const TOKEN_CACHE_MS = 50 * 60 * 1000; // 50 minutes

/** Create a signed JWT and exchange it for a Google OAuth2 access token. */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const sa = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(sa.private_key, "base64url");

  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch(
    sa.token_uri || "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    }
  );

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Failed to get access token: ${tokenRes.status} ${text}`);
  }

  const data = (await tokenRes.json()) as { access_token: string };

  // Cache the token
  cachedToken = { token: data.access_token, expiresAt: Date.now() + TOKEN_CACHE_MS };

  return data.access_token;
}

// ---------------------------------------------------------------------------
// Indexing API calls
// ---------------------------------------------------------------------------

const INDEXING_API = "https://indexing.googleapis.com/v3/urlNotifications";

/**
 * Notify Google that a URL has been updated or removed.
 * Accepts an optional pre-fetched access token to avoid redundant auth calls in batch operations.
 */
export async function requestIndexing(
  url: string,
  action: IndexingAction = "URL_UPDATED",
  accessToken?: string
): Promise<IndexingResult> {
  try {
    const token = accessToken ?? await getAccessToken();

    const res = await fetch(`${INDEXING_API}:publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type: action }),
    });

    const body = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      return {
        url,
        action,
        success: false,
        error: `${res.status}: ${JSON.stringify(body)}`,
      };
    }

    return { url, action, success: true, response: body };
  } catch (err) {
    return {
      url,
      action,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Batch-notify Google for multiple URLs.
 * Fetches a single access token and reuses it across all requests.
 * Runs up to 5 requests in parallel to stay within rate limits (200 req/min).
 */
export async function requestIndexingBatch(
  urls: string[],
  action: IndexingAction = "URL_UPDATED"
): Promise<IndexingResult[]> {
  const accessToken = await getAccessToken();

  // Process in chunks of 5 for parallelism without overwhelming rate limits
  const CHUNK_SIZE = 5;
  const results: IndexingResult[] = [];

  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map((url) => requestIndexing(url, action, accessToken))
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Check the indexing status of a URL (last notification time & type).
 */
export async function getIndexingStatus(
  url: string
): Promise<IndexingStatusResult> {
  try {
    const accessToken = await getAccessToken();

    const res = await fetch(
      `${INDEXING_API}/metadata?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const body = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      return {
        url,
        success: false,
        error: `${res.status}: ${JSON.stringify(body)}`,
      };
    }

    const latest = body.latestUpdate as
      | { url: string; type: string; notifyTime: string }
      | undefined;

    return { url, success: true, latestUpdate: latest };
  } catch (err) {
    return {
      url,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Check if the Google Indexing API is configured (env var present).
 */
export function isIndexingConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}
