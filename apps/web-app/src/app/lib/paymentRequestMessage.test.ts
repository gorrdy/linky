import { describe, expect, it } from "vitest";
import { encode } from "cbor-x";
import { nip19 } from "nostr-tools";
import {
  buildCashuPaymentRequestMessage,
  buildLinkyPaymentRequestDeclineMessage,
  parseCashuPaymentRequestMessage,
  parseLinkyPaymentRequestDeclineMessage,
  withPaymentRequestAmount,
} from "./paymentRequestMessage";
import { encodeBase64Url } from "../../utils/base64";

describe("paymentRequestMessage", () => {
  it("round-trips a cashu payment request message", () => {
    // parseCashuPaymentRequestMessage validates the pubkey is on-curve, so the
    // fixture must be a real one (getPublicKey of the all-ones secret key).
    const recipientPubkey =
      "1b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f";
    const recipientNprofile = nip19.nprofileEncode({
      pubkey: recipientPubkey,
      relays: ["wss://relay.damus.io"],
    });

    const message = buildCashuPaymentRequestMessage({
      amount: 21000,
      description: "Payment request from Linky chat.",
      mintUrls: ["https://mint.example"],
      recipientNprofile,
      requestId: "request-1",
    });

    const parsed = parseCashuPaymentRequestMessage(message);

    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(21000);
    expect(parsed?.description).toBe("Payment request from Linky chat.");
    expect(parsed?.mintUrls).toEqual(["https://mint.example"]);
    expect(parsed?.requestId).toBe("request-1");
    expect(parsed?.transportNprofile).toBe(recipientNprofile);
    expect(parsed?.transportPubkeyHex).toBe(recipientPubkey);
    expect(parsed?.unit).toBe("sat");
  });

  it("parses a cashu payment request with HTTP POST transport", () => {
    const message = `creqA${encodeBase64Url(
      encode({
        a: 21,
        u: "sat",
        m: ["https://mint.example"],
        t: [
          {
            t: "post",
            a: "https://pay.example/request-1",
          },
        ],
      }),
    )}`;

    const parsed = parseCashuPaymentRequestMessage(message);

    expect(parsed?.amount).toBe(21);
    expect(parsed?.transportNprofile).toBeNull();
    expect(parsed?.transportPostUrl).toBe("https://pay.example/request-1");
    expect(parsed?.transportPubkeyHex).toBeNull();
  });

  it("keeps the amount open when the request leaves it to the payer", () => {
    const message = `creqA${encodeBase64Url(
      encode({
        i: "2b9035ee",
        u: "sat",
        t: [{ t: "nostr", a: "nprofile1invalid", g: [["n", "17"]] }],
      }),
    )}`;

    const parsed = parseCashuPaymentRequestMessage(message);

    expect(parsed?.amount).toBeNull();
    expect(parsed?.requestId).toBe("2b9035ee");
    expect(withPaymentRequestAmount(parsed!, 21).amount).toBe(21);
  });

  it("parses a real amount-less request from another wallet", () => {
    // Created by cashu.me: nostr transport, reusable, no amount.
    const parsed = parseCashuPaymentRequestMessage(
      "creqAo2F0gaNhdGVub3N0cmFhePducHJvZmlsZTFxeTI4d3VtbjhnaGo3dW45ZDNzaGp0bnl2OWtoMnVld2Q5aHN6OW1od2RlbjV0ZTB3ZmprY2N0ZTljdXJ4dmVuOWVlaHFjdHJ2NWhzenJ0aHdkZW41dGUwZGVoaHh0bnZkYWtxejluaHdkZW41dGUwd2Zqa2NjdGU5ZWM4eTZ0ZHY5a3p1bW45d3NxM3dhbW53dmF6N3RtanY0a3h6N2Z3d3BleGptdHBkc2h4dWV0NXlxcXpwd2plbDRybmczeGdoc2h2dmd3dTllcm4yN2E0eGp2N3F5M3htM3pncDNjbDYwa3ZkMmF2ejcycnkyYWeBgmFuYjE3YWloMmI5MDM1ZWVhdWNzYXQ=",
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBeNull();
    expect(parsed?.unit).toBe("sat");
    expect(parsed?.transportPubkeyHex).toBe(
      "ba59fd473444c8bc2ec621dc2e47357bb53499e01226dc4480c71fd3ecc6abac",
    );
  });

  it("still rejects a request that states a non-positive amount", () => {
    const message = `creqA${encodeBase64Url(encode({ a: 0, u: "sat" }))}`;

    expect(parseCashuPaymentRequestMessage(message)).toBeNull();
  });

  it("parses a payment request decline marker", () => {
    const message = buildLinkyPaymentRequestDeclineMessage("rumor-123");

    expect(parseLinkyPaymentRequestDeclineMessage(message)).toEqual({
      requestRumorId: "rumor-123",
    });
  });
});
