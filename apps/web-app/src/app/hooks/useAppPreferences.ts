import React from "react";
import { persistLang, type Lang } from "../../i18n";
import {
  ALLOW_PROMISES_STORAGE_KEY,
  LIGHTNING_INVOICE_AUTO_PAY_LIMIT_STORAGE_KEY,
  PAY_WITH_CASHU_STORAGE_KEY,
  UNIT_TOGGLE_STORAGE_KEY,
} from "../../utils/constants";

interface UseAppPreferencesParams {
  allowPromisesEnabled: boolean;
  lang: Lang;
  lightningInvoiceAutoPayLimit: number;
  payWithCashuEnabled: boolean;
  useBitcoinSymbol: boolean;
}

export const useAppPreferences = ({
  allowPromisesEnabled,
  lang,
  lightningInvoiceAutoPayLimit,
  payWithCashuEnabled,
  useBitcoinSymbol,
}: UseAppPreferencesParams): void => {
  React.useEffect(() => {
    persistLang(lang);
    try {
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        UNIT_TOGGLE_STORAGE_KEY,
        useBitcoinSymbol ? "1" : "0",
      );
    } catch {
      // ignore
    }
  }, [useBitcoinSymbol]);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        PAY_WITH_CASHU_STORAGE_KEY,
        payWithCashuEnabled ? "1" : "0",
      );
    } catch {
      // ignore
    }
  }, [payWithCashuEnabled]);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        LIGHTNING_INVOICE_AUTO_PAY_LIMIT_STORAGE_KEY,
        String(lightningInvoiceAutoPayLimit),
      );
    } catch {
      // ignore
    }
  }, [lightningInvoiceAutoPayLimit]);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        ALLOW_PROMISES_STORAGE_KEY,
        allowPromisesEnabled ? "1" : "0",
      );
    } catch {
      // ignore
    }
  }, [allowPromisesEnabled]);
};
