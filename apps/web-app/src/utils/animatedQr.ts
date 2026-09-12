import type { Buffer } from "buffer";
import { optimizeCaseInsensitiveQrPayload } from "./qrPayload";

// NUT-16: a payload too large for one QR travels as a multi-part UR animation
// (Blockchain Commons Uniform Resources). Parts are fountain-coded, so the
// receiver can join mid-cycle and still finish without seeing every frame in
// order — which is what makes a phone camera a workable transport.

/**
 * `cbor-sync`, under the UR encoder, decides between a compact CBOR byte
 * string and a verbose map by testing the value against the **global**
 * Buffer. An instance imported from the `buffer` package is a different
 * constructor there, which both doubles the frame count and decodes back as a
 * plain object, so the payload has to be built with the global one. `main.tsx`
 * installs it in the browser.
 */
const isBuffer = (value: unknown): value is Buffer =>
  ArrayBuffer.isView(value) && "readUInt8" in value;

const toGlobalBuffer = (payload: string): Buffer => {
  const candidate: unknown = Reflect.get(globalThis, "Buffer");
  if (
    typeof candidate === "function" &&
    "from" in candidate &&
    typeof candidate.from === "function"
  ) {
    const buffer: unknown = candidate.from(payload, "utf8");
    if (isBuffer(buffer)) return buffer;
  }
  throw new Error("animated-qr-buffer-unavailable");
};

/**
 * Bytes of payload per frame. At 150 a two-kilobyte token becomes sixteen
 * frames of roughly 340 bytewords each: dense enough to finish a cycle in
 * about three seconds, loose enough for a camera to read off a phone screen.
 */
const UR_FRAGMENT_BYTES = 150;

/**
 * How long one frame stays on screen. The scan loop decodes at most every
 * 200 ms, so a frame has to outlast two of its samples — matching its rate
 * would leave the camera sampling in step with the changes and reading the
 * transitions.
 */
export const ANIMATED_QR_FRAME_MS = 420;

const UR_BYTES_FRAME = /^ur:bytes\/[0-9]+-[0-9]+\//i;

/** Whether a scanned value is one frame of an animation rather than a payload. */
export const isAnimatedQrFrame = (value: string): boolean =>
  UR_BYTES_FRAME.test(value.trim());

export interface AnimatedQrFrames {
  /**
   * The next frame to show. Past the first pass these are fountain parts
   * rather than a repeat of the sequence, so a receiver that missed a frame
   * does not have to wait for that exact one to come round again.
   */
  next: () => string;
  /** Frames in one pass — what a receiver needs at minimum. */
  total: number;
}

export const createAnimatedQrFrames = async (
  payload: string,
): Promise<AnimatedQrFrames> => {
  const { UR, UREncoder } = await import("@ngraveio/bc-ur");
  const encoder = new UREncoder(
    UR.fromBuffer(toGlobalBuffer(payload)),
    UR_FRAGMENT_BYTES,
    0,
  );

  return {
    // Uppercase lets the QR encoder use its denser alphanumeric mode; UR is
    // defined as case-insensitive for exactly this reason.
    next: () => optimizeCaseInsensitiveQrPayload(encoder.nextPart()),
    total: encoder.fragmentsLength,
  };
};

/**
 * The decoder hands back the `buffer` package's Buffer, which fails an
 * `instanceof Uint8Array` check because it subclasses a different realm's.
 */
const toBytes = (value: unknown): Uint8Array | null =>
  ArrayBuffer.isView(value)
    ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    : null;

export type AnimatedQrProgress =
  | { status: "collecting"; percent: number }
  | { status: "done"; payload: string }
  | { status: "rejected" };

export interface AnimatedQrReader {
  /** Feeds one scanned frame and reports what the animation still needs. */
  receive: (frame: string) => AnimatedQrProgress;
}

export const createAnimatedQrReader = async (): Promise<AnimatedQrReader> => {
  const { URDecoder } = await import("@ngraveio/bc-ur");
  const decoder = new URDecoder();

  return {
    receive: (frame) => {
      // Frames are shown uppercase for QR density and come back that way.
      const part = frame.trim().toLowerCase();
      try {
        if (!decoder.receivePart(part)) return { status: "rejected" };
      } catch {
        // A frame from a different animation fails its checksum.
        return { status: "rejected" };
      }

      if (!decoder.isComplete()) {
        return {
          status: "collecting",
          percent: Math.round(decoder.estimatedPercentComplete() * 100),
        };
      }
      if (!decoder.isSuccess()) return { status: "rejected" };

      const decoded = toBytes(decoder.resultUR().decodeCBOR());
      if (!decoded) return { status: "rejected" };
      return { status: "done", payload: new TextDecoder().decode(decoded) };
    },
  };
};
