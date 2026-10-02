import type { IconName } from "@linky-fit/ui";
import type { ReactNode } from "react";
import {
  Avatar,
  Icon,
  IconButton,
  OptionTile,
  Row,
  Stack,
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
          <OptionTile
            label={t("profileUploadPhoto")}
            leading={
              custom.pictureUrl ? (
                <Avatar
                  name={t("profileUploadPhoto")}
                  uri={custom.pictureUrl}
                  size="sm"
                />
              ) : (
                <Icon name="Plus" size="lg" />
              )
            }
            selected={custom.isSelected}
            onPress={custom.onPick}
            disabled={disabled}
          />
        </Cell>
      ) : null}
    </Row>
  );
}
