import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  renderHook,
  act,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BundleSelectorProvider,
  useBundleSelector,
} from "../bundle-selector-context";
import React from "react";
import { Bundle } from "@/__generated__/graphql";

// Mock the external hooks
vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("nuqs", () => ({
  useQueryStates: () => [
    {
      numOfDays: 7,
      countryId: "",
      tripId: "",
      activeTab: "countries",
    },
    vi.fn(),
  ],
  parseAsInteger: {
    withDefault: () => ({}),
  },
  parseAsString: {
    withDefault: () => ({}),
  },
  parseAsStringLiteral: () => ({
    withDefault: () => ({}),
  }),
}));

describe("BundleSelectorContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide context values", () => {
    const TestComponent = () => {
      const context = useBundleSelector();
      return (
        <div>
          <span data-testid="num-days">{context.numOfDays}</span>
          <span data-testid="country-id">{context.countryId}</span>
          <span data-testid="active-tab">{context.activeTab}</span>
        </div>
      );
    };

    render(
      <BundleSelectorProvider>
        <TestComponent />
      </BundleSelectorProvider>
    );

    expect(screen.getByTestId("num-days")).toHaveTextContent("7");
    expect(screen.getByTestId("country-id")).toHaveTextContent("");
    expect(screen.getByTestId("active-tab")).toHaveTextContent("countries");
  });

  it("should calculate isPricingValid correctly", () => {
    const { result } = renderHook(() => useBundleSelector(), {
      wrapper: BundleSelectorProvider,
    });

    // Initially, pricing is not valid (no pricing data)
    expect(result.current.isPricingValid).toBe(false);

    // Set pricing data
    act(() => {
      result.current.setPricing({ totalPrice: 100 });
    });

    // Still not valid because no country or trip selected
    expect(result.current.isPricingValid).toBe(false);
  });

  it("should handle findOptimalBundle function", () => {
    const { result } = renderHook(() => useBundleSelector(), {
      wrapper: BundleSelectorProvider,
    });

    const bundles: Bundle[] = [
      {
        currency: "USD",
        dataAmountReadable: "1GB",
        isUnlimited: false,
        speed: ["4g"],
        name: "Bundle 1",
        validityInDays: 7,
        basePrice: 10,
        groups: ["group1"],
        countries: ["US"],
      },
      {
        currency: "USD",
        dataAmountReadable: "1GB",
        isUnlimited: false,
        speed: ["4g"],
        name: "Bundle 2",
        validityInDays: 14,
        basePrice: 18,
        groups: ["group1"],
        countries: ["US"],
      },
      {
        currency: "USD",
        dataAmountReadable: "1GB",
        isUnlimited: false,
        speed: ["4g"],
        name: "Bundle 3",
        validityInDays: 30,
        basePrice: 35,
        groups: ["group1"],
        countries: ["US"],
      },
    ];

    // Test exact match
    const exactMatch = result.current.findOptimalBundle(bundles, 7);
    expect(exactMatch.selectedBundle.validityInDays).toBe(7);

    // Test smallest suitable bundle
    const smallestSuitable = result.current.findOptimalBundle(
      bundles,
      10
    );
    expect(smallestSuitable.selectedBundle.validityInDays).toBe(14);

    // Test fallback to largest bundle
    const largestBundle = result.current.findOptimalBundle(bundles, 45);
    expect(largestBundle.selectedBundle.validityInDays).toBe(30);
  });

  it("should handle calculateUnusedDayDiscount function", () => {
    const { result } = renderHook(() => useBundleSelector(), {
      wrapper: BundleSelectorProvider,
    });

    const bundles: Bundle[] = [
      {
        currency: "USD",
        dataAmountReadable: "1GB",
        isUnlimited: false,
        speed: ["4g"],
        name: "Bundle 1",
        validityInDays: 7,
        basePrice: 10,
        groups: ["group1"],
        countries: ["US"],
      },
      {
        currency: "USD",
        dataAmountReadable: "1GB",
        isUnlimited: false,
        speed: ["4g"],
        name: "Bundle 2",
        validityInDays: 14,
        basePrice: 18,
        groups: ["group1"],
        countries: ["US"],
      },
    ];

    const selectedBundle = bundles[1];
    const discount = result.current.calculateUnusedDayDiscount(
      bundles,
      selectedBundle,
      10
    );

    // Expected: (18 - 10) / (14 - 7) = 8 / 7 ≈ 1.14
    expect(discount).toBeGreaterThan(1);
    expect(discount).toBeLessThan(1.2);
  });

  it("should update pricing state correctly", async () => {
    const TestComponent = () => {
      const { pricing, setPricing, isPricingValid } = useBundleSelector();
      return (
        <div>
          <span data-testid="pricing">
            {pricing ? pricing.totalPrice : "null"}
          </span>
          <span data-testid="is-valid">{isPricingValid.toString()}</span>
          <button
            onClick={() => setPricing({ totalPrice: 50 })}
            data-testid="set-pricing"
          >
            Set Pricing
          </button>
        </div>
      );
    };

    render(
      <BundleSelectorProvider>
        <TestComponent />
      </BundleSelectorProvider>
    );

    expect(screen.getByTestId("pricing")).toHaveTextContent("null");
    expect(screen.getByTestId("is-valid")).toHaveTextContent("false");

    const user = userEvent.setup();
    await user.click(screen.getByTestId("set-pricing"));

    await waitFor(() => {
      expect(screen.getByTestId("pricing")).toHaveTextContent("50");
    });
  });
});
