import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const rawBaseURL = import.meta.env.VITE_OPENAI_BASE_URL || '/api';

function normalizeBaseURL(): string {
  // Absolute URL provided
  if (/^https?:\/\//i.test(rawBaseURL)) return rawBaseURL;

  // Relative path: in browser we can attach origin (works in dev/prod with proxy)
  if (rawBaseURL.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${rawBaseURL}`;
    }
  }

  // Fallback to default Onyx endpoint if nothing usable
  return 'https://ai.onyx.dev/v1';
}

if (!apiKey) {
  // Fail fast to guide env setup.
  throw new Error('Missing VITE_OPENAI_API_KEY. Set it in your .env.local file.');
}

export const onyx = new OpenAI({
  apiKey,
  baseURL: normalizeBaseURL(),
  dangerouslyAllowBrowser: true,
});
