interface MessageLinkMatch {
  displayText: string;
  end: number;
  start: number;
  trailingText: string;
  url: string;
}

// The length cap keeps a single link bounded: without it a message of one
// short URL followed by tens of thousands of characters is one giant match,
// and normalizing it is what let a sender freeze the chat.
const MAX_LINK_LENGTH = 2048;
const MESSAGE_LINK_PATTERN = new RegExp(
  `(?:https?://|www\\.)[^\\s<>"']{1,${MAX_LINK_LENGTH}}`,
  "gi",
);
const SIMPLE_TRAILING_PUNCTUATION = /[.,!?;:]$/;

const countOccurrences = (value: string, character: string): number => {
  let count = 0;
  for (const current of value) if (current === character) count += 1;
  return count;
};

// Strips trailing `closing` characters while they outnumber `opening` ones,
// e.g. the ")" in "(see https://x.y/a)". Single linear pass: the counts are
// taken once, then decremented as trailing closers are dropped. `opening`
// and `closing` are single ASCII code units, so UTF-16 indexing is safe.
const trimUnbalancedClosingCharacter = (
  value: string,
  opening: string,
  closing: string,
): string => {
  let closingCount = countOccurrences(value, closing);
  const openingCount = countOccurrences(value, opening);
  let end = value.length;
  while (end > 0 && value[end - 1] === closing && closingCount > openingCount) {
    end -= 1;
    closingCount -= 1;
  }
  return value.slice(0, end);
};

export const normalizeMessageLinkMatch = (
  rawMatch: string,
): { displayText: string; trailingText: string; url: string } | null => {
  let displayText = rawMatch;
  while (SIMPLE_TRAILING_PUNCTUATION.test(displayText)) {
    displayText = displayText.slice(0, -1);
  }
  displayText = trimUnbalancedClosingCharacter(displayText, "(", ")");
  displayText = trimUnbalancedClosingCharacter(displayText, "[", "]");
  displayText = trimUnbalancedClosingCharacter(displayText, "{", "}");

  if (!displayText) return null;

  const candidate = /^www\./i.test(displayText)
    ? `https://${displayText}`
    : displayText;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
      return null;
    }
    return {
      displayText,
      trailingText: rawMatch.slice(displayText.length),
      url: parsed.toString(),
    };
  } catch {
    return null;
  }
};

export const extractMessageLinks = (content: string): MessageLinkMatch[] => {
  const links: MessageLinkMatch[] = [];
  for (const match of content.matchAll(MESSAGE_LINK_PATTERN)) {
    const rawMatch = match[0];
    const normalized = normalizeMessageLinkMatch(rawMatch);
    if (!normalized) continue;
    const start = match.index ?? 0;
    links.push({
      ...normalized,
      end: start + rawMatch.length,
      start,
    });
  }
  return links;
};
