import {
  Divider,
  EmojiPicker,
  ListRow,
  ScrollView,
  Sheet,
} from "@linky-fit/ui";
import type { IconName } from "@linky-fit/ui";
import { useState, type FC } from "react";
import {
  QUICK_REACTION_EMOJIS,
  REACTION_EMOJIS,
} from "../app/lib/reactionEmojis";

interface MessageImageActions {
  canShare: boolean;
  onSave: () => void;
  onShare: () => void;
}

interface MessageActionsMenuProps {
  canCopy: boolean;
  canEdit: boolean;
  canReplyOrReact: boolean;
  imageActions: MessageImageActions | null;
  isOpen: boolean;
  labels: {
    copy: string;
    edit: string;
    menu: string;
    react: string;
    reply: string;
    save: string;
    share: string;
  };
  onClose: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
}

interface MenuAction {
  icon: IconName;
  label: string;
  run: () => void;
}

export const MessageActionsMenu: FC<MessageActionsMenuProps> = ({
  canCopy,
  canEdit,
  canReplyOrReact,
  imageActions,
  isOpen,
  labels,
  onClose,
  onCopy,
  onEdit,
  onReact,
  onReply,
}) => {
  const [emojisExpanded, setEmojisExpanded] = useState(false);
  // Every message has its own menu and a closing Sheet lingers in the DOM, so mount it only while open.
  if (!isOpen) return null;
  const actions: MenuAction[] = [];
  if (canReplyOrReact)
    actions.push({ icon: "Reply", label: labels.reply, run: onReply });
  if (canEdit)
    actions.push({ icon: "Pencil", label: labels.edit, run: onEdit });
  if (imageActions?.canShare)
    actions.push({
      icon: "Share2",
      label: labels.share,
      run: imageActions.onShare,
    });
  if (imageActions)
    actions.push({
      icon: "Download",
      label: labels.save,
      run: imageActions.onSave,
    });
  if (canCopy) actions.push({ icon: "Copy", label: labels.copy, run: onCopy });
  const close = () => {
    setEmojisExpanded(false);
    onClose();
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={labels.menu}
      hideTitle
    >
      {canReplyOrReact ? (
        <ScrollView maxHeight="$qr" flexGrow={0}>
          <EmojiPicker
            accessibilityLabel={labels.react}
            emojis={emojisExpanded ? REACTION_EMOJIS : QUICK_REACTION_EMOJIS}
            onSelect={(emoji) => {
              onReact(emoji);
              close();
            }}
            {...(emojisExpanded
              ? {}
              : {
                  more: {
                    label: "More emojis",
                    onPress: () => setEmojisExpanded(true),
                  },
                })}
          />
        </ScrollView>
      ) : null}
      <Divider />
      {actions.map((action) => (
        <ListRow
          key={action.label}
          testID="message-action"
          icon={action.icon}
          title={action.label}
          chevron={false}
          onPress={() => {
            action.run();
            close();
          }}
        />
      ))}
    </Sheet>
  );
};
