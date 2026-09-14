import { TokenTransfer } from "@linky/linkshu";
import { Schema } from "effect";
import { act, type ComponentProps } from "react";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { id } from "@evolu/common";
import { renderIntoDocument } from "../testUtils/renderIntoDocument";
import { ANIMATED_QR_FRAME_MS } from "../utils/animatedQr";
import { CashuTokenPage } from "./CashuTokenPage";

vi.mock("../app/context/AppShellContexts", () => ({
  useAppShellCore: () => ({
    t: (key: string) => key,
    allowedDisplayCurrencies: ["sat"],
    formatDisplayedAmountText: (amount: number) => `${amount} sat`,
    formatDisplayedAmountParts: (amount: number) => ({
      approxPrefix: "",
      amountText: String(amount),
      unitLabel: "sat",
    }),
  }),
  useAppShellActions: () => ({ cycleDisplayCurrency: vi.fn() }),
}));

const tokenOf = (length: number) =>
  `cashuB${"o2FtcGh0dHBzOi8vY2FzaHUuY3phdWNzYXRhdIGiYWlIAbqH8lOtAF9hcI".repeat(60)}`.slice(
    0,
    length,
  );

const props = (tokenText: string): ComponentProps<typeof CashuTokenPage> => ({
  inspectCashuProofStates: null,
  canSendToContact: false,
  canWriteToNfc: false,
  cashuIsBusy: false,
  cashuProofs: [],
  cashuTransfers: [
    Schema.decodeUnknownSync(TokenTransfer)({
      id: "AQEBAQEBAQEBAQEBAQEBAQ",
      kind: "send",
      status: "issued",
      tokenText,
      mint: "https://mint.example",
      unit: "sat",
      amount: 21,
      error: null,
      createdAt: 1,
    }),
  ],
  checkAndRefreshCashuToken: async () => "ok",
  checkSingleIssuedCashuTokenIsClaimed: async () => false,
  copyText: vi.fn(),
  pendingCashuDeleteId: null,
  requestDeleteCashuToken: vi.fn(),
  returnCashuTokenToWallet: async () => {},
  routeId: id("CashuOperation").orThrow("AQEBAQEBAQEBAQEBAQEBAQ"),
  shareTokenText: async () => {},
  showPaidOverlay: vi.fn(),
  startSendCashuTokenToContact: async () => {},
  writeToNfc: async () => {},
});

const waitFor = async (check: () => void) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    try {
      check();
      return;
    } catch (error) {
      if (attempt === 39) throw error;
    }
  }
};
const imageSource = (container: HTMLElement) =>
  container.querySelector("img.qr")?.getAttribute("src");
const toggle = async (container: HTMLElement) => {
  const input = container.querySelector(
    'input[aria-label="cashuTokenAnimateQr"]',
  );
  assert(input instanceof HTMLInputElement);
  await act(async () => input.click());
  return input;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("token QR animation toggle", () => {
  it("replaces the animation with a stable QR of the complete token and can re-enable it", async () => {
    const token = tokenOf(2200);
    const QRCode = await import("qrcode");
    const fullTokenQr: string = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "M",
      margin: 2,
    });
    const rendered = await renderIntoDocument(
      <CashuTokenPage {...props(token)} />,
    );
    try {
      await waitFor(() => expect(imageSource(rendered.container)).toBeTruthy());
      const firstFrame = imageSource(rendered.container);
      await waitFor(() =>
        expect(imageSource(rendered.container)).not.toBe(firstFrame),
      );
      const input = await toggle(rendered.container);
      expect(input.checked).toBe(false);
      await waitFor(() =>
        expect(imageSource(rendered.container)).toBe(fullTokenQr),
      );
      await act(async () => {
        await new Promise((resolve) =>
          setTimeout(resolve, ANIMATED_QR_FRAME_MS * 2),
        );
      });
      expect(imageSource(rendered.container)).toBe(fullTokenQr);
      expect(rendered.container.textContent).not.toContain(
        "cashuTokenAnimatedQrHint",
      );
      await toggle(rendered.container);
      await waitFor(() => {
        expect(imageSource(rendered.container)).toBeTruthy();
        expect(imageSource(rendered.container)).not.toBe(fullTokenQr);
      });
      expect(input.checked).toBe(true);
    } finally {
      await rendered.unmount();
    }
  });

  it("explains when one static QR cannot fit and allows animation again", async () => {
    const rendered = await renderIntoDocument(
      <CashuTokenPage {...props(tokenOf(3000))} />,
    );
    try {
      await waitFor(() => expect(imageSource(rendered.container)).toBeTruthy());
      await toggle(rendered.container);
      await waitFor(() => {
        expect(imageSource(rendered.container)).toBeUndefined();
        expect(rendered.container.textContent).toContain(
          "cashuTokenStaticQrUnavailable",
        );
      });
      await toggle(rendered.container);
      await waitFor(() => expect(imageSource(rendered.container)).toBeTruthy());
      expect(rendered.container.textContent).not.toContain(
        "cashuTokenStaticQrUnavailable",
      );
    } finally {
      await rendered.unmount();
    }
  });

  it("keeps small tokens static without an animation toggle", async () => {
    const rendered = await renderIntoDocument(
      <CashuTokenPage {...props(tokenOf(300))} />,
    );
    try {
      await waitFor(() => expect(imageSource(rendered.container)).toBeTruthy());
      expect(
        rendered.container.querySelector('input[type="checkbox"]'),
      ).toBeNull();
    } finally {
      await rendered.unmount();
    }
  });
});

const transferProps = (
  overrides: Partial<ConstructorParameters<typeof TokenTransfer>[0]>,
) => {
  const base = props(tokenOf(200));
  const transfer = base.cashuTransfers[0];
  assert(transfer !== undefined);
  return {
    ...base,
    cashuTransfers: [new TokenTransfer({ ...transfer, ...overrides })],
  };
};

const buttonLabels = (container: HTMLElement) =>
  [...container.querySelectorAll("button")].map((button) =>
    button.textContent?.trim(),
  );

describe("closing a transfer", () => {
  it("offers a sent token only return to wallet, never a delete without refund", async () => {
    const rendered = await renderIntoDocument(
      <CashuTokenPage {...transferProps({ kind: "send", status: "issued" })} />,
    );
    try {
      const labels = buttonLabels(rendered.container);
      expect(labels).toContain("cashuReturnToWallet");
      expect(labels).not.toContain("delete");
    } finally {
      rendered.unmount();
    }
  });

  it("still lets a failed receive be deleted", async () => {
    const rendered = await renderIntoDocument(
      <CashuTokenPage
        {...transferProps({ kind: "receive", status: "failed" })}
      />,
    );
    try {
      expect(buttonLabels(rendered.container)).toContain("delete");
    } finally {
      rendered.unmount();
    }
  });
});
