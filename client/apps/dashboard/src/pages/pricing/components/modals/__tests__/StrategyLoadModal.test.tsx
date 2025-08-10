import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { vi } from "vitest";
import StrategyLoadModal from "../StrategyLoadModal";
import { GET_PRICING_STRATEGIES } from "../../../../../graphql/queries/strategies";
import { Block } from "../../../types";

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
    const { useStrategies, useSearchStrategies } = require("../../../../../hooks/useStrategies");
    const { useLoadStrategy } = require("../../../../../hooks/useLoadStrategy");

    useStrategies.mockReturnValue({
      strategies: mockStrategies.filter(s => !s.archivedAt),
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    useSearchStrategies.mockReturnValue({
      strategies: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    useLoadStrategy.mockReturnValue({
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
});