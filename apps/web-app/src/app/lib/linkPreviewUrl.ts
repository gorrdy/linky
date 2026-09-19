import { extractCashuTokenFromText } from "./tokenText";

const LINKY_CASHU_PATH = /(?:^|\/)cashu(?:\/|$)/i;
// Fail closed: anything shaped like a cashu token (`cashuA`/`cashuB` + a run
// of base64url) is treated as token-bearing even if it does not fully parse,
// so a near-miss can never leak to the preview server.
const CASHU_TOKEN_SHAPE = /cashu[AB][A-Za-z0-9_-]{20,}/i;

const isLinkyHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  return host === "linky.fit" || host.endsWith(".linky.fit");
};

/**
 * The URL a link preview may be fetched for, or `null` when no preview should
 * be requested. A cashu share link carries the token in its `#fragment`
 * precisely so it never reaches a server, so the fragment (and any userinfo)
 * is stripped before the preview request, and any link that carries a cashu
 * token — or a Linky `/cashu` redemption link — is refused outright. Without
 * this the bearer token lands in the link-preview backend's request logs and
 * public cache.
 */
export const linkPreviewUrl = (rawUrl: string): string | null => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  let decoded = rawUrl;
  try {
    decoded = decodeURIComponent(rawUrl);
  } catch {
    // keep the raw form; the token check below still runs on it
  }
  if (CASHU_TOKEN_SHAPE.test(decoded) || extractCashuTokenFromText(decoded))
    return null;
  if (isLinkyHost(parsed.hostname) && LINKY_CASHU_PATH.test(parsed.pathname)) {
    return null;
  }

  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  return parsed.toString();
};
