import { GET_PRICING_FILTERS } from "@/lib/graphql/queries";
import { useQuery } from "@apollo/client";
import { Button, Input, Label } from "@workspace/ui";
import { AlertTriangle, Loader } from "lucide-react";
import React from "react";
import { MarkupConfigurationModalProps } from "../../types";

const MarkupConfigurationModal: React.FC<MarkupConfigurationModalProps> = ({
  tempConfig,
  setTempConfig,
}) => {
  const { data, loading, error } = useQuery(GET_PRICING_FILTERS);

  const groups = data?.pricingFilters?.groups || [];
  const durations = data?.pricingFilters?.durations || [];

  // Initialize group-duration configurations if not already set
  React.useEffect(() => {
    if (groups.length && durations.length && !tempConfig.groupDurationConfigs) {
      const initialConfigs: {
        [key: string]: { [key: string]: { markupValue: number } };
      } = {};

      groups.forEach((group: string) => {
        initialConfigs[group] = {};
        durations.forEach((duration: any) => {
          initialConfigs[group][duration.value] = {
            markupValue: tempConfig.markupValue || 5,
          };
        });
      });

      setTempConfig({
        ...tempConfig,
        groupDurationConfigs: initialConfigs,
      });
    }
  }, [groups, durations, tempConfig, setTempConfig]);

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
      durations.forEach((duration: any) => {
        if (!newConfigs[group]) newConfigs[group] = {};
        if (!newConfigs[group][duration.value]) {
          newConfigs[group][duration.value] = {
            markupValue: tempConfig.markupValue || 5,
          };
        }
        newConfigs[group][duration.value][field] = value;
      });
    });
    setTempConfig({ ...tempConfig, groupDurationConfigs: newConfigs });
  };

  const handleUseDefaultConfiguration = () => {
    // Initialize with some default data
    const defaultGroups = [
      "Standard Fixed",
      "Standard Unlimited Lite",
      "Standard Unlimited Essential",
    ];
    const defaultDurations = [
      { value: "1", label: "1 day", minDays: 1, maxDays: 1 },
      { value: "3", label: "3 days", minDays: 3, maxDays: 3 },
      { value: "5", label: "5 days", minDays: 5, maxDays: 5 },
      { value: "7", label: "7 days", minDays: 7, maxDays: 7 },
      { value: "10", label: "10 days", minDays: 10, maxDays: 10 },
      { value: "15", label: "15 days", minDays: 15, maxDays: 15 },
      { value: "21", label: "21 days", minDays: 21, maxDays: 21 },
      { value: "30", label: "30 days", minDays: 30, maxDays: 30 },
    ];

    const initialConfigs: {
      [key: string]: { [key: string]: { markupValue: number } };
    } = {};
    defaultGroups.forEach((group: string) => {
      initialConfigs[group] = {};
      defaultDurations.forEach((duration: any) => {
        initialConfigs[group][duration.value] = {
          markupValue: tempConfig.markupValue || 5,
        };
      });
    });

    setTempConfig({
      ...tempConfig,
      groupDurationConfigs: initialConfigs,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">
          Loading configuration data...
        </span>
      </div>
    );
  }

  if (error) {
    console.error("GraphQL Error:", error);
    return (
      <div className="space-y-4 py-8">
        <div className="flex items-center justify-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>Error loading configuration data: {error.message}</span>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Using default configuration instead.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseDefaultConfiguration}
          >
            Use Default Configuration
          </Button>
        </div>
      </div>
    );
  }

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
                  {durations.length > 0
                    ? durations.map((duration: any) => (
                        <th
                          key={duration.value}
                          className="border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 text-center"
                          style={{ minWidth: "100px" }}
                        >
                          {duration.value}{" "}
                          {duration.value === 1 ? "day" : "days"}
                        </th>
                      ))
                    : // Default columns if no durations loaded - using the exact durations: 1, 3, 5, 7, 10, 15, 21, 30
                      [1, 3, 5, 7, 10, 15, 21, 30].map((days) => (
                        <th
                          key={days}
                          className="border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 text-center"
                          style={{ minWidth: "100px" }}
                        >
                          {days} {days === 1 ? "day" : "days"}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {groups.length > 0
                  ? groups.map((group: string) => (
                      <tr key={group}>
                        <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 sticky left-0 z-10">
                          {group}
                        </td>
                        {durations.length > 0
                          ? durations.map((duration: any) => {
                              const config = tempConfig.groupDurationConfigs?.[
                                group
                              ]?.[duration.value] || {
                                markupValue: tempConfig.markupValue || 5,
                              };
                              return (
                                <td
                                  key={duration.value}
                                  className="border border-gray-300 px-1 py-1"
                                >
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={config.markupValue || ""}
                                    onChange={(e) =>
                                      updateGroupDurationConfig(
                                        group,
                                        duration.value,
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
                            })
                          : // Default columns if no durations loaded
                            [1, 3, 5, 7, 10, 15, 21, 30].map((days) => (
                              <td
                                key={days}
                                className="border border-gray-300 px-1 py-1"
                              >
                                <input
                                  type="number"
                                  step="0.01"
                                  value=""
                                  onChange={(e) => {}}
                                  className="w-full text-center text-xs py-1 px-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                                  style={{ minHeight: "24px" }}
                                  placeholder="0"
                                />
                              </td>
                            ))}
                      </tr>
                    ))
                  : // Default rows if no groups loaded
                    [
                      "Standard Fixed",
                      "Standard Unlimited Lite",
                      "Standard Unlimited Essential",
                    ].map((group) => (
                      <tr key={group}>
                        <td className="border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 sticky left-0 z-10">
                          {group}
                        </td>
                        {[1, 3, 5, 7, 10, 15, 21, 30].map((days) => (
                          <td
                            key={days}
                            className="border border-gray-300 px-1 py-1"
                          >
                            <input
                              type="number"
                              step="0.01"
                              value=""
                              onChange={(e) => {}}
                              className="w-full text-center text-xs py-1 px-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent"
                              style={{ minHeight: "24px" }}
                              placeholder="0"
                            />
                          </td>
                        ))}
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