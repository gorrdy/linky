import { describe, expect, it } from "vitest";
import { parseProfileGeneralStatus } from "./nostrStatus";

describe("profile exchange status currencies", () => {
  it("silently removes legacy BTC and USD while preserving supported currencies", () => {
    expect(parseProfileGeneralStatus("BTC, CZK, USD").currencies).toEqual([
      "CZK",
    ]);
    expect(parseProfileGeneralStatus("CZK, EUR").currencies).toEqual([
      "CZK",
      "EUR",
    ]);
    expect(parseProfileGeneralStatus("USD").currencies).toEqual([]);
    expect(parseProfileGeneralStatus("BTC").currencies).toEqual([]);
  });
});
