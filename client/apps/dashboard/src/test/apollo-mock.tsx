import React from 'react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { type ReactNode } from 'react';

interface ApolloMockProviderProps {
  children: ReactNode;
  mocks?: MockedResponse[];
  addTypename?: boolean;
  defaultOptions?: any;
}

export const ApolloMockProvider: React.FC<ApolloMockProviderProps> = ({
  children,
  mocks = [],
  addTypename = false,
  defaultOptions = {},
}) => {
  return (
    <MockedProvider
      mocks={mocks}
      addTypename={addTypename}
      defaultOptions={defaultOptions}
    >
      {children}
    </MockedProvider>
  );
};

// Helper function to create consistent mock responses
export const createMockResponse = (
  query: any,
  variables: any = {},
  result: any,
  error?: Error
): MockedResponse => ({
  request: {
    query,
    variables,
  },
  result: error ? undefined : { data: result },
  error,
});

// Mock data helpers
export const mockCountriesData = {
  countries: [
    { iso: 'US', name: 'United States', nameHebrew: 'ארצות הברית', region: 'North America', flag: '🇺🇸' },
    { iso: 'UK', name: 'United Kingdom', nameHebrew: 'בריטניה', region: 'Europe', flag: '🇬🇧' },
    { iso: 'FR', name: 'France', nameHebrew: 'צרפת', region: 'Europe', flag: '🇫🇷' },
    { iso: 'DE', name: 'Germany', nameHebrew: 'גרמניה', region: 'Europe', flag: '🇩🇪' },
    { iso: 'JP', name: 'Japan', nameHebrew: 'יפן', region: 'Asia', flag: '🇯🇵' },
  ],
};

export const mockAirHaloPackagesData = {
  airHaloPackages: {
    data: [
      {
        id: 'ahp-1',
        title: 'Europe Regional Plan',
        slug: 'europe-regional',
        image: {
          url: 'https://example.com/europe.jpg',
          width: 300,
          height: 200,
        },
        operators: [
          {
            id: 'op-1',
            title: 'European Telecom',
            type: 'MNO',
            countries: [
              { id: 'fr', title: 'France', slug: 'france' },
              { id: 'de', title: 'Germany', slug: 'germany' },
            ],
            packages: [
              {
                id: 'pkg-1gb-eu',
                type: 'REGIONAL',
                title: '1GB Europe',
                shortInfo: '1GB data valid in 28+ EU countries',
                data: 1024,
                amount: 1024,
                day: 30,
                isUnlimited: false,
                voice: 'N/A',
                text: 'N/A',
                price: { value: 25.0, currency: 'USD' },
                netPrice: { value: 20.0, currency: 'USD' },
                prices: {
                  netPrice: { value: 20.0, currency: 'USD' },
                  recommendedRetailPrice: { value: 30.0, currency: 'USD' },
                },
                qrInstallation: true,
                manualInstallation: true,
                isFairUsagePolicy: false,
                fairUsagePolicy: null,
              },
              {
                id: 'pkg-5gb-eu',
                type: 'REGIONAL',
                title: '5GB Europe',
                shortInfo: '5GB data valid in 28+ EU countries',
                data: 5120,
                amount: 5120,
                day: 30,
                isUnlimited: false,
                voice: 'N/A',
                text: 'N/A',
                price: { value: 45.0, currency: 'USD' },
                netPrice: { value: 35.0, currency: 'USD' },
                prices: {
                  netPrice: { value: 35.0, currency: 'USD' },
                  recommendedRetailPrice: { value: 50.0, currency: 'USD' },
                },
                qrInstallation: true,
                manualInstallation: true,
                isFairUsagePolicy: false,
                fairUsagePolicy: null,
              },
            ],
            coverages: [
              {
                networks: [
                  { name: 'Orange', type: '4G/5G' },
                  { name: 'Deutsche Telekom', type: '4G/5G' },
                ],
              },
            ],
            apn: {
              name: 'internet',
              username: '',
              password: '',
              ios: {
                name: 'internet',
                username: '',
                password: '',
              },
            },
          },
        ],
      },
      {
        id: 'ahp-2',
        title: 'USA Local Plan',
        slug: 'usa-local',
        image: {
          url: 'https://example.com/usa.jpg',
          width: 300,
          height: 200,
        },
        operators: [
          {
            id: 'op-2',
            title: 'Verizon USA',
            type: 'MNO',
            countries: [
              { id: 'us', title: 'United States', slug: 'united-states' },
            ],
            packages: [
              {
                id: 'pkg-unlimited-us',
                type: 'LOCAL',
                title: 'Unlimited USA',
                shortInfo: 'Unlimited data for 30 days',
                data: 0,
                amount: 0,
                day: 30,
                isUnlimited: true,
                voice: 'Unlimited',
                text: 'Unlimited',
                price: { value: 60.0, currency: 'USD' },
                netPrice: { value: 50.0, currency: 'USD' },
                prices: {
                  netPrice: { value: 50.0, currency: 'USD' },
                  recommendedRetailPrice: { value: 70.0, currency: 'USD' },
                },
                qrInstallation: true,
                manualInstallation: true,
                isFairUsagePolicy: true,
                fairUsagePolicy: 'Fair usage policy applies after 22GB',
              },
            ],
            coverages: [
              {
                networks: [
                  { name: 'Verizon', type: '4G/5G' },
                ],
              },
            ],
            apn: {
              name: 'vzwinternet',
              username: '',
              password: '',
              ios: {
                name: 'vzwinternet',
                username: '',
                password: '',
              },
            },
          },
        ],
      },
    ],
    links: {
      first: 'https://api.airalo.com/v2/packages?page=1',
      last: 'https://api.airalo.com/v2/packages?page=5',
      prev: null,
      next: 'https://api.airalo.com/v2/packages?page=2',
    },
    meta: {
      currentPage: 1,
      from: 1,
      lastPage: 5,
      path: 'https://api.airalo.com/v2/packages',
      perPage: 20,
      to: 20,
      total: 100,
    },
  },
};

export const mockCompareAirHaloPackagesData = {
  compareAirHaloPackages: [
    {
      id: 'compare-1',
      title: 'France Local Plans',
      slug: 'france-local',
      image: {
        url: 'https://example.com/france.jpg',
        width: 300,
        height: 200,
      },
      operators: [
        {
          id: 'fr-op-1',
          title: 'Orange France',
          type: 'MNO',
          countries: [
            { id: 'fr', title: 'France', slug: 'france' },
          ],
          packages: [
            {
              id: 'fr-pkg-1',
              type: 'LOCAL',
              title: '2GB France',
              shortInfo: '2GB data for 14 days',
              data: 2048,
              amount: 2048,
              day: 14,
              isUnlimited: false,
              voice: 'N/A',
              text: 'N/A',
              price: { value: 15.0, currency: 'USD' },
              netPrice: { value: 12.0, currency: 'USD' },
              prices: {
                netPrice: { value: 12.0, currency: 'USD' },
                recommendedRetailPrice: { value: 18.0, currency: 'USD' },
              },
              qrInstallation: true,
              manualInstallation: true,
              isFairUsagePolicy: false,
              fairUsagePolicy: null,
            },
          ],
          coverages: [
            {
              networks: [
                { name: 'Orange', type: '4G/5G' },
              ],
            },
          ],
          apn: {
            name: 'orange.fr',
            username: 'orange',
            password: 'orange',
            ios: {
              name: 'orange.fr',
              username: 'orange',
              password: 'orange',
            },
          },
        },
      ],
    },
  ],
};