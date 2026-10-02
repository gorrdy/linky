import { Children } from "react";
import type { PagerProps } from "./pager";

/** Full-width pages side by side that snap while swiping; each page scrolls vertically on its own. */
export function Pager({ children, activePage, scrollRef }: PagerProps) {
  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflowX: "auto",
        overscrollBehaviorX: "none",
        scrollSnapType: "x mandatory",
        scrollbarWidth: "none",
      }}
    >
      {Children.map(children, (page, index) => (
        <div
          aria-hidden={index !== activePage}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: "0 0 100%",
            minWidth: "100%",
            overflowY: "auto",
            overscrollBehaviorY: "contain",
            scrollSnapAlign: "start",
            scrollbarWidth: "none",
          }}
        >
          {page}
        </div>
      ))}
    </div>
  );
}
