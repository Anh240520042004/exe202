/**
 * Escape special characters in a string for use in a regular expression.
 * Helps prevent Regular Expression Denial of Service (ReDoS) attacks.
 * 
 * @param {string} string - The string to escape.
 * @returns {string} The escaped string.
 */
export const escapeRegex = (string) => {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
