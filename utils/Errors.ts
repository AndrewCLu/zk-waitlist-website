// Tries to get an error message out of a possible Error object
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "Unknown error";
};
