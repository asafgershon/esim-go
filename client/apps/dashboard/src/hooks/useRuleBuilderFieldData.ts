import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import {
  GET_COUNTRIES,
  GET_BUNDLE_GROUPS,
  GET_PAYMENT_METHODS,
} from '../lib/graphql/queries';
import {
  GetCountriesQuery,
  GetBundleGroupsQuery,
  GetPaymentMethodsQuery,
} from '@/__generated__/graphql';

interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

interface UseRuleBuilderFieldDataReturn {
  // Field options
  bundleGroups: FieldOption[];
  countries: FieldOption[];
  regions: FieldOption[];
  paymentMethods: FieldOption[];
  customerSegments: FieldOption[];
  
  // Loading states
  bundleGroupsLoading: boolean;
  countriesLoading: boolean;
  paymentMethodsLoading: boolean;
  
  // Error states
  bundleGroupsError: any;
  countriesError: any;
  paymentMethodsError: any;
  
  // Data freshness
  lastUpdated: Date | null;
  
  // Utility functions
  getFieldOptions: (fieldValue: string) => FieldOption[];
  isFieldLoading: (fieldValue: string) => boolean;
  hasFieldError: (fieldValue: string) => boolean;
}

export const useRuleBuilderFieldData = (): UseRuleBuilderFieldDataReturn => {
  // Fetch bundle groups
  const {
    data: bundleGroupsData,
    loading: bundleGroupsLoading,
    error: bundleGroupsError,
  } = useQuery<GetBundleGroupsQuery>(GET_BUNDLE_GROUPS, {
    errorPolicy: 'all', // Continue with partial data on errors
  });

  // Fetch countries
  const {
    data: countriesData,
    loading: countriesLoading,
    error: countriesError,
  } = useQuery<GetCountriesQuery>(GET_COUNTRIES, {
    errorPolicy: 'all',
  });

  // Fetch payment methods
  const {
    data: paymentMethodsData,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = useQuery<GetPaymentMethodsQuery>(GET_PAYMENT_METHODS, {
    errorPolicy: 'all',
  });

  // Process bundle groups
  const bundleGroups = useMemo((): FieldOption[] => {
    if (!bundleGroupsData?.pricingFilters?.groups) {
      // Fallback to known groups if API fails
      return [
        { value: 'Standard Fixed', label: 'Standard Fixed', description: 'Fixed data allowance bundles' },
        { value: 'Standard - Unlimited Lite', label: 'Standard - Unlimited Lite', description: 'Basic unlimited data plans' },
        { value: 'Standard - Unlimited Essential', label: 'Standard - Unlimited Essential', description: 'Standard unlimited data plans' },
        { value: 'Standard - Unlimited Plus', label: 'Standard - Unlimited Plus', description: 'Premium unlimited data plans' },
        { value: 'Regional Bundles', label: 'Regional Bundles', description: 'Multi-country regional coverage' },
      ];
    }

    return bundleGroupsData.pricingFilters.groups.map((group) => ({
      value: group,
      label: group,
      description: getBundleGroupDescription(group),
    }));
  }, [bundleGroupsData]);

  // Process countries
  const countries = useMemo((): FieldOption[] => {
    if (!countriesData?.countries) {
      // Fallback to common countries if API fails
      return [
        { value: 'US', label: 'United States', description: 'North America' },
        { value: 'IL', label: 'Israel', description: 'Middle East' },
        { value: 'UK', label: 'United Kingdom', description: 'Europe' },
        { value: 'FR', label: 'France', description: 'Europe' },
        { value: 'DE', label: 'Germany', description: 'Europe' },
        { value: 'JP', label: 'Japan', description: 'Asia' },
        { value: 'AU', label: 'Australia', description: 'Oceania' },
      ];
    }

    return countriesData.countries.map((country) => ({
      value: country.iso,
      label: country.name,
      description: country.region || 'Unknown region',
    }));
  }, [countriesData]);

  // Process regions from countries data
  const regions = useMemo((): FieldOption[] => {
    if (!countriesData?.countries) {
      // Fallback regions
      return [
        { value: 'Europe', label: 'Europe', description: 'European countries' },
        { value: 'Asia', label: 'Asia', description: 'Asian countries' },
        { value: 'North America', label: 'North America', description: 'North American countries' },
        { value: 'Middle East', label: 'Middle East', description: 'Middle Eastern countries' },
        { value: 'Africa', label: 'Africa', description: 'African countries' },
        { value: 'Oceania', label: 'Oceania', description: 'Oceanic countries' },
      ];
    }

    // Extract unique regions from countries
    const uniqueRegions = new Set(
      countriesData.countries
        .map((country) => country.region)
        .filter((region) => region) // Remove null/undefined
    );

    return Array.from(uniqueRegions).map((region) => ({
      value: region!,
      label: region!,
      description: `${region} region`,
    }));
  }, [countriesData]);

  // Process payment methods
  const paymentMethods = useMemo((): FieldOption[] => {
    if (!paymentMethodsData?.paymentMethods) {
      // Fallback to known payment methods
      return [
        { value: 'ISRAELI_CARD', label: 'Israeli Credit Card', description: 'Domestic credit cards' },
        { value: 'FOREIGN_CARD', label: 'Foreign Credit Card', description: 'International credit cards' },
        { value: 'AMEX', label: 'American Express', description: 'AMEX cards' },
        { value: 'BIT', label: 'Bit Payment', description: 'Israeli digital payment' },
        { value: 'DINERS', label: 'Diners Club', description: 'Diners Club cards' },
      ];
    }

    return paymentMethodsData.paymentMethods
      .filter((pm) => pm.isActive)
      .map((pm) => ({
        value: pm.value,
        label: pm.label,
        description: pm.description || `${pm.label} payment method`,
      }));
  }, [paymentMethodsData]);

  // Customer segments (static for now, could be dynamic in the future)
  const customerSegments = useMemo((): FieldOption[] => [
    { value: 'default', label: 'Default', description: 'Standard customer segment' },
    { value: 'premium', label: 'Premium', description: 'Premium tier customers' },
    { value: 'enterprise', label: 'Enterprise', description: 'Enterprise customers' },
    { value: 'new', label: 'New Customer', description: 'First-time customers' },
    { value: 'returning', label: 'Returning', description: 'Returning customers' },
  ], []);

  // Utility function to get options for a specific field
  const getFieldOptions = (fieldValue: string): FieldOption[] => {
    switch (fieldValue) {
      case 'group':
        return bundleGroups;
      case 'country':
        return countries;
      case 'region':
        return regions;
      case 'paymentMethod':
        return paymentMethods;
      case 'customerSegment':
        return customerSegments;
      default:
        return [];
    }
  };

  // Utility function to check if a field is loading
  const isFieldLoading = (fieldValue: string): boolean => {
    switch (fieldValue) {
      case 'group':
        return bundleGroupsLoading;
      case 'country':
      case 'region':
        return countriesLoading;
      case 'paymentMethod':
        return paymentMethodsLoading;
      default:
        return false;
    }
  };

  // Utility function to check if a field has errors
  const hasFieldError = (fieldValue: string): boolean => {
    switch (fieldValue) {
      case 'group':
        return !!bundleGroupsError;
      case 'country':
      case 'region':
        return !!countriesError;
      case 'paymentMethod':
        return !!paymentMethodsError;
      default:
        return false;
    }
  };

  // Calculate last updated timestamp
  const lastUpdated = useMemo(() => {
    if (bundleGroupsLoading || countriesLoading || paymentMethodsLoading) {
      return null;
    }
    return new Date();
  }, [bundleGroupsLoading, countriesLoading, paymentMethodsLoading]);

  return {
    // Field options
    bundleGroups,
    countries,
    regions,
    paymentMethods,
    customerSegments,
    
    // Loading states
    bundleGroupsLoading,
    countriesLoading,
    paymentMethodsLoading,
    
    // Error states
    bundleGroupsError,
    countriesError,
    paymentMethodsError,
    
    // Data freshness
    lastUpdated,
    
    // Utility functions
    getFieldOptions,
    isFieldLoading,
    hasFieldError,
  };
};

// Helper function to get bundle group descriptions
function getBundleGroupDescription(group: string): string {
  const descriptions: Record<string, string> = {
    'Standard Fixed': 'Fixed data allowance bundles',
    'Standard - Unlimited Lite': 'Basic unlimited data plans',
    'Standard - Unlimited Essential': 'Standard unlimited data plans',
    'Standard - Unlimited Plus': 'Premium unlimited data plans',
    'Regional Bundles': 'Multi-country regional coverage',
  };
  
  return descriptions[group] || `${group} bundle group`;
}