import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderIntoDocument } from "../testUtils/renderIntoDocument";
import { TopupInvoicePage } from "./TopupInvoicePage";

vi.mock("../components/WalletBalance", () => ({
  WalletBalance: ({ balance }: { balance: number }) => (
    <div data-testid="wallet-balance">{balance}</div>
  ),
}));

vi.mock("qrcode", () => ({
  toDataURL: vi.fn(async (payload: string) => `qr:${payload}`),
}));

const translate = (key: string): string => {
  switch (key) {
    case "copy":
      return "Copy";
    case "topupFetchingInvoice":
      return "Loading invoice...";
    case "topupInvoiceTitle":
      return "Top-up invoice";
    default:
      return key;
  }
};

// The QR src updates asynchronously (qrcode.toDataURL + setState), so poll
// until the assertion holds instead of racing it with a fixed delay.
const waitFor = async (assertion: () => void): Promise<void> => {
  const deadline = Date.now() + 2000;
  for (;;) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() > deadline) throw error;
      await act(async () => {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 10);
        });
      });
    }
  }
};

describe("TopupInvoicePage", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows loading instead of a stale QR while a fresh invoice is loading", async () => {
    const { container } = await renderIntoDocument(
      <TopupInvoicePage
        copyText={async () => {}}
        receiveMethod="universal"
        t={translate}
        topupAmount="21"
        topupInvoice="lnbc-old"
        topupInvoiceCashuRequest="creqAold"
        topupInvoiceError={null}
        topupInvoiceIsBusy={true}
        topupInvoiceQr="data:image/png;base64,old"
        topupInvoiceQrPayload="bitcoin:?lightning=lnbc-old"
        topupMintUrl="https://mint.example"
      />,
    );

    expect(container.textContent).toContain("Loading invoice...");
    expect(container.querySelector(".topup-invoice-qr")).toBeNull();
  });

  it("shows the universal QR and copies its payload by default", async () => {
    const copied: string[] = [];

    const { container, root } = await renderIntoDocument(
      <TopupInvoicePage
        copyText={async (text) => {
          copied.push(text);
        }}
        receiveMethod="universal"
        t={translate}
        topupAmount="21"
        topupInvoice="lnbc-invoice"
        topupInvoiceCashuRequest="creqArequest"
        topupInvoiceError={null}
        topupInvoiceIsBusy={false}
        topupInvoiceQr="data:image/png;base64,universal"
        topupInvoiceQrPayload="bitcoin:?lightning=lnbc-invoice&creq=creqArequest"
        topupMintUrl="https://mint.example"
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      container.querySelector(".topup-invoice-qr")?.getAttribute("src"),
    ).toBe("data:image/png;base64,universal");
    expect(container.querySelector('[role="tab"]')).toBeNull();

    await act(async () => {
      container
        .querySelector(".topup-invoice-copy")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(copied).toEqual([
      "bitcoin:?lightning=lnbc-invoice&creq=creqArequest",
    ]);

    await act(async () => {
      root.unmount();
    });
  });

  it("renders the cashu request when cashu is the receive method", async () => {
    const copied: string[] = [];

    const { container, root } = await renderIntoDocument(
      <TopupInvoicePage
        copyText={async (text) => {
          copied.push(text);
        }}
        receiveMethod="cashu"
        t={translate}
        topupAmount="21"
        topupInvoice="lnbc-invoice"
        topupInvoiceCashuRequest="creqArequest"
        topupInvoiceError={null}
        topupInvoiceIsBusy={false}
        topupInvoiceQr="data:image/png;base64,universal"
        topupInvoiceQrPayload="bitcoin:?lightning=lnbc-invoice&creq=creqArequest"
        topupMintUrl="https://mint.example"
      />,
    );

    await waitFor(() => {
      expect(
        container.querySelector(".topup-invoice-qr")?.getAttribute("src"),
      ).toBe("qr:creqArequest");
    });

    await act(async () => {
      container
        .querySelector(".topup-invoice-copy")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(copied).toEqual(["creqArequest"]);

    await act(async () => {
      root.unmount();
    });
  });

  it("falls back to the universal QR when the cashu request is missing", async () => {
    const { container, root } = await renderIntoDocument(
      <TopupInvoicePage
        copyText={async () => {}}
        receiveMethod="cashu"
        t={translate}
        topupAmount="21"
        topupInvoice="lnbc-invoice"
        topupInvoiceCashuRequest={null}
        topupInvoiceError={null}
        topupInvoiceIsBusy={false}
        topupInvoiceQr="data:image/png;base64,universal"
        topupInvoiceQrPayload="bitcoin:?lightning=lnbc-invoice"
        topupMintUrl="https://mint.example"
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      container.querySelector(".topup-invoice-qr")?.getAttribute("src"),
    ).toBe("data:image/png;base64,universal");

    await act(async () => {
      root.unmount();
    });
  });

  it("renders the lightning invoice when lightning is the receive method", async () => {
    const { container, root } = await renderIntoDocument(
      <TopupInvoicePage
        copyText={async () => {}}
        receiveMethod="lightning"
        t={translate}
        topupAmount="21"
        topupInvoice="lnbc-invoice"
        topupInvoiceCashuRequest="creqArequest"
        topupInvoiceError={null}
        topupInvoiceIsBusy={false}
        topupInvoiceQr="data:image/png;base64,universal"
        topupInvoiceQrPayload="bitcoin:?lightning=lnbc-invoice&creq=creqArequest"
        topupMintUrl="https://mint.example"
      />,
    );

    await waitFor(() => {
      expect(
        container.querySelector(".topup-invoice-qr")?.getAttribute("src"),
      ).toBe("qr:LNBC-INVOICE");
    });

    await act(async () => {
      root.unmount();
    });
  });
});
