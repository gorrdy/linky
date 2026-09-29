import { bech32 } from "@scure/base";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LnurlFallback } from "./common";
import {
  isLnurlAuthTarget,
  parseLnurlAuthTarget,
  submitLnurlAuth,
} from "./lnurlAuth";

const K1 = "a".repeat(64);
const AUTH_URL = `https://example.com/lnurl-auth?tag=login&k1=${K1}&action=login`;

const encodeLnurl = (url: string): string => {
  const bytes = new TextEncoder().encode(url);
  return bech32.encode("lnurl", bech32.toWords(bytes), 2000).toUpperCase();
};

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const signature = {
  publicKeyHex: "02".padEnd(66, "b"),
  signatureHex: "3045ff",
};

describe("LNURL-auth target parsing", () => {
  it("parses a bech32 login target without touching the network", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    expect(parseLnurlAuthTarget(encodeLnurl(AUTH_URL))).toEqual({
      action: "login",
      domain: "example.com",
      k1: K1,
      requestUrl: AUTH_URL,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("accepts the lightning: prefix, the keyauth scheme and plain https", () => {
    expect(isLnurlAuthTarget(`lightning:${encodeLnurl(AUTH_URL)}`)).toBe(true);
    expect(
      isLnurlAuthTarget(`keyauth://example.com/lnurl-auth?tag=login&k1=${K1}`),
    ).toBe(true);
    expect(isLnurlAuthTarget(AUTH_URL)).toBe(true);
  });

  it("keeps the advertised action and defaults to login", () => {
    expect(
      parseLnurlAuthTarget(AUTH_URL.replace("action=login", "action=register"))
        ?.action,
    ).toBe("register");
    expect(
      parseLnurlAuthTarget(AUTH_URL.replace("&action=login", ""))?.action,
    ).toBe("login");
    expect(
      parseLnurlAuthTarget(AUTH_URL.replace("action=login", "action=nonsense"))
        ?.action,
    ).toBe("login");
  });

  it("rejects targets that are not a well-formed login request", () => {
    expect(
      isLnurlAuthTarget(encodeLnurl("https://example.com/lnurlp/alice")),
    ).toBe(false);
    expect(
      isLnurlAuthTarget(`https://example.com/a?tag=withdrawRequest&k1=${K1}`),
    ).toBe(false);
    expect(isLnurlAuthTarget("https://example.com/a?tag=login&k1=nothex")).toBe(
      false,
    );
    expect(isLnurlAuthTarget("https://example.com/a?tag=login")).toBe(false);
    expect(isLnurlAuthTarget("alice@example.com")).toBe(false);
  });
});

describe("LNURL-auth callback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const previewFor = (target: string) => {
    const preview = parseLnurlAuthTarget(target);
    if (!preview) throw new Error("expected a login target");
    return preview;
  };

  it("appends the signature to the original query and hands the signer the domain", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ status: "OK" }));
    const sign = vi.fn().mockReturnValue(signature);

    await submitLnurlAuth({ preview: previewFor(AUTH_URL), sign });

    expect(sign).toHaveBeenCalledWith({
      challengeHex: K1,
      domain: "example.com",
    });
    const called = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(called.searchParams.get("tag")).toBe("login");
    expect(called.searchParams.get("k1")).toBe(K1);
    expect(called.searchParams.get("key")).toBe(signature.publicKeyHex);
    expect(called.searchParams.get("sig")).toBe(signature.signatureHex);
  });

  it("reports the domain's reason when it rejects the login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ status: "ERROR", reason: "expired k1" }),
    );

    await expect(
      submitLnurlAuth({
        preview: previewFor(AUTH_URL),
        sign: () => signature,
      }),
    ).rejects.toThrow("expired k1");
  });

  it("does not report success when the domain never confirms it", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    await expect(
      submitLnurlAuth({
        preview: previewFor(AUTH_URL),
        sign: () => signature,
      }),
    ).rejects.toThrow();
  });

  it("sends the signed callback through the fallback first, exactly once", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const fallback = vi.fn<LnurlFallback>(async () =>
      jsonResponse({ status: "OK" }),
    );

    await submitLnurlAuth(
      { preview: previewFor(AUTH_URL), sign: () => signature },
      fallback,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalledTimes(1);
    const called = new URL(String(fallback.mock.calls[0]?.[0]));
    expect(called.searchParams.get("k1")).toBe(K1);
    expect(called.searchParams.get("sig")).toBe(signature.signatureHex);
    expect(called.searchParams.get("key")).toBe(signature.publicKeyHex);
  });

  it("keeps the domain's reason from an error status the fallback relayed", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const fallback = vi.fn(async () =>
      Response.json(
        { status: "ERROR", reason: "k1 already used" },
        {
          status: 400,
        },
      ),
    );

    await expect(
      submitLnurlAuth(
        { preview: previewFor(AUTH_URL), sign: () => signature },
        fallback,
      ),
    ).rejects.toThrow("k1 already used");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not retry directly after the fallback relayed a failure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const fallback = vi.fn(async () =>
      Response.json({ error: "Proxy fetch failed" }, { status: 502 }),
    );

    await expect(
      submitLnurlAuth(
        { preview: previewFor(AUTH_URL), sign: () => signature },
        fallback,
      ),
    ).rejects.toThrow("HTTP 502");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("goes direct only when the fallback cannot be reached", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ status: "OK" }));
    const fallback = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await submitLnurlAuth(
      { preview: previewFor(AUTH_URL), sign: () => signature },
      fallback,
    );

    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(
      new URL(String(fetchSpy.mock.calls[0]?.[0])).searchParams.get("sig"),
    ).toBe(signature.signatureHex);
  });
});
