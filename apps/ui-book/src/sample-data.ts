import type { Tone } from "@linky-fit/ui";

export const tones: readonly Tone[] = [
  "neutral",
  "accent",
  "warning",
  "danger",
  "info",
];

export const options = [
  { value: "sats", label: "Sats" },
  { value: "eur", label: "Euro" },
  { value: "usd", label: "Dollar", disabled: true },
];
