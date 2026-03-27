export interface ProvisioningPayload {
  userId: number;
  wifiSsid: string;
  wifiPassword: string;
}

export interface ProvisioningResponse {
  status: "accepted" | "success" | "error";
  message?: string;
}

const DEFAULT_PI_BASE_URL = "http://192.168.4.1:8080";
const PROVISION_PATH = "/api/provision";
const REQUEST_TIMEOUT_MS = 7000;
const RETRY_COUNT = 2;

const trimValue = (value: string): string => value.trim();

export const validateProvisioningPayload = (
  payload: ProvisioningPayload,
): string | null => {
  if (!Number.isInteger(payload.userId) || payload.userId <= 0) {
    return "Invalid user ID. Please sign in again.";
  }

  const ssid = trimValue(payload.wifiSsid);
  if (ssid.length === 0) {
    return "Wi-Fi name is required.";
  }

  if (ssid.length > 32) {
    return "Wi-Fi name is too long.";
  }

  if (payload.wifiPassword.length < 8 || payload.wifiPassword.length > 63) {
    return "Wi-Fi password must be 8 to 63 characters.";
  }

  return null;
};

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(url, options, REQUEST_TIMEOUT_MS);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Network request failed.");
}

export async function pingProvisioningServer(
  baseUrl: string = DEFAULT_PI_BASE_URL,
): Promise<boolean> {
  const response = await fetchWithRetry(`${baseUrl}/health`, {
    method: "GET",
  }, RETRY_COUNT);

  return response.ok;
}

export async function submitProvisioning(
  payload: ProvisioningPayload,
  baseUrl: string = DEFAULT_PI_BASE_URL,
): Promise<ProvisioningResponse> {
  const validationError = validateProvisioningPayload(payload);
  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetchWithRetry(`${baseUrl}${PROVISION_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }, RETRY_COUNT);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Provisioning failed.");
    throw new Error(errorText || "Provisioning failed.");
  }

  return response.json() as Promise<ProvisioningResponse>;
}
