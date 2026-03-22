import { apiClient } from "./apiClient";

export const authenticateToken = (
  token: string,
  email: string,
): Promise<boolean> =>
  apiClient.post<boolean>("/authToken/authenticate", { token, email });
