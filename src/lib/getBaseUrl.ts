export function getBaseUrl(): string {
  let url = 'http://localhost:3000';

  // 1. If we have a hardcoded public app URL, use it (usually for custom domains or explicit overrides)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    url = process.env.NEXT_PUBLIC_APP_URL;
  }
  // 2. If we are on Vercel, use the system-provided URL
  else if (process.env.VERCEL_URL) {
    url = `https://${process.env.VERCEL_URL}`;
  }
  // 3. If we are in the browser, use the current origin
  else if (typeof window !== 'undefined') {
    url = window.location.origin;
  }

  // Remove trailing slash if present
  return url.replace(/\/$/, '');
}
