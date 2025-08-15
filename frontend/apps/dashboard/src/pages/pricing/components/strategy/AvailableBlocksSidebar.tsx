import { Card } from "@workspace/ui";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Settings } from "lucide-react";
import React from "react";
import { AvailableBlocksSidebarProps } from "../../types";

const AvailableBlocksSidebar: React.FC<AvailableBlocksSidebarProps> = ({
  availableBlocks,
}) => {
  return (
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
              {availableBlocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm font-medium">All blocks are in use</p>
                  <p className="text-xs mt-1">Remove blocks from your strategy to make them available again</p>
                </div>
              ) : (
                availableBlocks.map((block, index) => (
                <Draggable
                  key={block.id}
                  draggableId={block.id}
                  index={index}
                  isDragDisabled={block.disabled}
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
                          : "none",
                      }}
                    >
                      <Card
                        className={`p-3 transition-all ${
                          block.disabled 
                            ? "cursor-not-allowed opacity-60 grayscale" 
                            : "cursor-move hover:shadow-md"
                        } ${block.color} border-2 ${
                          snapshot.isDragging ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{block.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {block.name}
                              {block.disabled && (
                                <span className="ml-2 text-xs font-normal opacity-60">
                                  (Coming Soon)
                                </span>
                              )}
                            </h4>
                            <p className="text-xs opacity-75 mt-1">
                              {block.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Drag blocks to the right to build your
            pricing strategy. Each block type can only be used once. Remove blocks 
            from your strategy to make them available again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvailableBlocksSidebar;