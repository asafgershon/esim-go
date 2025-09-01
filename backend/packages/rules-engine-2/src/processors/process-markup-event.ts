import { Event } from "json-rules-engine";
import { AppliedRule } from "../generated/types";
import { SelectedBundleFact, PreviousBundleFact } from "../facts/bundle-facts";
import { Provider } from "../generated/types";
import type { StructuredLogger } from "@hiilo/utils";

interface ProcessMarkupContext {
  selectedBundle: SelectedBundleFact | null;
  previousBundle: PreviousBundleFact | null;
  unusedDays: number;
  paymentMethod?: string;
}

interface ProcessMarkupResult {
  newPrice: number;
  description: string;
  details: any;
}

/**
 * Process apply-markup event
 */
export function processMarkupEvent(
  event: Event,
  currentPrice: number,
  appliedRules: AppliedRule[],
  context: ProcessMarkupContext,
  logger: StructuredLogger
): ProcessMarkupResult {
  const { selectedBundle, previousBundle } = context;
  
  logger.debug(`Processing markup event`, { 
    currentPrice,
    eventParams: event.params 
  });

  let newPrice = currentPrice;
  let description = '';
  let details: any = {};

  const markupParams = event.params as any;
  
  if (markupParams.markupMatrix) {
    // Determine which bundle to use for markup calculation
    // Priority: selectedBundle of same provider, then previousBundle of same provider
    let bundleForMarkup = null;
    let bundleType = '';
    
    if (selectedBundle && selectedBundle.is_unlimited) {
      bundleForMarkup = selectedBundle;
      bundleType = 'selected';
    } else if (previousBundle && previousBundle.is_unlimited) {
      bundleForMarkup = previousBundle;
      bundleType = 'previous';
    }
    
    if (bundleForMarkup) {
      const provider = bundleForMarkup.provider || Provider.EsimGo;
      const groupName = bundleForMarkup.group_name || '';
      const days = (bundleForMarkup.validity_in_days || 0).toString();
      
      let markupKey: string;
      let markupValue = 0;
      
      if (provider === Provider.Maya) {
        // Maya has no groups, use MAYA key directly
        markupKey = 'MAYA';
        markupValue = markupParams.markupMatrix[markupKey]?.[days] || 0;
      } else if (groupName) {
        // For ESIM_GO, try provider-specific key first, then legacy key
        const providerSpecificKey = `${provider}-${groupName}`;
        if (markupParams.markupMatrix[providerSpecificKey]) {
          markupKey = providerSpecificKey;
          markupValue = markupParams.markupMatrix[providerSpecificKey][days] || 0;
        } else {
          // Fallback to legacy key (backward compatibility)
          markupKey = groupName;
          markupValue = markupParams.markupMatrix[groupName]?.[days] || 0;
        }
      } else {
        markupKey = '';
      }
      
      newPrice = currentPrice + markupValue;
      description = `Applied markup of $${markupValue} for ${markupKey || 'unknown'} (${days} days) using ${bundleType} bundle`;
      details = { provider, markupKey, days, markupAmount: markupValue, bundleType };
    }
  } else if (markupParams.value) {
    const markupValue = markupParams.value;
    newPrice = currentPrice + markupValue;
    description = `Applied fixed markup of $${markupValue}`;
    details = { markupAmount: markupValue };
  }

  return { newPrice, description, details };
}