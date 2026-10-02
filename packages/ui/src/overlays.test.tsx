import { act, useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../test/render";
import { Button } from "./controls";
import { Dialog } from "./overlays";

function MountedOpen() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Pay</Button>
      {open ? (
        <Dialog open onOpenChange={setOpen} title="Confirm" closeLabel="Close">
          Paying 21 sats
        </Dialog>
      ) : null}
    </>
  );
}

describe("Dialog", () => {
  it("returns focus to the opener of a dialog that mounts open", async () => {
    const container = await render(<MountedOpen />);
    const opener = container.querySelector("button");
    opener?.focus();
    await act(async () => opener?.click());
    const close = document.querySelector<HTMLElement>("[aria-label=Close]");
    expect(document.activeElement).not.toBe(opener);
    await act(async () => close?.click());
    await act(() => new Promise((resolve) => setTimeout(resolve, 500)));
    expect(document.activeElement).toBe(opener);
  });
});
