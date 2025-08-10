import React from "react";
import { Label, Input } from "@workspace/ui";
import { CreditCard } from "lucide-react";

// PaymentMethod enum matching the server
enum PaymentMethod {
  AMEX = "AMEX",
  BIT = "BIT",
  DINERS = "DINERS",
  FOREIGN_CARD = "FOREIGN_CARD",
  ISRAELI_CARD = "ISRAELI_CARD",
}

// Human-friendly labels for payment methods
const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.ISRAELI_CARD]: "Israeli Credit Card",
  [PaymentMethod.FOREIGN_CARD]: "Foreign Credit Card",
  [PaymentMethod.DINERS]: "Diners Club",
  [PaymentMethod.AMEX]: "American Express",
  [PaymentMethod.BIT]: "Bit Payment",
};

// Default processing fees based on the existing rules
const defaultProcessingFees: Record<PaymentMethod, { percentageFee: number; fixedFee: number }> = {
  [PaymentMethod.ISRAELI_CARD]: { percentageFee: 1.4, fixedFee: 0 },
  [PaymentMethod.DINERS]: { percentageFee: 3.9, fixedFee: 0 },
  [PaymentMethod.FOREIGN_CARD]: { percentageFee: 2.9, fixedFee: 0.3 },
  [PaymentMethod.AMEX]: { percentageFee: 3.5, fixedFee: 0 },
  [PaymentMethod.BIT]: { percentageFee: 0, fixedFee: 0.5 },
};

interface ProcessingFeeModalProps {
  tempConfig: { [key: string]: any };
  setTempConfig: (config: { [key: string]: any }) => void;
}

const ProcessingFeeModal: React.FC<ProcessingFeeModalProps> = ({
  tempConfig,
  setTempConfig,
}) => {
  // Initialize fees matrix if not present
  React.useEffect(() => {
    if (!tempConfig.feesMatrix) {
      setTempConfig({
        ...tempConfig,
        feesMatrix: defaultProcessingFees,
      });
    }
  }, []);

  const handleFeeChange = (
    method: PaymentMethod,
    field: 'percentageFee' | 'fixedFee',
    value: number
  ) => {
    const updatedFeesMatrix = {
      ...tempConfig.feesMatrix,
      [method]: {
        ...tempConfig.feesMatrix[method],
        [field]: value,
      },
    };
    
    setTempConfig({
      ...tempConfig,
      feesMatrix: updatedFeesMatrix,
    });
  };

  const feesMatrix = tempConfig.feesMatrix || defaultProcessingFees;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium text-gray-900">Payment Processing Fees</h4>
      </div>

      {/* Processing Fees Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Payment Method
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Percentage Fee (%)
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Fixed Fee ($)
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Example: $100 Purchase
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.values(PaymentMethod).map((method) => {
              const fee = feesMatrix[method] || defaultProcessingFees[method];
              const exampleTotal = (100 * (1 + fee.percentageFee / 100) + fee.fixedFee).toFixed(2);
              const exampleFee = (100 * fee.percentageFee / 100 + fee.fixedFee).toFixed(2);
              
              return (
                <tr key={method} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {paymentMethodLabels[method]}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        ({method})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={fee.percentageFee}
                      onChange={(e) =>
                        handleFeeChange(method, 'percentageFee', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 mx-auto text-center"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fee.fixedFee}
                      onChange={(e) =>
                        handleFeeChange(method, 'fixedFee', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 mx-auto text-center"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="text-sm">
                      <span className="text-gray-600">Fee: </span>
                      <span className="font-medium text-gray-900">${exampleFee}</span>
                      <br />
                      <span className="text-gray-600">Total: </span>
                      <span className="font-semibold text-blue-600">${exampleTotal}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Label className="text-sm font-medium text-blue-900 mb-2 block">
          Processing Fee Configuration
        </Label>
        <div className="text-xs space-y-1 text-blue-800">
          <p>
            <strong>How it works:</strong> Processing fees are calculated based on the payment method selected by the customer.
          </p>
          <p>
            <strong>Formula:</strong> Total = (Base Price × (1 + Percentage Fee)) + Fixed Fee
          </p>
          <p>
            <strong>Storage:</strong> These fees are stored as part of the pricing strategy rules, similar to markup configuration.
          </p>
        </div>
      </div>

      {/* Configuration Preview */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <Label className="text-sm font-medium text-gray-700">
          Configuration Preview
        </Label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs space-y-1 text-gray-700 font-mono">
            <p>
              <strong>Event Type:</strong> apply-processing-fee
            </p>
            <p>
              <strong>Action:</strong> SET_PROCESSING_RATE
            </p>
            <p>
              <strong>Fees Matrix:</strong> {Object.keys(feesMatrix).length} payment methods configured
            </p>
          </div>
        </div>
      </div>

      {/* Info message */}
      <div className="text-xs text-gray-500 italic">
        * Processing fees are applied after all other pricing rules have been calculated.
      </div>
    </div>
  );
};

export default ProcessingFeeModal;