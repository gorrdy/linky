import {
  Chip,
  IconButton,
  Row,
  ScrollView,
  Section,
  space,
  Stack,
  Text,
  TextField,
} from "@linky-fit/ui";
import type { FC } from "react";
import React from "react";
import type { ContactRowLike } from "../app/types/appTypes";
import { BottomTabBar } from "../components/BottomTabBar";

import type { Translate } from "../i18n";

interface ContactsPageProps {
  activeGroup: string | null;
  bottomTabActive: "contacts" | "wallet" | null;
  contactsSearch: string;
  contactsSearchInputRef: React.RefObject<HTMLInputElement | null>;
  conversationsLabel: string;
  filterOpen: boolean;
  filterOptions: Array<{ count: number; label: string; value: string }>;
  openNewContactPage: () => void;
  onboardingContent?: React.ReactNode;
  otherContactsLabel: string;
  renderContactCard: (contact: ContactRowLike) => React.ReactNode;
  setActiveGroup: (value: string | null) => void;
  setContactsSearch: (value: string) => void;
  showGroupFilter: boolean;
  showBottomTabBar?: boolean;
  showFab?: boolean;
  t: Translate;
  visibleContacts: {
    conversations: ContactRowLike[];
    others: ContactRowLike[];
    pinned: ContactRowLike[];
    proxyPayments: ContactRowLike[];
  };
}

/** Rows bleed into the gutter so their highlight frames content aligned with the titles. */
const ContactRows = ({ children }: { children: React.ReactNode }) => (
  <Stack gap="$xs" marginHorizontal={-space.md}>
    {children}
  </Stack>
);

export const ContactsPage: FC<ContactsPageProps> = React.memo(
  ({
    activeGroup,
    bottomTabActive,
    contactsSearch,
    contactsSearchInputRef,
    conversationsLabel,
    filterOpen,
    filterOptions,
    openNewContactPage,
    onboardingContent,
    otherContactsLabel,
    renderContactCard,
    setActiveGroup,
    setContactsSearch,
    showGroupFilter,
    showBottomTabBar = true,
    showFab = true,
    t,
    visibleContacts,
  }) => {
    const totalVisible =
      visibleContacts.pinned.length +
      visibleContacts.proxyPayments.length +
      visibleContacts.conversations.length +
      visibleContacts.others.length;
    const hasAnyContacts = totalVisible > 0;
    const renderSection = (title: string, contacts: ContactRowLike[]) =>
      contacts.length > 0 ? (
        <Section title={title}>
          <ContactRows>{contacts.map(renderContactCard)}</ContactRows>
        </Section>
      ) : null;

    return (
      <>
        {onboardingContent}
        {filterOpen && (
          <Stack
            position="sticky"
            top="$none"
            zIndex="$sticky"
            gap="$sm"
            paddingVertical="$xs"
            backgroundColor="$background"
          >
            <TextField
              ref={(node) => {
                contactsSearchInputRef.current =
                  node instanceof HTMLInputElement ? node : null;
              }}
              label={t("contactsSearchPlaceholder")}
              hideLabel
              placeholder={t("contactsSearchPlaceholder")}
              value={contactsSearch}
              onChange={(event) => setContactsSearch(event.target.value)}
              autoComplete="off"
              enterKeyHint="search"
              trailing={
                contactsSearch.trim() ? (
                  <IconButton
                    icon="X"
                    size="sm"
                    variant="secondary"
                    accessibilityLabel={t("contactsSearchClear")}
                    onPointerDown={(event) => event.preventDefault()}
                    onPress={() => {
                      setContactsSearch("");
                      requestAnimationFrame(() => {
                        contactsSearchInputRef.current?.focus();
                      });
                    }}
                  />
                ) : null
              }
            />

            {showGroupFilter && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                role="navigation"
                aria-label={t("group")}
              >
                <Row gap="$sm" paddingVertical="$xs">
                  {filterOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={activeGroup === option.value}
                      onPress={() =>
                        setActiveGroup(
                          activeGroup === option.value ? null : option.value,
                        )
                      }
                    />
                  ))}
                </Row>
              </ScrollView>
            )}
          </Stack>
        )}

        <ScrollView
          flex={1}
          marginHorizontal={-space.md}
          contentContainerStyle={{ paddingHorizontal: space.md }}
        >
          {!hasAnyContacts ? (
            <Text color="$colorMuted">{t("noContactsYet")}</Text>
          ) : (
            <Stack gap="$xs">
              {visibleContacts.pinned.length > 0 && (
                <ContactRows>
                  {visibleContacts.pinned.map(renderContactCard)}
                </ContactRows>
              )}
              {renderSection(t("proxyPayments"), visibleContacts.proxyPayments)}
              {renderSection(conversationsLabel, visibleContacts.conversations)}
              {renderSection(otherContactsLabel, visibleContacts.others)}
            </Stack>
          )}
        </ScrollView>

        {showBottomTabBar ? (
          <BottomTabBar
            activeTab={bottomTabActive}
            contactsLabel={t("contactsTitle")}
            t={t}
            walletLabel={t("wallet")}
          />
        ) : null}

        {showFab ? (
          <Stack
            position="fixed"
            right="$xl"
            bottom="$huge"
            zIndex="$raised"
            data-safe-area="bottom"
          >
            <IconButton
              marginBottom="$huge"
              icon="UserPlus"
              variant="primary"
              size="lg"
              accessibilityLabel={t("addContact")}
              onPress={openNewContactPage}
              data-guide="contact-add-button"
            />
          </Stack>
        ) : null}
      </>
    );
  },
);
