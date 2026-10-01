import { Avatar, NavigationRail, Pressable, Row } from "@linky-fit/ui";
import React from "react";
import {
  useAppShellActions,
  useAppShellCore,
} from "../app/context/AppShellContexts";
import { getDesktopRouteSection } from "../app/routes/desktopRouteSection";
import { navigateTo } from "../hooks/useRouting";
import { formatShortNpub } from "../utils/formatting";

export function DesktopNavigation(): React.ReactElement {
  const actions = useAppShellActions();
  const state = useAppShellCore();
  const { t } = state;

  return (
    <Row
      position="fixed"
      top="$lg"
      bottom="$lg"
      left="$lg"
      alignItems="stretch"
      zIndex="$raised"
    >
      <NavigationRail
        accessibilityLabel={t("menu")}
        header={
          <Pressable
            borderRadius="$pill"
            aria-label={t("profile")}
            onPress={actions.openProfileQr}
          >
            <Avatar
              name={
                state.effectiveProfileName ??
                (state.currentNpub ? formatShortNpub(state.currentNpub) : "?")
              }
              uri={state.effectiveProfilePicture ?? undefined}
            />
          </Pressable>
        }
        items={[
          { value: "contacts", label: t("contactsTitle"), icon: "Users" },
          { value: "wallet", label: t("wallet"), icon: "Wallet" },
        ]}
        footerItems={[
          { value: "settings", label: t("settings"), icon: "Settings" },
        ]}
        value={getDesktopRouteSection(state.route)}
        onValueChange={(route) => navigateTo({ route })}
      />
    </Row>
  );
}
