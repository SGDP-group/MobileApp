export type CalendarTaskItem = {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  leadLabel: string;
  leadStatus: "upcoming" | "late" | "none";
  metaText: string;
  completed: boolean;
  subtasks: {
    id: string;
    title: string;
    notes?: string;
    due?: string;
    completed: boolean;
  }[];
};



