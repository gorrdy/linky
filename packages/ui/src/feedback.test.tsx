import { describe, expect, it } from "vitest";
import { render } from "../test/render";
import { Progress, StatusLine } from "./feedback";

const progressbar = async (element: React.ReactElement) => {
  const bar = (await render(element)).querySelector("[role=progressbar]");
  return [
    bar?.getAttribute("aria-valuenow"),
    bar?.getAttribute("aria-valuemax"),
  ];
};

describe("Progress", () => {
  it("reports its value and max", async () => {
    expect(
      await progressbar(
        <Progress value={3} max={6} segments={6} accessibilityLabel="Steps" />,
      ),
    ).toEqual(["3", "6"]);
  });

  it("clamps the value to the range", async () => {
    expect(
      await progressbar(<Progress value={1.4} accessibilityLabel="Done" />),
    ).toEqual(["1", "1"]);
  });
});

describe("StatusLine", () => {
  it("announces its label and shows a spinner only while busy", async () => {
    const idle = await render(<StatusLine label="Waiting" />);
    expect(idle.querySelector("[role=status]")?.textContent).toBe("Waiting");
    expect(idle.querySelector("[role=progressbar]")).toBeNull();
    const busy = await render(<StatusLine label="Waiting" busy />);
    expect(busy.querySelector("[role=progressbar]")).not.toBeNull();
  });
});
