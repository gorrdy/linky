import React from "react";
import {
  ANIMATED_QR_FRAME_MS,
  createAnimatedQrFrames,
} from "../../../utils/animatedQr";

export interface TokenQr {
  /** Data URL of the frame to show, or null while there is nothing to show. */
  src: string | null;
  /** Frames in one pass, or null when the token fits a single static QR. */
  frameCount: number | null;
}

const renderQr = async (payload: string, level: "M" | "L"): Promise<string> => {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: level,
    margin: 2,
  });
};

/**
 * A token's QR, animated when it has to be. A single code is better whenever
 * it fits — it can be photographed, shared as an image, and read by anything —
 * so the animation (NUT-16) is the fallback for tokens that exceed what one QR
 * can carry, which is where the page used to show nothing at all.
 */
export const useTokenQr = (tokenText: string): TokenQr => {
  const [src, setSrc] = React.useState<string | null>(null);
  const [frameCount, setFrameCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    const payload = tokenText.trim();
    if (!payload) {
      setSrc(null);
      setFrameCount(null);
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };

    const animate = async () => {
      const frames = await createAnimatedQrFrames(payload);
      if (cancelled) return;
      setFrameCount(frames.total);

      // Each tick renders the part the encoder hands out next. Past the first
      // pass those are fountain parts, so a receiver that missed one does not
      // have to wait for that exact frame to come round again.
      const showNextFrame = async () => {
        const frame = frames.next();
        const rendered = await renderQr(frame, "M");
        if (!cancelled) setSrc(rendered);
      };

      await showNextFrame();
      if (cancelled) return;
      timer = window.setInterval(() => {
        void showNextFrame();
      }, ANIMATED_QR_FRAME_MS);
    };

    const renderStatic = async (): Promise<string | null> => {
      for (const level of ["M", "L"] as const) {
        try {
          return await renderQr(payload, level);
        } catch {
          // A large multi-proof token can exceed QR capacity at M while still
          // fitting at L; when neither fits, it has to be animated.
        }
      }
      return null;
    };

    const generate = async () => {
      const stat = await renderStatic();
      if (cancelled) return;
      if (stat !== null) {
        setFrameCount(null);
        setSrc(stat);
        return;
      }
      await animate();
    };

    void generate().catch(() => {
      if (!cancelled) {
        setSrc(null);
        setFrameCount(null);
      }
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [tokenText]);

  return { src, frameCount };
};
