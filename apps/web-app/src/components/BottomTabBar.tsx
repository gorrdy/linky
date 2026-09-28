import {
  Users as ContactsIcon,
  Settings as SettingsIcon,
  Wallet as WalletIcon,
} from "lucide-react";
import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { navigateTo } from "../hooks/useRouting";
import type { Translate } from "../i18n";
import { formatShortNpub, getInitials } from "../utils/formatting";
import { Avatar } from "./Avatar";
import { BottomTab } from "./BottomTab";

export type BottomTabKey = "profile" | "contacts" | "wallet" | "settings";

const TAB_KEYS: readonly BottomTabKey[] = [
  "profile",
  "contacts",
  "wallet",
  "settings",
];

interface BottomTabBarProps {
  activeTab: BottomTabKey | null;
  activeProgress?: number;
  contactsLabel: string;
  onTabChange?: (tab: "contacts" | "wallet") => void;
  t: Translate;
  walletLabel: string;
}

interface TabMetric {
  left: number;
  width: number;
}

type TabMetrics = Partial<Record<BottomTabKey, TabMetric>>;

const clampProgress = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

const ProfileTabAvatar = (): React.ReactElement => {
  const { currentNpub, effectiveProfileName, effectiveProfilePicture } =
    useAppShellCore();
  return (
    <span className="bottom-tab-avatar">
      <Avatar
        pictureUrl={effectiveProfilePicture}
        fallback={getInitials(
          effectiveProfileName ??
            (currentNpub ? formatShortNpub(currentNpub) : "?"),
        )}
        fallbackClassName="bottom-tab-avatar-fallback"
        loading="lazy"
      />
    </span>
  );
};

export function BottomTabBar({
  activeTab,
  activeProgress,
  contactsLabel,
  onTabChange,
  t,
  walletLabel,
}: BottomTabBarProps): React.ReactElement {
  const tabsRef = React.useRef<HTMLDivElement | null>(null);
  const tabRefs = React.useRef<
    Partial<Record<BottomTabKey, HTMLButtonElement>>
  >({});
  const [tabMetrics, setTabMetrics] = React.useState<TabMetrics>({});

  // Swipe progress interpolates the indicator between contacts and wallet.
  const swipeProgress =
    activeProgress !== undefined ? clampProgress(activeProgress) : null;
  const visualActiveTab: BottomTabKey | null =
    swipeProgress !== null
      ? swipeProgress >= 0.5
        ? "wallet"
        : "contacts"
      : activeTab;

  const measureTabs = React.useCallback(() => {
    const container = tabsRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const next: TabMetrics = {};
    for (const key of TAB_KEYS) {
      const element = tabRefs.current[key];
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      next[key] = { left: rect.left - containerRect.left, width: rect.width };
    }
    setTabMetrics(next);
  }, []);

  React.useLayoutEffect(() => {
    measureTabs();
  }, [measureTabs, contactsLabel, walletLabel]);

  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const container = tabsRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      measureTabs();
    });
    observer.observe(container);
    for (const key of TAB_KEYS) {
      const element = tabRefs.current[key];
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [measureTabs]);

  const indicator = (() => {
    const contacts = tabMetrics.contacts;
    const wallet = tabMetrics.wallet;
    if (swipeProgress !== null && contacts && wallet) {
      return {
        left: contacts.left + (wallet.left - contacts.left) * swipeProgress,
        width: contacts.width + (wallet.width - contacts.width) * swipeProgress,
      };
    }
    return visualActiveTab ? (tabMetrics[visualActiveTab] ?? null) : null;
  })();

  const handleTabChange = React.useCallback(
    (tab: BottomTabKey) => {
      if (tab === activeTab) return;
      if (onTabChange && (tab === "contacts" || tab === "wallet")) {
        onTabChange(tab);
        return;
      }
      navigateTo({ route: tab });
    },
    [activeTab, onTabChange],
  );

  const setTabRef =
    (key: BottomTabKey) => (element: HTMLButtonElement | null) => {
      if (element) {
        tabRefs.current[key] = element;
      } else {
        delete tabRefs.current[key];
      }
    };

  return (
    <div className="contacts-qr-bar bottom-nav" role="region">
      <div className="bottom-tabs-bar" role="tablist" aria-label={t("list")}>
        <div
          className={["bottom-tabs", indicator ? null : "no-indicator"]
            .filter(Boolean)
            .join(" ")}
          ref={tabsRef}
        >
          <div
            className="bottom-tabs-indicator"
            aria-hidden="true"
            style={
              indicator
                ? {
                    transform: `translateX(${indicator.left}px)`,
                    width: `${indicator.width}px`,
                  }
                : undefined
            }
          />
          <BottomTab
            buttonRef={setTabRef("profile")}
            dataGuide="profile-qr-button"
            icon={<ProfileTabAvatar />}
            isActive={visualActiveTab === "profile"}
            label={t("profile")}
            onClick={() => handleTabChange("profile")}
          />
          <BottomTab
            buttonRef={setTabRef("contacts")}
            icon={<ContactsIcon size={18} />}
            isActive={visualActiveTab === "contacts"}
            label={contactsLabel}
            onClick={() => handleTabChange("contacts")}
          />
          <BottomTab
            buttonRef={setTabRef("wallet")}
            icon={<WalletIcon size={18} />}
            isActive={visualActiveTab === "wallet"}
            label={walletLabel}
            onClick={() => handleTabChange("wallet")}
          />
          <BottomTab
            buttonRef={setTabRef("settings")}
            dataGuide="open-menu"
            icon={<SettingsIcon size={18} />}
            isActive={visualActiveTab === "settings"}
            label={t("settings")}
            onClick={() => handleTabChange("settings")}
          />
        </div>
      </div>
      <div className="contacts-qr-inner"></div>
    </div>
  );
}
