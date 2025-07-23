import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CATALOG_BUNDLES } from '@/lib/graphql/queries';
import type { GetCatalogBundlesQuery, SearchCatalogCriteria } from '@/__generated__/graphql';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { AdvancedDataTable } from '@workspace/ui/components/advanced-data-table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download, Package, Globe, Clock, DollarSign, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';

type CatalogBundle = {
  id: string;
  esimGoName: string;
  bundleGroup: string;
  description: string;
  duration: number;
  dataAmount: number; // -1 for unlimited
  unlimited: boolean;
  priceCents: number;
  currency: string;
  countries: string[];
  regions: string[];
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
};

const columns: ColumnDef<CatalogBundle>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Bundle Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{plan.name}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {plan.description}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'region',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Region
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <div className="space-y-1">
          <Badge variant="outline">{plan.region}</Badge>
          <div className="text-xs text-muted-foreground">
            {plan.countries.length} {plan.countries.length === 1 ? 'country' : 'countries'}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'countries',
    header: 'Countries',
    cell: ({ row }) => {
      const countries = row.original.countries;
      const displayCountries = countries.slice(0, 3);
      const remainingCount = countries.length - 3;
      
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {displayCountries.map((country) => (
              <Badge key={country.iso} variant="secondary" className="text-xs">
                {country.flag} {country.iso}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const duration = row.original.duration;
      return (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{duration} days</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const plan = row.original;
      const pricePerDay = plan.price / plan.duration;
      return (
        <div className="space-y-1">
          <div className="font-medium">
            ${plan.price.toFixed(2)} {plan.currency}
          </div>
          <div className="text-xs text-muted-foreground">
            ${pricePerDay.toFixed(2)}/day
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'bundleGroup',
    header: 'Bundle Group',
    cell: ({ row }) => {
      const bundleGroup = row.original.bundleGroup;
      return bundleGroup ? (
        <Badge variant="outline">{bundleGroup}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: 'features',
    header: 'Features',
    cell: ({ row }) => {
      const features = row.original.features;
      const displayFeatures = features.slice(0, 2);
      const remainingCount = features.length - 2;
      
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {displayFeatures.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'availableQuantity',
    header: 'Stock',
    cell: ({ row }) => {
      const quantity = row.original.availableQuantity;
      if (quantity === null || quantity === undefined) {
        return <span className="text-muted-foreground">-</span>;
      }
      
      const isLowStock = quantity < 10;
      const isOutOfStock = quantity === 0;
      
      return (
        <div className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${
              isOutOfStock
                ? 'bg-red-500'
                : isLowStock
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
          />
          <span className={isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : ''}>
            {quantity}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'isUnlimited',
    header: 'Type',
    cell: ({ row }) => {
      const isUnlimited = row.original.isUnlimited;
      return (
        <Badge variant={isUnlimited ? 'default' : 'secondary'}>
          {isUnlimited ? 'Unlimited' : 'Limited'}
        </Badge>
      );
    },
  },
];

function BundlesPageContent() {
  const [filter, setFilter] = useState<DataPlanFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100); // Default to 100 items per page
  
  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);
  
  // Combine search term with filter for API call
  const queryFilter = useMemo(() => {
    const combinedFilter = { ...filter };
    
    // Add search term to filter - this will trigger a new API call
    if (debouncedSearchTerm.trim()) {
      combinedFilter.search = debouncedSearchTerm;
    }
    
    // Add pagination parameters
    combinedFilter.limit = pageSize;
    combinedFilter.offset = (currentPage - 1) * pageSize;
    
    return combinedFilter;
  }, [filter, debouncedSearchTerm, currentPage, pageSize]);
  
  const { data, loading, error } = useQuery<GetDataPlansQuery>(GET_DATA_PLANS, {
    variables: { filter: queryFilter },
  });

  // Use data directly since filtering now happens server-side
  const filteredPlans = data?.dataPlans?.items || [];
  const paginationInfo = data?.dataPlans;

  const handleExportCSV = () => {
    if (!filteredPlans.length) return;
    
    const csvContent = [
      ['Name', 'Description', 'Region', 'Countries', 'Duration', 'Price', 'Currency', 'Bundle Group', 'Features', 'Stock', 'Type'],
      ...(filteredPlans || []).map(plan => [
        plan.name,
        plan.description,
        plan.region,
        plan.countries.map(c => c.name).join('; '),
        plan.duration.toString(),
        plan.price.toString(),
        plan.currency,
        plan.bundleGroup || '',
        plan.features.join('; '),
        plan.availableQuantity?.toString() || '',
        plan.isUnlimited ? 'Unlimited' : 'Limited'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'esim-bundles.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueRegions = useMemo(() => {
    if (!data?.dataPlans) return [];
    return [...new Set(data.dataPlans.items.map(plan => plan.region).filter(region => region && region.trim() !== ''))];
  }, [data?.dataPlans]);

  const uniqueBundleGroups = useMemo(() => {
    if (!data?.dataPlans) return [];
    return [...new Set(data.dataPlans.items.map(plan => plan.bundleGroup).filter(group => group && group.trim() !== ''))];
  }, [data?.dataPlans]);

  if (error) {
    console.error('Error fetching data plans:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">eSIM Bundles</h1>
          <p className="text-muted-foreground">
            Review and analyze all available eSIM bundles from our catalog
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={!filteredPlans.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paginationInfo?.totalCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Showing {filteredPlans.length} of {paginationInfo?.totalCount || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueRegions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredPlans.length > 0 ? (filteredPlans.reduce((sum, plan) => sum + plan.price, 0) / filteredPlans.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPlans.length > 0 ? Math.round(filteredPlans.reduce((sum, plan) => sum + plan.duration, 0) / filteredPlans.length) : 0} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={filter.region || 'all'}
                onValueChange={(value) => setFilter({ ...filter, region: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {uniqueRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bundle Group</Label>
              <Select
                value={filter.bundleGroup || 'all'}
                onValueChange={(value) => setFilter({ ...filter, bundleGroup: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {uniqueBundleGroups.map((group) => (
                    <SelectItem key={group} value={group || ''}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Max Price</Label>
              <Input
                type="number"
                placeholder="Max price"
                value={filter.maxPrice || ''}
                onChange={(e) => setFilter({ ...filter, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bundle Catalog</CardTitle>
          <CardDescription>
            Comprehensive view of all available eSIM bundles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">
                Error loading bundles: {error.message}
              </p>
            </div>
          ) : (
            <AdvancedDataTable 
              columns={columns} 
              data={filteredPlans} 
              searchKey="name"
              searchPlaceholder="Search bundles..."
              enableSorting={true}
              enableFiltering={true}
              enablePagination={true}
              initialPageSize={20}
              pageSizeOptions={[10, 20, 30, 50]}
            />
          )}
          
          {/* Pagination Controls */}
          {paginationInfo && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Items per page:</p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  Page {paginationInfo.pageInfo.currentPage} of {paginationInfo.pageInfo.pages}
                </p>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={!paginationInfo.hasPreviousPage}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!paginationInfo.hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!paginationInfo.hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(paginationInfo.pageInfo.pages)}
                    disabled={!paginationInfo.hasNextPage}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function BundlesPage() {
  return (
    <ErrorBoundary>
      <BundlesPageContent />
    </ErrorBoundary>
  );
}