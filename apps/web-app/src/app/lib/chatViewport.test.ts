import { describe, expect, it } from "vitest";
import {
  captureChatPrependAnchor,
  captureChatViewportAnchor,
  restoreChatPrependAnchor,
  restoreChatViewportAnchor,
} from "./chatViewport";

const setClientHeight = (element: HTMLElement, height: number): void => {
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: height,
  });
};

const setScrollHeight = (element: HTMLElement, height: number): void => {
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: height,
  });
};

describe("chat viewport anchor", () => {
  it("keeps the same content at the bottom when the viewport shrinks", () => {
    const messages = document.createElement("div");
    messages.scrollTop = 640;
    setClientHeight(messages, 400);
    setScrollHeight(messages, 1_600);

    const anchor = captureChatViewportAnchor(messages);

    setClientHeight(messages, 160);
    restoreChatViewportAnchor(messages, anchor);

    expect(messages.scrollTop).toBe(880);
    expect(messages.scrollTop + messages.clientHeight).toBe(1_040);
  });

  it("keeps a chat at the end when the viewport shrinks", () => {
    const messages = document.createElement("div");
    messages.scrollTop = 1_200;
    setClientHeight(messages, 400);
    setScrollHeight(messages, 1_600);

    const anchor = captureChatViewportAnchor(messages);

    setClientHeight(messages, 160);
    restoreChatViewportAnchor(messages, anchor);

    expect(messages.scrollTop).toBe(1_440);
  });

  it("clamps a short chat to its reachable end", () => {
    const messages = document.createElement("div");
    setClientHeight(messages, 600);
    setScrollHeight(messages, 600);

    const anchor = captureChatViewportAnchor(messages);

    setClientHeight(messages, 260);
    setScrollHeight(messages, 360);
    restoreChatViewportAnchor(messages, anchor);

    expect(messages.scrollTop).toBe(100);
    expect(messages.scrollTop + messages.clientHeight).toBe(
      messages.scrollHeight,
    );
  });
});

describe("chat prepend anchor", () => {
  it("keeps the reader on the same message when older ones are prepended", () => {
    const messages = document.createElement("div");
    setClientHeight(messages, 600);
    setScrollHeight(messages, 2_000);
    messages.scrollTop = 400;

    const anchor = captureChatPrependAnchor(messages);

    // Another window of older messages mounted above the reader.
    setScrollHeight(messages, 5_000);
    restoreChatPrependAnchor(messages, anchor);

    expect(messages.scrollTop).toBe(3_400);
  });

  it("leaves the offset alone when nothing was prepended", () => {
    const messages = document.createElement("div");
    setClientHeight(messages, 600);
    setScrollHeight(messages, 2_000);
    messages.scrollTop = 400;

    const anchor = captureChatPrependAnchor(messages);
    restoreChatPrependAnchor(messages, anchor);

    expect(messages.scrollTop).toBe(400);
  });

  it("has nothing to restore without a container", () => {
    expect(captureChatPrependAnchor(null)).toBeNull();
    expect(() => restoreChatPrependAnchor(null, null)).not.toThrow();
  });
});
