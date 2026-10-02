import { Children, useState } from "react";
import type { ReactNode, Ref } from "react";
import { ScrollView } from "tamagui";

export interface PagerProps {
  children: ReactNode;
  /** Index of the page on screen; the other pages are hidden from assistive technology. */
  activePage: number;
  /** Web only: receives the horizontal scroll node, e.g. to keep the page in sync with the route. */
  scrollRef?: Ref<HTMLDivElement> | undefined;
}

/** Full-width pages side by side that snap while swiping; each page scrolls vertically on its own. */
export function Pager({ children, activePage }: PagerProps) {
  const [width, setWidth] = useState(0);
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      flex={1}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {Children.map(children, (page, index) => (
        <ScrollView width={width} aria-hidden={index !== activePage}>
          {page}
        </ScrollView>
      ))}
    </ScrollView>
  );
}
