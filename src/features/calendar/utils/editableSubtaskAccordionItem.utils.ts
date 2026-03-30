 export const toDate = (value?: string): Date | null => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(trimmed);
    const normalizedInput = hasTimezone ? trimmed : `${trimmed}Z`;
    const parsed = new Date(normalizedInput);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (value: Date): string => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (value: Date): string => {
    const hours = `${value.getHours()}`.padStart(2, "0");
    const minutes = `${value.getMinutes()}`.padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  export const formatDateTimeForDisplay = (value?: string): string => {
    const date = toDate(value);
    if (!date) {
      return "Not set";
    }

    return `${formatDate(date)} ${formatTime(date)}`;
  };

  export const normalizeId = (value: unknown): string | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }

    return String(value).trim();
  };

  export const normalizeName = (value: unknown): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
  };
