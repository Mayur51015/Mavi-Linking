export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  // No response at all means the request never reached the server
  // (offline, DNS failure, server down, CORS, timeout, etc.)
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return 'Request timed out. Please check your internet connection and try again.';
    }
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  const { status, data } = error.response;

  // express-validator style: { errors: [{ message }] }
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0 && data.errors[0]?.message) {
    return data.errors[0].message;
  }

  // Standard API shape used across this app: { success: false, message }
  if (data?.message) {
    return data.message;
  }

  // Status code default fallbacks
  switch (status) {
    case 401:
      return 'Invalid email or password.';
    case 403:
      return 'Your account is not authorized for this action.';
    case 404:
      return 'Authentication service endpoint was not found.';
    case 500:
      return 'Something went wrong on the server. Please try again later.';
    case 503:
      return 'The authentication service is temporarily unavailable.';
    default:
      return fallback;
  }
}