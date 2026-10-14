import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

// Ensure compatibility across Vitest and Jest globals
if (typeof globalThis.jest === 'undefined' && typeof vi !== 'undefined') {
  globalThis.jest = vi;
}
if (typeof globalThis.vi === 'undefined' && typeof jest !== 'undefined') {
  globalThis.vi = jest;
}