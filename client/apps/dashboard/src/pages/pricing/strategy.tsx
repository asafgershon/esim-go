import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@workspace/ui';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  CreditCard,
  Target,
  Globe,
  Plus,
  Trash2,
  ChevronRight,
  Settings,
  Edit2,
  Check,
  X,
  Pencil
} from 'lucide-react';

interface Block {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  params?: Record<string, any>;
}

interface StrategyStep extends Block {
  uniqueId: string;
  config?: {
    [key: string]: any;
  };
}

const availableBlocks: Block[] = [
  {
    id: 'discount',
    type: 'discount',
    name: 'Discount',
    description: 'Apply percentage or fixed discount',
    icon: <Percent className="h-4 w-4" />,
    color: 'bg-green-100 border-green-300 text-green-800',
  },
  {
    id: 'markup',
    type: 'markup',
    name: 'Markup',
    description: 'Add markup to base price',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  {
    id: 'fixed-price',
    type: 'fixed-price',
    name: 'Fixed Price',
    description: 'Set a fixed price for the bundle',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  {
    id: 'processing-fee',
    type: 'processing-fee',
    name: 'Processing Fee',
    description: 'Calculate payment processing fees',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'bg-orange-100 border-orange-300 text-orange-800',
  },
  {
    id: 'keep-profit',
    type: 'keep-profit',
    name: 'Keep Profit',
    description: 'Maintain minimum profit margin',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-red-100 border-red-300 text-red-800',
  },
  {
    id: 'psychological-rounding',
    type: 'psychological-rounding',
    name: 'Psychological Rounding',
    description: 'Apply charm pricing (e.g., $9.99)',
    icon: <Calculator className="h-4 w-4" />,
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
  },
  {
    id: 'region-rounding',
    type: 'region-rounding',
    name: 'Region Rounding',
    description: 'Apply region-specific rounding rules',
    icon: <Globe className="h-4 w-4" />,
    color: 'bg-teal-100 border-teal-300 text-teal-800',
  },
];

const StrategyPage: React.FC = () => {
  const [strategySteps, setStrategySteps] = useState<StrategyStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState<string>('New Strategy #1');
  const [strategyDescription, setStrategyDescription] = useState<string>('Add a description for your pricing strategy...');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [editingStep, setEditingStep] = useState<StrategyStep | null>(null);
  const [tempConfig, setTempConfig] = useState<{ [key: string]: any }>({});

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'available-blocks' && destination.droppableId === 'strategy-flow') {
      // Adding a new block to the strategy
      const block = availableBlocks.find(b => b.id === result.draggableId);
      if (block) {
        const newStep: StrategyStep = {
          ...block,
          uniqueId: `${block.id}-${Date.now()}`,
        };
        const newSteps = [...strategySteps];
        newSteps.splice(destination.index, 0, newStep);
        setStrategySteps(newSteps);
      }
    } else if (source.droppableId === 'strategy-flow' && destination.droppableId === 'strategy-flow') {
      // Reordering within the strategy
      const newSteps = Array.from(strategySteps);
      const [removed] = newSteps.splice(source.index, 1);
      newSteps.splice(destination.index, 0, removed);
      setStrategySteps(newSteps);
    }
  };

  const removeStep = (uniqueId: string) => {
    setStrategySteps(steps => steps.filter(step => step.uniqueId !== uniqueId));
    if (selectedStep === uniqueId) {
      setSelectedStep(null);
    }
  };

  const openEditModal = (step: StrategyStep) => {
    setEditingStep(step);
    setTempConfig(step.config || getDefaultConfig(step.type));
  };

  const getDefaultConfig = (type: string): { [key: string]: any } => {
    switch (type) {
      case 'discount':
        return {
          type: 'percentage',
          value: 10,
          condition: 'always',
          minDays: 7,
        };
      case 'markup':
        return {
          type: 'percentage',
          value: 20,
          applyTo: 'all',
        };
      case 'fixed-price':
        return {
          basePrice: 0,
          currency: 'USD',
        };
      case 'processing-fee':
        return {
          paymentMethod: 'card',
          feePercentage: 2.9,
          fixedFee: 0.30,
        };
      case 'keep-profit':
        return {
          minProfit: 15,
          type: 'percentage',
        };
      case 'psychological-rounding':
        return {
          strategy: 'charm',
          roundTo: 0.99,
        };
      case 'region-rounding':
        return {
          region: 'us',
          roundingRule: 'nearest-dollar',
        };
      default:
        return {};
    }
  };

  const saveStepConfig = () => {
    if (!editingStep) return;
    
    setStrategySteps(steps => 
      steps.map(step => 
        step.uniqueId === editingStep.uniqueId 
          ? { ...step, config: tempConfig }
          : step
      )
    );
    setEditingStep(null);
    setTempConfig({});
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex gap-4">
        {/* Left Sidebar - Available Blocks */}
        <div className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Available Blocks
            </h3>
            
            <Droppable droppableId="available-blocks" isDropDisabled={true}>
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {availableBlocks.map((block, index) => (
                    <Draggable 
                      key={block.id} 
                      draggableId={block.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? provided.draggableProps.style?.transform 
                              : 'none',
                          }}
                        >
                          <Card className={`p-3 cursor-move transition-all hover:shadow-md ${block.color} border-2 ${
                            snapshot.isDragging ? 'opacity-50' : ''
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{block.icon}</div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{block.name}</h4>
                                <p className="text-xs opacity-75 mt-1">{block.description}</p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Drag blocks to the right to build your pricing strategy. 
                The blocks will be executed in order from top to bottom.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Strategy Flow Builder */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <div className="max-w-4xl mx-auto">
            {/* Editable Strategy Name */}
            <div className="mb-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingName(false);
                      if (e.key === 'Escape') {
                        setStrategyName('New Strategy #1');
                        setIsEditingName(false);
                      }
                    }}
                    className="text-2xl font-bold border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1 hover:bg-green-100 rounded text-green-600"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setStrategyName('New Strategy #1');
                      setIsEditingName(false);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h2 
                  className="text-2xl font-bold inline-flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -ml-2"
                  onClick={() => setIsEditingName(true)}
                >
                  {strategyName}
                  <Edit2 className="h-4 w-4 text-gray-400" />
                </h2>
              )}
            </div>

            {/* Editable Strategy Description */}
            <div className="mb-6">
              {isEditingDescription ? (
                <div className="flex items-start gap-2">
                  <textarea
                    value={strategyDescription}
                    onChange={(e) => setStrategyDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setStrategyDescription('Add a description for your pricing strategy...');
                        setIsEditingDescription(false);
                      }
                    }}
                    className="flex-1 text-gray-600 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingDescription(false)}
                    className="p-1 hover:bg-green-100 rounded text-green-600"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setStrategyDescription('Add a description for your pricing strategy...');
                      setIsEditingDescription(false);
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <p 
                  className="text-gray-600 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -ml-2 inline-flex items-center gap-2"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {strategyDescription}
                  <Edit2 className="h-3 w-3 text-gray-400" />
                </p>
              )}
            </div>
            
            <Droppable droppableId="strategy-flow">
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className={`min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {strategySteps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                      <Plus className="h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">Start building your strategy</p>
                      <p className="text-sm mt-2">Drag blocks from the left sidebar here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {strategySteps.map((step, index) => (
                        <React.Fragment key={step.uniqueId}>
                          {index > 0 && (
                            <div className="flex justify-center">
                              <ChevronRight className="h-5 w-5 text-gray-400 rotate-90" />
                            </div>
                          )}
                          
                          <Draggable draggableId={step.uniqueId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`group relative ${snapshot.isDragging ? 'z-50' : ''}`}
                              >
                                <Card className={`p-4 cursor-move transition-all ${
                                  selectedStep === step.uniqueId 
                                    ? 'ring-2 ring-blue-500 shadow-lg' 
                                    : 'hover:shadow-md'
                                } ${step.color} border-2 ${
                                  snapshot.isDragging ? 'opacity-50 rotate-2' : ''
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="text-xs font-bold opacity-50">
                                        #{index + 1}
                                      </div>
                                      {step.icon}
                                      <div className="flex-1">
                                        <h4 className="font-medium">{step.name}</h4>
                                        <p className="text-xs opacity-75">{step.description}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(step);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-200 rounded"
                                      >
                                        <Pencil className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeStep(step.uniqueId);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-200 rounded"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {step.config && (
                                    <div className="mt-3 pt-3 border-t border-current opacity-50">
                                      <p className="text-xs font-medium mb-1">Configuration:</p>
                                      <div className="text-xs space-y-0.5">
                                        {Object.entries(step.config).slice(0, 2).map(([key, value]) => (
                                          <div key={key}>
                                            {key}: {value}
                                          </div>
                                        ))}
                                        {Object.keys(step.config).length > 2 && (
                                          <div className="text-gray-500">...</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

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

      {/* Rule Editing Modal */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingStep?.icon}
              Edit {editingStep?.name} Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editingStep?.type === 'discount' && (
              <>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={tempConfig.type}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {tempConfig.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                  </Label>
                  <Input
                    type="number"
                    value={tempConfig.value}
                    onChange={(e) => setTempConfig({ ...tempConfig, value: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apply When</Label>
                  <Select
                    value={tempConfig.condition}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="min-days">Minimum Days</SelectItem>
                      <SelectItem value="bulk">Bulk Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tempConfig.condition === 'min-days' && (
                  <div className="space-y-2">
                    <Label>Minimum Days</Label>
                    <Input
                      type="number"
                      value={tempConfig.minDays}
                      onChange={(e) => setTempConfig({ ...tempConfig, minDays: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </>
            )}

            {editingStep?.type === 'markup' && (
              <>
                <div className="space-y-2">
                  <Label>Markup Type</Label>
                  <Select
                    value={tempConfig.type}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {tempConfig.type === 'percentage' ? 'Markup (%)' : 'Amount ($)'}
                  </Label>
                  <Input
                    type="number"
                    value={tempConfig.value}
                    onChange={(e) => setTempConfig({ ...tempConfig, value: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apply To</Label>
                  <Select
                    value={tempConfig.applyTo}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, applyTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bundles</SelectItem>
                      <SelectItem value="unlimited">Unlimited Only</SelectItem>
                      <SelectItem value="limited">Limited Data Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {editingStep?.type === 'fixed-price' && (
              <>
                <div className="space-y-2">
                  <Label>Base Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempConfig.basePrice}
                    onChange={(e) => setTempConfig({ ...tempConfig, basePrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={tempConfig.currency}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {editingStep?.type === 'processing-fee' && (
              <>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={tempConfig.paymentMethod}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="apple-pay">Apple Pay</SelectItem>
                      <SelectItem value="google-pay">Google Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fee Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tempConfig.feePercentage}
                    onChange={(e) => setTempConfig({ ...tempConfig, feePercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fixed Fee ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempConfig.fixedFee}
                    onChange={(e) => setTempConfig({ ...tempConfig, fixedFee: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {editingStep?.type === 'keep-profit' && (
              <>
                <div className="space-y-2">
                  <Label>Profit Type</Label>
                  <Select
                    value={tempConfig.type}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Minimum Profit {tempConfig.type === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    type="number"
                    value={tempConfig.minProfit}
                    onChange={(e) => setTempConfig({ ...tempConfig, minProfit: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {editingStep?.type === 'psychological-rounding' && (
              <>
                <div className="space-y-2">
                  <Label>Pricing Strategy</Label>
                  <Select
                    value={tempConfig.strategy}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, strategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="charm">Charm Pricing (.99)</SelectItem>
                      <SelectItem value="prestige">Prestige Pricing (.00)</SelectItem>
                      <SelectItem value="odd">Odd Pricing (.95)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Round To</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tempConfig.roundTo}
                    onChange={(e) => setTempConfig({ ...tempConfig, roundTo: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}

            {editingStep?.type === 'region-rounding' && (
              <>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={tempConfig.region}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rounding Rule</Label>
                  <Select
                    value={tempConfig.roundingRule}
                    onValueChange={(value) => setTempConfig({ ...tempConfig, roundingRule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest-dollar">Nearest Dollar</SelectItem>
                      <SelectItem value="nearest-five">Nearest $5</SelectItem>
                      <SelectItem value="nearest-ten">Nearest $10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Cancel
            </Button>
            <Button onClick={saveStepConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
};

export default StrategyPage;