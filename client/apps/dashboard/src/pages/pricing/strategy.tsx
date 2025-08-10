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

const StrategyPage: React.FC = () => {
  const [strategyName, setStrategyName] = useState<string>("New Strategy #1");
  const [strategyDescription, setStrategyDescription] = useState<string>(
    "Add a description for your pricing strategy..."
  );
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] =
    useState<boolean>(false);

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
  } = useDragAndDrop();

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex gap-4">
        {/* Left Sidebar - Available Blocks */}
        <AvailableBlocksSidebar availableBlocks={availableBlocks} />

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
