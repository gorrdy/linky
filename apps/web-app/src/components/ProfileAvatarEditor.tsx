import { Avatar, Stack } from "@linky-fit/ui";
import React from "react";
import type { AvatarEditorControlId } from "../derivedProfile";
import type { Translate } from "../i18n";
import { formatShortNpub } from "../utils/formatting";
import type { FilePickerHandle } from "../utils/pickFile";
import { AvatarControlGrid } from "./AvatarControlGrid";
import { AvatarPhotoInput } from "./AvatarPhotoInput";

interface ProfileAvatarEditorProps {
  currentNpub: string;
  cycleProfileAvatarControl: (controlId: AvatarEditorControlId) => void;
  effectiveProfileName: string | null;
  effectiveProfilePicture: string | null;
  onProfilePhotoError: (error: unknown) => void;
  onPickProfilePhoto: () => void;
  onProfilePhotoSelected: (dataUrl: string) => void;
  profileCustomPictureUrl: string;
  profileEditName: string;
  profileEditPicture: string;
  profilePhotoInputRef: React.RefObject<FilePickerHandle | null>;
  profileSelectedPictureKind: "custom" | "generated";
  t: Translate;
}

export function ProfileAvatarEditor({
  currentNpub,
  cycleProfileAvatarControl,
  effectiveProfileName,
  effectiveProfilePicture,
  onProfilePhotoError,
  onPickProfilePhoto,
  onProfilePhotoSelected,
  profileCustomPictureUrl,
  profileEditName,
  profileEditPicture,
  profilePhotoInputRef,
  profileSelectedPictureKind,
  t,
}: ProfileAvatarEditorProps): React.ReactElement {
  const previewPicture = profileEditPicture || effectiveProfilePicture;
  const previewName =
    profileEditName.trim() ||
    effectiveProfileName ||
    formatShortNpub(currentNpub);

  return (
    <Stack gap="$md" marginBottom="$md">
      <Stack alignItems="center">
        <Avatar
          name={previewName}
          uri={previewPicture || undefined}
          size="lg"
        />
      </Stack>

      <AvatarPhotoInput
        inputRef={profilePhotoInputRef}
        onError={onProfilePhotoError}
        onSelected={onProfilePhotoSelected}
        t={t}
      />

      <AvatarControlGrid
        custom={{
          isSelected: profileSelectedPictureKind === "custom",
          onPick: onPickProfilePhoto,
          pictureUrl: profileCustomPictureUrl,
        }}
        onCycle={cycleProfileAvatarControl}
        t={t}
      />
    </Stack>
  );
}
