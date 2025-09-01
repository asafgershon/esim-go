import { DropResult } from "@hello-pangea/dnd";
import { useState } from "react";
import { getDefaultConfig } from "../constants/defaultConfigs";
import { StrategyStep, Block } from "../types";

export const useDragAndDrop = (blocks: Block[], onNotification?: (type: 'success' | 'error' | 'warning', message: string, details?: string) => void) => {
  const [strategySteps, setStrategySteps] = useState<StrategyStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<StrategyStep | null>(null);
  const [tempConfig, setTempConfig] = useState<{ [key: string]: any }>({});

  const handleDragEnd = (result: DropResult) => {
    try {
      if (!result.destination) return;

      const { source, destination } = result;

      if (
        source.droppableId === "available-blocks" &&
        destination.droppableId === "strategy-flow"
      ) {
        // Adding a new block to the strategy
        const block = blocks.find((b) => b.id === result.draggableId);
        if (!block) {
          console.warn(`Block with ID "${result.draggableId}" not found`);
          return;
        }

        // Check if this block type is already in the strategy
        const isBlockTypeAlreadyUsed = strategySteps.some(step => step.type === block.type);
        
        if (isBlockTypeAlreadyUsed) {
          // Block type already exists, don't add it again
          console.log(`Block type "${block.type}" is already in the strategy`);
          onNotification?.('warning', 'Block already exists', `A "${block.name}" block is already in your strategy`);
          return;
        }

        // Validate destination index
        if (destination.index < 0 || destination.index > strategySteps.length) {
          console.warn(`Invalid destination index: ${destination.index}`);
          return;
        }

        const newStep: StrategyStep = {
          ...block,
          uniqueId: `${block.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          config: block.params || {},
        };
        
        const newSteps = [...strategySteps];
        
        // Provider selection blocks always go first (priority 100)
        if (block.type === "provider-selection") {
          newSteps.unshift(newStep);
          onNotification?.('success', 'Provider selection added', 'Provider selection block added at the beginning (priority 100)');
        } else {
          newSteps.splice(destination.index, 0, newStep);
        }
        
        setStrategySteps(newSteps);
        
        console.log(`Added block "${block.type}" to strategy at position ${destination.index}`);
        
      } else if (
        source.droppableId === "strategy-flow" &&
        destination.droppableId === "strategy-flow"
      ) {
        // Reordering within the strategy
        if (source.index === destination.index) {
          // No change needed
          return;
        }

        // Validate indices
        if (source.index < 0 || source.index >= strategySteps.length ||
            destination.index < 0 || destination.index >= strategySteps.length) {
          console.warn(`Invalid drag indices: source=${source.index}, dest=${destination.index}, length=${strategySteps.length}`);
          return;
        }

        const newSteps = Array.from(strategySteps);
        const [removed] = newSteps.splice(source.index, 1);
        newSteps.splice(destination.index, 0, removed);
        setStrategySteps(newSteps);
        
        console.log(`Reordered block from position ${source.index} to ${destination.index}`);
      }
    } catch (error) {
      console.error('Error handling drag and drop:', error);
      // Don't update state if there's an error
    }
  };

  const removeStep = (uniqueId: string) => {
    try {
      if (!uniqueId) {
        console.warn('Invalid uniqueId provided to removeStep');
        return;
      }

      setStrategySteps((steps) => {
        const updatedSteps = steps.filter((step) => step.uniqueId !== uniqueId);
        console.log(`Removed step with ID "${uniqueId}". Remaining steps: ${updatedSteps.length}`);
        return updatedSteps;
      });
      
      if (selectedStep === uniqueId) {
        setSelectedStep(null);
      }
    } catch (error) {
      console.error('Error removing step:', error);
    }
  };

  const openEditModal = (step: StrategyStep) => {
    try {
      if (!step || !step.uniqueId) {
        console.warn('Invalid step provided to openEditModal');
        return;
      }

      setEditingStep(step);
      setTempConfig(step.config || getDefaultConfig(step.type));
      console.log(`Opening edit modal for step: ${step.type}`);
    } catch (error) {
      console.error('Error opening edit modal:', error);
    }
  };

  const saveStepConfig = () => {
    try {
      if (!editingStep || !editingStep.uniqueId) {
        console.warn('No editing step available to save');
        return;
      }

      setStrategySteps((steps) =>
        steps.map((step) =>
          step.uniqueId === editingStep.uniqueId
            ? { ...step, config: { ...tempConfig } }
            : step
        )
      );
      
      console.log(`Saved configuration for step: ${editingStep.type}`);
      setEditingStep(null);
      setTempConfig({});
    } catch (error) {
      console.error('Error saving step config:', error);
      // Don't clear the modal if there's an error, so user can retry
    }
  };

  return {
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
  };
};