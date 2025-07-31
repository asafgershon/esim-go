import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLError } from 'graphql';
import { AirHaloPricingPage } from '../airhalo';
import {
  ApolloMockProvider,
  createMockResponse,
  mockCountriesData,
  mockAirHaloPackagesData,
  mockCompareAirHaloPackagesData,
} from '@/test/apollo-mock';
import {
  GET_AIRHALO_PACKAGES,
  GET_COUNTRIES,
  COMPARE_AIRHALO_PACKAGES,
} from '@/lib/graphql/queries';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    ...window.location,
    reload: mockReload,
  },
});

describe('AirHaloPricingPage', () => {
  beforeEach(() => {
    mockReload.mockClear();
  });

  describe('Loading States', () => {
    it('should show loading skeleton when packages are loading', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        // Don't include packages mock to simulate loading
      ];

      render(
        <ApolloMockProvider mocks={mocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should show comparison loading when comparison is triggered', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          mockAirHaloPackagesData
        ),
        // Don't include comparison mock to simulate loading
      ];

      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={mocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      // Wait for main data to load
      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Select a country
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      await user.click(countrySelect);
      await user.click(screen.getByText('United States'));

      // Enable comparison
      const comparisonButton = screen.getByRole('button', { name: /show comparison/i });
      await user.click(comparisonButton);

      // Should show comparison loading
      expect(screen.getByText(/found.*airhalo package groups/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when packages fail to load', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          null,
          new GraphQLError('API rate limit exceeded')
        ),
      ];

      render(
        <ApolloMockProvider mocks={mocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load AirHalo pricing data')).toBeInTheDocument();
        expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          null,
          new GraphQLError('Network error')
        ),
      ];

      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={mocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load AirHalo pricing data')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Data Display', () => {
    const defaultMocks = [
      createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
      createMockResponse(
        GET_AIRHALO_PACKAGES,
        { filter: { type: undefined, countries: undefined, limit: 50 } },
        mockAirHaloPackagesData
      ),
    ];

    it('should display packages in table format', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Check table headers
      expect(screen.getByText('Package')).toBeInTheDocument();
      expect(screen.getByText('Operator')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Countries')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Net Price')).toBeInTheDocument();
      expect(screen.getByText('RRP')).toBeInTheDocument();

      // Check package data
      expect(screen.getByText('1GB Europe')).toBeInTheDocument();
      expect(screen.getByText('5GB Europe')).toBeInTheDocument();
      expect(screen.getByText('Unlimited USA')).toBeInTheDocument();
      expect(screen.getByText('European Telecom')).toBeInTheDocument();
      expect(screen.getByText('Verizon USA')).toBeInTheDocument();
    });

    it('should display correct pricing information', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Check pricing formats
      expect(screen.getByText('$25.00')).toBeInTheDocument(); // Price
      expect(screen.getByText('$20.00')).toBeInTheDocument(); // Net Price
      expect(screen.getByText('$30.00')).toBeInTheDocument(); // RRP

      expect(screen.getByText('$60.00')).toBeInTheDocument(); // Unlimited price
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Unlimited net price
      expect(screen.getByText('$70.00')).toBeInTheDocument(); // Unlimited RRP
    });

    it('should display data amounts correctly', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Check data formatting
      expect(screen.getByText('1.0GB')).toBeInTheDocument(); // 1024MB -> 1.0GB
      expect(screen.getByText('5.0GB')).toBeInTheDocument(); // 5120MB -> 5.0GB
      expect(screen.getByText('Unlimited')).toBeInTheDocument(); // Unlimited data
    });

    it('should display duration correctly', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Check duration display
      expect(screen.getAllByText('30 days')).toHaveLength(3); // All test packages are 30 days
    });

    it('should show results summary', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      expect(screen.getByText('Showing 3 AirHalo packages')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    it('should show empty state when no packages found', async () => {
      const emptyMocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          { airHaloPackages: { data: [], links: null, meta: null } }
        ),
      ];

      render(
        <ApolloMockProvider mocks={emptyMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      expect(screen.getByText('No AirHalo packages found matching the current filters')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    const defaultMocks = [
      createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
      createMockResponse(
        GET_AIRHALO_PACKAGES,
        { filter: { type: undefined, countries: undefined, limit: 50 } },
        mockAirHaloPackagesData
      ),
    ];

    it('should filter by country', async () => {
      const countryFilterMocks = [
        ...defaultMocks,
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: ['US'], limit: 50 } },
          {
            airHaloPackages: {
              data: [mockAirHaloPackagesData.airHaloPackages.data[1]], // USA package only
              links: null,
              meta: { ...mockAirHaloPackagesData.airHaloPackages.meta, total: 1 },
            },
          }
        ),
      ];

      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={countryFilterMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Select United States
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      await user.click(countrySelect);
      await user.click(screen.getByText('United States'));

      await waitFor(() => {
        expect(screen.getByText('Showing 1 AirHalo packages for United States')).toBeInTheDocument();
      });
    });

    it('should filter by package type', async () => {
      const typeFilterMocks = [
        ...defaultMocks,
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: 'LOCAL', countries: undefined, limit: 50 } },
          {
            airHaloPackages: {
              data: [mockAirHaloPackagesData.airHaloPackages.data[1]], // USA local package only
              links: null,
              meta: { ...mockAirHaloPackagesData.airHaloPackages.meta, total: 1 },
            },
          }
        ),
      ];

      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={typeFilterMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Select LOCAL type
      const typeSelect = screen.getByRole('combobox', { name: /package type/i });
      await user.click(typeSelect);
      await user.click(screen.getByText('Local'));

      await waitFor(() => {
        expect(screen.getByText('Showing 1 AirHalo packages')).toBeInTheDocument();
      });
    });

    it('should clear filters', async () => {
      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Apply filters
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      await user.click(countrySelect);
      await user.click(screen.getByText('United States'));

      const typeSelect = screen.getByRole('combobox', { name: /package type/i });
      await user.click(typeSelect);
      await user.click(screen.getByText('Local'));

      // Clear filters
      await user.click(countrySelect);
      await user.click(screen.getByText('All Countries'));

      await user.click(typeSelect);
      await user.click(screen.getByText('All Types'));

      await waitFor(() => {
        expect(screen.getByText('Showing 3 AirHalo packages')).toBeInTheDocument();
      });
    });
  });

  describe('Comparison Feature', () => {
    it('should show comparison when enabled with country selected', async () => {
      const comparisonMocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          mockAirHaloPackagesData
        ),
        createMockResponse(
          COMPARE_AIRHALO_PACKAGES,
          { countryCode: 'FR' },
          mockCompareAirHaloPackagesData
        ),
      ];

      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={comparisonMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Select France
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      await user.click(countrySelect);
      await user.click(screen.getByText('France'));

      // Enable comparison
      const comparisonButton = screen.getByRole('button', { name: /show comparison/i });
      await user.click(comparisonButton);

      await waitFor(() => {
        expect(screen.getByText('Pricing Comparison for France')).toBeInTheDocument();
        expect(screen.getByText('Found 1 AirHalo package groups for comparison')).toBeInTheDocument();
        expect(screen.getByText('France Local Plans')).toBeInTheDocument();
      });
    });

    it('should disable comparison button when no country selected', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          mockAirHaloPackagesData
        ),
      ];

      render(
        <ApolloMockProvider mocks={mocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      const comparisonButton = screen.getByRole('button', { name: /show comparison/i });
      expect(comparisonButton).toBeDisabled();
    });

    it('should hide comparison when toggled off', async () => {
      const comparisonMocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          mockAirHaloPackagesData
        ),
        createMockResponse(
          COMPARE_AIRHALO_PACKAGES,
          { countryCode: 'FR' },
          mockCompareAirHaloPackagesData
        ),
      ];

      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={comparisonMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Select France and enable comparison
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      await user.click(countrySelect);
      await user.click(screen.getByText('France'));

      const comparisonButton = screen.getByRole('button', { name: /show comparison/i });
      await user.click(comparisonButton);

      await waitFor(() => {
        expect(screen.getByText('Pricing Comparison for France')).toBeInTheDocument();
      });

      // Hide comparison
      const hideButton = screen.getByRole('button', { name: /hide comparison/i });
      await user.click(hideButton);

      await waitFor(() => {
        expect(screen.queryByText('Pricing Comparison for France')).not.toBeInTheDocument();
      });
    });

    it('should show empty comparison state', async () => {
      const emptyComparisonMocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          mockAirHaloPackagesData
        ),
        createMockResponse(
          COMPARE_AIRHALO_PACKAGES,
          { countryCode: 'DE' },
          { compareAirHaloPackages: [] }
        ),
      ];

      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={emptyComparisonMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Select Germany and enable comparison
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      await user.click(countrySelect);
      await user.click(screen.getByText('Germany'));

      const comparisonButton = screen.getByRole('button', { name: /show comparison/i });
      await user.click(comparisonButton);

      await waitFor(() => {
        expect(screen.getByText('No AirHalo packages found for comparison in Germany')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    const defaultMocks = [
      createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
      createMockResponse(
        GET_AIRHALO_PACKAGES,
        { filter: { type: undefined, countries: undefined, limit: 50 } },
        mockAirHaloPackagesData
      ),
    ];

    it('should have proper ARIA labels', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      expect(screen.getByRole('combobox', { name: /country/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /package type/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show comparison/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('combobox', { name: /country/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /package type/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /show comparison/i })).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    const defaultMocks = [
      createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
      createMockResponse(
        GET_AIRHALO_PACKAGES,
        { filter: { type: undefined, countries: undefined, limit: 50 } },
        mockAirHaloPackagesData
      ),
    ];

    it('should handle table overflow on small screens', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      const tableContainer = screen.getByRole('table').closest('.overflow-auto');
      expect(tableContainer).toBeInTheDocument();
      expect(tableContainer).toHaveClass('overflow-auto');
    });

    it('should truncate long text in table cells', async () => {
      render(
        <ApolloMockProvider mocks={defaultMocks}>
          <AirHaloPricingPage />
        </ApolloMockProvider>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      const countryCell = screen.getByText('France, Germany');
      expect(countryCell).toHaveClass('truncate');
    });
  });
});