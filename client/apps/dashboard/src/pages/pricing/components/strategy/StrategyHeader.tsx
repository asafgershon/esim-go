import { Check, Edit2, X, FolderOpen, CheckCircle2 } from "lucide-react";
import React, { useState } from "react";
import { StrategyHeaderProps } from "../../types";
import { StrategyLoadModal } from "../modals";

const StrategyHeader: React.FC<StrategyHeaderProps> = ({
  strategyName,
  setStrategyName,
  strategyDescription,
  setStrategyDescription,
  isEditingName,
  setIsEditingName,
  isEditingDescription,
  setIsEditingDescription,
  onLoadStrategy,
  currentStrategySteps,
  loadedStrategyId,
  loadedStrategyCode,
}) => {
  const [showLoadModal, setShowLoadModal] = useState(false);

  const handleLoadStrategy = (strategyBlocks: any[]) => {
    onLoadStrategy(strategyBlocks);
    setShowLoadModal(false);
  };
  return (
    <>
      {/* Strategy Header with Load Button and Loaded Strategy Indicator */}
      <div className="mb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Loaded Strategy Indicator */}
            {loadedStrategyId && (
              <div className="mb-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 max-w-fit">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Strategy Loaded:</span>
                <span className="font-mono">{loadedStrategyCode}</span>
              </div>
            )}
            
            {/* Editable Strategy Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                    if (e.key === "Escape") {
                      setStrategyName("New Strategy #1");
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
                    setStrategyName("New Strategy #1");
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
          
          {/* Load Strategy Button */}
          <div className="ml-4">
            <button
              onClick={() => setShowLoadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <FolderOpen className="h-4 w-4" />
              Load Strategy
            </button>
          </div>
        </div>
      </div>

      {/* Editable Strategy Description */}
      <div className="mb-6">
        {isEditingDescription ? (
          <div className="flex items-start gap-2">
            <textarea
              value={strategyDescription}
              onChange={(e) => setStrategyDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setStrategyDescription(
                    "Add a description for your pricing strategy..."
                  );
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
                setStrategyDescription(
                  "Add a description for your pricing strategy..."
                );
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

      {/* Strategy Load Modal */}
      <StrategyLoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onStrategyLoad={handleLoadStrategy}
        currentStrategySteps={currentStrategySteps}
      />
    </>
  );
};

export default StrategyHeader;