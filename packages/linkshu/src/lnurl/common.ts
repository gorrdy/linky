import { bech32 } from "@scure/base";
import { Schema } from "effect";
import { stripLightningPrefix } from "./lightningAddress";
import { isHttpUrl } from "./text";

/**
 * Browsers cannot reach every LNURL server directly (CORS), so a consumer may
 * hand in a proxy to retry through when the direct request fails.
 */
export type LnurlFallback = (url: string) => Promise<Response>;

const LnurlStatusResponse = Schema.Struct({
  reason: Schema.optional(Schema.String),
  status: Schema.optional(Schema.String),
});
export const isLnurlStatusResponse = Schema.is(LnurlStatusResponse);

/** Every LNURL response may be an error instead, whatever the tag asked for. */
export const isLnurlErrorStatus = (status: string | undefined): boolean =>
  String(status ?? "").toUpperCase() === "ERROR";

// Some LNURL encoders ship URLs with empty path segments (e.g.
// `https://lnbits.cz/lnurlp//AVH9zJ`). Most servers respond 404 to the empty
// segment but answer the same content under the collapsed path. Mirror the
// behavior of other LNURL wallets by collapsing consecutive slashes in the
// path while leaving the `://` authority and the query/fragment untouched.
export const normalizeLnurlHttpUrl = (value: string): string => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return value;
    const collapsedPath = url.pathname.replace(/\/{2,}/g, "/");
    if (collapsedPath !== url.pathname) {
      url.pathname = collapsedPath;
    }
    return url.toString();
  } catch {
    return value;
  }
};

export const decodeLnurlBech32Url = (value: string): string | null => {
  const normalized = stripLightningPrefix(value);
  if (!/^lnurl1/i.test(normalized)) return null;

  try {
    const decoded = bech32.decodeUnsafe(normalized.toLowerCase(), 2048);
    if (!decoded) return null;
    const bytes = Uint8Array.from(bech32.fromWords(decoded.words));
    const text = new TextDecoder().decode(bytes).trim();
    if (!isHttpUrl(text)) return null;
    return normalizeLnurlHttpUrl(text);
  } catch {
    return null;
  }
};

export const toHttpLnurlUrl = (value: string): string | null => {
  const normalized = stripLightningPrefix(value);
  if (!isHttpUrl(normalized)) return null;
  return normalized;
};

const fetchJson = async (url: string) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body: unknown = await response.json();
  return body;
};

export const fetchLnurlJson = async (url: string, fallback?: LnurlFallback) => {
  try {
    return await fetchJson(url);
  } catch (error) {
    if (!fallback) throw error;
    const response = await fallback(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body: unknown = await response.json();
    return body;
  }
};
