import React from "react";
import { navigateTo } from "../../../hooks/useRouting";
import type { Route } from "../../../types/route";

export const useMainMenuState = ({ route }: { route: Route }) => {
  const mainReturnRouteRef = React.useRef<Route>({ kind: "contacts" });

  React.useEffect(() => {
    if (route.kind === "wallet") {
      mainReturnRouteRef.current = { kind: "wallet" };
      return;
    }
    if (route.kind === "contacts") {
      mainReturnRouteRef.current = { kind: "contacts" };
    }
  }, [route.kind]);

  const navigateToMainReturn = React.useCallback(() => {
    if (mainReturnRouteRef.current.kind === "wallet") {
      navigateTo({ route: "wallet" });
      return;
    }
    navigateTo({ route: "contacts" });
  }, []);

  const openMenu = React.useCallback(() => {
    mainReturnRouteRef.current =
      route.kind === "wallet" ? { kind: "wallet" } : { kind: "contacts" };
    navigateTo({ route: "settings" });
  }, [route.kind]);

  return { navigateToMainReturn, openMenu };
};
