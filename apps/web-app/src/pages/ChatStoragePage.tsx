import { Stack, Text, ListRow, Button } from "@linky-fit/ui";
import { useState } from "react";
import { keepNewest, linkyScopes, messageScopes } from "@linky-fit/linksync";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useShardSummaries } from "../app/hooks/useLinksync";
import { forgetChatShards } from "../evolu";

export function ChatStoragePage(): React.ReactElement {
  const { t } = useAppShellCore();
  const summaries = useShardSummaries();
  const messages = summaries.find((shard) => shard.scope === "messages");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const keep = keepNewest(linkyScopes.messages);
  const subscribed = messages?.visibleOwnerIds.length ?? 0;
  const forgettable = summaries.some(
    (shard) =>
      messageScopes.some((scope) => scope === shard.scope) &&
      shard.visibleOwnerIds.length > keepNewest(linkyScopes[shard.scope]),
  );
  const forget = async () => {
    setBusy(true);
    setStatus("");
    try {
      await forgetChatShards();
      setStatus(t("chatStorageForgotten"));
    } catch {
      setStatus(t("chatStorageFailed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Stack>
      <Text>{t("chatStoragePolicy").replace("{count}", String(keep))}</Text>
      <ListRow
        testID="chat-storage-total"
        title={t("chatStorageTotal")}
        trailing={<Text>{messages ? messages.index + 1 : t("unknown")}</Text>}
      />
      <ListRow
        testID="chat-storage-subscribed"
        title={t("chatStorageSubscribed")}
        trailing={<Text>{messages ? subscribed : t("unknown")}</Text>}
      />
      <Text color="$colorMuted">{t("chatStorageForgetHint")}</Text>
      <Button
        variant="secondary"
        disabled={busy || !forgettable}
        onPress={() => void forget()}
      >
        {t("chatStorageForget")}
      </Button>
      <Text role="status">{status}</Text>
    </Stack>
  );
}
