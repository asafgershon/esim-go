import React from 'react';
import { Button, Tooltip, TooltipTrigger, TooltipContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui';
import { Calculator, DollarSign, Table, CreditCard, RefreshCw, Layers, TrendingDown } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usePricingData } from '../hooks/usePricingData';
import { SYNC_CATALOG } from '../lib/graphql/queries';





const PricingPage: React.FC = () => {
  const { countryGroups, loading, error, expandCountry } = usePricingData();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync catalog mutation
  const [syncCatalog, { loading: syncLoading }] = useMutation(SYNC_CATALOG);




  // Handle sync catalog
  const handleSyncCatalog = async () => {
    try {
      const result = await syncCatalog({
        variables: { force: false }
      });
      
      if (result.data?.syncCatalog.success) {
        toast.success('A sync has been triggered and can take up to few minutes...');
      } else {
        toast.error(result.data?.syncCatalog.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to trigger catalog sync. Please try again.');
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pricing data from eSIM Go API...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Tab configuration with titles, icons, descriptions, and routes
  const tabConfig = {
    '/pricing/summary': {
      title: 'Summary',
      icon: <Table className="h-5 w-5" />,
      description: 'View and manage pricing configurations across all countries and bundles'
    },
    '/pricing/summary-experimental': {
      title: 'Split-View',
      icon: <Layers className="h-5 w-5" />,
      description: 'Experimental simplified layout with split-view design'
    },
    '/pricing/markup': {
      title: 'Markup Pricing',
      icon: <DollarSign className="h-5 w-5" />,
      description: 'Update fixed markup amounts for each bundle group and duration'
    },
    '/pricing/processing-fee': {
      title: 'Processing Fee',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Configure processing fees and payment-related charges'
    },
    '/pricing/discounts': {
      title: 'Discounts',
      icon: <TrendingDown className="h-5 w-5" />,
      description: 'Manage discount rates and progressive daily discounts'
    },
    '/pricing/simulator': {
      title: 'Simulator Pricing',
      icon: <Calculator className="h-5 w-5" />,
      description: 'Simulate pricing for any country and duration combination'
    }
  };

  // Get current tab based on route, default to summary
  const currentPath = location.pathname === '/pricing' ? '/pricing/summary' : location.pathname;
  const currentTab = tabConfig[currentPath as keyof typeof tabConfig] || tabConfig['/pricing/summary'];

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        {/* Active tab header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            {/* Small top title - very tight spacing */}
            <h1 className="text-sm font-normal text-gray-500 leading-none">Pricing Management</h1>
            <div className="flex items-center gap-3">
              {currentTab.icon}
              <h2 className="text-2xl font-bold text-gray-900">{currentTab.title}</h2>
            </div>
            <p className="text-gray-600">{currentTab.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSyncCatalog}
                  disabled={syncLoading}
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${
                    syncLoading ? 'text-primary animate-pulse' : ''
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  Sync catalog
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {syncLoading ? 'Sync in progress' : 'Triggers sync with eSIM Go API'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Tab Navigation */}
        <div>
          {/* Desktop Tabs - hidden on mobile, shown on desktop */}
          <div className="hidden md:flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Link
              to="/pricing/summary"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/summary'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Table className="h-4 w-4" />
              Summary
            </Link>
            <Link
              to="/pricing/summary-experimental"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/summary-experimental'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-4 w-4" />
              Split-View
              <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">Beta</span>
            </Link>
            <Link
              to="/pricing/markup"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/markup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Markup Pricing
            </Link>
            <Link
              to="/pricing/processing-fee"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/processing-fee'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Processing Fee
            </Link>
            <Link
              to="/pricing/discounts"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/discounts'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Discounts
            </Link>
            <Link
              to="/pricing/simulator"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/simulator'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calculator className="h-4 w-4" />
              Simulator Pricing
            </Link>
          </div>

          {/* Mobile Dropdown - shown on mobile and tablet, hidden on desktop */}
          <div className="md:hidden">
            <Select value={currentPath} onValueChange={(value) => navigate(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="/pricing/summary">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  <span>Summary</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/summary-experimental">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>Split-View</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full ml-1">Beta</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/markup">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Markup Pricing</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/processing-fee">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Processing Fee</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/discounts">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  <span>Discounts</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/simulator">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span>Simulator Pricing</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>

        {/* Separator between tabs and content */}
        <div className="flex justify-center">
          <div className="w-3/4 h-px bg-gray-200"></div>
        </div>
      </div>

      {/* Flexible Content Area */}
      <div className="flex-1 min-h-0">
        <Outlet context={{ 
          countryGroups, 
          expandCountry, 
          loading, 
          error 
        }} />
      </div>
    </div>
  );
};

export default PricingPage;