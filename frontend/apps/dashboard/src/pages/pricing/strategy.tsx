import { DragDropContext } from "@hello-pangea/dnd";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import React, { useState } from "react";
import { usePricingBlocks } from "../../hooks/usePricingBlocks";
import { StepConfigurationModal } from "./components/modals";
import {
  AvailableBlocksSidebar,
  StrategyFlowBuilder,
  StrategyHeader,
} from "./components/strategy";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { Block, StrategyStep } from "./types";
import { mapDatabaseBlocksToUI } from "./utils/mapDatabaseBlocksToUI";

const StrategyPage: React.FC = () => {
  const [strategyName, setStrategyName] = useState<string>("New Strategy #1");
  const [strategyDescription, setStrategyDescription] = useState<string>(
    "Add a description for your pricing strategy..."
  );
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] =
    useState<boolean>(false);
  
  // State for tracking loaded strategy
  const [loadedStrategyId, setLoadedStrategyId] = useState<string | undefined>();
  const [loadedStrategyCode, setLoadedStrategyCode] = useState<string | undefined>();
  
  // State for notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    details?: string;
  } | null>(null);

  // Fetch pricing blocks from database (includes fallback logic in resolver)
  const { blocks: databaseBlocks, loading: blocksLoading, error: blocksError } = usePricingBlocks({
    isActive: true // Only show active blocks by default
  });

  // Map database blocks to UI format with icons and colors
  const allBlocks = mapDatabaseBlocksToUI(databaseBlocks);
  
  // Notification helpers
  const showNotification = (type: 'success' | 'error' | 'warning', message: string, details?: string) => {
    setNotification({ type, message, details });
    // Auto-dismiss after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };
  
  const dismissNotification = () => {
    setNotification(null);
  };

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
  } = useDragAndDrop(allBlocks, showNotification);

  // Handle strategy loading
  const handleLoadStrategy = (strategyBlocks: Block[], strategyMetadata?: { id: string; name: string; code: string; description?: string }) => {
    try {
      // Validate input
      if (!Array.isArray(strategyBlocks)) {
        console.error('Invalid strategy blocks data:', strategyBlocks);
        showNotification('error', 'Failed to load strategy', 'Invalid strategy data format');
        return;
      }

      if (strategyBlocks.length === 0) {
        showNotification('warning', 'Empty strategy loaded', 'The selected strategy contains no blocks');
        return;
      }

      // Filter out blocks that don't exist in available blocks or have issues
      const invalidBlocks: string[] = [];
      const validBlocks = strategyBlocks.filter(block => {
        if (!block || !block.type || !block.name) {
          console.warn('Invalid block detected, skipping:', block);
          invalidBlocks.push(block?.type || 'Unknown');
          return false;
        }
        
        // Check if the block type exists in available blocks
        const availableBlock = allBlocks.find(ab => ab.type === block.type);
        if (!availableBlock) {
          console.warn(`Block type "${block.type}" not found in available blocks, skipping`);
          invalidBlocks.push(block.type);
          return false;
        }
        
        return true;
      });

      if (validBlocks.length === 0) {
        showNotification('error', 'Strategy cannot be loaded', 'None of the blocks in this strategy are available');
        return;
      }

      // Show warning if some blocks were skipped
      if (invalidBlocks.length > 0) {
        showNotification('warning', 
          `Strategy partially loaded (${invalidBlocks.length} blocks skipped)`,
          `Skipped blocks: ${invalidBlocks.join(', ')}`
        );
      }

      // Convert valid Block[] to StrategyStep[] by adding uniqueId and config
      const loadedSteps: StrategyStep[] = validBlocks.map((block, index) => ({
        ...block,
        uniqueId: `${block.type}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
        config: {
          ...block.params,
          ...block.config,
          priority: block.config?.priority || index + 1,
        },
      }));
      
      // Sort by priority if available
      loadedSteps.sort((a, b) => {
        const priorityA = a.config?.priority || 999;
        const priorityB = b.config?.priority || 999;
        return priorityA - priorityB;
      });
      
      setStrategySteps(loadedSteps);
      
      if (strategyMetadata) {
        // Use actual strategy metadata when available
        setLoadedStrategyId(strategyMetadata.id);
        setLoadedStrategyCode(strategyMetadata.code);
        setStrategyName(strategyMetadata.name || 'Loaded Strategy');
        if (strategyMetadata.description) {
          setStrategyDescription(strategyMetadata.description);
        }
      } else {
        // Fallback for when metadata isn't available
        setLoadedStrategyId(`strategy-${Date.now()}`);
        setLoadedStrategyCode(`STR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
        setStrategyName('Loaded Strategy');
      }

      // Show success notification
      const strategyNameDisplay = strategyMetadata?.name || 'Unknown Strategy';
      if (invalidBlocks.length === 0) {
        showNotification('success', 
          `Strategy "${strategyNameDisplay}" loaded successfully`,
          `${loadedSteps.length} blocks loaded`
        );
      }
      
      console.log(`Successfully loaded strategy with ${loadedSteps.length} blocks`);
      
    } catch (error) {
      console.error('Error loading strategy:', error);
      showNotification('error', 'Failed to load strategy', 'An unexpected error occurred while loading the strategy');
    }
  };

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

        {/* Notification component */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 ${
            notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
            'bg-yellow-50 border-yellow-400 text-yellow-800'
          }`}>
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : notification.type === 'error' ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{notification.message}</h4>
                {notification.details && (
                  <p className="text-sm opacity-80">{notification.details}</p>
                )}
              </div>
              <button
                onClick={dismissNotification}
                className="ml-4 text-sm opacity-70 hover:opacity-100 focus:outline-none"
              >
                ×
              </button>
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
              onLoadStrategy={handleLoadStrategy}
              currentStrategySteps={strategySteps}
              loadedStrategyId={loadedStrategyId}
              loadedStrategyCode={loadedStrategyCode}
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
                  onClick={() => {
                    const blockCount = strategySteps.length;
                    setStrategySteps([]);
                    setLoadedStrategyId(undefined);
                    setLoadedStrategyCode(undefined);
                    setStrategyName("New Strategy #1");
                    setStrategyDescription("Add a description for your pricing strategy...");
                    if (blockCount > 0) {
                      showNotification('success', 'Strategy cleared', `${blockCount} blocks removed`);
                    }
                  }}
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
