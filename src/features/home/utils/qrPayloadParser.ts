const MAX_RAW_PAYLOAD_LENGTH = 2048;
const MAX_FIELD_LENGTH = 128;
const WIFI_SSID_MAX_LENGTH = 32;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

const EXPECTED_KEYS = ["ID", "Code"] as const;

type QrPayloadKey = (typeof EXPECTED_KEYS)[number];

export interface QrLegacyPayload {
  type: "legacy";
  ID: string;
  Code: string;
}

export interface QrWifiPayload {
  type: "wifi";
  ssid: string;
  security: "nopass" | "WEP" | "WPA";
}

export type QrPayload = QrLegacyPayload | QrWifiPayload;

const hasExactExpectedKeys = (value: Record<string, unknown>): boolean => {
  const keys = Object.keys(value);

  if (keys.length !== EXPECTED_KEYS.length) {
    return false;
  }

  return EXPECTED_KEYS.every((key) =>
    Object.prototype.hasOwnProperty.call(value, key),
  );
};

const sanitizeField = (key: QrPayloadKey, value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error(`${key} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error(`${key} cannot be empty.`);
  }

  if (normalizedValue.length > MAX_FIELD_LENGTH) {
    throw new Error(`${key} is too long.`);
  }

  if (CONTROL_CHAR_PATTERN.test(normalizedValue)) {
    throw new Error(`${key} contains invalid characters.`);
  }

  return normalizedValue;
};

const parseWifiQrPayload = (payload: string): QrWifiPayload => {
  const body = payload.slice(5);
  const parts = body.split(";");

  let securityRaw = "";
  let ssidRaw = "";

  for (const part of parts) {
    if (part.length < 3 || part[1] !== ":") {
      continue;
    }

    const key = part[0].toUpperCase();
    const value = part.slice(2).trim();

    if (key === "T") {
      securityRaw = value;
    } else if (key === "S") {
      ssidRaw = value;
    }
  }

  if (ssidRaw.length === 0) {
    throw new Error("Wi-Fi SSID cannot be empty.");
  }

  if (ssidRaw.length > WIFI_SSID_MAX_LENGTH) {
    throw new Error("Wi-Fi SSID is too long.");
  }

  if (CONTROL_CHAR_PATTERN.test(ssidRaw)) {
    throw new Error("Wi-Fi SSID contains invalid characters.");
  }

  const normalizedSecurity = securityRaw.toUpperCase();
  let security: "nopass" | "WEP" | "WPA";

  if (normalizedSecurity === "NOPASS") {
    security = "nopass";
  } else if (normalizedSecurity === "WEP") {
    security = "WEP";
  } else if (normalizedSecurity === "WPA" || normalizedSecurity === "WPA2" || normalizedSecurity === "WPA3") {
    security = "WPA";
  } else {
    throw new Error("Unsupported Wi-Fi security type.");
  }

  return {
    type: "wifi",
    ssid: ssidRaw,
    security,
  };
};

export const parseQrPayload = (rawPayload: unknown): QrPayload => {
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

  if (trimmedPayload.toUpperCase().startsWith("WIFI:")) {
    return parseWifiQrPayload(trimmedPayload);
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(trimmedPayload);
  } catch {
    throw new Error("QR payload must be valid JSON.");
  }

  if (
    parsedPayload === null ||
    typeof parsedPayload !== "object" ||
    Array.isArray(parsedPayload)
  ) {
    throw new Error("QR payload must be a JSON object.");
  }

  const objectPayload = parsedPayload as Record<string, unknown>;

  if (!hasExactExpectedKeys(objectPayload)) {
    throw new Error("QR payload must contain only ID and Code keys.");
  }

  return {
    type: "legacy",
    ID: sanitizeField("ID", objectPayload.ID),
    Code: sanitizeField("Code", objectPayload.Code),
  };
};
