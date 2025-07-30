import type { PricingEngineInput } from '../src/rules-engine-types';

/**
 * Convert old test input structure to new structure
 */
export function convertToNewInputStructure(oldInput: any): PricingEngineInput {
  return {
    context: {
      bundles: oldInput.bundles || [],
      customer: oldInput.customer || oldInput.costumer || { id: 'test', segment: 'default' },
      payment: oldInput.payment || { method: 'ISRAELI_CARD' },
      rules: oldInput.rules || [],
      date: oldInput.date || new Date(),
    },
    request: {
      duration: oldInput.request?.duration || oldInput.duration || 7,
      paymentMethod: oldInput.request?.paymentMethod || oldInput.payment?.method || 'ISRAELI_CARD',
      countryISO: oldInput.request?.countryISO || oldInput.country || '',
      dataType: (oldInput.request?.dataType || oldInput.dataType || 'fixed') as 'unlimited' | 'fixed',
      promo: oldInput.request?.promo,
    },
    metadata: oldInput.metadata || { correlationId: 'test' },
  };
}