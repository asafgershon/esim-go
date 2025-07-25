import {
  Badge,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@workspace/ui';
import React from 'react';
import { Calculator, AlertTriangle } from 'lucide-react';

import { Country } from '@/__generated__/graphql';

interface PricingSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
}

export const PricingSimulatorDrawer: React.FC<PricingSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  countries,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="fixed right-0 top-0 bottom-0 w-[600px] z-50 bg-background border-l rounded-l-lg">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pricing Simulator
          </DrawerTitle>
          <DrawerDescription>
            Pricing simulator is temporarily disabled during system upgrade
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col h-full overflow-hidden p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Temporarily Unavailable</h3>
              <p className="text-muted-foreground mb-4">
                The pricing simulator is being upgraded to use our new pricing pipeline.
              </p>
              <Badge variant="outline" className="mb-4">
                Coming Soon
              </Badge>
              <p className="text-sm text-muted-foreground max-w-md">
                This feature will be restored once the new pricing engine implementation is complete.
                Thank you for your patience.
              </p>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={onClose}>Close</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};