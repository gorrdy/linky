import type { Tone } from "@linky-fit/ui";
import type { I18nKey } from "../i18n";

export type ConnectionState = "connected" | "checking" | "disconnected";

/** Status dot tone and label of a relay or Evolu server connection. */
export const connectionStatus = {
  connected: { tone: "accent", labelKey: "relayStateConnected" },
  checking: { tone: "warning", labelKey: "relayStateConnecting" },
  disconnected: { tone: "danger", labelKey: "relayStateUnreachable" },
} as const satisfies Record<ConnectionState, { tone: Tone; labelKey: I18nKey }>;
