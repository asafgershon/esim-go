  // Lazy load bundles for a country when expanded
  const expandCountry = async (countryId: string) => {
    try {
      // Use the dedicated countryBundles query which already returns filtered and calculated data
      console.log(`🔍 Fetching bundles for country: ${countryId}`);
      
      const countryBundlesResult = await getCountryBundles({
        variables: { countryId }
      });
      
      if (countryBundlesResult.data?.countryBundles) {
        const bundles = countryBundlesResult.data.countryBundles;
        
        console.log(`✅ Fetched ${bundles.length} bundles for ${countryId}`);
        
        // Transform the bundles to include additional display fields
        const transformedBundles = bundles.map(bundle => ({
          ...bundle,
          pricePerDay: bundle.duration > 0 ? bundle.priceAfterDiscount / bundle.duration : 0,
          hasCustomDiscount: bundle.hasCustomDiscount || false,
          configurationLevel: bundle.configurationLevel || 'GLOBAL',
          discountPerDay: bundle.discountPerDay || 0.10,
          // These are already in the response but ensure they exist
          dataAmount: bundle.dataAmount || 'Unknown',
          isUnlimited: bundle.isUnlimited || false,
          bundleGroup: bundle.bundleGroup || 'Standard Fixed'
        }));
        
        // Calculate average price per day for the country summary
        const avgPricePerDay = calculateAveragePricePerDay(transformedBundles);
        
        // Update the country group with the fetched bundles
        setCountryGroups(prev => prev.map(group => 
          group.countryId === countryId 
            ? { 
                ...group, 
                bundles: transformedBundles,
                avgPricePerDay
              }
            : group
        ));
        
        console.log(`📊 Updated country group for ${countryId} with ${transformedBundles.length} bundles`);
      } else {
        console.warn(`⚠️ No bundles found for country ${countryId}`);
      }
    } catch (error) {
      console.error('Error fetching bundles for country:', countryId, error);
      setError(`Failed to load bundles for ${countryId}`);
    }
  };