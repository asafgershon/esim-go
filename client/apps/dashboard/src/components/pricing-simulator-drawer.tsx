import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  ScrollArea,
} from '@workspace/ui';
import React from 'react';
import { Calculator, X } from 'lucide-react';

import { Country } from '@/__generated__/graphql';
import { PricingSimulatorContent } from './pricing-simulator-content';

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
      <DrawerContent className="fixed right-0 top-0 bottom-0 w-[700px] z-50 bg-background border-l rounded-l-lg">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <div>
                <DrawerTitle>Pricing Simulator</DrawerTitle>
                <DrawerDescription>
                  Test pricing scenarios with real-time calculations and profit analysis
                </DrawerDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-6">
          <PricingSimulatorContent countries={countries} />
        </ScrollArea>

        <DrawerFooter className="border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Real-time pricing with comprehensive profit analysis
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};