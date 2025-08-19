/**
 * Example usage of StrategyLoadModal component
 * This demonstrates how to integrate the modal with the strategy builder
 */

import React, { useState } from "react";
import { Button } from "@workspace/ui";
import { Download } from "lucide-react";
import StrategyLoadModal from "../pages/pricing/components/modals/StrategyLoadModal";
import { Block } from "../pages/pricing/types";

const StrategyBuilderWithLoadModal: React.FC = () => {
  const [strategySteps, setStrategySteps] = useState<Block[]>([]);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  // Handler when a strategy is loaded from the modal
  const handleStrategyLoad = (strategyBlocks: Block[]) => {
    setStrategySteps(strategyBlocks);
    console.log("Strategy loaded with blocks:", strategyBlocks);
  };

  // Handler to open the load modal
  const handleOpenLoadModal = () => {
    setIsLoadModalOpen(true);
  };

  // Handler to close the load modal
  const handleCloseLoadModal = () => {
    setIsLoadModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Strategy Builder</h1>
        
        <Button
          onClick={handleOpenLoadModal}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Load Strategy
        </Button>
      </div>

      {/* Current strategy display */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium mb-3">Current Strategy</h3>
        {strategySteps.length === 0 ? (
          <p className="text-gray-500 text-sm">No blocks configured</p>
        ) : (
          <div className="space-y-2">
            {strategySteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                <span className="text-sm font-medium">{index + 1}.</span>
                <div className="text-gray-600">{step.icon}</div>
                <div>
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Load Modal */}
      <StrategyLoadModal
        isOpen={isLoadModalOpen}
        onClose={handleCloseLoadModal}
        onStrategyLoad={handleStrategyLoad}
        currentStrategySteps={strategySteps}
      />
    </div>
  );
};

export default StrategyBuilderWithLoadModal;

/**
 * Integration Notes:
 * 
 * 1. Import the modal component:
 *    import StrategyLoadModal from "./components/modals/StrategyLoadModal";
 * 
 * 2. Add state for modal visibility:
 *    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
 * 
 * 3. Add handlers for modal actions:
 *    const handleStrategyLoad = (blocks) => { 
 *      // Update your strategy state 
 *    };
 *    const handleOpenLoadModal = () => setIsLoadModalOpen(true);
 *    const handleCloseLoadModal = () => setIsLoadModalOpen(false);
 * 
 * 4. Add modal to your JSX:
 *    <StrategyLoadModal
 *      isOpen={isLoadModalOpen}
 *      onClose={handleCloseLoadModal}
 *      onStrategyLoad={handleStrategyLoad}
 *      currentStrategySteps={currentSteps}
 *    />
 * 
 * 5. Add trigger button:
 *    <Button onClick={handleOpenLoadModal}>Load Strategy</Button>
 * 
 * The modal will:
 * - Display all available strategies with search and filter capabilities
 * - Show strategy metadata including name, description, version, block count
 * - Handle loading and error states gracefully
 * - Warn users before overwriting unsaved changes
 * - Load the selected strategy blocks into your builder state
 */