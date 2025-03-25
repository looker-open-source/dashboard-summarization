/**
 * Decode base64 encoded string with support for Unicode characters
 *
 * Base64 encoding is necessary because:
 * 1. The Looker proxy has issues handling Unicode characters (like Japanese)
 *    in JSON responses, resulting in 500 errors
 * 2. By encoding responses as base64 on the backend and decoding them on
 *    the frontend, we can safely transmit any Unicode characters
 * 3. The TextDecoder ensures proper UTF-8 handling for multi-byte characters
 *
 * @param base64String - Base64 encoded string to decode
 * @returns Decoded UTF-8 string
 */
export const decodeBase64String = (base64String: string): string => {
  try {
    // Convert base64 to binary data using the approach from MDN
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings
    const binString = atob(base64String);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    // Decode as UTF-8
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded;
  } catch (error: any) {
    console.error('Error decoding base64 string:', error);
    throw new Error(`Failed to decode base64 string: ${error.message}`);
  }
};
