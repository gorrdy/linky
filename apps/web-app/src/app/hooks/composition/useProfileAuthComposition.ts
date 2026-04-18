import type { Lang } from "../../../i18n";
import { useProfileAuthDomain } from "../useProfileAuthDomain";

interface UseProfileAuthCompositionParams {
  currentNsec: string | null;
  lang: Lang;
  pushToast: (message: string) => void;
  t: (key: string) => string;
}

export type ProfileAuthCompositionResult = ReturnType<
  typeof useProfileAuthDomain
>;

export const useProfileAuthComposition = ({
  currentNsec,
  lang,
  pushToast,
  t,
}: UseProfileAuthCompositionParams): ProfileAuthCompositionResult => {
  return useProfileAuthDomain({
    currentNsec,
    lang,
    pushToast,
    t,
  });
};
