import React from "react";
import "../App.css";
import { AuthenticatedLayout } from "../components/AuthenticatedLayout";
import { ToastNotifications } from "../components/ToastNotifications";
import { UnauthenticatedLayout } from "../components/UnauthenticatedLayout";
import {
  AppShellContextsProvider,
  type AppShellActionsContextValue,
  type AppShellCoreContextValue,
  type AppShellRouteContextValue,
} from "./context/AppShellContexts";
import { AppRouteContent } from "./routes/AppRouteContent";
import { useAppShellComposition } from "./useAppShellComposition";

const AppShell = () => {
  const {
    appActions,
    appState,
    confirmPendingOnboardingProfile,
    createNewAccount,
    currentNsec,
    formatDisplayedAmountParts,
    isMainSwipeRoute,
    lang,
    mainSwipeRouteProps,
    moneyRouteProps,
    onboardingIsBusy,
    onboardingPhotoInputRef,
    onboardingStep,
    onPendingOnboardingPhotoSelected,
    pageClassNameWithSwipe,
    pasteExistingNsec,
    peopleRouteProps,
    pickPendingOnboardingPhoto,
    pushToast,
    recentlyReceivedToken,
    selectPendingOnboardingAvatar,
    setOnboardingStep,
    setLang,
    setPendingOnboardingName,
    setRecentlyReceivedToken,
    systemRouteProps,
    t,
    toasts,
  } = useAppShellComposition();

  const coreContextValue: AppShellCoreContextValue = appState;

  const actionsContextValue: AppShellActionsContextValue = appActions;

  const routeContextValue = React.useMemo<AppShellRouteContextValue>(
    () => ({
      isMainSwipeRoute,
      mainSwipeRoutes: mainSwipeRouteProps,
      moneyRoutes: moneyRouteProps,
      pageClassNameWithSwipe,
      peopleRoutes: peopleRouteProps,
      systemRoutes: systemRouteProps,
    }),
    [
      isMainSwipeRoute,
      mainSwipeRouteProps,
      moneyRouteProps,
      pageClassNameWithSwipe,
      peopleRouteProps,
      systemRouteProps,
    ],
  );

  return (
    <div className={pageClassNameWithSwipe}>
      <ToastNotifications
        recentlyReceivedToken={recentlyReceivedToken}
        toasts={toasts}
        formatDisplayedAmountParts={formatDisplayedAmountParts}
        pushToast={pushToast}
        setRecentlyReceivedToken={setRecentlyReceivedToken}
        t={t}
      />

      {!currentNsec ? (
        <UnauthenticatedLayout
          confirmPendingOnboardingProfile={confirmPendingOnboardingProfile}
          onboardingStep={onboardingStep}
          onboardingIsBusy={onboardingIsBusy}
          lang={lang}
          onboardingPhotoInputRef={onboardingPhotoInputRef}
          onPendingOnboardingPhotoSelected={onPendingOnboardingPhotoSelected}
          setOnboardingStep={setOnboardingStep}
          createNewAccount={createNewAccount}
          pasteExistingNsec={pasteExistingNsec}
          pickPendingOnboardingPhoto={pickPendingOnboardingPhoto}
          selectPendingOnboardingAvatar={selectPendingOnboardingAvatar}
          setLang={setLang}
          setPendingOnboardingName={setPendingOnboardingName}
          t={t}
        />
      ) : null}

      {currentNsec ? (
        <AppShellContextsProvider
          actions={actionsContextValue}
          core={coreContextValue}
          routes={routeContextValue}
        >
          <AuthenticatedLayout>
            <AppRouteContent />
          </AuthenticatedLayout>
        </AppShellContextsProvider>
      ) : null}
    </div>
  );
};

export default AppShell;
