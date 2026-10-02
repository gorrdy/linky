import type { IconName } from "@linky-fit/ui";
import type { ReactNode } from "react";
import {
  Avatar,
  Icon,
  IconButton,
  Pressable,
  Row,
  Stack,
  Text,
} from "@linky-fit/ui";
import type { AvatarEditorControlId } from "../derivedProfile";
import { AVATAR_EDITOR_CONTROLS } from "../derivedProfile";
import type { Translate } from "../i18n";

const controlIcons: Record<AvatarEditorControlId, IconName> = {
  top: "Scissors",
  hairColor: "Palette",
  accessories: "Glasses",
  face: "Eye",
  mouth: "Smile",
  facialHair: "VenetianMask",
  skin: "Pipette",
  clothing: "Shirt",
};

interface AvatarControlGridCustomChoice {
  isSelected: boolean;
  onPick: () => void;
  pictureUrl: string | null;
}

interface AvatarControlGridProps {
  custom?: AvatarControlGridCustomChoice;
  disabled?: boolean;
  onCycle: (controlId: AvatarEditorControlId) => void;
  t: Translate;
}

function Cell({ children }: { children: ReactNode }) {
  return (
    <Stack role="listitem" width="33.333%" alignItems="center">
      {children}
    </Stack>
  );
}

export function AvatarControlGrid({
  custom,
  disabled = false,
  onCycle,
  t,
}: AvatarControlGridProps) {
  return (
    <Row
      role="list"
      aria-label={t("onboardingAvatarGridLabel")}
      flexWrap="wrap"
      gap="$none"
      rowGap="$md"
    >
      {AVATAR_EDITOR_CONTROLS.map((control) => (
        <Cell key={control.id}>
          <IconButton
            icon={controlIcons[control.id]}
            size="lg"
            accessibilityLabel={control.label}
            onPress={() => onCycle(control.id)}
            disabled={disabled}
          />
        </Cell>
      ))}

      {custom ? (
        <Cell>
          <Pressable
            flexDirection="column"
            gap="$xs"
            padding="$sm"
            borderRadius="$card"
            backgroundColor={custom.isSelected ? "$accentSoft" : "$transparent"}
            onPress={custom.onPick}
            disabled={disabled}
            aria-pressed={custom.isSelected}
          >
            {custom.pictureUrl ? (
              <Avatar
                name={t("profileUploadPhoto")}
                uri={custom.pictureUrl}
                size="sm"
              />
            ) : (
              <Icon name="Plus" size="lg" />
            )}
            <Text variant="caption" bold textAlign="center">
              {t("profileUploadPhoto")}
            </Text>
          </Pressable>
        </Cell>
      ) : null}
    </Row>
  );
}
