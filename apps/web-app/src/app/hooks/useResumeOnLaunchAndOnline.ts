import React from "react";

/**
 * Runs `resume` once per function identity (a new instance arrives with each
 * composed runtime), again whenever the browser comes back online, and again
 * when `resumeKey` changes, so an already-running device picks up work that
 * synced in (e.g. a pending quote created on another device) without a reload.
 */
export const useResumeOnLaunchAndOnline = (
  resume: (() => void) | null,
  resumeKey: string | null = null,
): void => {
  const resumedForRef = React.useRef<(() => void) | null>(null);
  const resumedKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (resume === null) return;
    if (resumedForRef.current !== resume) {
      resumedForRef.current = resume;
      resume();
    }
    window.addEventListener("online", resume);
    return () => {
      window.removeEventListener("online", resume);
    };
  }, [resume]);

  React.useEffect(() => {
    if (resume === null || resumeKey === null) return;
    if (resumedKeyRef.current === resumeKey) return;
    const isFirstKey = resumedKeyRef.current === null;
    resumedKeyRef.current = resumeKey;
    if (isFirstKey) return;
    resume();
  }, [resume, resumeKey]);
};
