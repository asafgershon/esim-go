import React from "react";

export interface Block {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  params?: Record<string, any>;
  disabled?: boolean;
}

export interface StrategyStep extends Block {
  uniqueId: string;
  config?: {
    [key: string]: any;
  };
}

export interface MarkupConfigurationModalProps {
  tempConfig: { [key: string]: any };
  setTempConfig: (config: { [key: string]: any }) => void;
}

export interface CouponConfigurationModalProps {
  tempConfig: { [key: string]: any };
  setTempConfig: (config: { [key: string]: any }) => void;
}

export interface StrategyHeaderProps {
  strategyName: string;
  setStrategyName: (name: string) => void;
  strategyDescription: string;
  setStrategyDescription: (description: string) => void;
  isEditingName: boolean;
  setIsEditingName: (editing: boolean) => void;
  isEditingDescription: boolean;
  setIsEditingDescription: (editing: boolean) => void;
  // New props for strategy loading
  onLoadStrategy: (strategyBlocks: Block[], metadata?: { id: string; name: string; code: string; description?: string }) => void;
  currentStrategySteps: Block[];
  loadedStrategyId?: string;
  loadedStrategyCode?: string;
}

export interface AvailableBlocksSidebarProps {
  availableBlocks: Block[];
}

export interface StrategyFlowBuilderProps {
  strategySteps: StrategyStep[];
  selectedStep: string | null;
  setSelectedStep: (stepId: string | null) => void;
  removeStep: (uniqueId: string) => void;
  openEditModal: (step: StrategyStep) => void;
  setStrategySteps: React.Dispatch<React.SetStateAction<StrategyStep[]>>;
}

export interface StepConfigurationModalProps {
  editingStep: StrategyStep | null;
  setEditingStep: (step: StrategyStep | null) => void;
  tempConfig: { [key: string]: any };
  setTempConfig: (config: { [key: string]: any }) => void;
  saveStepConfig: () => void;
  cancelEditModal?: () => void;
}

export interface StrategyLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStrategyLoad: (strategyBlocks: Block[], metadata?: { id: string; name: string; code: string; description?: string }) => void;
  currentStrategySteps: Block[];
}