import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Select,
  SelectContent,
  SelectItem,  
  SelectTrigger,
  SelectValue,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton
} from '@workspace/ui';
import { GET_AIRHALO_PACKAGES, GET_COUNTRIES, COMPARE_AIRHALO_PACKAGES } from '@/lib/graphql/queries';
import { 
  GetAirHaloPackagesQuery, 
  GetCountriesQuery, 
  CompareAirHaloPackagesQuery,
  AirHaloPackageFilter,
  AirHaloPackageType 
} from '@/__generated__/graphql';
import { Eye, Wifi, Clock, Globe } from 'lucide-react';

interface AirHaloPricingPageProps {}

export const AirHaloPricingPage: React.FC<AirHaloPricingPageProps> = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [packageTypeFilter, setPackageTypeFilter] = useState<AirHaloPackageType | undefined>();
  const [showComparison, setShowComparison] = useState(false);

  // Fetch countries for filter dropdown
  const { data: countriesData } = useQuery<GetCountriesQuery>(GET_COUNTRIES);

  // Fetch AirHalo packages with filters
  const { data: packagesData, loading: packagesLoading, error: packagesError } = useQuery<GetAirHaloPackagesQuery>(
    GET_AIRHALO_PACKAGES,
    {
      variables: {
        filter: {
          type: packageTypeFilter,
          countries: selectedCountry ? [selectedCountry] : undefined,
          limit: 50
        } as AirHaloPackageFilter
      }
    }
  );

  // Fetch country-specific packages for comparison
  const { data: comparisonData, loading: comparisonLoading } = useQuery<CompareAirHaloPackagesQuery>(
    COMPARE_AIRHALO_PACKAGES,
    {
      variables: { countryCode: selectedCountry },
      skip: !selectedCountry || !showComparison
    }
  );

  // Flatten packages for table display
  const flattenedPackages = useMemo(() => {
    if (!packagesData?.airHaloPackages?.data) return [];
    
    return packagesData.airHaloPackages.data.flatMap(packageData =>
      packageData.operators.flatMap(operator =>
        operator.packages.map(pkg => ({
          ...pkg,
          operatorTitle: operator.title,
          operatorType: operator.type,
          countryTitles: operator.countries.map(c => c.title).join(', '),
          packageDataTitle: packageData.title,
          packageDataSlug: packageData.slug,
          networks: operator.coverages.flatMap(c => c.networks).map(n => n.name).join(', ')
        }))
      )
    );
  }, [packagesData]);

  const formatPrice = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const formatDataAmount = (amount: number, isUnlimited: boolean) => {
    if (isUnlimited) return 'Unlimited';
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}GB`;
    return `${amount}MB`;
  };

  if (packagesLoading) {
    return (
      <div className="space-y-4" data-testid="loading-skeleton" aria-live="polite" aria-label="Loading AirHalo packages">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (packagesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load AirHalo pricing data</p>
        <p className="text-sm text-red-600 mt-1">{packagesError.message}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2"
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            AirHalo Pricing Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Country</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {countriesData?.countries?.map(country => (
                  <SelectItem key={country.iso} value={country.iso}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Package Type</label>
            <Select 
              value={packageTypeFilter || ''} 
              onValueChange={(value) => setPackageTypeFilter(value as AirHaloPackageType || undefined)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="LOCAL">Local</SelectItem>
                <SelectItem value="REGIONAL">Regional</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Actions</label>
            <Button
              onClick={() => setShowComparison(!showComparison)}
              disabled={!selectedCountry}
              variant={showComparison ? "default" : "outline"}
              size="sm"
              className="w-48"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showComparison ? 'Hide' : 'Show'} Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {flattenedPackages.length} AirHalo packages
          {selectedCountry && ` for ${countriesData?.countries?.find(c => c.iso === selectedCountry)?.name}`}
        </p>
        {packagesData?.airHaloPackages?.meta && (
          <p className="text-sm text-gray-500">
            Page {packagesData.airHaloPackages.meta.currentPage} of {packagesData.airHaloPackages.meta.lastPage}
          </p>
        )}
      </div>

      {/* Packages Table */}
      <Card className="flex-1 min-h-0">
        <CardContent className="p-0">
          <div className="overflow-auto h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Net Price</TableHead>
                  <TableHead>RRP</TableHead>
                  <TableHead>Networks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flattenedPackages.map((pkg, index) => (
                  <TableRow key={`${pkg.id}-${index}`}>
                    <TableCell className="max-w-48">
                      <div>
                        <p className="font-medium text-sm">{pkg.title}</p>
                        {pkg.shortInfo && (
                          <p className="text-xs text-gray-500 truncate">{pkg.shortInfo}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{pkg.operatorTitle}</p>
                        <Badge variant="secondary" className="text-xs">
                          {pkg.operatorType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.type === 'LOCAL' ? 'default' : pkg.type === 'REGIONAL' ? 'secondary' : 'outline'}>
                        {pkg.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-32">
                      <p className="text-xs truncate" title={pkg.countryTitles}>
                        {pkg.countryTitles}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {formatDataAmount(pkg.amount, pkg.isUnlimited)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">{pkg.day} days</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatPrice(pkg.price.value, pkg.price.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">
                        {formatPrice(pkg.netPrice.value, pkg.netPrice.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600 font-medium">
                        {formatPrice(pkg.prices.recommendedRetailPrice.value, pkg.prices.recommendedRetailPrice.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-32">
                      <p className="text-xs truncate" title={pkg.networks}>
                        {pkg.networks || 'N/A'}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
                {flattenedPackages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No AirHalo packages found matching the current filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Section */}
      {showComparison && selectedCountry && (
        <Card>
          <CardHeader>
            <CardTitle>
              Pricing Comparison for {countriesData?.countries?.find(c => c.iso === selectedCountry)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : comparisonData?.compareAirHaloPackages?.length ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Found {comparisonData.compareAirHaloPackages.length} AirHalo package groups for comparison
                </p>
                {/* Add more detailed comparison view here */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisonData.compareAirHaloPackages.slice(0, 6).map(pkg => (
                    <div key={pkg.id} className="border rounded-lg p-3">
                      <h4 className="font-medium text-sm">{pkg.title}</h4>
                      <p className="text-xs text-gray-500">{pkg.slug}</p>
                      <p className="text-xs mt-1">
                        {pkg.operators.length} operator(s), {' '}
                        {pkg.operators.reduce((acc, op) => acc + op.packages.length, 0)} packages
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No AirHalo packages found for comparison in {countriesData?.countries?.find(c => c.iso === selectedCountry)?.name}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};