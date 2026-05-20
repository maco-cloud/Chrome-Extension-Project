import { BILLING } from '../constants';

const MONTHLY_URL = import.meta.env.VITE_STRIPE_CHECKOUT_MONTHLY_URL || '';
const YEARLY_URL = import.meta.env.VITE_STRIPE_CHECKOUT_YEARLY_URL || '';

export type BillingInterval = 'monthly' | 'yearly';

export function getCheckoutUrl(interval: BillingInterval): string | null {
  if (interval === 'monthly' && MONTHLY_URL) return MONTHLY_URL;
  if (interval === 'yearly' && YEARLY_URL) return YEARLY_URL;
  return null;
}

export function openCheckout(interval: BillingInterval): void {
  const url = getCheckoutUrl(interval);
  if (url) {
    chrome.tabs.create({ url });
    return;
  }
  chrome.tabs.create({
    url: chrome.runtime.getURL(
      `src/options/index.html?upgrade=${interval}#billing`,
    ),
  });
}

export function getPricingCopy() {
  return {
    monthly: BILLING.monthlyPrice,
    yearly: BILLING.yearlyPrice,
    trial: `${BILLING.trialDays}-day free trial`,
  };
}
