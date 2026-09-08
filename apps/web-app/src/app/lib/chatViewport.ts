export interface ChatViewportAnchor {
  visibleBottom: number;
}

export const captureChatViewportAnchor = (
  messages: HTMLElement | null,
): ChatViewportAnchor | null => {
  if (!messages || messages.clientHeight <= 0) return null;

  return {
    visibleBottom: messages.scrollTop + messages.clientHeight,
  };
};

export const restoreChatViewportAnchor = (
  messages: HTMLElement | null,
  anchor: ChatViewportAnchor | null,
): void => {
  if (!messages || !anchor) return;

  const maxScrollTop = Math.max(
    0,
    messages.scrollHeight - messages.clientHeight,
  );
  messages.scrollTop = Math.min(
    maxScrollTop,
    Math.max(0, anchor.visibleBottom - messages.clientHeight),
  );
};

/**
 * Prepending older messages grows the list above the viewport, so keeping the
 * same scroll offset would slide the reader backwards. `capture` is taken
 * before the render that prepends, `restore` after it, and the difference in
 * height is added to the offset so the message the reader was looking at stays
 * where it was.
 */
export interface ChatPrependAnchor {
  scrollHeight: number;
  scrollTop: number;
}

export const captureChatPrependAnchor = (
  messages: HTMLElement | null,
): ChatPrependAnchor | null =>
  messages
    ? { scrollHeight: messages.scrollHeight, scrollTop: messages.scrollTop }
    : null;

export const restoreChatPrependAnchor = (
  messages: HTMLElement | null,
  anchor: ChatPrependAnchor | null,
): void => {
  if (!messages || !anchor) return;

  const grewBy = messages.scrollHeight - anchor.scrollHeight;
  if (grewBy <= 0) return;
  messages.scrollTop = anchor.scrollTop + grewBy;
};
