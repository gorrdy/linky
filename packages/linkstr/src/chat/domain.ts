import { Schema } from "effect";
import { WrapDelivery } from "../domain/delivery";
import {
  ClientId,
  Pubkey,
  RelayUrl,
  RumorId,
  UnixSeconds,
} from "../domain/primitives";
import { parseCashuToken, PaymentRequestPayloadFields } from "./cashuToken";

const LOWERCASE_HEX_64 = /^[0-9a-f]{64}$/;
const LOWERCASE_HEX_24 = /^[0-9a-f]{24}$/;

export const MessageText = Schema.NonEmptyTrimmedString.pipe(
  Schema.brand("MessageText"),
);
export type MessageText = typeof MessageText.Type;

export const CashuTokenText = Schema.NonEmptyTrimmedString.pipe(
  Schema.filter((value) => parseCashuToken(value) !== null, {
    description: "a parseable cashu token",
  }),
  Schema.brand("CashuTokenText"),
);
export type CashuTokenText = typeof CashuTokenText.Type;

const PrivateImageFields = {
  url: Schema.NonEmptyTrimmedString,
  fileType: Schema.NonEmptyTrimmedString,
  encryptionAlgorithm: Schema.Literal("aes-gcm"),
  key: Schema.String.pipe(Schema.pattern(LOWERCASE_HEX_64)),
  nonce: Schema.String.pipe(Schema.pattern(LOWERCASE_HEX_24)),
  encryptedSha256: Schema.String.pipe(Schema.pattern(LOWERCASE_HEX_64)),
  originalSha256: Schema.String.pipe(Schema.pattern(LOWERCASE_HEX_64)),
  encryptedSize: Schema.Int.pipe(Schema.positive()),
  width: Schema.optional(Schema.Int.pipe(Schema.positive())),
  height: Schema.optional(Schema.Int.pipe(Schema.positive())),
  fileName: Schema.optional(Schema.NonEmptyTrimmedString),
  storageEncoding: Schema.Literal("base64", "raw"),
};

// Images carry both dimensions, PDFs neither; a lone dimension is invalid.
export class PrivateImage extends Schema.Class<PrivateImage>("PrivateImage")(
  Schema.Struct(PrivateImageFields).pipe(
    Schema.filter(
      (image) => (image.width === undefined) === (image.height === undefined),
      { message: () => "width and height must be given together" },
    ),
  ),
) {}

export class TextMessageDraft extends Schema.Class<TextMessageDraft>(
  "TextMessageDraft",
)({
  to: Pubkey,
  content: MessageText,
  replyTo: Schema.optional(RumorId),
  root: Schema.optional(RumorId),
  clientId: Schema.optional(ClientId),
  sentAt: Schema.optional(UnixSeconds),
}) {}

/**
 * The NUT-18 payment payload for the token being sent. Its presence switches
 * the wire content from the bare token to this JSON; `proofs` are the
 * token's proofs with full keyset ids (linkshu's `SendReceipt.proofs`).
 */
export class PaymentRequestPayload extends Schema.Class<PaymentRequestPayload>(
  "PaymentRequestPayload",
)(PaymentRequestPayloadFields) {}

export class TokenMessageDraft extends Schema.Class<TokenMessageDraft>(
  "TokenMessageDraft",
)({
  to: Pubkey,
  token: CashuTokenText,
  replyTo: Schema.optional(RumorId),
  root: Schema.optional(RumorId),
  clientId: Schema.optional(ClientId),
  sentAt: Schema.optional(UnixSeconds),
  paymentRequest: Schema.optional(PaymentRequestPayload),
  /** Extra relays for the recipient copy, e.g. the hints in the payee's nprofile. */
  relayHints: Schema.optional(Schema.Array(RelayUrl)),
}) {}

export class ImageMessageDraft extends Schema.Class<ImageMessageDraft>(
  "ImageMessageDraft",
)({
  to: Pubkey,
  image: PrivateImage,
  replyTo: Schema.optional(RumorId),
  root: Schema.optional(RumorId),
  clientId: Schema.optional(ClientId),
  sentAt: Schema.optional(UnixSeconds),
}) {}

export class EditMessageDraft extends Schema.Class<EditMessageDraft>(
  "EditMessageDraft",
)({
  to: Pubkey,
  editOf: RumorId,
  content: MessageText,
  clientId: Schema.optional(ClientId),
  sentAt: Schema.optional(UnixSeconds),
}) {}

export class ChatMessageReceipt extends Schema.TaggedClass<ChatMessageReceipt>()(
  "ChatMessageReceipt",
  {
    rumorId: RumorId,
    clientId: ClientId,
    sentAt: UnixSeconds,
    selfCopy: WrapDelivery,
    recipientCopy: WrapDelivery,
  },
) {}

export class MessageEditReceipt extends Schema.TaggedClass<MessageEditReceipt>()(
  "MessageEditReceipt",
  {
    rumorId: RumorId,
    editOf: RumorId,
    clientId: ClientId,
    sentAt: UnixSeconds,
    selfCopy: WrapDelivery,
    recipientCopy: WrapDelivery,
  },
) {}
