/**
 * Theme & Timezone Localization Utility for Onseclick CRM
 * Handles instant dynamic switching between 'light', 'dark', and 'system' themes,
 * system media query listening, persistent storage, and timezone calculations.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 'GMT+0' },
  { value: 'America/New_York', label: 'Eastern Time - New York, Toronto (EST / EDT)', offset: 'GMT-5 / -4' },
  { value: 'America/Chicago', label: 'Central Time - Chicago, Dallas (CST / CDT)', offset: 'GMT-6 / -5' },
  { value: 'America/Denver', label: 'Mountain Time - Denver, Salt Lake City (MST / MDT)', offset: 'GMT-7 / -6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time - Los Angeles, San Francisco (PST / PDT)', offset: 'GMT-8 / -7' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST / AKDT)', offset: 'GMT-9 / -8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'GMT-10' },
  { value: 'America/Sao_Paulo', label: 'Brasília / São Paulo Time (BRT)', offset: 'GMT-3' },
  { value: 'Europe/London', label: 'London, Dublin (GMT / BST)', offset: 'GMT+0 / +1' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Amsterdam, Rome (CET / CEST)', offset: 'GMT+1 / +2' },
  { value: 'Europe/Helsinki', label: 'Helsinki, Athens, Cairo (EET / EEST)', offset: 'GMT+2 / +3' },
  { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi (GST)', offset: 'GMT+4' },
  { value: 'Asia/Kolkata', label: 'India Standard Time - Mumbai, Delhi, Bengaluru (IST)', offset: 'GMT+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong, Beijing (SGT / HKT)', offset: 'GMT+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka, Seoul (JST / KST)', offset: 'GMT+9' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne (AEST / AEDT)', offset: 'GMT+10 / +11' },
  { value: 'Pacific/Auckland', label: 'Auckland, Wellington (NZST / NZDT)', offset: 'GMT+12 / +13' },
];

const THEME_STORAGE_KEY = 'crm_theme';
const TIMEZONE_STORAGE_KEY = 'crm_timezone';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const val = localStorage.getItem(THEME_STORAGE_KEY);
  if (val === 'light' || val === 'dark' || val === 'system') return val;
  return 'system';
}

export function getStoredTimezone(): string {
  if (typeof window === 'undefined') return 'UTC';
  return localStorage.getItem(TIMEZONE_STORAGE_KEY) || 'UTC';
}

export function setStoredTimezone(tz: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
  window.dispatchEvent(new CustomEvent('crm:timezone-changed', { detail: { timezone: tz } }));
}

let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Apply a theme ('light', 'dark', or 'system') immediately to document root and body.
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(THEME_STORAGE_KEY, mode);

  const root = document.documentElement;
  const body = document.body;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Clean up any existing media query listener
  if (systemThemeListener) {
    try {
      mediaQuery.removeEventListener('change', systemThemeListener);
    } catch {
      // Fallback for older browsers
      try {
        (mediaQuery as any).removeListener(systemThemeListener);
      } catch {}
    }
    systemThemeListener = null;
  }

  const setDomTheme = (isDark: boolean) => {
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
    window.dispatchEvent(
      new CustomEvent('crm:theme-changed', { detail: { mode, isDark } })
    );
  };

  if (mode === 'dark') {
    setDomTheme(true);
  } else if (mode === 'light') {
    setDomTheme(false);
  } else {
    // System default: match current OS setting and dynamically update on change
    setDomTheme(mediaQuery.matches);
    systemThemeListener = (e: MediaQueryListEvent) => {
      setDomTheme(e.matches);
    };
    try {
      mediaQuery.addEventListener('change', systemThemeListener);
    } catch {
      try {
        (mediaQuery as any).addListener(systemThemeListener);
      } catch {}
    }
  }
}

/**
 * Initialize theme from localStorage on page startup.
 */
export function initTheme(): void {
  const current = getStoredTheme();
  applyTheme(current);
}

/**
 * Format a date string or object respecting a specific timezone.
 */
export function formatDateWithTimezone(
  dateInput?: string | Date | null,
  timeZone = 'UTC',
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateInput) return 'N/A';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(d);
  } catch {
    try {
      return new Date(dateInput).toLocaleDateString();
    } catch {
      return String(dateInput);
    }
  }
}

/**
 * Get the current local time string for a given timezone (e.g. "10:45 AM (IST)").
 */
export function getCurrentTimeInTimezone(timeZone = 'UTC'): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString();
  }
}

