import { typedPick, typedSet } from '../state-helpers';
import type { PricingEngineState } from '../../../rules-engine-types';

describe('Typed helpers', () => {
  it('should provide type safety for dot notation paths', () => {
    const mockState: PricingEngineState = {
      context: {
        customer: { id: '123', groups: ['vip'] },
        timestamp: new Date(),
      },
      request: {
        duration: 7,
        countryISO: 'US',
        paymentMethod: 'card',
        dataType: 'unlimited',
        promo: undefined,
      },
      processing: {
        steps: [],
        selectedBundle: null as any,
        previousBundle: undefined,
        region: 'NA',
        group: 'global',
      },
      response: {
        unusedDays: 0,
        selectedBundle: null as any,
        pricing: null as any,
        appliedRules: [],
      },
      metadata: {
        correlationId: 'test-123',
        timestamp: new Date(),
        version: '1.0.0',
      },
    };

    // These should work without type errors
    const countryISO = typedPick('request.countryISO', mockState);
    const customerId = typedPick('context.customer.id', mockState);
    const region = typedPick('processing.region', mockState);

    // These would cause TypeScript compilation errors:
    // const invalid1 = typedPick('request.dataType', mockState); // ❌ dataType doesn't exist on request
    // const invalid2 = typedPick('request.nonExistent', mockState); // ❌ property doesn't exist
    // const invalid3 = typedPick('context.costumer.id', mockState); // ❌ typo in 'customer'

    expect(countryISO).toBe('US');
    expect(customerId).toBe('123');
    expect(region).toBe('NA');
  });

  it('should provide type safety for setting values', () => {
    const mockState: PricingEngineState = {
      context: {
        customer: { id: '123', groups: ['vip'] },
        timestamp: new Date(),
      },
      request: {
        duration: 7,
        countryISO: 'US',
        paymentMethod: 'card',
        dataType: 'unlimited',
        promo: undefined,
      },
      processing: {
        steps: [],
        selectedBundle: null as any,
        previousBundle: undefined,
        region: 'NA',
        group: 'global',
      },
      response: {
        unusedDays: 0,
        selectedBundle: null as any,
        pricing: null as any,
        appliedRules: [],
      },
      metadata: {
        correlationId: 'test-123',
        timestamp: new Date(),
        version: '1.0.0',
      },
    };

    // These should work without type errors
    typedSet('request.countryISO', 'UK', mockState);
    typedSet('processing.region', 'EU', mockState);
    typedSet('response.unusedDays', 5, mockState);

    // These would cause TypeScript compilation errors:
    // typedSet('request.dataType', 'fixed', mockState); // ❌ dataType doesn't exist on request
    // typedSet('request.countryISO', 123, mockState); // ❌ wrong type (number instead of string)
    // typedSet('response.unusedDays', '5', mockState); // ❌ wrong type (string instead of number)

    expect(mockState.request.countryISO).toBe('UK');
    expect(mockState.processing.region).toBe('EU');
    expect(mockState.response.unusedDays).toBe(5);
  });
});