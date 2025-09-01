import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui";
import React from "react";
import { StepConfigurationModalProps } from "../../types";
import CouponConfigurationModal from "./CouponConfigurationModal";
import MarkupConfigurationModal from "./MarkupConfigurationModal";
import ProcessingFeeModal from "./ProcessingFeeModal";
import ProviderSelectionModal from "./ProviderSelectionModal";

const StepConfigurationModal: React.FC<StepConfigurationModalProps> = ({
  editingStep,
  setEditingStep,
  tempConfig,
  setTempConfig,
  saveStepConfig,
  cancelEditModal,
}) => {
  return (
    <Dialog
      open={!!editingStep}
      modal={true}
      onOpenChange={(open) => !open && cancelEditModal?.()}
    >
      <DialogContent className={"max-h-[90vh] !max-w-none w-[calc(100vw-100px)] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingStep?.icon}
            Edit {editingStep?.name} Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {editingStep?.type === "provider-selection" && (
            <ProviderSelectionModal
              tempConfig={tempConfig}
              setTempConfig={setTempConfig}
            />
          )}

          {editingStep?.type === "discount" && (
            <>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={tempConfig.type}
                  onValueChange={(value) =>
                    setTempConfig({ ...tempConfig, type: value })
                  }
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
                  {tempConfig.type === "percentage"
                    ? "Percentage (%)"
                    : "Amount ($)"}
                </Label>
                <Input
                  type="number"
                  value={tempConfig.value}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      value: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Apply When</Label>
                <Select
                  value={tempConfig.condition}
                  onValueChange={(value) =>
                    setTempConfig({ ...tempConfig, condition: value })
                  }
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
              {tempConfig.condition === "min-days" && (
                <div className="space-y-2">
                  <Label>Minimum Days</Label>
                  <Input
                    type="number"
                    value={tempConfig.minDays}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        minDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}
            </>
          )}

          {editingStep?.type === "markup" && (
            <MarkupConfigurationModal
              tempConfig={tempConfig}
              setTempConfig={setTempConfig}
            />
          )}

          {editingStep?.type === "coupon" && (
            <CouponConfigurationModal
              tempConfig={tempConfig}
              setTempConfig={setTempConfig}
            />
          )}

          {editingStep?.type === "fixed-price" && (
            <>
              <div className="space-y-2">
                <Label>Base Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tempConfig.basePrice}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      basePrice: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={tempConfig.currency}
                  onValueChange={(value) =>
                    setTempConfig({ ...tempConfig, currency: value })
                  }
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

          {editingStep?.type === "processing-fee" && (
            <ProcessingFeeModal
              tempConfig={tempConfig}
              setTempConfig={setTempConfig}
            />
          )}

          {editingStep?.type === "base-price" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Base Price Configuration</strong>
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  This block initializes the pricing calculation with the bundle's base cost.
                  No additional configuration is required - the base price is automatically 
                  extracted from the selected bundle.
                </p>
              </div>
            </div>
          )}

          {editingStep?.type === "unused-days-discount" && (
            <div className="space-y-4">
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                <p className="text-sm text-cyan-800">
                  <strong>Unused Days Discount Configuration</strong>
                </p>
                <p className="text-xs text-cyan-700 mt-2">
                  This block applies a discount based on unused days from a previous bundle.
                  The calculation is automatic - 50% discount on the daily rate for each unused day.
                  No additional configuration is required.
                </p>
              </div>
            </div>
          )}

          {(editingStep?.type === "profit-constraint" || editingStep?.type === "keep-profit") && (
            <>
              <div className="space-y-2">
                <Label>Minimum Profit ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tempConfig.value}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Ensures the final price maintains at least this profit margin in dollars.
                </p>
              </div>
            </>
          )}

          {editingStep?.type === "psychological-rounding" && (
            <>
              <div className="space-y-2">
                <Label>Pricing Strategy</Label>
                <Select
                  value={tempConfig.strategy}
                  onValueChange={(value) =>
                    setTempConfig({ ...tempConfig, strategy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charm">Charm Pricing (.99)</SelectItem>
                    <SelectItem value="prestige">
                      Prestige Pricing (.00)
                    </SelectItem>
                    <SelectItem value="odd">Odd Pricing (.95)</SelectItem>
                    <SelectItem value="nearest-whole">Nearest Whole</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Round To</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tempConfig.roundTo}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      roundTo: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </>
          )}

          {editingStep?.type === "region-rounding" && (
            <>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select
                  value={tempConfig.region}
                  onValueChange={(value) =>
                    setTempConfig({ ...tempConfig, region: value })
                  }
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
                  onValueChange={(value) =>
                    setTempConfig({ ...tempConfig, roundingRule: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nearest-dollar">
                      Nearest Dollar
                    </SelectItem>
                    <SelectItem value="nearest-five">Nearest $5</SelectItem>
                    <SelectItem value="nearest-ten">Nearest $10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rounding Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tempConfig.value || 0.99}
                  onChange={(e) =>
                    setTempConfig({
                      ...tempConfig,
                      value: parseFloat(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Add this value to achieve psychological pricing (e.g., $X.99)
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => cancelEditModal?.()}>
            Cancel
          </Button>
          <Button onClick={saveStepConfig}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StepConfigurationModal;
