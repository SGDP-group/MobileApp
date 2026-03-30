import { SubtaskDraft } from "../types/types";



export const getDeviceTimeZone = (): string => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone && timezone.trim().length > 0 ? timezone : "UTC";
};


export const toTwoDigits = (value: number): string => `${value}`.padStart(2, "0");

export const toLocalApiDateTime = (value: Date): string => {
  const year = value.getFullYear();
  const month = toTwoDigits(value.getMonth() + 1);
  const day = toTwoDigits(value.getDate());
  const hours = toTwoDigits(value.getHours());
  const minutes = toTwoDigits(value.getMinutes());
  const seconds = toTwoDigits(value.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export const toOffsetDateTime = (value: Date): string => {
  const localDateTime = toLocalApiDateTime(value);
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const hours = toTwoDigits(Math.floor(absOffsetMinutes / 60));
  const minutes = toTwoDigits(absOffsetMinutes % 60);

  return `${localDateTime}${sign}${hours}:${minutes}`;
};

export const formatDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatTime = (value: Date): string => {
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const formatDateTime = (value: Date): string =>
  `${formatDate(value)} ${formatTime(value)}`;

export const getEmptySubtask = (): SubtaskDraft => ({
  name: "",
  description: "",
  startTime: null,
  endTime: null,
});

export const getTodayMinDate = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};


