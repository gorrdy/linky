import type { TokenTransfer } from "@linky-fit/linkshu";
import { Pressable, Stack, Text } from "@linky-fit/ui";
import { useAppShellCore } from "../app/context/AppShellContexts";
import type { LocalNostrMessage } from "../app/types/appTypes";
import type { ContactId } from "../evolu";
import { navigateTo } from "../hooks/useRouting";

export interface CashuTokenHandoffProps {
  transfer: TokenTransfer;
  chats: readonly LocalNostrMessage[];
  contacts: readonly { id: ContactId; name?: string | null }[];
}

export const CashuTokenHandoff = ({
  transfer,
  chats,
  contacts,
}: CashuTokenHandoffProps) => {
  const { t } = useAppShellCore();
  const location =
    transfer.status === "externalized"
      ? "cashuHandoffNfc"
      : transfer.kind === "receive"
        ? "cashuHandoffReceived"
        : transfer.status === "issued"
          ? "cashuHandoffIssued"
          : transfer.status === "returned"
            ? "cashuHandoffReclaimed"
            : "cashuHandoffUnknown";
  const chatLabel = (message: LocalNostrMessage) =>
    `${t(
      message.direction === "in"
        ? "cashuReceivedInChat"
        : message.status === "pending"
          ? "cashuQueuedInChat"
          : "cashuSentInChat",
    )} · ${
      contacts.find((contact) => contact.id === message.contactId)?.name ||
      t("cashuChatContact")
    }`;
  return (
    <Stack alignItems="flex-start" gap="$xs">
      {chats.length === 0 ? (
        <Text>{t(location)}</Text>
      ) : (
        chats.map((message) => (
          <Pressable
            key={message.contactId}
            onPress={() => navigateTo({ route: "chat", id: message.contactId })}
          >
            <Text textDecorationLine="underline">{chatLabel(message)}</Text>
          </Pressable>
        ))
      )}
      {chats.length > 0 && transfer.status === "externalized" ? (
        <Text>{t("cashuHandoffNfc")}</Text>
      ) : null}
    </Stack>
  );
};
