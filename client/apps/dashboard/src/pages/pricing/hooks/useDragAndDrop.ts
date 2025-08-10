import { DropResult } from "@hello-pangea/dnd";
import { useState } from "react";
import { availableBlocks } from "../constants/blocks";
import { getDefaultConfig } from "../constants/defaultConfigs";
import { StrategyStep } from "../types";

export const useDragAndDrop = () => {
  const [strategySteps, setStrategySteps] = useState<StrategyStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<StrategyStep | null>(null);
  const [tempConfig, setTempConfig] = useState<{ [key: string]: any }>({});

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (
      source.droppableId === "available-blocks" &&
      destination.droppableId === "strategy-flow"
    ) {
      // Adding a new block to the strategy
      const block = availableBlocks.find((b) => b.id === result.draggableId);
      if (block) {
        const newStep: StrategyStep = {
          ...block,
          uniqueId: `${block.id}-${Date.now()}`,
        };
        const newSteps = [...strategySteps];
        newSteps.splice(destination.index, 0, newStep);
        setStrategySteps(newSteps);
      }
    } else if (
      source.droppableId === "strategy-flow" &&
      destination.droppableId === "strategy-flow"
    ) {
      // Reordering within the strategy
      const newSteps = Array.from(strategySteps);
      const [removed] = newSteps.splice(source.index, 1);
      newSteps.splice(destination.index, 0, removed);
      setStrategySteps(newSteps);
    }
  };

  const removeStep = (uniqueId: string) => {
    setStrategySteps((steps) =>
      steps.filter((step) => step.uniqueId !== uniqueId)
    );
    if (selectedStep === uniqueId) {
      setSelectedStep(null);
    }
  };

  const openEditModal = (step: StrategyStep) => {
    setEditingStep(step);
    setTempConfig(step.config || getDefaultConfig(step.type));
  };

  const saveStepConfig = () => {
    if (!editingStep) return;

    setStrategySteps((steps) =>
      steps.map((step) =>
        step.uniqueId === editingStep.uniqueId
          ? { ...step, config: tempConfig }
          : step
      )
    );
    setEditingStep(null);
    setTempConfig({});
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