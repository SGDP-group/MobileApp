export interface CalendarTaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  leadLabel?: string;
  leadStatus?: string;
  metaText?: string;
  completed: boolean;
  subtasks: Array<{
    id: string;
    title: string;
    notes?: string;
    due?: string;
    completed: boolean;
  }>;
}
