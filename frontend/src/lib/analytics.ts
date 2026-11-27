/**
 * Public-surface GA4 helper (saas-analytics-standard.mdc).
 * Only tracks public marketing routes; never fires on authenticated workspace or /portal/:token links.
 */

const PUBLIC_PATHS = new Set(['/', '/services', '/request-audit']);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function getMeasurementId(): string {
  return (
    (import.meta as unknown as { env?: { VITE_GA4_MEASUREMENT_ID?: string } }).env
      ?.VITE_GA4_MEASUREMENT_ID || ''
  ).trim();
}

export function isPublicAnalyticsPath(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return PUBLIC_PATHS.has(clean);
}

export function initPublicAnalytics(): void {
  const measurementId = getMeasurementId();
  if (!measurementId || initialized || typeof document === 'undefined') return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function trackPublicPageView(pathname: string): void {
  const measurementId = getMeasurementId();
  if (!measurementId || !isPublicAnalyticsPath(pathname)) return;
  initPublicAnalytics();
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
}
