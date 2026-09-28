import React from "react";
import { useAppShellCore } from "../app/context/AppShellContexts";
import { useAdvancedSettingsContext } from "../app/context/SystemSettingsContexts";
import {
  RECEIVE_METHOD_LABEL_KEYS,
  RECEIVE_METHODS,
} from "../utils/receiveMethod";

export function ReceiveMethodPage(): React.ReactElement {
  const { t } = useAppShellCore();
  const { receiveMethod, setReceiveMethod } = useAdvancedSettingsContext();

  return (
    <section className="panel">
      {RECEIVE_METHODS.map((method) => {
        const isSelected = receiveMethod === method;

        return (
          <button
            type="button"
            className={`settings-row settings-link settings-option${isSelected ? " is-selected" : ""}`}
            key={method}
            aria-pressed={isSelected}
            onClick={() => setReceiveMethod(method)}
          >
            <span className="settings-left">
              <span className="settings-label">
                {t(RECEIVE_METHOD_LABEL_KEYS[method])}
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
