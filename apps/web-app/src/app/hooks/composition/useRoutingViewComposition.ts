import type { MainSwipeRoutesProps } from "../../routes/AppRouteContent";
import { useMemoizedRouteBuilder } from "./useMemoizedRouteBundle";

type MainSwipeRouteBuilderInput = Omit<
  MainSwipeRoutesProps["mainSwipeProps"],
  "bottomTabActive" | "showGroupFilter" | "showNoGroupFilter"
>;

interface UseRoutingViewCompositionParams {
  groupNamesCount: number;
  mainSwipeRouteBuilderInput: MainSwipeRouteBuilderInput;
  statusFilterCount: number;
  ungroupedCount: number;
}

interface RoutingViewCompositionResult {
  mainSwipeRouteProps: MainSwipeRoutesProps;
}

export const useRoutingViewComposition = ({
  groupNamesCount,
  mainSwipeRouteBuilderInput,
  statusFilterCount,
  ungroupedCount,
}: UseRoutingViewCompositionParams): RoutingViewCompositionResult => {
  const routeKind = mainSwipeRouteBuilderInput.route.kind;
  const showGroupFilter =
    routeKind === "contacts" &&
    (groupNamesCount + statusFilterCount > 0 || ungroupedCount > 0);
  const bottomTabActive =
    routeKind === "contacts" || routeKind === "wallet" ? routeKind : null;

  const routeBuilderInput = {
    ...mainSwipeRouteBuilderInput,
    bottomTabActive,
    showGroupFilter,
  };

  return {
    mainSwipeRouteProps: useMemoizedRouteBuilder(
      routeBuilderInput,
      (mainSwipeProps) => ({ mainSwipeProps }),
    ),
  };
};
