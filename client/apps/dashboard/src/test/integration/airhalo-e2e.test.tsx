import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AirHaloPricingPage } from '@/pages/pricing/airhalo';
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

// Mock for React Router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper component that provides necessary context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

describe('AirHalo E2E User Journey', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Complete User Flow', () => {
    it('should complete a full user journey through AirHalo pricing page', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        // Initial load without filters
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          mockAirHaloPackagesData
        ),
        // Filtered by country
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
        // Filtered by type and country
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: 'LOCAL', countries: ['US'], limit: 50 } },
          {
            airHaloPackages: {
              data: [mockAirHaloPackagesData.airHaloPackages.data[1]], // USA local package
              links: null,
              meta: { ...mockAirHaloPackagesData.airHaloPackages.meta, total: 1 },
            },
          }
        ),
        // Comparison query
        createMockResponse(
          COMPARE_AIRHALO_PACKAGES,
          { countryCode: 'US' },
          {
            compareAirHaloPackages: [
              {
                id: 'compare-us',
                title: 'USA Comparison Package',
                slug: 'usa-comparison',
                image: null,
                operators: [
                  {
                    id: 'us-comp-op',
                    title: 'USA Comparison Operator',
                    type: 'MNO',
                    countries: [{ id: 'us', title: 'United States', slug: 'usa' }],
                    packages: [
                      {
                        id: 'us-comp-pkg',
                        type: 'LOCAL',
                        title: '10GB USA Comparison',
                        shortInfo: '10GB for 30 days',
                        data: 10240,
                        amount: 10240,
                        day: 30,
                        isUnlimited: false,
                        voice: 'N/A',
                        text: 'N/A',
                        price: { value: 40.0, currency: 'USD' },
                        netPrice: { value: 32.0, currency: 'USD' },
                        prices: {
                          netPrice: { value: 32.0, currency: 'USD' },
                          recommendedRetailPrice: { value: 48.0, currency: 'USD' },
                        },
                        qrInstallation: true,
                        manualInstallation: true,
                        isFairUsagePolicy: false,
                        fairUsagePolicy: null,
                      },
                    ],
                    coverages: [{ networks: [{ name: 'T-Mobile', type: '5G' }] }],
                    apn: {
                      name: 'internet',
                      username: '',
                      password: '',
                      ios: { name: 'internet', username: '', password: '' },
                    },
                  },
                ],
              },
            ],
          }
        ),
      ];

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApolloMockProvider mocks={mocks}>
            <AirHaloPricingPage />
          </ApolloMockProvider>
        </TestWrapper>
      );

      // Step 1: Wait for initial page load
      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Verify initial state shows all packages
      expect(screen.getByText('Showing 3 AirHalo packages')).toBeInTheDocument();
      expect(screen.getByText('Europe Regional Plan')).toBeInTheDocument();
      expect(screen.getByText('USA Local Plan')).toBeInTheDocument();

      // Step 2: Apply country filter
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      await user.click(countrySelect);
      
      // Verify dropdown opened
      expect(screen.getByText('All Countries')).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
      
      await user.click(screen.getByText('United States'));

      // Wait for filtered results
      await waitFor(() => {
        expect(screen.getByText('Showing 1 AirHalo packages for United States')).toBeInTheDocument();
      });

      // Verify only USA packages are shown
      expect(screen.getByText('USA Local Plan')).toBeInTheDocument();
      expect(screen.queryByText('Europe Regional Plan')).not.toBeInTheDocument();

      // Step 3: Apply package type filter
      const typeSelect = screen.getByRole('combobox', { name: /package type/i });
      await user.click(typeSelect);
      await user.click(screen.getByText('Local'));

      // Wait for type-filtered results
      await waitFor(() => {
        expect(screen.getByText('Showing 1 AirHalo packages for United States')).toBeInTheDocument();
      });

      // Step 4: Enable comparison feature
      const comparisonButton = screen.getByRole('button', { name: /show comparison/i });
      expect(comparisonButton).not.toBeDisabled();
      
      await user.click(comparisonButton);

      // Wait for comparison to load
      await waitFor(() => {
        expect(screen.getByText('Pricing Comparison for United States')).toBeInTheDocument();
      });

      // Verify comparison content
      expect(screen.getByText('Found 1 AirHalo package groups for comparison')).toBeInTheDocument();
      expect(screen.getByText('USA Comparison Package')).toBeInTheDocument();
      expect(screen.getByText('1 operator(s), 1 packages')).toBeInTheDocument();

      // Step 5: Test interaction with package data
      // Verify detailed package information is displayed
      expect(screen.getByText('Unlimited USA')).toBeInTheDocument();
      expect(screen.getByText('Verizon USA')).toBeInTheDocument();
      expect(screen.getByText('Unlimited')).toBeInTheDocument(); // Data amount
      expect(screen.getByText('30 days')).toBeInTheDocument(); // Duration
      expect(screen.getByText('$60.00')).toBeInTheDocument(); // Price
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Net price
      expect(screen.getByText('$70.00')).toBeInTheDocument(); // RRP

      // Step 6: Test hiding comparison
      const hideButton = screen.getByRole('button', { name: /hide comparison/i });
      await user.click(hideButton);

      await waitFor(() => {
        expect(screen.queryByText('Pricing Comparison for United States')).not.toBeInTheDocument();
      });

      // Step 7: Clear filters to return to initial state
      await user.click(countrySelect);
      await user.click(screen.getByText('All Countries'));

      await user.click(typeSelect);
      await user.click(screen.getByText('All Types'));

      // Wait for unfiltered results
      await waitFor(() => {
        expect(screen.getByText('Showing 3 AirHalo packages')).toBeInTheDocument();
      });

      // Verify we're back to showing all packages
      expect(screen.getByText('Europe Regional Plan')).toBeInTheDocument();
      expect(screen.getByText('USA Local Plan')).toBeInTheDocument();

      // Verify comparison button is disabled without country selection
      expect(screen.getByRole('button', { name: /show comparison/i })).toBeDisabled();
    });

    it('should handle error recovery flow', async () => {
      const errorMocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          null,
          new Error('Network timeout')
        ),
      ];

      const user = userEvent.setup();

      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, reload: mockReload },
      });

      render(
        <TestWrapper>
          <ApolloMockProvider mocks={errorMocks}>
            <AirHaloPricingPage />
          </ApolloMockProvider>
        </TestWrapper>
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load AirHalo pricing data')).toBeInTheDocument();
      });

      // Verify error details and retry option
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Test retry functionality
      await user.click(retryButton);
      expect(mockReload).toHaveBeenCalled();
    });

    it('should handle empty state gracefully', async () => {
      const emptyMocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          { airHaloPackages: { data: [], links: null, meta: null } }
        ),
      ];

      render(
        <TestWrapper>
          <ApolloMockProvider mocks={emptyMocks}>
            <AirHaloPricingPage />
          </ApolloMockProvider>
        </TestWrapper>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Verify empty state message
      expect(screen.getByText('Showing 0 AirHalo packages')).toBeInTheDocument();
      expect(screen.getByText('No AirHalo packages found matching the current filters')).toBeInTheDocument();

      // Verify filters still work in empty state
      const countrySelect = screen.getByRole('combobox', { name: /country/i });
      const typeSelect = screen.getByRole('combobox', { name: /package type/i });
      
      expect(countrySelect).not.toBeDisabled();
      expect(typeSelect).not.toBeDisabled();
    });
  });

  describe('Accessibility Flow', () => {
    it('should support keyboard navigation through the interface', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          mockAirHaloPackagesData
        ),
      ];

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApolloMockProvider mocks={mocks}>
            <AirHaloPricingPage />
          </ApolloMockProvider>
        </TestWrapper>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      // Test keyboard navigation through filter controls
      await user.tab();
      expect(screen.getByRole('combobox', { name: /country/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /package type/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /show comparison/i })).toHaveFocus();

      // Test that all interactive elements have proper labels
      expect(screen.getByRole('combobox', { name: /country/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('combobox', { name: /package type/i })).toHaveAttribute('aria-label');
    });

    it('should announce loading states to screen readers', async () => {
      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        // Delay the packages response to test loading state
      ];

      render(
        <TestWrapper>
          <ApolloMockProvider mocks={mocks}>
            <AirHaloPricingPage />
          </ApolloMockProvider>
        </TestWrapper>
      );

      // Verify loading state has appropriate attributes
      const loadingSkeleton = screen.getByTestId('loading-skeleton');
      expect(loadingSkeleton).toBeInTheDocument();
      expect(loadingSkeleton).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets without performance degradation', async () => {
      // Create a large dataset
      const largeDataset = {
        airHaloPackages: {
          data: Array.from({ length: 100 }, (_, i) => ({
            ...mockAirHaloPackagesData.airHaloPackages.data[0],
            id: `large-pkg-${i}`,
            title: `Large Package ${i + 1}`,
          })),
          meta: {
            ...mockAirHaloPackagesData.airHaloPackages.meta,
            total: 100,
            perPage: 100,
          },
          links: mockAirHaloPackagesData.airHaloPackages.links,
        },
      };

      const mocks = [
        createMockResponse(GET_COUNTRIES, {}, mockCountriesData),
        createMockResponse(
          GET_AIRHALO_PACKAGES,
          { filter: { type: undefined, countries: undefined, limit: 50 } },
          largeDataset
        ),
      ];

      const startTime = performance.now();

      render(
        <TestWrapper>
          <ApolloMockProvider mocks={mocks}>
            <AirHaloPricingPage />
          </ApolloMockProvider>
        </TestWrapper>
      );

      await waitForElementToBeRemoved(() => screen.getByTestId('loading-skeleton'));

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify page renders large dataset in reasonable time (< 2 seconds)
      expect(renderTime).toBeLessThan(2000);

      // Verify all 100 packages are displayed
      expect(screen.getByText('Showing 300 AirHalo packages')).toBeInTheDocument(); // 100 packages * 3 operators/packages each
    });
  });
});