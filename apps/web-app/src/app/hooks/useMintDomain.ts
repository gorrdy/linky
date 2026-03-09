import type { OwnerId } from "@evolu/common";
import React from "react";
import type {
  CashuTokenRowLike,
  LocalMintInfoRow,
  MintUrlInput,
} from "../types/appTypes";
import {
  getMintOriginAndHost,
  normalizeMintUrl,
} from "../../utils/mint";
import { useMintInfoStore } from "./mint/useMintInfoStore";

interface UseMintDomainParams {
  appOwnerId: OwnerId | null;
  appOwnerIdRef: React.MutableRefObject<OwnerId | null>;
  cashuTokensAll: readonly CashuTokenRowLike[];
  defaultMintUrl: string | null;
  rememberSeenMint: (mintUrl: MintUrlInput) => void;
}

interface UseMintDomainResult {
  getMintIconUrl: (mint: MintUrlInput) => {
    failed: boolean;
    host: string | null;
    origin: string | null;
    url: string | null;
  };
  getMintRuntime: (
    mintUrl: string,
  ) => { lastCheckedAtSec: number; latencyMs: number | null } | null;
  isMintDeleted: (mintUrl: string) => boolean;
  mintIconUrlByMint: Record<string, string | null>;
  mintInfoByUrl: Map<string, LocalMintInfoRow>;
  mintInfoDeduped: Array<{ canonicalUrl: string; row: LocalMintInfoRow }>;
  refreshMintInfo: (mintUrl: string) => Promise<void>;
  setMintIconUrlByMint: React.Dispatch<
    React.SetStateAction<Record<string, string | null>>
  >;
  setMintInfoAll: React.Dispatch<React.SetStateAction<LocalMintInfoRow[]>>;
  touchMintInfo: (_mintUrl: string, nowSec: number) => void;
}

export const useMintDomain = ({
  appOwnerId,
  appOwnerIdRef,
  cashuTokensAll,
  defaultMintUrl,
  rememberSeenMint,
}: UseMintDomainParams): UseMintDomainResult => {
  const [mintIconUrlByMint, setMintIconUrlByMint] = React.useState<
    Record<string, string | null>
  >(() => ({}));

  const {
    getMintRuntime,
    isMintDeleted,
    mintInfoByUrl,
    mintInfoDeduped,
    refreshMintInfo,
    setMintInfoAll,
    touchMintInfo,
  } = useMintInfoStore({
    appOwnerId,
    appOwnerIdRef,
    cashuTokensAll,
    defaultMintUrl,
    rememberSeenMint,
  });

  const getMintIconUrl = React.useCallback(
    (
      mint: MintUrlInput,
    ): {
      origin: string | null;
      url: string | null;
      host: string | null;
      failed: boolean;
    } => {
      const { origin, host } = getMintOriginAndHost(mint);
      if (!origin) return { origin: null, url: null, host, failed: true };

      if (Object.prototype.hasOwnProperty.call(mintIconUrlByMint, origin)) {
        const stored = mintIconUrlByMint[origin];
        return {
          origin,
          url: stored ?? null,
          host,
          failed: stored === null,
        };
      }

      const normalized = normalizeMintUrl(mint);
      const row = normalized ? mintInfoByUrl.get(normalized) : undefined;

      if (row?.iconUrl) {
        try {
          const absoluteUrl = new URL(row.iconUrl, origin).toString();
          return { origin, url: absoluteUrl, host, failed: false };
        } catch {
          return { origin, url: row.iconUrl, host, failed: false };
        }
      }

      return {
        origin,
        url: null,
        host,
        failed: true,
      };
    },
    [mintInfoByUrl, mintIconUrlByMint],
  );

  return {
    getMintIconUrl,
    getMintRuntime,
    isMintDeleted,
    mintIconUrlByMint,
    mintInfoByUrl,
    mintInfoDeduped,
    refreshMintInfo,
    setMintIconUrlByMint,
    setMintInfoAll,
    touchMintInfo,
  };
};