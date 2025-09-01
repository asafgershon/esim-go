import { Button, Input, Label } from "@workspace/ui";
import React from "react";
import { MarkupConfigurationModalProps } from "../../types";

const MarkupConfigurationModal: React.FC<MarkupConfigurationModalProps> = ({
  tempConfig,
  setTempConfig,
}) => {

  const groups = Object.keys(tempConfig?.groupDurationConfigs || {});
  // Get unique durations from the first group (assuming all groups have the same durations)
  const firstGroup = groups[0];
  const durations = firstGroup ? Object.keys(tempConfig?.groupDurationConfigs?.[firstGroup] || {}) : [];


  const updateGroupDurationConfig = (
    group: string,
    duration: string,
    field: string,
    value: any
  ) => {
    const newConfigs = { ...tempConfig.groupDurationConfigs };
    if (!newConfigs[group]) {
      newConfigs[group] = {};
    }
    if (!newConfigs[group][duration]) {
      newConfigs[group][duration] = {
        markupValue: tempConfig.markupValue || 5,
      };
    }
    newConfigs[group][duration][field] = value;
    setTempConfig({ ...tempConfig, groupDurationConfigs: newConfigs });
  };

  const applyToAll = (field: string, value: any) => {
    const newConfigs = { ...tempConfig.groupDurationConfigs };
    groups.forEach((group: string) => {
      durations.forEach((duration: string) => {
        if (!newConfigs[group]) newConfigs[group] = {};
        if (!newConfigs[group][duration]) {
          newConfigs[group][duration] = {
            markupValue: tempConfig.markupValue || 5,
          };
        }
        newConfigs[group][duration][field] = value;
      });
    });
    setTempConfig({ ...tempConfig, groupDurationConfigs: newConfigs });
  };



  return (
    <>
      {/* Global Markup Settings */}
      <div className="space-y-4 pb-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900">Global Settings</h4>

        <div className="space-y-2">
          <Label>Default Markup Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={tempConfig.markupValue || 0}
            onChange={(e) =>
              setTempConfig({
                ...tempConfig,
                markupValue: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-gray-500">
            This will be the default markup applied to all bundles
          </p>
        </div>
      </div>

      {/* Group-Duration Configuration Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            Group & Duration Configuration
          </h4>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                applyToAll("markupValue", tempConfig.markupValue || 5)
              }
            >
              Apply Default to All
            </Button>
          </div>
        </div>

        {groups.length === 0 || durations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No groups or durations available.</p>
            <p className="text-xs mt-1">
              Default markup will be applied to all bundles.
            </p>
          </div>
        ) : (
          <div
            className="border border-gray-300 rounded-sm overflow-x-auto bg-white"
            style={{ maxHeight: "400px" }}
          >
            <table
              className="w-full border-collapse"
              style={{ minWidth: "800px" }}
            >
              <thead className="sticky top-0 z-20">
                <tr>
                  <th
                    className="border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 text-left sticky left-0 z-30"
                    style={{ minWidth: "200px" }}
                  >
                    Group / Duration
                  </th>
                  {durations.map((duration: string) => (
                    <th
                      key={duration}
                      className="border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 text-center"
                      style={{ minWidth: "100px" }}
                    >
                      {duration}{" "}
                      {duration === "1" ? "day" : "days"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group: string) => (
                  <tr key={group}>
                    <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 sticky left-0 z-10">
                      {group}
                    </td>
                    {durations.map((duration: string) => {
                      const config = tempConfig.groupDurationConfigs?.[
                        group
                      ]?.[duration] || {
                        markupValue: tempConfig.markupValue || 5,
                      };
                      return (
                        <td
                          key={duration}
                          className="border border-gray-300 px-1 py-1"
                        >
                          <input
                            type="number"
                            step="0.01"
                            value={config.markupValue || ""}
                            onChange={(e) =>
                              updateGroupDurationConfig(
                                group,
                                duration,
                                "markupValue",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full text-center text-xs py-1 px-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                            style={{ minHeight: "24px" }}
                            placeholder="0"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <Label className="text-sm font-medium text-gray-700">
          Configuration Preview
        </Label>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs space-y-1 text-blue-800">
            <p>
              <strong>Type:</strong> Fixed Amount
            </p>
            <p>
              <strong>Default Markup:</strong> ${tempConfig.markupValue || 0}
            </p>
            {tempConfig.groupDurationConfigs &&
              Object.keys(tempConfig.groupDurationConfigs).length > 0 && (
                <p>
                  <strong>Custom Configs:</strong> {groups.length} group(s) ×{" "}
                  {durations.length} duration(s)
                </p>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MarkupConfigurationModal;