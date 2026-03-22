const MAX_RAW_PAYLOAD_LENGTH = 2048;

export const parseQrPayload = (rawPayload: unknown): string => {
  if (typeof rawPayload !== "string") {
    throw new Error("QR payload must be a string.");
  }

  const trimmedPayload = rawPayload.trim();

  if (trimmedPayload.length === 0) {
    throw new Error("QR payload cannot be empty.");
  }

  if (trimmedPayload.length > MAX_RAW_PAYLOAD_LENGTH) {
    throw new Error("QR payload is too large.");
  }

  return trimmedPayload;
};
