import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errorMessage';

describe('getErrorMessage utility', () => {
  it('returns server unreachable message when error is undefined or has no response', () => {
    expect(getErrorMessage(undefined)).toBe('Unable to reach the server. Please check your connection and try again.');
    expect(getErrorMessage(null)).toBe('Unable to reach the server. Please check your connection and try again.');
  });

  it('handles network error when error.response is missing', () => {
    const error = new Error('Network error');
    expect(getErrorMessage(error)).toBe('Unable to reach the server. Please check your connection and try again.');
  });

  it('handles timeout error specifically', () => {
    const timeoutError = { code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' };
    expect(getErrorMessage(timeoutError)).toBe('Request timed out. Please check your internet connection and try again.');

    const errorWithMessage = { message: 'Connection timeout' };
    expect(getErrorMessage(errorWithMessage)).toBe('Request timed out. Please check your internet connection and try again.');
  });

  it('extracts express-validator formatted errors (errors array with message)', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errors: [{ message: 'Email address is invalid' }, { message: 'Password too short' }],
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Email address is invalid');
  });

  it('extracts express-validator formatted errors (errors array with msg)', () => {
    const error = {
      response: {
        status: 422,
        data: {
          errors: [{ msg: 'Password must contain a special character' }],
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Password must contain a special character');
  });

  it('extracts express-validator formatted errors (errors array with string)', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errors: ['Invalid institution code'],
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Invalid institution code');
  });

  it('extracts standard API response message { success: false, message }', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          message: 'Student record already exists.',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Student record already exists.');
  });

  it('provides appropriate status code fallbacks when data.message is missing', () => {
    expect(getErrorMessage({ response: { status: 401, data: {} } })).toBe('Invalid email or password.');
    expect(getErrorMessage({ response: { status: 403, data: {} } })).toBe('Your account is not authorized for this action.');
    expect(getErrorMessage({ response: { status: 404, data: {} } })).toBe('Authentication service endpoint was not found.');
    expect(getErrorMessage({ response: { status: 409, data: {} } })).toBe(
      'An account with this email address or institutional identifier already exists.'
    );
    expect(getErrorMessage({ response: { status: 500, data: {} } })).toBe(
      'Something went wrong on the server. Please try again later.'
    );
    expect(getErrorMessage({ response: { status: 503, data: {} } })).toBe(
      'The authentication service is temporarily unavailable.'
    );
  });

  it('returns custom fallback for unhandled HTTP status codes', () => {
    const error = { response: { status: 418, data: {} } };
    expect(getErrorMessage(error, 'I am a teapot fallback')).toBe('I am a teapot fallback');
  });
});
