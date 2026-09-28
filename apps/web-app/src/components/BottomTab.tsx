import type { ReactNode, Ref } from "react";

interface BottomTabProps {
  buttonRef?: Ref<HTMLButtonElement>;
  dataGuide?: string;
  icon: ReactNode;
  isActive: boolean;
  label: string;
  onClick: () => void;
}

export function BottomTab({
  buttonRef,
  dataGuide,
  icon,
  isActive,
  label,
  onClick,
}: BottomTabProps) {
  return (
    <button
      type="button"
      className={
        isActive
          ? "bottom-tab bottom-nav-tab is-active"
          : "bottom-tab bottom-nav-tab"
      }
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-current={isActive ? "page" : undefined}
      ref={buttonRef}
      {...(dataGuide ? { "data-guide": dataGuide } : {})}
    >
      <span className="bottom-tab-icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
