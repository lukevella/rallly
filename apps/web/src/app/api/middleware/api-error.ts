export const apiError = (code: string, message: string) => ({
  error: { code, message },
});
