// Strategy types
export * from './strategies';

// Re-export existing pricing types for backward compatibility
export type {
  Block,
  StrategyStep,
  MarkupConfigurationModalProps,
  CouponConfigurationModalProps,
  StrategyHeaderProps,
  AvailableBlocksSidebarProps,
  StrategyFlowBuilderProps,
  StepConfigurationModalProps,
} from '../pages/pricing/types';