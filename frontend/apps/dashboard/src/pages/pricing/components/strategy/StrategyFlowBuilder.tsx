import { Card } from "@workspace/ui";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import React from "react";
import { StrategyFlowBuilderProps } from "../../types";

const StrategyFlowBuilder: React.FC<StrategyFlowBuilderProps> = ({
  strategySteps,
  selectedStep,
  removeStep,
  openEditModal,
  setStrategySteps,
}) => {
  const renderStepConfiguration = (step: any) => {
    if (!step.config) return null;

    return (
      <div className="mt-3 pt-3 border-t border-current opacity-50">
        <p className="text-xs font-medium mb-1">Configuration:</p>
        <div className="text-xs space-y-0.5">
          {step.type === "provider-selection" ? (
            <>
              <div>Preferred: {step.config.preferredProvider || "MAYA"}</div>
              <div>Fallback: {step.config.fallbackProvider || "ESIM_GO"}</div>
              <div className="text-slate-600">Priority: 100 (First)</div>
            </>
          ) : step.type === "markup" ? (
            <>
              <div>Type: Fixed Amount</div>
              <div>Default: ${step.config.markupValue || 0}</div>
              {step.config.groupDurationConfigs &&
                Object.keys(step.config.groupDurationConfigs).length > 0 && (
                  <div>
                    Custom configs:{" "}
                    {Object.keys(step.config.groupDurationConfigs).length}{" "}
                    group(s)
                  </div>
                )}
            </>
          ) : step.type === "coupon" ? (
            <>
              <div>
                Coupons:{" "}
                {step.config.enableCoupons ? "Enabled" : "Disabled"}
              </div>
              <div>
                Corporate:{" "}
                {step.config.enableCorporateDiscounts ? "Enabled" : "Disabled"}
              </div>
              <div>
                Active: {step.config.activeCoupons || 0} coupons,{" "}
                {step.config.corporateDomains || 0} domains
              </div>
            </>
          ) : (
            <>
              {Object.entries(step.config)
                .slice(0, 2)
                .map(([key, value]) => (
                  <div key={key}>
                    {key}: {typeof value === 'object' && value !== null 
                      ? JSON.stringify(value) 
                      : String(value)}
                  </div>
                ))}
              {Object.keys(step.config).length > 2 && (
                <div className="text-gray-500">...</div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Droppable droppableId="strategy-flow">
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-colors ${
            snapshot.isDraggingOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300"
          }`}
        >
          {strategySteps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              <Plus className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Start building your strategy</p>
              <p className="text-sm mt-2">
                Drag blocks from the left sidebar here
              </p>
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
                        className={`group relative ${
                          snapshot.isDragging ? "z-50" : ""
                        }`}
                      >
                        <Card
                          className={`p-4 cursor-move transition-all ${
                            selectedStep === step.uniqueId
                              ? "ring-2 ring-blue-500 shadow-lg"
                              : "hover:shadow-md"
                          } ${step.color} border-2 ${
                            snapshot.isDragging ? "opacity-50 rotate-2" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-xs font-bold opacity-50">
                                #{index + 1}
                              </div>
                              {step.icon}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{step.name}</h4>
                                  {step.type === "provider-selection" && (
                                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                                      Priority 100
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs opacity-75">
                                  {step.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (step.type === "coupon") {
                                    alert("Coming soon");
                                  } else {
                                    openEditModal(step);
                                  }
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

                          {renderStepConfiguration(step)}
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
  );
};

export default StrategyFlowBuilder;