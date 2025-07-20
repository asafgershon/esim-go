import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  InputWithAdornment,
  Label,
  Separator,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui";
import React, { useState, useEffect } from "react";
import { CreditCard, Save, RotateCcw, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_CURRENT_PROCESSING_FEE_CONFIGURATION,
  CREATE_PROCESSING_FEE_CONFIGURATION,
  UPDATE_PROCESSING_FEE_CONFIGURATION,
} from "../lib/graphql/queries";

interface ProcessingFeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProcessingFeeData {
  // Main processing fees
  israeliCardsRate: number; // עמלות סליקה עסקאות ש"ח בכרטיסים שהונפקו בישראל
  foreignCardsRate: number; // עמלות סליקה כרטיסים שהונפקו בחו"ל
  premiumDinersRate: number; // תוספת לעמלות הסליקה בגין תשלום בכרטיסי פרימיום - דיינרס
  premiumAmexRate: number; // תוספת לעמלות הסליקה בגין תשלום בכרטיסי פרימיום - אמקס
  bitPaymentRate: number; // תוספת לעמלות הסליקה בגין תשלום באמצעות ביט

  // Fixed fees
  fixedFeeNIS: number; // עמלה קבועה לעסקה ב ש"ח
  fixedFeeForeign: number; // עמלה קבועה לעסקה ב מט"ח
  monthlyFixedCost: number; // עלות חודשית קבועה
  bankWithdrawalFee: number; // עלות משיכה לחשבון הבנק
  monthlyMinimumFee: number; // עמלת מינימום חודשית
  setupCost: number; // עלות הקמה

  // Additional services
  threeDSecureFee: number; // 3DSecure - שירות מניעת הכחשות עסקה
  chargebackFee: number; // עמלת הכחשות עסקה
  cancellationFee: number; // עמלת ביטול עסקה
  invoiceServiceFee: number; // שירותי חשבוניות / קבלות
  appleGooglePayFee: number; // Apple/Google Pay
}

const defaultProcessingFees: ProcessingFeeData = {
  israeliCardsRate: 1.4,
  foreignCardsRate: 3.9,
  premiumDinersRate: 0.3,
  premiumAmexRate: 0.8,
  bitPaymentRate: 0.1,
  fixedFeeNIS: 0,
  fixedFeeForeign: 0,
  monthlyFixedCost: 0, // בהתאם לסיכום
  bankWithdrawalFee: 9.9,
  monthlyMinimumFee: 0,
  setupCost: 250,
  threeDSecureFee: 0, // תמחור פרטני בעת התחברות
  chargebackFee: 50,
  cancellationFee: 30,
  invoiceServiceFee: 69,
  appleGooglePayFee: 0,
};

export const ProcessingFeeDrawer: React.FC<ProcessingFeeDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [fees, setFees] = useState<ProcessingFeeData>(defaultProcessingFees);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL queries and mutations
  const { data: currentConfig, loading: loadingCurrent, refetch } = useQuery(
    GET_CURRENT_PROCESSING_FEE_CONFIGURATION,
    {
      skip: !isOpen, // Only run when drawer is open
    }
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
        fixedFeeNIS: config.fixedFeeNIS,
        fixedFeeForeign: config.fixedFeeForeign,
        monthlyFixedCost: config.monthlyFixedCost,
        bankWithdrawalFee: config.bankWithdrawalFee,
        monthlyMinimumFee: config.monthlyMinimumFee,
        setupCost: config.setupCost,
        threeDSecureFee: config.threeDSecureFee,
        chargebackFee: config.chargebackFee,
        cancellationFee: config.cancellationFee,
        invoiceServiceFee: config.invoiceServiceFee,
        appleGooglePayFee: config.appleGooglePayFee,
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

  // Handler for percentage fields
  const handlePercentageChange = (field: keyof ProcessingFeeData, value: string) => {
    const decimalValue = parsePercentageFromDisplay(value);
    setFees((prev) => ({
      ...prev,
      [field]: decimalValue,
    }));
    setHasChanges(true);
  };

  // Handler for currency fields
  const handleCurrencyChange = (field: keyof ProcessingFeeData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFees((prev) => ({
      ...prev,
      [field]: numValue,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      const input = {
        israeliCardsRate: fees.israeliCardsRate, // Already in decimal format
        foreignCardsRate: fees.foreignCardsRate,
        premiumDinersRate: fees.premiumDinersRate,
        premiumAmexRate: fees.premiumAmexRate,
        bitPaymentRate: fees.bitPaymentRate,
        fixedFeeNIS: fees.fixedFeeNIS,
        fixedFeeForeign: fees.fixedFeeForeign,
        monthlyFixedCost: fees.monthlyFixedCost,
        bankWithdrawalFee: fees.bankWithdrawalFee,
        monthlyMinimumFee: fees.monthlyMinimumFee,
        setupCost: fees.setupCost,
        threeDSecureFee: fees.threeDSecureFee,
        chargebackFee: fees.chargebackFee,
        cancellationFee: fees.cancellationFee,
        invoiceServiceFee: fees.invoiceServiceFee,
        appleGooglePayFee: fees.appleGooglePayFee,
        effectiveFrom: new Date().toISOString(),
        effectiveTo: null,
        notes: `Updated on ${new Date().toLocaleDateString('he-IL')}`,
      };

      if (currentConfig?.currentProcessingFeeConfiguration) {
        // Update existing configuration by creating a new version
        await updateConfiguration({
          variables: {
            id: currentConfig.currentProcessingFeeConfiguration.id,
            input,
          },
        });
      } else {
        // Create new configuration
        await createConfiguration({
          variables: { input },
        });
      }

      // Refetch current configuration to get the latest data
      await refetch();
      
      setHasChanges(false);
      toast.success("הגדרות עמלות הסליקה נשמרו בהצלחה");
      onClose();
    } catch (error) {
      console.error("Error saving processing fee configuration:", error);
      toast.error("אירעה שגיאה בשמירת הגדרות עמלות הסליקה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFees(defaultProcessingFees);
    setHasChanges(true);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-w-4xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2" dir="rtl">
            <CreditCard className="h-5 w-5" />
            ניהול עמלות סליקה
          </DrawerTitle>
          <DrawerDescription>
            עדכן את פרמטרי העמלות בהתאם להצעת המחיר שקיבלת מספק הסליקה
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 space-y-4 max-h-[70vh] overflow-y-auto" dir="rtl">
          {loadingCurrent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">טוען הגדרות עמלות...</span>
            </div>
          ) : (
            <>
          
          {/* Main Processing Fees */}
          <Card>
            <CardHeader>
              <CardTitle>תעריפי עמלות סליקה ועלויות שוטפות</CardTitle>
              <CardDescription>
                עמלות בסיסיות על פי סוג כרטיס ומקור הנפקה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="israeliCards" className="text-xs font-medium">
                    כרטיסים ישראליים
                  </Label>
                  <InputWithAdornment
                    id="israeliCards"
                    type="number"
                    step="0.1"
                    value={formatPercentageForDisplay(fees.israeliCardsRate)}
                    onChange={(e) =>
                      handlePercentageChange("israeliCardsRate", e.target.value)
                    }
                    placeholder="1.4"
                    rightAdornment="%"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="foreignCards" className="text-xs font-medium">
                    כרטיסים זרים
                  </Label>
                  <InputWithAdornment
                    id="foreignCards"
                    type="number"
                    step="0.1"
                    value={formatPercentageForDisplay(fees.foreignCardsRate)}
                    onChange={(e) =>
                      handlePercentageChange("foreignCardsRate", e.target.value)
                    }
                    placeholder="3.9"
                    rightAdornment="%"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="premiumDiners" className="text-xs font-medium">
                    תוספת דיינרס
                  </Label>
                  <InputWithAdornment
                    id="premiumDiners"
                    type="number"
                    step="0.1"
                    value={formatPercentageForDisplay(fees.premiumDinersRate)}
                    onChange={(e) =>
                      handlePercentageChange("premiumDinersRate", e.target.value)
                    }
                    placeholder="0.3"
                    rightAdornment="%"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="premiumAmex" className="text-xs font-medium">
                    תוספת אמקס
                  </Label>
                  <InputWithAdornment
                    id="premiumAmex"
                    type="number"
                    step="0.1"
                    value={formatPercentageForDisplay(fees.premiumAmexRate)}
                    onChange={(e) =>
                      handlePercentageChange("premiumAmexRate", e.target.value)
                    }
                    placeholder="0.8"
                    rightAdornment="%"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bitPayment" className="text-xs font-medium">
                    תשלום ביט
                  </Label>
                  <InputWithAdornment
                    id="bitPayment"
                    type="number"
                    step="0.1"
                    value={formatPercentageForDisplay(fees.bitPaymentRate)}
                    onChange={(e) =>
                      handlePercentageChange("bitPaymentRate", e.target.value)
                    }
                    placeholder="0.1"
                    rightAdornment="%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fixed Fees */}
          <Card>
            <CardHeader>
              <CardTitle>עמלות קבועות</CardTitle>
              <CardDescription>עמלות קבועות ועלויות חודשיות</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fixedFeeNIS" className="text-xs font-medium">עמלה קבועה ש"ח</Label>
                  <InputWithAdornment
                    id="fixedFeeNIS"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.fixedFeeNIS)}
                    onChange={(e) =>
                      handleCurrencyChange("fixedFeeNIS", e.target.value)
                    }
                    placeholder="0.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fixedFeeForeign" className="text-xs font-medium">
                    עמלה קבועה מט"ח
                  </Label>
                  <InputWithAdornment
                    id="fixedFeeForeign"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.fixedFeeForeign)}
                    onChange={(e) =>
                      handleCurrencyChange("fixedFeeForeign", e.target.value)
                    }
                    placeholder="0.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="monthlyFixedCost" className="text-xs font-medium">
                    עלות חודשית
                  </Label>
                  <InputWithAdornment
                    id="monthlyFixedCost"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.monthlyFixedCost)}
                    onChange={(e) =>
                      handleCurrencyChange("monthlyFixedCost", e.target.value)
                    }
                    placeholder="0.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bankWithdrawalFee" className="text-xs font-medium">
                    משיכה לבנק
                  </Label>
                  <InputWithAdornment
                    id="bankWithdrawalFee"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.bankWithdrawalFee)}
                    onChange={(e) =>
                      handleCurrencyChange("bankWithdrawalFee", e.target.value)
                    }
                    placeholder="9.90"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="monthlyMinimumFee" className="text-xs font-medium">
                    מינימום חודשי
                  </Label>
                  <InputWithAdornment
                    id="monthlyMinimumFee"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.monthlyMinimumFee)}
                    onChange={(e) =>
                      handleCurrencyChange("monthlyMinimumFee", e.target.value)
                    }
                    placeholder="0.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="setupCost" className="text-xs font-medium">עלות הקמה</Label>
                  <InputWithAdornment
                    id="setupCost"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.setupCost)}
                    onChange={(e) =>
                      handleCurrencyChange("setupCost", e.target.value)
                    }
                    placeholder="250.00"
                    leftAdornment="₪"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Services */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>שירותי ערך מוסף</CardTitle>
              <CardDescription>
                עמלות נוספות עבור שירותים מתקדמים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="threeDSecureFee" className="text-xs font-medium">
                    3DSecure
                  </Label>
                  <InputWithAdornment
                    id="threeDSecureFee"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.threeDSecureFee)}
                    onChange={(e) =>
                      handleCurrencyChange("threeDSecureFee", e.target.value)
                    }
                    placeholder="0.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="chargebackFee" className="text-xs font-medium">הכחשות עסקה</Label>
                  <InputWithAdornment
                    id="chargebackFee"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.chargebackFee)}
                    onChange={(e) =>
                      handleCurrencyChange("chargebackFee", e.target.value)
                    }
                    placeholder="50.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cancellationFee" className="text-xs font-medium">ביטול עסקה</Label>
                  <InputWithAdornment
                    id="cancellationFee"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.cancellationFee)}
                    onChange={(e) =>
                      handleCurrencyChange("cancellationFee", e.target.value)
                    }
                    placeholder="30.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="invoiceServiceFee" className="text-xs font-medium">
                    חשבוניות/קבלות
                  </Label>
                  <InputWithAdornment
                    id="invoiceServiceFee"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.invoiceServiceFee)}
                    onChange={(e) =>
                      handleCurrencyChange("invoiceServiceFee", e.target.value)
                    }
                    placeholder="69.00"
                    leftAdornment="₪"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="appleGooglePayFee" className="text-xs font-medium">
                    Apple/Google Pay
                  </Label>
                  <InputWithAdornment
                    id="appleGooglePayFee"
                    type="number"
                    step="0.01"
                    value={formatCurrencyForDisplay(fees.appleGooglePayFee)}
                    onChange={(e) =>
                      handleCurrencyChange("appleGooglePayFee", e.target.value)
                    }
                    placeholder="0.00"
                    leftAdornment="₪"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>

        <Separator />

        <DrawerFooter>
          <div className="flex justify-between items-center w-full">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס לברירת מחדל
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSubmitting || loadingCurrent}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "שומר..." : "שמירה"}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
