import React, { useState } from 'react';
import { Card } from '@workspace/ui';
import { Button } from '@workspace/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { QrCode, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { InstallationLinks } from '@/__generated__/graphql';
import { DirectActivationButton } from './DirectActivationButton';
import { ManualSetupInstructions } from './ManualSetupInstructions';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';

interface ActivationMethodSelectorProps {
  installationLinks: InstallationLinks;
  qrCode?: string | null;
  iccid: string;
}

export const ActivationMethodSelector: React.FC<ActivationMethodSelectorProps> = ({
  installationLinks,
  qrCode,
  iccid,
}) => {
  const capabilities = useDeviceCapabilities();
  const [activeTab, setActiveTab] = useState<string>(
    capabilities.recommendedMethod === 'manual' ? 'qr' : 'direct'
  );

  // Generate QR code URL if not provided
  const qrCodeUrl = qrCode || 
    `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(installationLinks.qrCodeData)}&size=400x400`;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Smartphone className="h-5 w-5" />
        הפעלת ה-eSIM שלך
      </h3>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="direct" className="text-xs">
            הפעלה ישירה
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-xs">
            קוד QR
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">
            הזנה ידנית
          </TabsTrigger>
        </TabsList>

        {/* Direct Activation */}
        <TabsContent value="direct" className="mt-4">
          <div className="space-y-4">
            {capabilities.supportsUniversalLinks || capabilities.supportsLPAScheme ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {capabilities.platform === 'ios' && capabilities.isIOS174Plus
                    ? 'המכשיר שלך תומך בהפעלה ישירה! לחץ על הכפתור להפעלת ה-eSIM ללא צורך בסריקת QR.'
                    : capabilities.platform === 'android'
                    ? 'המכשיר שלך תומך בהפעלה ישירה דרך Android. לחץ על הכפתור להתחיל.'
                    : 'המכשיר שלך תומך בהפעלה ישירה. לחץ על הכפתור להתחיל.'}
                </p>
                <DirectActivationButton 
                  installationLinks={installationLinks}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  המכשיר שלך אינו תומך בהפעלה ישירה. אנא השתמש בקוד QR או הזנה ידנית.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('qr')}
                >
                  <QrCode className="h-4 w-4 ml-2" />
                  עבור לקוד QR
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* QR Code */}
        <TabsContent value="qr" className="mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              סרוק את הקוד להתקנת כרטיס ה-eSIM במכשיר שלך
            </p>
            
            <div className="flex justify-center">
              <div className="p-4 rounded-lg border shadow-sm bg-white">
                <Image 
                  src={qrCodeUrl}
                  alt="QR Code for eSIM activation"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                />
              </div>
            </div>

            <div className="text-center space-y-2 text-sm text-muted-foreground">
              <p>ICCID: {iccid}</p>
            </div>
          </div>
        </TabsContent>

        {/* Manual Setup */}
        <TabsContent value="manual" className="mt-4">
          <ManualSetupInstructions 
            manual={installationLinks.manual}
            platform={capabilities.platform}
          />
        </TabsContent>
      </Tabs>

      {/* Platform info */}
      <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-muted-foreground">
          זוהה: {capabilities.platform === 'ios' ? `iOS ${capabilities.version || ''}` : 
                capabilities.platform === 'android' ? 'Android' :
                capabilities.platform === 'windows' ? 'Windows' : 'מכשיר אחר'}
        </p>
      </div>
    </Card>
  );
};