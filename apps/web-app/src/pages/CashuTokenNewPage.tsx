import { Button, Stack, TextField } from "@linky-fit/ui";
import type { ComponentRef, FC, RefObject } from "react";
import { extractCashuTokenFromText } from "../app/lib/tokenText";
import type { Translate } from "../i18n";

interface CashuTokenNewPageProps {
  cashuDraft: string;
  cashuDraftRef: RefObject<ComponentRef<typeof TextField> | null>;
  cashuIsBusy: boolean;
  saveCashuFromText: (
    text: string,
    opts: { navigateToTokens?: boolean; navigateToWallet?: boolean },
  ) => Promise<void>;
  setCashuDraft: (value: string) => void;
  t: Translate;
}

export const CashuTokenNewPage: FC<CashuTokenNewPageProps> = ({
  cashuDraft,
  cashuDraftRef,
  cashuIsBusy,
  saveCashuFromText,
  setCashuDraft,
  t,
}) => {
  const saveToken = (tokenRaw: string) =>
    void saveCashuFromText(tokenRaw, { navigateToTokens: true });

  // A complete token is saved as soon as it lands in the field, whether it
  // arrives via the paste event or a keyboard/IME insert that only fires change.
  const handleDraftChange = (value: string) => {
    const token = cashuIsBusy ? null : extractCashuTokenFromText(value);
    if (token) {
      saveToken(token);
      return;
    }
    setCashuDraft(value);
  };

  return (
    <Stack gap="$lg">
      <TextField
        multiline
        ref={cashuDraftRef}
        label={t("cashuToken")}
        value={cashuDraft}
        onChangeText={handleDraftChange}
        placeholder={t("cashuPasteManualHint")}
      />
      <Button
        onPress={() => saveToken(cashuDraft)}
        disabled={!cashuDraft.trim() || cashuIsBusy}
      >
        {t("cashuSave")}
      </Button>
    </Stack>
  );
};
