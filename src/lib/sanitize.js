/** Strip control chars and HTML tags from user-provided text. */
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG = /<[^>]*>/g;

export function sanitizeText(value, maxLen) {
  const s = String(value ?? "")
    .replace(CTRL, "")
    .replace(HTML_TAG, "")
    .trim();
  return maxLen ? s.slice(0, maxLen) : s;
}
