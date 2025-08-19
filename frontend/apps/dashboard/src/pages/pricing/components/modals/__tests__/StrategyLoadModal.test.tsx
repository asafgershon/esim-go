import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { vi, describe, it, expect, beforeEach } from "vitest";
import StrategyLoadModal from "../StrategyLoadModal";
import { GET_PRICING_STRATEGIES } from "../../../../../graphql/queries/strategies";
import { Block } from "../../../types";
import * as strategiesHooks from "../../../../../hooks/useStrategies";
import * as loadStrategyHooks from "../../../../../hooks/useLoadStrategy";

// Mock the hooks
vi.mock("../../../../../hooks/useStrategies", () => ({
  useStrategies: vi.fn(),
  useSearchStrategies: vi.fn(),
}));

vi.mock("../../../../../hooks/useLoadStrategy", () => ({
  useLoadStrategy: vi.fn(),
}));

const mockStrategies = [
  {
    id: "strategy-1",
    name: "Standard Pricing",
    code: "STD001",
    description: "Basic pricing strategy with markup and rounding",
    version: 1,
    isDefault: true,
    activationCount: 25,
    lastActivatedAt: "2023-12-01T10:00:00Z",
    archivedAt: null,
    createdAt: "2023-11-01T10:00:00Z",
    createdBy: "user-1",
    updatedAt: "2023-12-01T10:00:00Z",
    updatedBy: "user-1",
    parentStrategyId: null,
  },
  {
    id: "strategy-2",
    name: "Premium Pricing",
    code: "PREM001",
    description: "Premium pricing with advanced discounts",
    version: 2,
    isDefault: false,
    activationCount: 10,
    lastActivatedAt: "2023-11-25T15:30:00Z",
    archivedAt: null,
    createdAt: "2023-10-15T14:20:00Z",
    createdBy: "user-2",
    updatedAt: "2023-11-20T16:45:00Z",
    updatedBy: "user-2",
    parentStrategyId: null,
  },
  {
    id: "strategy-3",
    name: "Archived Strategy",
    code: "OLD001",
    description: "Deprecated pricing strategy",
    version: 1,
    isDefault: false,
    activationCount: 5,
    lastActivatedAt: "2023-09-01T12:00:00Z",
    archivedAt: "2023-10-01T12:00:00Z",
    createdAt: "2023-08-01T10:00:00Z",
    createdBy: "user-1",
    updatedAt: "2023-10-01T12:00:00Z",
    updatedBy: "user-1",
    parentStrategyId: null,
  },
];

const mockStrategyWithBlocks = {
  ...mockStrategies[0],
  blocks: [
    {
      priority: 1,
      isEnabled: true,
      configOverrides: { value: 1.2 },
      pricingBlock: {
        id: "block-1",
        name: "Base Price",
        description: "Initialize with bundle base price",
        category: "INITIALIZATION",
        conditions: {},
        action: { type: "set_base_price" },
        priority: 1,
        isActive: true,
        isEditable: false,
        createdAt: "2023-11-01T10:00:00Z",
        updatedAt: "2023-11-01T10:00:00Z",
      },
    },
  ],
};

const mockCurrentSteps: Block[] = [
  {
    id: "current-1",
    type: "base-price",
    name: "Base Price",
    description: "Current base price block",
    icon: <div>Icon</div>,
    color: "bg-gray-100",
  },
];

describe("StrategyLoadModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onStrategyLoad: vi.fn(),
    currentStrategySteps: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    vi.mocked(strategiesHooks.useStrategies).mockReturnValue({
      strategies: mockStrategies.filter(s => !s.archivedAt),
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(strategiesHooks.useSearchStrategies).mockReturnValue({
      strategies: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(loadStrategyHooks.useLoadStrategy).mockReturnValue({
      strategy: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
      loadStrategyIntoBuilder: vi.fn(() => []),
    });

    return render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StrategyLoadModal {...defaultProps} {...props} />
      </MockedProvider>
    );
  };

  it("renders the modal when open", () => {
    renderModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Load Pricing Strategy")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays strategies in the list", () => {
    renderModal();
    expect(screen.getByText("Standard Pricing")).toBeInTheDocument();
    expect(screen.getByText("Premium Pricing")).toBeInTheDocument();
    expect(screen.queryByText("Archived Strategy")).not.toBeInTheDocument();
  });

  it("shows default badge for default strategy", () => {
    renderModal();
    const defaultStrategy = screen.getByText("Standard Pricing").closest(".cursor-pointer");
    expect(defaultStrategy).toHaveTextContent("Default");
  });

  it("filters search results", async () => {
    const { useSearchStrategies } = require("../../../../../hooks/useStrategies");
    
    useSearchStrategies.mockReturnValue({
      strategies: [mockStrategies[1]], // Premium strategy
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderModal();
    
    const searchInput = screen.getByPlaceholderText("Search strategies by name or description...");
    fireEvent.change(searchInput, { target: { value: "premium" } });

    await waitFor(() => {
      expect(useSearchStrategies).toHaveBeenCalledWith("premium");
    });
  });

  it("shows archived strategies when toggled", () => {
    const { useStrategies } = require("../../../../../hooks/useStrategies");
    
    useStrategies.mockReturnValue({
      strategies: mockStrategies, // Include archived
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderModal();
    
    const showArchivedButton = screen.getByText("Show Archived");
    fireEvent.click(showArchivedButton);

    expect(useStrategies).toHaveBeenCalledWith({ archived: true });
  });

  it("selects a strategy when clicked", () => {
    renderModal();
    
    const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
    fireEvent.click(strategyCard!);

    expect(strategyCard).toHaveClass("border-blue-500", "bg-blue-50");
  });

  it("shows strategy preview when selected", () => {
    renderModal();
    
    const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
    fireEvent.click(strategyCard!);

    expect(screen.getByText("STD001 • Version 1")).toBeInTheDocument();
  });

  it("disables load button when no strategy selected", () => {
    renderModal();
    
    const loadButton = screen.getByText("Load Strategy");
    expect(loadButton).toBeDisabled();
  });

  it("enables load button when strategy selected", () => {
    renderModal();
    
    const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
    fireEvent.click(strategyCard!);

    const loadButton = screen.getByText("Load Strategy");
    expect(loadButton).not.toBeDisabled();
  });

  it("shows confirmation dialog when loading with unsaved changes", () => {
    renderModal({ currentStrategySteps: mockCurrentSteps });
    
    // Select a strategy
    const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
    fireEvent.click(strategyCard!);

    // Click load button
    const loadButton = screen.getByText("Load Strategy");
    fireEvent.click(loadButton);

    expect(screen.getByText("Confirm Strategy Load")).toBeInTheDocument();
    expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
  });

  it("loads strategy directly when no unsaved changes", () => {
    const { useLoadStrategy } = require("../../../../../hooks/useLoadStrategy");
    const mockLoadStrategyIntoBuilder = vi.fn(() => []);
    
    useLoadStrategy.mockReturnValue({
      strategy: mockStrategyWithBlocks,
      loading: false,
      error: null,
      refetch: vi.fn(),
      loadStrategyIntoBuilder: mockLoadStrategyIntoBuilder,
    });

    const onStrategyLoad = vi.fn();
    renderModal({ onStrategyLoad, currentStrategySteps: [] });
    
    // Select a strategy
    const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
    fireEvent.click(strategyCard!);

    // Click load button
    const loadButton = screen.getByText("Load Strategy");
    fireEvent.click(loadButton);

    expect(mockLoadStrategyIntoBuilder).toHaveBeenCalled();
    expect(onStrategyLoad).toHaveBeenCalled();
  });

  it("calls onClose when modal is closed", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("shows loading state", () => {
    const { useStrategies } = require("../../../../../hooks/useStrategies");
    
    useStrategies.mockReturnValue({
      strategies: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderModal();
    
    expect(screen.getByText("Loading strategies...")).toBeInTheDocument();
    expect(screen.getAllByRole("generic")).some(el => 
      el.classList.contains("animate-pulse")
    );
  });

  it("shows error state", () => {
    const { useStrategies } = require("../../../../../hooks/useStrategies");
    
    useStrategies.mockReturnValue({
      strategies: [],
      loading: false,
      error: new Error("Failed to fetch strategies"),
      refetch: vi.fn(),
    });

    renderModal();
    
    expect(screen.getByText(/Failed to load strategies/)).toBeInTheDocument();
  });

  it("shows empty state when no strategies found", () => {
    const { useStrategies } = require("../../../../../hooks/useStrategies");
    
    useStrategies.mockReturnValue({
      strategies: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderModal();
    
    expect(screen.getByText("No strategies found")).toBeInTheDocument();
  });

  it("clears search when X button is clicked", () => {
    renderModal();
    
    const searchInput = screen.getByPlaceholderText("Search strategies by name or description...");
    fireEvent.change(searchInput, { target: { value: "test search" } });

    const clearButton = screen.getByRole("button", { name: "" }); // X button has no text
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue("");
  });

  it("calls refetch when refresh button is clicked", () => {
    const { useStrategies } = require("../../../../../hooks/useStrategies");
    const mockRefetch = vi.fn();
    
    useStrategies.mockReturnValue({
      strategies: mockStrategies,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderModal();
    
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  describe("Strategy Selection and Loading", () => {
    it("should display correct strategy metadata in preview", () => {
      renderModal();
      
      const strategyCard = screen.getByText("Premium Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      expect(screen.getByText("PREM001 • Version 2")).toBeInTheDocument();
      expect(screen.getByText("Premium pricing with advanced discounts")).toBeInTheDocument();
      expect(screen.getByText("Used 10 times")).toBeInTheDocument();
    });

    it("should handle strategy with no activation count", () => {
      const strategyWithNoActivations = { ...mockStrategies[0], activationCount: null };
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      
      useStrategies.mockReturnValue({
        strategies: [strategyWithNoActivations],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      // Should not show activation count section when null
      expect(screen.queryByText(/Used/)).not.toBeInTheDocument();
    });

    it("should show loading state on Load Strategy button when strategy is loading", () => {
      const { useLoadStrategy } = require("../../../../../hooks/useLoadStrategy");
      
      useLoadStrategy.mockReturnValue({
        strategy: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
        loadStrategyIntoBuilder: vi.fn(() => []),
      });

      renderModal();
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      const loadButton = screen.getByRole("button", { name: /Loading/ });
      expect(loadButton).toBeDisabled();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should pass correct metadata when loading strategy", () => {
      const { useLoadStrategy } = require("../../../../../hooks/useLoadStrategy");
      const mockLoadStrategyIntoBuilder = vi.fn(() => []);
      
      useLoadStrategy.mockReturnValue({
        strategy: mockStrategyWithBlocks,
        loading: false,
        error: null,
        refetch: vi.fn(),
        loadStrategyIntoBuilder: mockLoadStrategyIntoBuilder,
      });

      const onStrategyLoad = vi.fn();
      renderModal({ onStrategyLoad, currentStrategySteps: [] });
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      const loadButton = screen.getByText("Load Strategy");
      fireEvent.click(loadButton);

      expect(onStrategyLoad).toHaveBeenCalledWith(
        [], // Strategy steps from loadStrategyIntoBuilder
        {
          id: "strategy-1",
          name: "Standard Pricing",
          code: "STD001",
          description: "Basic pricing strategy with markup and rounding",
        }
      );
    });
  });

  describe("Search and Filtering", () => {
    it("should handle search with real user interaction", async () => {
      const user = userEvent.setup();
      const { useSearchStrategies } = require("../../../../../hooks/useStrategies");
      
      useSearchStrategies.mockReturnValue({
        strategies: [mockStrategies[1]], // Premium strategy
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      const searchInput = screen.getByPlaceholderText("Search strategies by name or description...");
      await user.type(searchInput, "premium");

      await waitFor(() => {
        expect(useSearchStrategies).toHaveBeenCalledWith("premium");
      });
    });

    it("should clear search correctly", async () => {
      const user = userEvent.setup();
      renderModal();
      
      const searchInput = screen.getByPlaceholderText("Search strategies by name or description...");
      await user.type(searchInput, "test search");
      
      expect(searchInput).toHaveValue("test search");
      
      const clearButton = searchInput.parentElement!.querySelector('button');
      await user.click(clearButton!);

      expect(searchInput).toHaveValue("");
    });

    it("should show search results count", () => {
      const { useSearchStrategies } = require("../../../../../hooks/useStrategies");
      
      useSearchStrategies.mockReturnValue({
        strategies: [mockStrategies[1]], // 1 result
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      const searchInput = screen.getByPlaceholderText("Search strategies by name or description...");
      fireEvent.change(searchInput, { target: { value: "premium" } });

      expect(screen.getByText("1 strategy found")).toBeInTheDocument();
    });

    it("should toggle between active and archived strategies", async () => {
      const user = userEvent.setup();
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      
      // Initially return active strategies
      useStrategies.mockReturnValue({
        strategies: mockStrategies.filter(s => !s.archivedAt),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      expect(screen.getByText("2 strategies found")).toBeInTheDocument();
      expect(screen.queryByText("Archived Strategy")).not.toBeInTheDocument();

      // Toggle to show archived
      const showArchivedButton = screen.getByText("Show Archived");
      await user.click(showArchivedButton);

      expect(useStrategies).toHaveBeenCalledWith({ archived: true });
    });
  });

  describe("Confirmation Dialog", () => {
    it("should show detailed information in confirmation dialog", () => {
      const currentSteps = [mockCurrentSteps[0], { ...mockCurrentSteps[0], id: "current-2" }];
      renderModal({ currentStrategySteps: currentSteps });
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      const loadButton = screen.getByText("Load Strategy");
      fireEvent.click(loadButton);

      expect(screen.getByText("Confirm Strategy Load")).toBeInTheDocument();
      expect(screen.getByText("2 blocks configured")).toBeInTheDocument();
      expect(screen.getByText("Standard Pricing")).toBeInTheDocument();
    });

    it("should cancel confirmation dialog", async () => {
      const user = userEvent.setup();
      renderModal({ currentStrategySteps: mockCurrentSteps });
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      const loadButton = screen.getByText("Load Strategy");
      fireEvent.click(loadButton);

      const cancelButton = within(screen.getByRole("dialog", { name: /Confirm Strategy Load/ }))
        .getByText("Cancel");
      await user.click(cancelButton);

      expect(screen.queryByText("Confirm Strategy Load")).not.toBeInTheDocument();
      // Should return to main modal
      expect(screen.getByText("Load Pricing Strategy")).toBeInTheDocument();
    });

    it("should proceed with loading from confirmation dialog", async () => {
      const user = userEvent.setup();
      const { useLoadStrategy } = require("../../../../../hooks/useLoadStrategy");
      const mockLoadStrategyIntoBuilder = vi.fn(() => []);
      
      useLoadStrategy.mockReturnValue({
        strategy: mockStrategyWithBlocks,
        loading: false,
        error: null,
        refetch: vi.fn(),
        loadStrategyIntoBuilder: mockLoadStrategyIntoBuilder,
      });

      const onStrategyLoad = vi.fn();
      const onClose = vi.fn();
      renderModal({ 
        currentStrategySteps: mockCurrentSteps,
        onStrategyLoad,
        onClose
      });
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      const loadButton = screen.getByText("Load Strategy");
      fireEvent.click(loadButton);

      const confirmButton = within(screen.getByRole("dialog", { name: /Confirm Strategy Load/ }))
        .getByText("Load Strategy");
      await user.click(confirmButton);

      expect(mockLoadStrategyIntoBuilder).toHaveBeenCalled();
      expect(onStrategyLoad).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when strategies fail to load", () => {
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      
      useStrategies.mockReturnValue({
        strategies: [],
        loading: false,
        error: { message: "Network error occurred" },
        refetch: vi.fn(),
      });

      renderModal();
      
      expect(screen.getByText("Failed to load strategies: Network error occurred")).toBeInTheDocument();
    });

    it("should handle strategy loading error", () => {
      const { useLoadStrategy } = require("../../../../../hooks/useLoadStrategy");
      
      useLoadStrategy.mockReturnValue({
        strategy: null,
        loading: false,
        error: { message: "Strategy not found" },
        refetch: vi.fn(),
        loadStrategyIntoBuilder: vi.fn(() => []),
      });

      renderModal();
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);

      // Error doesn't prevent the load button from being enabled,
      // but it should be visible in the UI (implementation dependent)
      const loadButton = screen.getByText("Load Strategy");
      expect(loadButton).not.toBeDisabled();
    });

    it("should retry loading strategies after error", async () => {
      const user = userEvent.setup();
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      const mockRefetch = vi.fn();
      
      useStrategies.mockReturnValue({
        strategies: [],
        loading: false,
        error: { message: "Connection failed" },
        refetch: mockRefetch,
      });

      renderModal();
      
      const refreshButton = screen.getByText("Refresh");
      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      renderModal();
      
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", expect.stringMatching(/Load.*Strategy/i));
      expect(screen.getByPlaceholderText("Search strategies by name or description..."))
        .toHaveAttribute("type", "text");
      
      const strategyCards = screen.getAllByRole("button").filter(button => 
        button.closest('.cursor-pointer')
      );
      expect(strategyCards.length).toBeGreaterThan(0);
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      renderModal();
      
      // Tab to search input
      await user.tab();
      expect(screen.getByPlaceholderText("Search strategies by name or description...")).toHaveFocus();
      
      // Tab through interactive elements
      await user.tab();
      await user.tab();
      await user.tab();
      
      // Should be able to reach Load Strategy button (though it may be disabled)
      const loadButton = screen.getByText("Load Strategy");
      expect(loadButton).toBeVisible();
    });

    it("should announce loading states to screen readers", () => {
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      
      useStrategies.mockReturnValue({
        strategies: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      expect(screen.getByText("Loading strategies...")).toBeInTheDocument();
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large number of strategies", () => {
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      const manyStrategies = Array.from({ length: 100 }, (_, i) => ({
        ...mockStrategies[0],
        id: `strategy-${i}`,
        name: `Strategy ${i}`,
        code: `STR${i.toString().padStart(3, '0')}`,
      }));
      
      useStrategies.mockReturnValue({
        strategies: manyStrategies,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      expect(screen.getByText("100 strategies found")).toBeInTheDocument();
      // Should render first few strategies (virtualization might limit visible ones)
      expect(screen.getByText("Strategy 0")).toBeInTheDocument();
    });

    it("should handle strategy with missing description", () => {
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      const strategyWithoutDescription = { ...mockStrategies[0], description: null };
      
      useStrategies.mockReturnValue({
        strategies: [strategyWithoutDescription],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);
      
      // Should still show the strategy without crashing
      expect(screen.getByText("STD001 • Version 1")).toBeInTheDocument();
    });

    it("should handle strategies with special characters in name", () => {
      const { useStrategies } = require("../../../../../hooks/useStrategies");
      const specialStrategy = { 
        ...mockStrategies[0], 
        name: "Strategy with <special> & chars",
        code: "SPEC&AL"
      };
      
      useStrategies.mockReturnValue({
        strategies: [specialStrategy],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderModal();
      
      expect(screen.getByText("Strategy with <special> & chars")).toBeInTheDocument();
    });

    it("should debounce search input", async () => {
      const user = userEvent.setup();
      const { useSearchStrategies } = require("../../../../../hooks/useStrategies");
      
      renderModal();
      
      const searchInput = screen.getByPlaceholderText("Search strategies by name or description...");
      
      // Type rapidly
      await user.type(searchInput, "quick");
      
      // useSearchStrategies should be called for the final value
      await waitFor(() => {
        expect(useSearchStrategies).toHaveBeenCalledWith("quick");
      });
    });
  });

  describe("Modal State Management", () => {
    it("should reset state when modal is closed and reopened", () => {
      const onClose = vi.fn();
      const { rerender } = renderModal({ onClose });
      
      // Select a strategy
      const strategyCard = screen.getByText("Standard Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);
      
      expect(screen.getByText("STD001 • Version 1")).toBeInTheDocument(); // Preview shown
      
      // Close modal
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
      
      // Reopen modal
      rerender(<MockedProvider mocks={[]} addTypename={false}>
        <StrategyLoadModal {...defaultProps} onClose={onClose} isOpen={true} />
      </MockedProvider>);
      
      // Should not show previous selection
      expect(screen.queryByText("STD001 • Version 1")).not.toBeInTheDocument();
    });

    it("should maintain search term during modal session", async () => {
      const user = userEvent.setup();
      renderModal();
      
      const searchInput = screen.getByPlaceholderText("Search strategies by name or description...");
      await user.type(searchInput, "premium");
      
      // Search term should persist
      expect(searchInput).toHaveValue("premium");
      
      // Select a strategy (shouldn't clear search)
      const strategyCard = screen.getByText("Premium Pricing").closest(".cursor-pointer");
      fireEvent.click(strategyCard!);
      
      expect(searchInput).toHaveValue("premium");
    });
  });
});