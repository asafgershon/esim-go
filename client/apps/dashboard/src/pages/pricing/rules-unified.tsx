import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui';
import { 
  Settings, 
  Target, 
  CreditCard,
  AlertCircle 
} from 'lucide-react';

// Import existing components
import RulesPage from './rules';
import { MarkupTableManagement } from '../../components/markup-table-management';
import { ProcessingFeeManagement } from '../../components/processing-fee-management';

const UnifiedPricingRulesPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('rules');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Rules Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive pricing rule management including system rules, markup configuration, and processing fees
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
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
        <TabsContent value="rules" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
          <RulesPage />
        </TabsContent>

        {/* Markup Configuration Tab */}
        <TabsContent value="markup" className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
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
          <MarkupTableManagement />
        </TabsContent>

        {/* Processing Fees Tab */}
        <TabsContent value="processing" className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
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
          <ProcessingFeeManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedPricingRulesPage;