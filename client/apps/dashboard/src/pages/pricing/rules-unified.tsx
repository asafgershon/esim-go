import React, { useState, useCallback, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui';
import { 
  Settings, 
  Target, 
  CreditCard,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  TestTube,
  X
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_PRICING_RULES } from '../../lib/graphql/queries';

// Import existing components
import RulesPage from './rules';
import { MarkupTableManagement } from '../../components/markup-table-management';
import { ProcessingFeeManagement } from '../../components/processing-fee-management';
import { RuleTestingPanel } from '../../components/pricing/rule-testing-panel';

const UnifiedPricingRulesPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('rules');
  const [showTestingPanel, setShowTestingPanel] = useState(false);
  const [testingPanelWidth, setTestingPanelWidth] = useState(480); // Default width
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Changed to lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Query for rules data to pass to testing panel
  const { data: rulesData } = useQuery(GET_PRICING_RULES);
  const rules = rulesData?.pricingRules || [];

  // Toggle testing panel
  const toggleTestingPanel = useCallback(() => {
    setShowTestingPanel(prev => !prev);
  }, []);

  // Handle panel resize
  const handlePanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = testingPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth - (e.clientX - startX);
      setTestingPanelWidth(Math.min(Math.max(newWidth, 320), 800)); // Min 320px, max 800px
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [testingPanelWidth]);

  // Render content
  if (isMobile) {
    // Mobile: Use Sheet component for testing panel
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricing Rules Management</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive pricing rule management
            </p>
          </div>
          <Button
            variant={showTestingPanel ? 'default' : 'outline'}
            size="sm"
            onClick={toggleTestingPanel}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Test
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules" className="flex items-center gap-1 text-xs">
              <Settings className="h-3 w-3" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="markup" className="flex items-center gap-1 text-xs">
              <Target className="h-3 w-3" />
              Markup
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-1 text-xs">
              <CreditCard className="h-3 w-3" />
              Fees
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="rules" className="space-y-4">
            <RulesPage />
          </TabsContent>
          <TabsContent value="markup" className="space-y-4">
            <MarkupTableManagement />
          </TabsContent>
          <TabsContent value="processing" className="space-y-4">
            <ProcessingFeeManagement />
          </TabsContent>
        </Tabs>

        {/* Mobile Testing Panel Sheet */}
        <Sheet open={showTestingPanel} onOpenChange={setShowTestingPanel}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Rule Testing Panel</SheetTitle>
            </SheetHeader>
            <div className="mt-4 h-full overflow-y-auto pb-20">
              <RuleTestingPanel rules={rules} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop: Split view layout
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Rules Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive pricing rule management including system rules, markup configuration, and processing fees
          </p>
        </div>
        <Button
          variant={showTestingPanel ? 'default' : 'outline'}
          size="sm"
          onClick={toggleTestingPanel}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          {showTestingPanel ? 'Hide' : 'Show'} Testing Panel
        </Button>
      </div>

      {/* Main content with split view */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300`}>
          {/* Main Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Rules Engine
              </TabsTrigger>
              <TabsTrigger value="markup" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Markup Configuration
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Processing Fees
              </TabsTrigger>
            </TabsList>

            {/* Rules Engine Tab */}
            <TabsContent value="rules" className="flex-1 flex flex-col space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Rules Engine Overview</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Create and manage complex pricing rules with conditions and actions. 
                      Rules are processed in priority order and can handle dynamic pricing scenarios.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <RulesPage />
              </div>
            </TabsContent>

            {/* Markup Configuration Tab */}
            <TabsContent value="markup" className="flex-1 flex flex-col space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-green-900">Markup Configuration</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Configure fixed markup amounts for different bundle groups and durations. 
                      These create system-level pricing rules automatically.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <MarkupTableManagement />
              </div>
            </TabsContent>

            {/* Processing Fees Tab */}
            <TabsContent value="processing" className="flex-1 flex flex-col space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-purple-900">Processing Fees Configuration</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Manage payment processing rates and fees. Critical fields automatically update pricing rules 
                      that affect final customer pricing.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ProcessingFeeManagement />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Testing Panel - Integrated split view */}
        {showTestingPanel && (
          <div 
            className="relative border-l bg-background flex flex-col"
            style={{ width: `${testingPanelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 h-full w-1 cursor-ew-resize hover:bg-blue-500 transition-colors z-10"
              onMouseDown={handlePanelResize}
              style={{ marginLeft: '-2px' }}
            />
            
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Rule Testing Panel</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTestingPanel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Testing Panel Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <RuleTestingPanel rules={rules} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedPricingRulesPage;