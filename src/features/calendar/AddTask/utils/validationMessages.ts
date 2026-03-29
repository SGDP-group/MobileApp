export const VALIDATION_ERRORS = {
  MISSING_TASK_NAME: {
    title: "Missing Task Name",
    message: "Please enter a task name.",
  },
  MISSING_SUBTASKS: {
    title: "Missing Subtasks",
    message: "Please add at least one subtask with a name.",
  },
  MISSING_START_TIME: (index: number) => ({
    title: "Missing Start Date/Time",
    message: `Sub Task ${index}: Please set a start date and time.`,
  }),
  MISSING_END_TIME: (index: number) => ({
    title: "Missing End Date/Time",
    message: `Sub Task ${index}: Please set an end date and time.`,
  }),
  INVALID_SUBTASK_DATES: (index: number) => ({
    title: "Invalid Subtask Dates",
    message: `Sub Task ${index}: Start date/time must be before end date/time.`,
  }),
  USER_NOT_LINKED: {
    title: "User Not Linked",
    message: "Please sign in again before creating a task.",
  },
  AUTH_REQUIRED: {
    title: "Authentication Required",
    message: "Please sign in again to get your email for task creation.",
  },
  SUBTASK_CREATION_FAILED: {
    title: "Task Created with Warnings",
    message: "Main task was created, but one or more subtasks failed to save.",
  },
  TASK_CREATION_FAILED: {
    title: "Error",
    message: "Failed to create task. Please try again.",
  },
   NO_SUBTASKS: {
    title: "No Subtasks",
    message: "Please ensure you have at least one subtask",
  },
  EMPTY_DESCRIPTION: {
    title: "Validation Error",
    message: "Please enter a description",
  },
  EMPTY_TIME: {
    title: "Validation Error",
    message: "Please enter estimated time",
  },
  INVALID_TIME: {
    title: "Validation Error",
    message: "Time must be a number",
  },
  INVALID_TIME_VALUE: {
    title: "Validation Error",
    message: "Time must be greater than 0",
  },
  INVALID_SUBTASK_TIME: (index: number) => ({
    title: "Invalid Input",
    message: `Subtask ${index + 1}: Please enter a valid time in minutes`,
  }),
  INVALID_START_TIME: {
    title: "Invalid Start Time",
    message: "Start time must be before end time",
  },
  UNREASONABLE_TIME: {
    title: "Unreasonable Time Slot",
    message: "Please schedule between 5 AM and 11 PM",
  },
  SAVE_FAILED: {
    title: "Error",
    message: "Failed to save task. Please try again.",
  },
 
  SCHEDULING_FAILED: {
    title: "Scheduling Failed",
    message: "Failed to schedule subtasks. Please try again.",
  },
};



export const SUCCESS_MESSAGES = {
  TASK_CREATED: {
    title: "Task Created",
    message: "Task was added successfully.",
  },
  TASK_CREATED_CALENDAR_FAILED: {
    title: "Task Created with Issues",
    message:
      "Task was created successfully, but some calendar events could not be synced. Your calendar may be out of sync.",
  },
  SAVE_SUCCESS: (description: string, count: number, totalTime: number) => ({
    title: "Success",
    message: `Task "${description}" has been saved with ${count} subtasks\n\nTotal estimated time: ${totalTime} minutes`,
  }),
};