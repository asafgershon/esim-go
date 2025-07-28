import type { PricingEngineInput } from '../src/rules-engine-types';

/**
 * Convert old test input structure to new structure
 */
export function convertToNewInputStructure(oldInput: any): PricingEngineInput {
  return {
    context: {
      bundles: oldInput.bundles || [],
      costumer: oldInput.costumer || { id: 'test', segment: 'default' },
      payment: oldInput.payment || { method: 'ISRAELI_CARD' },
      rules: oldInput.rules || [],
      date: oldInput.date || new Date(),
    },
    request: {
      duration: oldInput.request?.duration || oldInput.duration || 7,
      paymentMethod: oldInput.request?.paymentMethod || oldInput.payment?.method || 'ISRAELI_CARD',
      promo: oldInput.request?.promo,
      countryISO: oldInput.request?.countryISO || oldInput.country,
      region: oldInput.request?.region || oldInput.region,
      group: oldInput.request?.group || oldInput.group,
      dataType: oldInput.request?.dataType as 'unlimited' | 'fixed' | undefined,
    },
    metadata: oldInput.metadata || { correlationId: 'test' },
  };
}