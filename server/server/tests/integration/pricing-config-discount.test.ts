import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PricingConfigRepository } from '../../src/repositories/pricing-configs/pricing-config.repository';
import { createClient } from '@supabase/supabase-js';
import { GraphQLError } from 'graphql';

// This is an integration test that requires a test database
describe('PricingConfigRepository - Discount Per Day Integration', () => {
  let repository: PricingConfigRepository;
  let supabase: ReturnType<typeof createClient>;
  let testConfigIds: string[] = [];

  beforeEach(async () => {
    repository = new PricingConfigRepository();
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    testConfigIds = [];
  });

  afterEach(async () => {
    // Clean up test data
    if (testConfigIds.length > 0) {
      await supabase
        .from('pricing_configurations')
        .delete()
        .in('id', testConfigIds);
    }
  });

  describe('discount per day validation', () => {
    it('should accept valid discount per day values', async () => {
      const validValues = [0, 0.1, 0.25, 0.5, 0.75, 1.0];

      for (const value of validValues) {
        const config = await repository.upsertConfiguration(
          {
            name: `Test Discount ${value}`,
            description: `Test config with ${value} discount per day`,
            countryId: 'TEST',
            duration: 7,
            discountRate: 0,
            discountPerDay: value,
            isActive: true
          },
          'test-user-id'
        );

        expect(config.discountPerDay).toBe(value);
        testConfigIds.push(config.id);
      }
    });

    it('should reject invalid discount per day values', async () => {
      const invalidValues = [-0.1, -1, 1.1, 2.0];

      for (const value of invalidValues) {
        await expect(
          repository.upsertConfiguration(
            {
              name: `Test Invalid Discount ${value}`,
              description: `Test config with invalid ${value} discount per day`,
              countryId: 'TEST',
              duration: 7,
              discountRate: 0,
              discountPerDay: value,
              isActive: true
            },
            'test-user-id'
          )
        ).rejects.toThrow(GraphQLError);
      }
    });

    it('should allow null discount per day (uses default)', async () => {
      const config = await repository.upsertConfiguration(
        {
          name: 'Test Null Discount',
          description: 'Test config with null discount per day',
          countryId: 'TEST',
          duration: 7,
          discountRate: 0,
          discountPerDay: undefined,
          isActive: true
        },
        'test-user-id'
      );

      expect(config.discountPerDay).toBeUndefined();
      testConfigIds.push(config.id);
    });
  });

  describe('configuration hierarchy with discount per day', () => {
    it('should find most specific configuration with discount per day', async () => {
      // Create global default
      const globalConfig = await repository.upsertConfiguration(
        {
          name: 'Global Default',
          description: 'Global default with 10% discount per day',
          discountRate: 0,
          discountPerDay: 0.10,
          isActive: true
        },
        'test-user-id'
      );
      testConfigIds.push(globalConfig.id);

      // Create country-specific
      const countryConfig = await repository.upsertConfiguration(
        {
          name: 'Austria Default',
          description: 'Austria default with 15% discount per day',
          countryId: 'AT',
          discountRate: 0,
          discountPerDay: 0.15,
          isActive: true
        },
        'test-user-id'
      );
      testConfigIds.push(countryConfig.id);

      // Create bundle-specific
      const bundleConfig = await repository.upsertConfiguration(
        {
          name: 'Austria 7d Unlimited',
          description: 'Austria 7d unlimited with 20% discount per day',
          countryId: 'AT',
          duration: 7,
          bundleGroup: 'Standard - Unlimited Essential',
          discountRate: 0,
          discountPerDay: 0.20,
          isActive: true
        },
        'test-user-id'
      );
      testConfigIds.push(bundleConfig.id);

      // Test hierarchy
      const foundBundle = await repository.findMatchingConfiguration(
        'AT',
        'europe',
        7,
        'Standard - Unlimited Essential'
      );
      expect(foundBundle?.discountPerDay).toBe(0.20);

      const foundCountry = await repository.findMatchingConfiguration(
        'AT',
        'europe',
        30,
        'Standard - Unlimited Essential'
      );
      expect(foundCountry?.discountPerDay).toBe(0.15);

      const foundGlobal = await repository.findMatchingConfiguration(
        'FR',
        'europe',
        7,
        'Standard - Unlimited Essential'
      );
      expect(foundGlobal?.discountPerDay).toBe(0.10);
    });
  });

  describe('update operations with discount per day', () => {
    it('should update discount per day value', async () => {
      // Create initial config
      const config = await repository.upsertConfiguration(
        {
          name: 'Test Update',
          description: 'Test update discount per day',
          countryId: 'TEST',
          duration: 7,
          discountRate: 0,
          discountPerDay: 0.10,
          isActive: true
        },
        'test-user-id'
      );
      testConfigIds.push(config.id);

      // Update discount per day
      const updated = await repository.upsertConfiguration(
        {
          id: config.id,
          name: 'Test Update',
          description: 'Updated discount per day',
          countryId: 'TEST',
          duration: 7,
          discountRate: 0,
          discountPerDay: 0.25,
          isActive: true
        },
        'test-user-id'
      );

      expect(updated.discountPerDay).toBe(0.25);
      expect(updated.id).toBe(config.id);
    });

    it('should validate discount per day on update', async () => {
      // Create initial config
      const config = await repository.upsertConfiguration(
        {
          name: 'Test Validate Update',
          description: 'Test validate update',
          countryId: 'TEST',
          duration: 7,
          discountRate: 0,
          discountPerDay: 0.10,
          isActive: true
        },
        'test-user-id'
      );
      testConfigIds.push(config.id);

      // Try to update with invalid value
      await expect(
        repository.upsertConfiguration(
          {
            id: config.id,
            name: 'Test Validate Update',
            description: 'Invalid update',
            countryId: 'TEST',
            duration: 7,
            discountRate: 0,
            discountPerDay: 1.5, // Invalid: > 1
            isActive: true
          },
          'test-user-id'
        )
      ).rejects.toThrow('Discount per day must be between 0 and 1');
    });
  });

  describe('query operations with discount per day', () => {
    it('should include discount per day in query results', async () => {
      // Create test configs
      const configs = await Promise.all([
        repository.upsertConfiguration(
          {
            name: 'Config 1',
            description: 'Test config 1',
            discountRate: 0,
            discountPerDay: 0.05,
            isActive: true
          },
          'test-user-id'
        ),
        repository.upsertConfiguration(
          {
            name: 'Config 2',
            description: 'Test config 2',
            discountRate: 0,
            discountPerDay: 0.15,
            isActive: true
          },
          'test-user-id'
        ),
        repository.upsertConfiguration(
          {
            name: 'Config 3',
            description: 'Test config 3',
            discountRate: 0,
            // No discountPerDay set
            isActive: true
          },
          'test-user-id'
        )
      ]);

      testConfigIds.push(...configs.map(c => c.id));

      // Query all configurations
      const allConfigs = await repository.getAllConfigurations();
      const testConfigs = allConfigs.filter(c => 
        testConfigIds.includes(c.id)
      );

      expect(testConfigs).toHaveLength(3);
      expect(testConfigs.find(c => c.name === 'Config 1')?.discountPerDay).toBe(0.05);
      expect(testConfigs.find(c => c.name === 'Config 2')?.discountPerDay).toBe(0.15);
      expect(testConfigs.find(c => c.name === 'Config 3')?.discountPerDay).toBeUndefined();
    });

    it('should handle active/inactive configs with discount per day', async () => {
      // Create active config
      const activeConfig = await repository.upsertConfiguration(
        {
          name: 'Active Config',
          description: 'Active test config',
          countryId: 'AT',
          discountRate: 0,
          discountPerDay: 0.20,
          isActive: true
        },
        'test-user-id'
      );
      testConfigIds.push(activeConfig.id);

      // Create inactive config
      const inactiveConfig = await repository.upsertConfiguration(
        {
          name: 'Inactive Config',
          description: 'Inactive test config',
          countryId: 'AT',
          discountRate: 0,
          discountPerDay: 0.30,
          isActive: false
        },
        'test-user-id'
      );
      testConfigIds.push(inactiveConfig.id);

      // Find matching should only return active
      const found = await repository.findMatchingConfiguration(
        'AT',
        'europe',
        7,
        'Standard - Unlimited Essential'
      );

      expect(found?.name).toBe('Active Config');
      expect(found?.discountPerDay).toBe(0.20);
    });
  });
});