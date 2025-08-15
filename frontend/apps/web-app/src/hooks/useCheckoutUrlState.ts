import { useQueryState } from "nuqs";

// Type-safe wrappers for URL state
const useTokenState = () => useQueryState("token");
const useNumOfDaysState = () => useQueryState("numOfDays", { 
  defaultValue: 7,
  parse: (value) => parseInt(value) || 7,
  serialize: (value) => value.toString(),
});
const useCountryIdState = () => useQueryState("countryId");
const useRegionIdState = () => useQueryState("regionId");

export const useCheckoutUrlState = () => {
  // Use the typed wrappers
  const [token, setToken] = useTokenState();
  const [numOfDays, setNumOfDays] = useNumOfDaysState();
  const [countryId, setCountryId] = useCountryIdState();
  const [regionId, setRegionId] = useRegionIdState();

  // Helper to update checkout parameters and clear token
  const updateCheckoutParams = (params: {
    numOfDays?: number;
    countryId?: string;
    regionId?: string;
  }) => {
    if (params.numOfDays !== undefined) setNumOfDays(params.numOfDays);
    if (params.countryId !== undefined) setCountryId(params.countryId);
    if (params.regionId !== undefined) setRegionId(params.regionId);
    
    // Clear token when parameters change (new order)
    if (token) {
      setToken(null);
    }
  };

  // Helper to clear all checkout state
  const clearCheckoutState = () => {
    setToken(null);
    setNumOfDays(7);
    setCountryId(null);
    setRegionId(null);
  };

  return {
    // State
    token,
    numOfDays,
    countryId: countryId || "",
    regionId: regionId || "",
    
    // Setters
    setToken,
    setNumOfDays,
    setCountryId,
    setRegionId,
    
    // Helpers
    updateCheckoutParams,
    clearCheckoutState,
    
    // Computed
    hasValidParams: !!(countryId || regionId),
    hasToken: !!token,
  };
};