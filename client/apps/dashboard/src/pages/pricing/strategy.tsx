import { DragDropContext } from "@hello-pangea/dnd";
import React, { useState } from "react";
import {
  AvailableBlocksSidebar,
  StrategyFlowBuilder,
  StrategyHeader,
} from "./components/strategy";
import { StepConfigurationModal } from "./components/modals";
import { availableBlocks } from "./constants";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { usePricingBlocks } from "../../hooks/usePricingBlocks";
import { mapDatabaseBlocksToUI } from "./utils/mapDatabaseBlocksToUI";

const StrategyPage: React.FC = () => {
  const [strategyName, setStrategyName] = useState<string>("New Strategy #1");
  const [strategyDescription, setStrategyDescription] = useState<string>(
    "Add a description for your pricing strategy..."
  );
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] =
    useState<boolean>(false);

  // Fetch pricing blocks from database (includes fallback logic in resolver)
  const { blocks: databaseBlocks, loading: blocksLoading, error: blocksError } = usePricingBlocks({
    isActive: true // Only show active blocks by default
  });

  // Map database blocks to UI format with icons and colors
  const allBlocks = mapDatabaseBlocksToUI(databaseBlocks);

  const {
    strategySteps,
    setStrategySteps,
    selectedStep,
    setSelectedStep,
    editingStep,
    setEditingStep,
    tempConfig,
    setTempConfig,
    handleDragEnd,
    removeStep,
    openEditModal,
    saveStepConfig,
  } = useDragAndDrop(allBlocks);

  // Filter out blocks that are already used in the strategy (after hook initialization)
  const usedBlockTypes = new Set(strategySteps.map(step => step.type));
  const availableBlocksForSidebar = allBlocks.filter(block => !usedBlockTypes.has(block.type));

  // Show loading state for blocks
  if (blocksLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pricing blocks...</p>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex gap-4">
        {/* Show error state if database fails but we have fallback */}
        {blocksError && (
          <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center">
              <span className="text-sm">
                Using fallback blocks - database unavailable
              </span>
            </div>
          </div>
        )}

        {/* Left Sidebar - Available Blocks */}
        <AvailableBlocksSidebar availableBlocks={availableBlocksForSidebar} />

        {/* Right Column - Strategy Flow Builder */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <div className="max-w-4xl mx-auto">
            <StrategyHeader
              strategyName={strategyName}
              setStrategyName={setStrategyName}
              strategyDescription={strategyDescription}
              setStrategyDescription={setStrategyDescription}
              isEditingName={isEditingName}
              setIsEditingName={setIsEditingName}
              isEditingDescription={isEditingDescription}
              setIsEditingDescription={setIsEditingDescription}
            />

            <StrategyFlowBuilder
              strategySteps={strategySteps}
              selectedStep={selectedStep}
              setSelectedStep={setSelectedStep}
              removeStep={removeStep}
              openEditModal={openEditModal}
              setStrategySteps={setStrategySteps}
            />

            {strategySteps.length > 0 && (
              <div className="mt-6 flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Strategy
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Test Strategy
                </button>
                <button
                  onClick={() => setStrategySteps([])}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <StepConfigurationModal
        editingStep={editingStep}
        setEditingStep={setEditingStep}
        tempConfig={tempConfig}
        setTempConfig={setTempConfig}
        saveStepConfig={saveStepConfig}
      />
    </DragDropContext>
  );
};

export default StrategyPage;
