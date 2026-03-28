const MAX_RAW_PAYLOAD_LENGTH = 2048;
const WIFI_SSID_MAX_LENGTH = 32;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

export interface QrWifiPayload {
  type: "wifi";
  ssid: string;
  security: "nopass" | "WEP" | "WPA";
}

export type QrPayload = QrWifiPayload;

const stripWrappingQuotes = (value: string): string => {
  if (value.length >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
    return value.slice(1, -1);
  }

  return value;
};

const buildWifiCandidates = (raw: string): string[] => {
  const candidates: string[] = [];

  const normalized = stripWrappingQuotes(raw.trim().replace(/\uFEFF/g, ""));
  if (normalized.length > 0) {
    candidates.push(normalized);
  }

  try {
    const decoded = stripWrappingQuotes(decodeURIComponent(normalized));
    if (decoded.length > 0 && !candidates.includes(decoded)) {
      candidates.push(decoded);
    }
  } catch {
    // Ignore decode failures and continue with raw candidate.
  }

  return candidates;
};

const parseWifiQrPayload = (payload: string): QrWifiPayload => {
  const wifiStart = payload.toUpperCase().indexOf("WIFI:");
  if (wifiStart < 0) {
    throw new Error("Wi-Fi QR prefix not found.");
  }

  const body = payload.slice(wifiStart + 5);
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
    throw new Error("Wi-Fi SSID missing in QR code.");
  }

  if (ssidRaw.length > WIFI_SSID_MAX_LENGTH) {
    throw new Error("Wi-Fi SSID is too long.");
  }

  if (CONTROL_CHAR_PATTERN.test(ssidRaw)) {
    throw new Error("Wi-Fi SSID contains invalid characters.");
  }

  const normalizedSecurity = securityRaw.toUpperCase() || "NOPASS";
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

  const candidates = buildWifiCandidates(trimmedPayload);

  for (const candidate of candidates) {
    if (candidate.toUpperCase().includes("WIFI:")) {
      return parseWifiQrPayload(candidate);
    }
  }

  throw new Error("WIFI QR prefix not found.");
};
