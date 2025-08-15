import React from 'react';
import { Card } from '@workspace/ui';
import { Copy, CheckCircle } from 'lucide-react';
import { Button } from '@workspace/ui';
import { ManualInstallation } from '@/__generated__/graphql';
import { getPlatformInstructions } from '@/hooks/useDeviceCapabilities';

interface ManualSetupInstructionsProps {
  manual: ManualInstallation;
  platform: 'ios' | 'android' | 'windows' | 'other';
}

export const ManualSetupInstructions: React.FC<ManualSetupInstructionsProps> = ({
  manual,
  platform,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const instructions = getPlatformInstructions(platform);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const CopyButton: React.FC<{ text: string; field: string }> = ({ text, field }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="p-1 h-auto"
    >
      {copiedField === field ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Card className="p-6" dir="rtl">
      <h3 className="text-lg font-semibold mb-4">הוראות התקנה ידנית</h3>
      
      {/* Platform-specific instructions */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">שלבי ההתקנה:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          {instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ol>
      </div>

      {/* Activation details */}
      <div className="space-y-4">
        <h4 className="font-medium">פרטי הפעלה:</h4>
        
        <div className="space-y-3">
          {/* SM-DP+ Address */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                כתובת SM-DP+
              </label>
              <CopyButton text={manual.smDpAddress} field="smdp" />
            </div>
            <p className="font-mono text-sm break-all">{manual.smDpAddress}</p>
          </div>

          {/* Activation Code */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                קוד הפעלה
              </label>
              <CopyButton text={manual.activationCode} field="activation" />
            </div>
            <p className="font-mono text-sm break-all">{manual.activationCode}</p>
          </div>

          {/* Confirmation Code (if exists) */}
          {manual.confirmationCode && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  קוד אישור
                </label>
                <CopyButton text={manual.confirmationCode} field="confirmation" />
              </div>
              <p className="font-mono text-sm break-all">{manual.confirmationCode}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>טיפ:</strong> לחץ על כל שדה כדי להעתיק אותו ללוח
        </p>
      </div>
    </Card>
  );
};