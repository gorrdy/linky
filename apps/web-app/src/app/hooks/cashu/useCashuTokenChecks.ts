import type { Proof, ProofState } from "@cashu/cashu-ts";
import * as Evolu from "@evolu/common";
import React from "react";
import { parseCashuToken } from "../../../cashu";
import { acceptCashuToken } from "../../../cashuAccept";
import type { CashuTokenId } from "../../../evolu";
import { navigateTo } from "../../../hooks/useRouting";
import {
  bumpCashuDeterministicCounter,
  getCashuDeterministicCounter,
  getCashuDeterministicSeedFromStorage,
  withCashuDeterministicCounterLock,
} from "../../../utils/cashuDeterministic";
import { getCashuLib } from "../../../utils/cashuLib";
import {
  createLoadedCashuWallet,
  decodeCashuTokenForMint,
} from "../../../utils/cashuWallet";
import {
  dedupeCashuProofs,
  partitionCashuProofGroupsByState,
} from "../../../utils/cashuProofs";
import { LAST_ACCEPTED_CASHU_TOKEN_STORAGE_KEY } from "../../../utils/constants";
import { normalizeMintUrl } from "../../../utils/mint";
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
} from "../../../utils/storage";
import { getUnknownErrorMessage } from "../../../utils/unknown";
import { buildPaymentFailureAmountAttempts } from "../../lib/paymentAmountFallback";
import {
  CASHU_TOKEN_STATE_ACCEPTED,
  CASHU_TOKEN_STATE_ERROR,
  CASHU_TOKEN_STATE_EXTERNALIZED,
  CASHU_TOKEN_STATE_PENDING,
  isCashuTokenAcceptedState,
  isCashuTokenEmittedState,
  normalizeCashuTokenState,
} from "../../lib/cashuTokenState";
import type { CashuTokenRowLike } from "../../types/appTypes";

type EvoluMutations = ReturnType<typeof import("../../../evolu").useEvolu>;

type CashuTokenRow = CashuTokenRowLike & { id?: CashuTokenId | string | null };
type CashuTokenUpdatePayload = Readonly<{
  id: CashuTokenId;
  amount?: number | null;
  error?: string | null;
  isDeleted?: number;
  mint?: string | null;
  rawToken?: string | null;
  state?: string | null;
  token?: string;
  unit?: string | null;
}>;

interface ProofLike {
  C?: string;
  amount?: number;
  id?: string;
  secret?: string;
}

interface UseCashuTokenChecksParams {
  appOwnerId: Evolu.OwnerId | null;
  cashuBulkCheckIsBusy: boolean;
  cashuIsBusy: boolean;
  cashuTokensAll: readonly CashuTokenRow[];
  pendingCashuDeleteId: CashuTokenId | null;
  pushToast: (message: string) => void;
  setCashuBulkCheckIsBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setCashuIsBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingCashuDeleteId: React.Dispatch<
    React.SetStateAction<CashuTokenId | null>
  >;
  setStatus: React.Dispatch<React.SetStateAction<string | null>>;
  t: (key: string) => string;
  update: EvoluMutations["update"];
}

export const useCashuTokenChecks = ({
  appOwnerId,
  cashuBulkCheckIsBusy,
  cashuIsBusy,
  cashuTokensAll,
  pendingCashuDeleteId,
  pushToast,
  setCashuBulkCheckIsBusy,
  setCashuIsBusy,
  setPendingCashuDeleteId,
  setStatus,
  t,
  update,
}: UseCashuTokenChecksParams) => {
  const updateCashuToken = React.useCallback(
    function (
      payload: CashuTokenUpdatePayload,
    ): ReturnType<EvoluMutations["update"]> {
      if (!appOwnerId) return update("cashuToken", payload);

      const scoped = update("cashuToken", payload, { ownerId: appOwnerId });
      if (scoped.ok) return scoped;

      return update("cashuToken", payload);
    },
    [appOwnerId, update],
  );

  const handleDeleteCashuToken = React.useCallback(
    (
      id: CashuTokenId,
      options?: { navigate?: boolean; setStatus?: boolean },
    ) => {
      const { navigate = true, setStatus: setStatusEnabled = true } =
        options ?? {};
      const row = cashuTokensAll.find(
        (tkn) => String(tkn?.id ?? "") === String(id),
      );
      const result = appOwnerId
        ? update(
            "cashuToken",
            { id, isDeleted: Evolu.sqliteTrue },
            { ownerId: appOwnerId },
          )
        : update("cashuToken", { id, isDeleted: Evolu.sqliteTrue });
      if (result.ok) {
        const token = String(row?.token ?? "").trim();
        const rawToken = String(row?.rawToken ?? "").trim();
        if (token || rawToken) {
          const remembered = String(
            safeLocalStorageGet(LAST_ACCEPTED_CASHU_TOKEN_STORAGE_KEY) ?? "",
          ).trim();
          if (remembered && (remembered === token || remembered === rawToken)) {
            safeLocalStorageSet(LAST_ACCEPTED_CASHU_TOKEN_STORAGE_KEY, "");
          }
        }
        if (setStatusEnabled) {
          setStatus(t("cashuDeleted"));
        }
        setPendingCashuDeleteId(null);
        if (navigate) {
          navigateTo({ route: "wallet" });
        }
        return;
      }
      if (setStatusEnabled) {
        setStatus(`${t("errorPrefix")}: ${String(result.error)}`);
      }
    },
    [appOwnerId, cashuTokensAll, setPendingCashuDeleteId, setStatus, t, update],
  );

  const refreshCashuTokenGroup = React.useCallback(
    async (args: {
      primaryRow: CashuTokenRow;
      rows: readonly CashuTokenRow[];
      manageBusy: boolean;
    }): Promise<"ok" | "invalid" | "transient" | "skipped"> => {
      const { primaryRow, rows, manageBusy } = args;

      const state = normalizeCashuTokenState(primaryRow.state);
      const storedTokenText = String(primaryRow.token ?? "").trim();
      const rawTokenText = String(primaryRow.rawToken ?? "").trim();
      const initialTokenText = storedTokenText || rawTokenText;
      if (!initialTokenText) {
        pushToast(t("errorPrefix"));
        return "skipped";
      }

      if (manageBusy) {
        if (cashuIsBusy) return "skipped";
        setCashuIsBusy(true);
      }
      setStatus(t("cashuChecking"));

      const looksLikeTransientError = (message: string) => {
        const m = message.toLowerCase();
        return (
          m.includes("failed to fetch") ||
          m.includes("networkerror") ||
          m.includes("network error") ||
          m.includes("timeout") ||
          m.includes("timed out") ||
          m.includes("econn") ||
          m.includes("enotfound") ||
          m.includes("dns") ||
          m.includes("offline") ||
          m.includes("503") ||
          m.includes("502") ||
          m.includes("504")
        );
      };

      // NUT error codes signalling a definitively invalid token. Preferred
      // signal: cashu-ts surfaces these as `MintOperationError` instances
      // with a numeric `.code` field. We fall back to substring matching
      // for non-mint errors (e.g. local "Token proofs missing" thrown
      // above), but the substring match is intentionally narrower than
      // before — the previous loose `.includes("spent")` could trip on
      // unrelated errors and on a single spent proof in the merge group.
      const DEFINITIVE_INVALID_CODES = new Set<number>([
        11001, // TokenAlreadySpentError
      ]);
      const isDefinitiveInvalidError = (error: unknown): boolean => {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          typeof (error as { code?: unknown }).code === "number" &&
          DEFINITIVE_INVALID_CODES.has((error as { code: number }).code)
        ) {
          return true;
        }
        const m = String(
          (error && typeof error === "object" && "message" in error
            ? (error as { message?: unknown }).message
            : error) ?? "",
        )
          .trim()
          .toLowerCase();
        return (
          m.includes("token already spent") ||
          m.includes("invalid proof") ||
          m.includes("invalid proofs") ||
          m.includes("token proofs missing") ||
          m.includes("invalid token")
        );
      };

      const normalizeProofs = (
        items: ProofLike[],
      ): Array<{ C: string; amount: number; id: string; secret: string }> =>
        items.filter(
          (p): p is { C: string; amount: number; id: string; secret: string } =>
            !!p &&
            typeof (p as { amount?: unknown }).amount === "number" &&
            typeof (p as { secret?: unknown }).secret === "string" &&
            typeof (p as { C?: unknown }).C === "string" &&
            typeof (p as { id?: unknown }).id === "string",
        );

      try {
        let tokenText = initialTokenText;
        let effectiveState = state;

        if (state && state !== CASHU_TOKEN_STATE_ACCEPTED) {
          if (state === CASHU_TOKEN_STATE_PENDING) {
            return "skipped";
          }

          if (
            (state === CASHU_TOKEN_STATE_ERROR ||
              state === CASHU_TOKEN_STATE_EXTERNALIZED) &&
            tokenText
          ) {
            try {
              const accepted = await acceptCashuToken(tokenText);
              const acceptedTokenText = String(accepted.token ?? "").trim();
              const result = updateCashuToken({
                id: primaryRow.id as CashuTokenId,
                token: acceptedTokenText as typeof Evolu.NonEmptyString.Type,
                rawToken: tokenText
                  ? (tokenText as typeof Evolu.NonEmptyString.Type)
                  : null,
                mint: accepted.mint as typeof Evolu.NonEmptyString1000.Type,
                unit: accepted.unit
                  ? (accepted.unit as typeof Evolu.NonEmptyString100.Type)
                  : null,
                amount:
                  accepted.amount > 0
                    ? (accepted.amount as typeof Evolu.PositiveInt.Type)
                    : null,
                state:
                  CASHU_TOKEN_STATE_ACCEPTED as typeof Evolu.NonEmptyString100.Type,
                error: null,
              });

              if (!result.ok) {
                throw new Error(String(result.error));
              }
              tokenText = acceptedTokenText;
              effectiveState = CASHU_TOKEN_STATE_ACCEPTED;
            } catch (e) {
              const message = String(e).trim() || "Token invalid";
              const definitive = isDefinitiveInvalidError(e);
              const transient = looksLikeTransientError(message);

              if (definitive && !transient) {
                updateCashuToken({
                  id: primaryRow.id as CashuTokenId,
                  state: "error" as typeof Evolu.NonEmptyString100.Type,
                  error: message.slice(
                    0,
                    1000,
                  ) as typeof Evolu.NonEmptyString1000.Type,
                });
                setStatus(`${t("cashuCheckFailed")}: ${message}`);
                pushToast(t("cashuInvalid"));
                return "invalid";
              }

              setStatus(`${t("cashuCheckFailed")}: ${message}`);
              pushToast(`${t("cashuCheckFailed")}: ${message}`);
              return "transient";
            }
          }
          if (effectiveState !== CASHU_TOKEN_STATE_ACCEPTED) {
            return "skipped";
          }
        }

        const {
          CashuMint,
          CashuWallet,
          getDecodedToken,
          getEncodedToken,
          getTokenMetadata,
        } = await getCashuLib();

        const tokenMetadata = getTokenMetadata(tokenText);
        const mint = String(tokenMetadata.mint ?? primaryRow.mint ?? "").trim();
        if (!mint) throw new Error("Token mint missing");

        const unit =
          String(tokenMetadata.unit ?? primaryRow.unit ?? "").trim() || "sat";
        const det = getCashuDeterministicSeedFromStorage();
        const wallet = await createLoadedCashuWallet({
          CashuMint,
          CashuWallet,
          mintUrl: mint,
          ...(unit ? { unit } : {}),
          ...(det ? { bip39seed: det.bip39seed } : {}),
        });

        const decoded = decodeCashuTokenForMint({
          tokenText,
          mintUrl: mint,
          keysets: wallet.keysets,
          getDecodedToken,
          getTokenMetadata,
        });

        const normalizedMint = normalizeMintUrl(mint);
        const normalizedUnit = String(wallet.unit ?? unit).trim() || "sat";

        // Build per-candidate proof groups so we can ask the mint about each
        // row's proofs separately. Previously this loop flattened all proofs
        // into a single merge — if any token in the merge was spent, the
        // subsequent swap failed with "Token already spent" and the catch
        // handler marked the *primary* row as invalid even when its own
        // proofs were unspent (user could still claim it in another wallet).
        type Candidate = {
          id: CashuTokenId | null;
          isPrimary: boolean;
          proofs: Proof[];
        };
        const candidates: Candidate[] = [];

        for (const candidate of rows) {
          if (candidate.isDeleted) continue;
          const candidateState = normalizeCashuTokenState(candidate.state);
          if (candidateState === CASHU_TOKEN_STATE_PENDING) continue;

          const candidateText = String(
            candidate.token ?? candidate.rawToken ?? "",
          ).trim();
          if (!candidateText) continue;

          let candidateDecoded: {
            mint?: string;
            proofs?: ProofLike[];
            unit?: string;
          } | null = null;
          try {
            candidateDecoded = decodeCashuTokenForMint({
              tokenText: candidateText,
              mintUrl: mint,
              keysets: wallet.keysets,
              getDecodedToken,
              getTokenMetadata,
            });
          } catch {
            continue;
          }

          const candidateMint = String(
            candidateDecoded?.mint ?? candidate.mint ?? "",
          ).trim();
          if (!candidateMint) continue;
          if (normalizeMintUrl(candidateMint) !== normalizedMint) continue;

          const candidateUnit =
            String(candidateDecoded?.unit ?? candidate.unit ?? "").trim() ||
            "sat";
          if (candidateUnit !== normalizedUnit) continue;

          const candidateProofs = normalizeProofs(
            Array.isArray(candidateDecoded?.proofs)
              ? candidateDecoded.proofs
              : [],
          );
          if (!candidateProofs.length) continue;

          const candidateId = candidate.id ?? null;
          candidates.push({
            id: candidateId as CashuTokenId | null,
            isPrimary:
              candidateId !== null &&
              String(candidateId) === String(primaryRow.id ?? ""),
            proofs: candidateProofs,
          });
        }

        // Fall back to the primary row's own decoded proofs if no candidates
        // matched (e.g. all rows are pending or fail to decode against the
        // active keyset). Mark this synthetic group as the primary so the
        // partition logic still tracks it.
        if (candidates.length === 0) {
          const fallbackProofs = normalizeProofs(
            Array.isArray(decoded?.proofs)
              ? (decoded.proofs as ProofLike[])
              : [],
          );
          if (fallbackProofs.length) {
            candidates.push({
              id: (primaryRow.id as CashuTokenId | null) ?? null,
              isPrimary: true,
              proofs: fallbackProofs,
            });
          }
        }

        if (candidates.length === 0) {
          throw new Error("Token proofs missing");
        }

        // Bulk state check across all candidate proofs in one round-trip.
        // cashu-ts batches into chunks of 100 internally and re-emits states
        // aligned to input order, so partitioning by group offset is safe.
        let bulkStates: ProofState[] | null = null;
        try {
          const flatProofs = candidates.flatMap((c) => c.proofs);
          const result = await wallet.checkProofsStates(flatProofs);
          bulkStates = Array.isArray(result) ? result : [];
        } catch {
          // If the mint is unreachable the existing behaviour was to push on
          // and let the swap surface the error. Preserve that by leaving
          // bulkStates null — we'll fall back to a single-candidate (primary
          // only) flow below to avoid merge poisoning.
          bulkStates = null;
        }

        let liveCandidates: Array<{
          id: CashuTokenId | null;
          proofs: Proof[];
        }>;

        if (bulkStates) {
          const partition = partitionCashuProofGroupsByState(
            candidates.map((c) => ({ id: c.id, proofs: c.proofs })),
            bulkStates,
          );

          // Mark every fully-spent row as error individually. Crucially we
          // do NOT mark unrelated rows just because one row in the same
          // mint+unit group is spent.
          for (const id of partition.fullySpentIds) {
            if (!id) continue;
            updateCashuToken({
              id,
              state: "error" as typeof Evolu.NonEmptyString100.Type,
              error:
                "Token already spent" as typeof Evolu.NonEmptyString1000.Type,
            });
          }

          // If the primary row is fully spent, surface that to the user and
          // stop — there is nothing to refresh.
          const primaryFullySpent = partition.fullySpentIds.some(
            (id) => id !== null && String(id) === String(primaryRow.id ?? ""),
          );
          if (primaryFullySpent) {
            setStatus(`${t("cashuCheckFailed")}: Token already spent`);
            pushToast(t("cashuInvalid"));
            return "invalid";
          }

          liveCandidates = partition.liveGroups;

          // If no row has any unspent proofs left, the entire group is dead.
          if (liveCandidates.length === 0) {
            setStatus(`${t("cashuCheckFailed")}: Token already spent`);
            pushToast(t("cashuInvalid"));
            return "invalid";
          }
        } else {
          // State check unreachable — verify only the primary row to avoid
          // poisoning it with another row's spent proofs in the swap merge.
          const primary = candidates.find((c) => c.isPrimary);
          liveCandidates = primary
            ? [{ id: primary.id, proofs: primary.proofs }]
            : [{ id: candidates[0].id, proofs: candidates[0].proofs }];
        }

        const mergeIds: CashuTokenId[] = liveCandidates
          .map((c) => c.id)
          .filter((id): id is CashuTokenId => !!id);

        const proofs = dedupeCashuProofs(
          liveCandidates.flatMap((c) => c.proofs),
        );
        if (!proofs.length) throw new Error("Token proofs missing");

        const total = proofs.reduce(
          (sum: number, p: { amount?: number }) =>
            sum + (Number(p?.amount ?? 0) || 0),
          0,
        );
        if (!Number.isFinite(total) || total <= 0) {
          throw new Error("Invalid token amount");
        }

        const walletUnit = wallet.unit;
        const keysetId = wallet.keysetId;
        const getSwapFeeForProofs = (): number | null => {
          const fn = (
            wallet as {
              getFeesForProofs?: (
                proofs: Array<{
                  C: string;
                  amount: number;
                  id: string;
                  secret: string;
                }>,
              ) => number | null | undefined;
            }
          ).getFeesForProofs;
          if (typeof fn !== "function") return null;
          try {
            const fee = Number(fn(proofs));
            return Number.isFinite(fee) && fee > 0 ? fee : null;
          } catch {
            return null;
          }
        };
        const runSwap = async (amountToSend: number) => {
          return det
            ? withCashuDeterministicCounterLock(
                { mintUrl: mint, unit: walletUnit, keysetId },
                async () => {
                  const counter = getCashuDeterministicCounter({
                    mintUrl: mint,
                    unit: walletUnit,
                    keysetId,
                  });

                  const swapped = await wallet.swap(
                    amountToSend,
                    proofs,
                    typeof counter === "number" ? { counter } : undefined,
                  );

                  const keepLen = Array.isArray(swapped.keep)
                    ? swapped.keep.length
                    : 0;
                  const sendLen = Array.isArray(swapped.send)
                    ? swapped.send.length
                    : 0;
                  bumpCashuDeterministicCounter({
                    mintUrl: mint,
                    unit: walletUnit,
                    keysetId,
                    used: keepLen + sendLen,
                  });

                  return swapped;
                },
              )
            : wallet.swap(amountToSend, proofs);
        };

        const applyLocalMerge = (): boolean => {
          if (mergeIds.length <= 1) return false;
          const mergedToken = getEncodedToken({
            mint,
            proofs,
            unit: walletUnit,
          });
          const result = updateCashuToken({
            id: primaryRow.id as CashuTokenId,
            token: mergedToken as typeof Evolu.NonEmptyString.Type,
            rawToken: null,
            mint: mint ? (mint as typeof Evolu.NonEmptyString1000.Type) : null,
            unit: walletUnit
              ? (walletUnit as typeof Evolu.NonEmptyString100.Type)
              : null,
            amount:
              total > 0
                ? (Math.floor(total) as typeof Evolu.PositiveInt.Type)
                : null,
            state:
              CASHU_TOKEN_STATE_ACCEPTED as typeof Evolu.NonEmptyString100.Type,
            error: null,
          });

          if (!result.ok) {
            throw new Error(String(result.error));
          }

          for (const mergeId of mergeIds) {
            if (String(mergeId) === String(primaryRow.id ?? "")) continue;
            updateCashuToken({
              id: mergeId,
              isDeleted: Evolu.sqliteTrue,
            });
          }
          return true;
        };

        const initialFee = getSwapFeeForProofs();
        if (initialFee && total - initialFee <= 0) {
          if (applyLocalMerge()) {
            setStatus(t("cashuCheckOk"));
            pushToast(t("cashuCheckOk"));
            return "ok";
          }
          setStatus(t("cashuCheckOk"));
          pushToast(t("cashuCheckOk"));
          return "ok";
        }

        const initialAmount =
          initialFee && total - initialFee > 0 ? total - initialFee : total;
        const amountAttempts = [
          initialAmount,
          ...buildPaymentFailureAmountAttempts(
            initialAmount,
            initialFee ? `fee: ${initialFee}` : "",
          ),
        ];
        let swapped: { keep?: ProofLike[]; send?: ProofLike[] } | null = null;
        let swapFailure: unknown = null;
        for (const amountAttempt of amountAttempts) {
          try {
            swapped = (await runSwap(amountAttempt)) as {
              keep?: ProofLike[];
              send?: ProofLike[];
            };
            swapFailure = null;
            break;
          } catch (error) {
            swapFailure = error;
            const message = getUnknownErrorMessage(error, "").toLowerCase();
            if (message.includes("not enough funds available for swap")) {
              if (applyLocalMerge()) {
                setStatus(t("cashuCheckOk"));
                pushToast(t("cashuCheckOk"));
                return "ok";
              }
              setStatus(t("cashuCheckOk"));
              pushToast(t("cashuCheckOk"));
              return "ok";
            }

            const retryAttempts = buildPaymentFailureAmountAttempts(
              amountAttempt,
              getUnknownErrorMessage(error, ""),
            );
            let appendedRetry = false;
            for (const retryAmount of retryAttempts) {
              if (amountAttempts.includes(retryAmount)) continue;
              amountAttempts.push(retryAmount);
              appendedRetry = true;
            }
            if (appendedRetry) continue;
          }
        }
        if (!swapped) {
          throw swapFailure ?? new Error("Swap produced empty token");
        }

        const newProofs = normalizeProofs([
          ...(swapped?.keep ?? []),
          ...(swapped?.send ?? []),
        ]);
        const newTotal = newProofs.reduce(
          (sum, p) => sum + (Number(p?.amount ?? 0) || 0),
          0,
        );
        if (!Number.isFinite(newTotal) || newTotal <= 0) {
          throw new Error("Swap produced empty token");
        }

        const refreshedToken = getEncodedToken({
          mint,
          proofs: newProofs,
          unit: walletUnit,
        });
        const result = updateCashuToken({
          id: primaryRow.id as CashuTokenId,
          token: refreshedToken as typeof Evolu.NonEmptyString.Type,
          rawToken: null,
          mint: mint ? (mint as typeof Evolu.NonEmptyString1000.Type) : null,
          unit: walletUnit
            ? (walletUnit as typeof Evolu.NonEmptyString100.Type)
            : null,
          amount:
            newTotal > 0
              ? (Math.floor(newTotal) as typeof Evolu.PositiveInt.Type)
              : null,
          state:
            CASHU_TOKEN_STATE_ACCEPTED as typeof Evolu.NonEmptyString100.Type,
          error: null,
        });

        if (!result.ok) {
          throw new Error(String(result.error));
        }

        for (const mergeId of mergeIds) {
          if (String(mergeId) === String(primaryRow.id ?? "")) continue;
          updateCashuToken({
            id: mergeId,
            isDeleted: Evolu.sqliteTrue,
          });
        }

        setStatus(t("cashuCheckOk"));
        pushToast(t("cashuCheckOk"));
        return "ok";
      } catch (e) {
        const message = String(e).trim() || "Token invalid";
        const definitive = isDefinitiveInvalidError(e);
        const transient = looksLikeTransientError(message);

        if (definitive && !transient) {
          updateCashuToken({
            id: primaryRow.id as CashuTokenId,
            state: "error" as typeof Evolu.NonEmptyString100.Type,
            error: message.slice(
              0,
              1000,
            ) as typeof Evolu.NonEmptyString1000.Type,
          });
          setStatus(`${t("cashuCheckFailed")}: ${message}`);
          pushToast(t("cashuInvalid"));
          return "invalid";
        }

        setStatus(`${t("cashuCheckFailed")}: ${message}`);
        pushToast(`${t("cashuCheckFailed")}: ${message}`);
        return "transient";
      } finally {
        if (manageBusy) {
          setCashuIsBusy(false);
        }
      }
    },
    [cashuIsBusy, pushToast, setCashuIsBusy, setStatus, t, updateCashuToken],
  );

  const checkAndRefreshCashuToken = React.useCallback(
    async (
      id: CashuTokenId,
    ): Promise<"ok" | "invalid" | "transient" | "skipped"> => {
      const row = cashuTokensAll.find(
        (tkn) => String(tkn?.id ?? "") === String(id) && !tkn?.isDeleted,
      );

      if (!row) {
        pushToast(t("errorPrefix"));
        return "skipped";
      }

      return await refreshCashuTokenGroup({
        primaryRow: row,
        rows: cashuTokensAll,
        manageBusy: true,
      });
    },
    [cashuTokensAll, pushToast, refreshCashuTokenGroup, t],
  );

  const checkAllCashuTokensAndDeleteInvalid = React.useCallback(async () => {
    if (cashuBulkCheckIsBusy) return;
    if (cashuIsBusy) return;
    setCashuBulkCheckIsBusy(true);
    setCashuIsBusy(true);
    try {
      const groups = new Map<string, CashuTokenRow[]>();
      for (const row of cashuTokensAll) {
        if (row?.isDeleted) continue;
        if (isCashuTokenEmittedState(row?.state)) continue;
        const id = row?.id as CashuTokenId | undefined;
        if (!id) continue;

        const tokenText = String(row.token ?? row.rawToken ?? "").trim();
        const parsed = tokenText ? parseCashuToken(tokenText) : null;
        const mintRaw = String(row.mint ?? parsed?.mint ?? "").trim();
        const mintKey = mintRaw ? normalizeMintUrl(mintRaw) : "";
        const unitKey = String(row.unit ?? "").trim() || "sat";
        const groupKey = mintKey ? `${mintKey}|${unitKey}` : `id:${String(id)}`;
        const entry = groups.get(groupKey) ?? [];
        entry.push(row);
        groups.set(groupKey, entry);
      }

      for (const rows of groups.values()) {
        const orderedRows = [...rows].sort((leftRow, rightRow) => {
          const leftAccepted = isCashuTokenAcceptedState(leftRow?.state);
          const rightAccepted = isCashuTokenAcceptedState(rightRow?.state);
          if (leftAccepted !== rightAccepted) return leftAccepted ? -1 : 1;
          return 0;
        });
        const primaryRow = orderedRows[0];
        if (!primaryRow?.id) continue;

        await refreshCashuTokenGroup({
          primaryRow,
          rows,
          manageBusy: false,
        });
      }
    } finally {
      setCashuIsBusy(false);
      setCashuBulkCheckIsBusy(false);
    }
  }, [
    cashuBulkCheckIsBusy,
    cashuIsBusy,
    cashuTokensAll,
    refreshCashuTokenGroup,
    setCashuIsBusy,
    setCashuBulkCheckIsBusy,
  ]);

  const requestDeleteCashuToken = React.useCallback(
    (id: CashuTokenId) => {
      if (pendingCashuDeleteId === id) {
        handleDeleteCashuToken(id);
        return;
      }
      setPendingCashuDeleteId(id);
      setStatus(t("deleteArmedHint"));
    },
    [
      handleDeleteCashuToken,
      pendingCashuDeleteId,
      setPendingCashuDeleteId,
      setStatus,
      t,
    ],
  );

  return {
    checkAllCashuTokensAndDeleteInvalid,
    checkAndRefreshCashuToken,
    requestDeleteCashuToken,
  };
};
