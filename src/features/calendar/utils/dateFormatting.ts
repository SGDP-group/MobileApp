/**
 * Date and time formatting utilities for calendar display
 */

export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return "No date";
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "No date";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export const calculateDuration = (
  start: string | undefined,
  end: string | undefined,
): string => {
  if (!start || !end) return "";
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  } catch {
    return "";
  }
};



