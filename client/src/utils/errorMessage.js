// Turns an axios error into a short, safe, user-facing message.
// Never surfaces raw stack traces, validation objects, or backend
// internals — only a message meant to be read by the end user.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  // No response at all means the request never reached the server
  // (offline, DNS failure, server down, CORS, timeout, etc.)
  if (!error?.response) {
    return 'Network error. Please check your internet connection and try again.';
  }

  const data = error.response.data;

  // express-validator style: { errors: [{ message }] }
  if (data?.errors && data.errors.length > 0 && data.errors[0]?.message) {
    return data.errors[0].message;
  }

  // Standard API shape used across this app: { success: false, message }
  if (data?.message) {
    return data.message;
  }

  return fallback;
}