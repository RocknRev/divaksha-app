interface AffiliateInfo {
  affiliateUserId: number;
  affiliateCode: string;
  timestamp: number;
}

const AFFILIATE_COOKIE_NAME = 'divaksha_affiliate';
const AFFILIATE_STORAGE_KEY = 'divaksha_affiliate';
const COOKIE_TTL_DAYS = 30;

// Cookie utility functions
const setCookie = (name: string, value: string, days: number): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const affiliateUtils = {
  setAffiliate: (affiliateUserId: number, affiliateCode: string): void => {
    const affiliateInfo: AffiliateInfo = {
      affiliateUserId,
      affiliateCode,
      timestamp: Date.now(),
    };

    // Store in cookie (30 days)
    setCookie(AFFILIATE_COOKIE_NAME, JSON.stringify(affiliateInfo), COOKIE_TTL_DAYS);

    // Store in localStorage as backup
    localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(affiliateInfo));
  },

  getAffiliate: (): AffiliateInfo | null => {
    // Try cookie first
    const cookieData = getCookie(AFFILIATE_COOKIE_NAME);
    if (cookieData) {
      try {
        const info: AffiliateInfo = JSON.parse(cookieData);
        // Check if cookie is still valid (30 days)
        const ageInDays = (Date.now() - info.timestamp) / (1000 * 60 * 60 * 24);
        if (ageInDays <= COOKIE_TTL_DAYS) {
          return info;
        }
      } catch {
        // Invalid cookie, try localStorage
      }
    }

    // Fallback to localStorage
    try {
      const storageData = localStorage.getItem(AFFILIATE_STORAGE_KEY);
      if (storageData) {
        const info: AffiliateInfo = JSON.parse(storageData);
        // Check if still valid (30 days)
        const ageInDays = (Date.now() - info.timestamp) / (1000 * 60 * 60 * 24);
        if (ageInDays <= COOKIE_TTL_DAYS) {
          return info;
        } else {
          // Expired, clean up
          localStorage.removeItem(AFFILIATE_STORAGE_KEY);
        }
      }
    } catch {
      // Invalid data
    }

    return null;
  },

  clearAffiliate: (): void => {
    deleteCookie(AFFILIATE_COOKIE_NAME);
    localStorage.removeItem(AFFILIATE_STORAGE_KEY);
  },

  hasAffiliate: (): boolean => {
    return affiliateUtils.getAffiliate() !== null;
  },
};

