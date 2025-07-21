import {
  Button,
  Input,
  InputWithAdornment,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@workspace/ui";
import React, { useState, useEffect } from "react";
import { CreditCard, Save, RotateCcw, Loader2, X, Check, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_CURRENT_PROCESSING_FEE_CONFIGURATION,
  CREATE_PROCESSING_FEE_CONFIGURATION,
  UPDATE_PROCESSING_FEE_CONFIGURATION,
} from "../lib/graphql/queries";

interface ProcessingFeeData {
  // Processing fees and rates
  israeliCardsRate: number; // Israeli cards processing rate
  foreignCardsRate: number; // Foreign cards processing rate
  premiumDinersRate: number; // Premium Diners surcharge
  premiumAmexRate: number; // Premium Amex surcharge
  bitPaymentRate: number; // Bit payment surcharge
  threeDSecureFee: number; // 3DSecure service fee
  appleGooglePayFee: number; // Apple/Google Pay fee

  // Fixed fees
  fixedFeeNIS: number; // Fixed fee per transaction (ILS)
  fixedFeeForeign: number; // Fixed fee per transaction (Foreign currency)
  monthlyFixedCost: number; // Monthly fixed cost
  bankWithdrawalFee: number; // Bank withdrawal fee
  monthlyMinimumFee: number; // Monthly minimum fee
  setupCost: number; // Setup cost

  // Additional services
  chargebackFee: number; // Chargeback fee
  cancellationFee: number; // Transaction cancellation fee
  invoiceServiceFee: number; // Invoice/receipt service
}

const defaultProcessingFees: ProcessingFeeData = {
  // Processing rates
  israeliCardsRate: 1.4,
  foreignCardsRate: 3.9,
  premiumDinersRate: 0.3,
  premiumAmexRate: 0.8,
  bitPaymentRate: 0.1,
  threeDSecureFee: 0, // Individual pricing upon connection
  appleGooglePayFee: 0,
  
  // Fixed fees
  fixedFeeNIS: 0,
  fixedFeeForeign: 0,
  monthlyFixedCost: 0, // As per agreement
  bankWithdrawalFee: 9.9,
  monthlyMinimumFee: 0,
  setupCost: 250,
  
  // Additional services
  chargebackFee: 50,
  cancellationFee: 30,
  invoiceServiceFee: 69,
};

export const ProcessingFeeManagement: React.FC = () => {
  const [fees, setFees] = useState<ProcessingFeeData>(defaultProcessingFees);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [showAlert, setShowAlert] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ field: keyof ProcessingFeeData; value: string } | null>(null);

  // GraphQL queries and mutations
  const { data: currentConfig, loading: loadingCurrent, refetch } = useQuery(
    GET_CURRENT_PROCESSING_FEE_CONFIGURATION
  );

  const [createConfiguration] = useMutation(CREATE_PROCESSING_FEE_CONFIGURATION);
  const [updateConfiguration] = useMutation(UPDATE_PROCESSING_FEE_CONFIGURATION);

  // Load current configuration when data is available
  useEffect(() => {
    if (currentConfig?.currentProcessingFeeConfiguration) {
      const config = currentConfig.currentProcessingFeeConfiguration;
      setFees({
        israeliCardsRate: config.israeliCardsRate,
        foreignCardsRate: config.foreignCardsRate,
        premiumDinersRate: config.premiumDinersRate,
        premiumAmexRate: config.premiumAmexRate,
        bitPaymentRate: config.bitPaymentRate,
        threeDSecureFee: config.threeDSecureFee,
        appleGooglePayFee: config.appleGooglePayFee,
        fixedFeeNIS: config.fixedFeeNIS,
        fixedFeeForeign: config.fixedFeeForeign,
        monthlyFixedCost: config.monthlyFixedCost,
        bankWithdrawalFee: config.bankWithdrawalFee,
        monthlyMinimumFee: config.monthlyMinimumFee,
        setupCost: config.setupCost,
        chargebackFee: config.chargebackFee,
        cancellationFee: config.cancellationFee,
        invoiceServiceFee: config.invoiceServiceFee,
      });
      setHasChanges(false);
    } else if (!loadingCurrent && !currentConfig?.currentProcessingFeeConfiguration) {
      // No current configuration exists, use defaults
      setFees(defaultProcessingFees);
      setHasChanges(false);
    }
  }, [currentConfig, loadingCurrent]);

  // Helper function to convert percentage from storage format (decimal) to display format (percentage)
  const formatPercentageForDisplay = (decimal: number) => {
    return (decimal * 100).toFixed(1);
  };

  // Helper function to convert percentage from display format (percentage) to storage format (decimal)
  const parsePercentageFromDisplay = (percentage: string) => {
    return (parseFloat(percentage) || 0) / 100;
  };

  // Helper function to format currency with proper decimals
  const formatCurrencyForDisplay = (amount: number) => {
    return amount.toFixed(2);
  };

  // Inline editing functions
  const startEditing = (field: keyof ProcessingFeeData, currentValue: number, isPercentage: boolean = false) => {
    setEditingField(field);
    setEditingValue(isPercentage ? formatPercentageForDisplay(currentValue) : formatCurrencyForDisplay(currentValue));
  };

  const saveEdit = async (field: keyof ProcessingFeeData, isPercentage: boolean = false) => {
    const numericValue = isPercentage ? parsePercentageFromDisplay(editingValue) : (parseFloat(editingValue) || 0);
    
    // Check if this is a percentage field that affects pricing
    const percentageFields = ['israeliCardsRate', 'foreignCardsRate', 'premiumDinersRate', 'premiumAmexRate', 'bitPaymentRate'];
    if (percentageFields.includes(field)) {
      setPendingChange({ field, value: editingValue });
      setShowAlert(true);
      return;
    }

    try {
      const updatedFees = {
        ...fees,
        [field]: numericValue,
      };

      const input = {
        israeliCardsRate: updatedFees.israeliCardsRate,
        foreignCardsRate: updatedFees.foreignCardsRate,
        premiumDinersRate: updatedFees.premiumDinersRate,
        premiumAmexRate: updatedFees.premiumAmexRate,
        bitPaymentRate: updatedFees.bitPaymentRate,
        threeDSecureFee: updatedFees.threeDSecureFee,
        appleGooglePayFee: updatedFees.appleGooglePayFee,
        fixedFeeNIS: updatedFees.fixedFeeNIS,
        fixedFeeForeign: updatedFees.fixedFeeForeign,
        monthlyFixedCost: updatedFees.monthlyFixedCost,
        bankWithdrawalFee: updatedFees.bankWithdrawalFee,
        monthlyMinimumFee: updatedFees.monthlyMinimumFee,
        setupCost: updatedFees.setupCost,
        chargebackFee: updatedFees.chargebackFee,
        cancellationFee: updatedFees.cancellationFee,
        invoiceServiceFee: updatedFees.invoiceServiceFee,
        effectiveFrom: new Date().toISOString(),
        effectiveTo: null,
        notes: `Updated ${field} on ${new Date().toLocaleDateString('en-US')}`,
      };

      if (currentConfig?.currentProcessingFeeConfiguration) {
        await updateConfiguration({
          variables: {
            id: currentConfig.currentProcessingFeeConfiguration.id,
            input,
          },
        });
      } else {
        await createConfiguration({
          variables: { input },
        });
      }

      await refetch();
      setFees(updatedFees);
      setEditingField(null);
      setEditingValue("");
      toast.success("Configuration updated successfully");
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Error updating configuration");
    }
  };

  const confirmPercentageChange = async () => {
    if (!pendingChange) return;
    
    const numericValue = parsePercentageFromDisplay(pendingChange.value);
    
    try {
      const updatedFees = {
        ...fees,
        [pendingChange.field]: numericValue,
      };

      const input = {
        israeliCardsRate: updatedFees.israeliCardsRate,
        foreignCardsRate: updatedFees.foreignCardsRate,
        premiumDinersRate: updatedFees.premiumDinersRate,
        premiumAmexRate: updatedFees.premiumAmexRate,
        bitPaymentRate: updatedFees.bitPaymentRate,
        threeDSecureFee: updatedFees.threeDSecureFee,
        appleGooglePayFee: updatedFees.appleGooglePayFee,
        fixedFeeNIS: updatedFees.fixedFeeNIS,
        fixedFeeForeign: updatedFees.fixedFeeForeign,
        monthlyFixedCost: updatedFees.monthlyFixedCost,
        bankWithdrawalFee: updatedFees.bankWithdrawalFee,
        monthlyMinimumFee: updatedFees.monthlyMinimumFee,
        setupCost: updatedFees.setupCost,
        chargebackFee: updatedFees.chargebackFee,
        cancellationFee: updatedFees.cancellationFee,
        invoiceServiceFee: updatedFees.invoiceServiceFee,
        effectiveFrom: new Date().toISOString(),
        effectiveTo: null,
        notes: `Updated ${pendingChange.field} on ${new Date().toLocaleDateString('en-US')}`,
      };

      if (currentConfig?.currentProcessingFeeConfiguration) {
        await updateConfiguration({
          variables: {
            id: currentConfig.currentProcessingFeeConfiguration.id,
            input,
          },
        });
      } else {
        await createConfiguration({
          variables: { input },
        });
      }

      await refetch();
      setFees(updatedFees);
      setEditingField(null);
      setEditingValue("");
      setShowAlert(false);
      setPendingChange(null);
      toast.success("Pricing configuration updated successfully");
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Error updating configuration");
    }
  };

  const discardEdit = () => {
    setEditingField(null);
    setEditingValue("");
    setShowAlert(false);
    setPendingChange(null);
  };


  // Helper function to render an editable field
  const renderEditableField = (
    field: keyof ProcessingFeeData,
    label: string,
    value: number,
    isPercentage: boolean = false,
    adornment?: string
  ) => {
    const isEditing = editingField === field;
    
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium">{label}</Label>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <InputWithAdornment
              type="number"
              step={isPercentage ? "0.1" : "0.01"}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              rightAdornment={isPercentage ? "%" : undefined}
              leftAdornment={!isPercentage ? adornment || "₪" : undefined}
              className="text-sm flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEdit(field, isPercentage);
                } else if (e.key === 'Escape') {
                  discardEdit();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveEdit(field, isPercentage)}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={discardEdit}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div 
            className="w-full p-2 cursor-pointer rounded hover:bg-gray-100 transition-colors border border-gray-200"
            onClick={() => startEditing(field, value, isPercentage)}
          >
            <span className="text-sm">
              {isPercentage 
                ? `${formatPercentageForDisplay(value)}%` 
                : `${adornment || "₪"}${formatCurrencyForDisplay(value)}`
              }
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loadingCurrent) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading fee settings...</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" showOnHover={true}>
      <div className="space-y-8 pb-12 pr-4">
      {/* Processing Rates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Rates</h3>
        <p className="text-sm text-gray-600 mb-4">Percentage-based fees applied to transactions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {renderEditableField('israeliCardsRate', 'Israeli Cards', fees.israeliCardsRate, true)}
          {renderEditableField('foreignCardsRate', 'Foreign Cards', fees.foreignCardsRate, true)}
          {renderEditableField('premiumDinersRate', 'Diners Surcharge', fees.premiumDinersRate, true)}
          {renderEditableField('premiumAmexRate', 'Amex Surcharge', fees.premiumAmexRate, true)}
          {renderEditableField('bitPaymentRate', 'Bit Payment', fees.bitPaymentRate, true)}
        </div>
      </div>

      {/* Service Fees */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Fees</h3>
        <p className="text-sm text-gray-600 mb-4">Fixed fees for additional services</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderEditableField('threeDSecureFee', '3DSecure Service', fees.threeDSecureFee, false, '$')}
          {renderEditableField('appleGooglePayFee', 'Apple/Google Pay', fees.appleGooglePayFee, false, '$')}
        </div>
      </div>

      {/* Fixed Fees */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fixed Fees</h3>
        <p className="text-sm text-gray-600 mb-4">Fixed fees and monthly costs</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {renderEditableField('fixedFeeNIS', 'Fixed Fee (ILS)', fees.fixedFeeNIS)}
          {renderEditableField('fixedFeeForeign', 'Fixed Fee (Foreign)', fees.fixedFeeForeign)}
          {renderEditableField('monthlyFixedCost', 'Monthly Cost', fees.monthlyFixedCost)}
          {renderEditableField('bankWithdrawalFee', 'Bank Withdrawal', fees.bankWithdrawalFee)}
          {renderEditableField('monthlyMinimumFee', 'Monthly Minimum', fees.monthlyMinimumFee)}
          {renderEditableField('setupCost', 'Setup Cost', fees.setupCost)}
        </div>
      </div>

      {/* Additional Services */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Services</h3>
        <p className="text-sm text-gray-600 mb-4">Additional fees for advanced services</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {renderEditableField('chargebackFee', 'Chargeback Fee', fees.chargebackFee)}
          {renderEditableField('cancellationFee', 'Cancellation Fee', fees.cancellationFee)}
          {renderEditableField('invoiceServiceFee', 'Invoice Service', fees.invoiceServiceFee)}
        </div>
      </div>

      {/* Destructive Alert Dialog */}
      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-red-900">Critical Pricing Change</DialogTitle>
                <DialogDescription className="text-red-700">
                  This will affect all existing bundles immediately and impact final pricing. Are you sure you want to continue?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={discardEdit}>
              Cancel
            </Button>
            <Button 
              onClick={confirmPercentageChange}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Yes, Update Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ScrollArea>
  );
};