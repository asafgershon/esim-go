import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Card,
  Badge,
  Alert,
  AlertDescription,
} from "@workspace/ui";
import {
  Search,
  Star,
  Clock,
  Building,
  Filter,
  X,
  AlertTriangle,
  RefreshCw,
  Archive,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { Block, StrategyLoadModalProps } from "../../types";
import { useStrategies, useSearchStrategies } from "../../../../hooks/useStrategies";
import { useLoadStrategy } from "../../../../hooks/useLoadStrategy";
import { 
  DatabasePricingStrategy,
  mapStrategyToListItem,
  StrategyListItem 
} from "../../../../types/strategies";

const StrategyLoadModal: React.FC<StrategyLoadModalProps> = ({
  isOpen,
  onClose,
  onStrategyLoad,
  currentStrategySteps,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch strategies based on search term
  const { 
    strategies: searchResults, 
    loading: searchLoading, 
    error: searchError,
    refetch: refetchSearch 
  } = useSearchStrategies(searchTerm);
  
  // Fetch all strategies when no search term
  const { 
    strategies: allStrategies, 
    loading: allLoading, 
    error: allError,
    refetch: refetchAll 
  } = useStrategies({ archived: showArchived });

  // Load selected strategy details
  const { 
    strategy: selectedStrategy,
    loading: strategyLoading,
    error: strategyError,
    loadStrategyIntoBuilder 
  } = useLoadStrategy(selectedStrategyId);

  // Determine which data to show
  const strategies = searchTerm ? searchResults : allStrategies;
  const loading = searchTerm ? searchLoading : allLoading;
  const error = searchTerm ? searchError : allError;
  const refetch = searchTerm ? refetchSearch : refetchAll;

  // Map strategies to list items with block count placeholder
  const strategyItems: StrategyListItem[] = useMemo(() => {
    return strategies.map(strategy => 
      mapStrategyToListItem(strategy, 0) // Block count would need to be fetched separately
    );
  }, [strategies]);

  // Filter strategies
  const filteredStrategies = useMemo(() => {
    let filtered = strategyItems;
    
    if (!showArchived) {
      filtered = filtered.filter(strategy => !strategy.isArchived);
    }
    
    return filtered.sort((a, b) => {
      // Default strategies first, then by creation date (newest first)
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [strategyItems, showArchived]);

  // Check if current strategy has unsaved changes
  const hasUnsavedChanges = currentStrategySteps.length > 0;

  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategyId(strategyId);
  };

  const handleLoadStrategy = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      loadSelectedStrategy();
    }
  };

  const loadSelectedStrategy = () => {
    if (selectedStrategy) {
      const strategyBlocks = loadStrategyIntoBuilder();
      onStrategyLoad(strategyBlocks);
      setShowConfirmDialog(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedStrategyId(null);
    setShowConfirmDialog(false);
    onClose();
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastActivated = (dateString?: string) => {
    if (!dateString) return "Never";
    return formatDate(dateString);
  };

  const selectedStrategyItem = filteredStrategies.find(s => s.id === selectedStrategyId);

  if (showConfirmDialog) {
    return (
      <Dialog open={true} onOpenChange={() => setShowConfirmDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Strategy Load
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              You have unsaved changes in your current strategy. Loading a new strategy will 
              replace all current blocks and configurations.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800">
                <strong>Current strategy:</strong> {currentStrategySteps.length} blocks configured
              </p>
              <p className="text-sm text-orange-800">
                <strong>Loading:</strong> {selectedStrategy?.name}
              </p>
            </div>
            
            <p className="text-sm text-gray-600">
              Are you sure you want to continue? This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={loadSelectedStrategy}>
              Load Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl w-[calc(100vw-100px)] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Load Pricing Strategy
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Filters */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search strategies by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-2 ${showArchived ? 'bg-gray-100' : ''}`}
              >
                <Archive className="h-4 w-4" />
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              {loading ? (
                "Loading strategies..."
              ) : (
                `${filteredStrategies.length} ${filteredStrategies.length === 1 ? 'strategy' : 'strategies'} found`
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load strategies: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Strategy List */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto py-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </Card>
              ))
            ) : filteredStrategies.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No strategies found</p>
                <p className="text-sm mt-1">
                  {searchTerm 
                    ? "Try adjusting your search terms or check archived strategies"
                    : "Create your first pricing strategy to get started"
                  }
                </p>
              </div>
            ) : (
              filteredStrategies.map((strategy) => (
                <Card
                  key={strategy.id}
                  className={`p-4 cursor-pointer transition-all border-2 hover:shadow-md ${
                    selectedStrategyId === strategy.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${strategy.isArchived ? "opacity-60" : ""}`}
                  onClick={() => handleStrategySelect(strategy.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">
                            {strategy.name}
                          </h4>
                          {strategy.isDefault && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          {strategy.isArchived && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              <Archive className="h-3 w-3 mr-1" />
                              Archived
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono">
                          {strategy.code} • v{strategy.version}
                        </p>
                      </div>
                    </div>

                    {strategy.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {strategy.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {strategy.blocksCount} blocks
                        </span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {strategy.activationCount || 0} uses
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(strategy.createdAt)}
                      </div>
                    </div>

                    {strategy.lastActivatedAt && (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Last used: {formatLastActivated(strategy.lastActivatedAt)}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Strategy Preview */}
          {selectedStrategyItem && (
            <div className="border-t pt-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-blue-900">
                      {selectedStrategyItem.name}
                      {selectedStrategyItem.isDefault && (
                        <Badge className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                          Default
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-blue-700 font-mono">
                      {selectedStrategyItem.code} • Version {selectedStrategyItem.version}
                    </p>
                    {selectedStrategyItem.description && (
                      <p className="text-sm text-blue-700 mt-2">
                        {selectedStrategyItem.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                      <span>{selectedStrategyItem.blocksCount} pricing blocks</span>
                      <span>Created {formatDate(selectedStrategyItem.createdAt)}</span>
                      {selectedStrategyItem.activationCount && selectedStrategyItem.activationCount > 0 && (
                        <span>Used {selectedStrategyItem.activationCount} times</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleLoadStrategy}
            disabled={!selectedStrategyId || strategyLoading}
          >
            {strategyLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Strategy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyLoadModal;