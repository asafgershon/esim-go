import React, { useState } from 'react';
import { Button, Tooltip, TooltipTrigger, TooltipContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui';
import { Calculator, RefreshCw, Layers, Settings } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usePricingData } from '../hooks/usePricingData';
import { TRIGGER_CATALOG_SYNC, GET_CATALOG_SYNC_HISTORY } from '../lib/graphql/queries';
import { SyncConflictModal, type ConflictingJob } from '@/components/SyncConflictModal';





const PricingPage: React.FC = () => {
  const { countryGroups, tripsData, loading, error, expandCountry } = usePricingData();
  const location = useLocation();
  const navigate = useNavigate();
  const [showTrips, setShowTrips] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingJob, setConflictingJob] = useState<ConflictingJob | null>(null);

  // Sync catalog mutation
  const [triggerCatalogSync, { loading: syncLoading }] = useMutation(TRIGGER_CATALOG_SYNC);
  
  // Sync history query
  const { data: syncHistoryData } = useQuery(GET_CATALOG_SYNC_HISTORY, {
    variables: { params: { limit: 10 } }
  });




  // Handle sync catalog
  const handleSyncCatalog = async () => {
    // Check for running sync jobs
    const syncHistory = syncHistoryData?.catalogSyncHistory?.jobs || [];
    const runningJob = syncHistory.find(job => job.status === 'running' || job.status === 'pending');
    
    if (runningJob) {
      // Map job data to ConflictingJob format
      const conflictJob: ConflictingJob = {
        id: runningJob.id,
        jobType: runningJob.jobType,
        status: runningJob.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
        createdAt: runningJob.createdAt,
        startedAt: runningJob.startedAt,
        bundleGroup: runningJob.bundleGroup,
        bundlesProcessed: runningJob.bundlesProcessed
      };
      
      setConflictingJob(conflictJob);
      setShowConflictModal(true);
      return;
    }
    
    // No conflicts, proceed with sync
    await performSync(false);
  };
  
  const performSync = async (force: boolean) => {
    try {
      const result = await triggerCatalogSync({
        variables: { 
          params: {
            type: 'FULL_SYNC',
            force
          }
        }
      });
      
      if (result.data?.triggerCatalogSync.success) {
        toast.success('A sync has been triggered and can take up to few minutes...');
      } else if (result.data?.triggerCatalogSync.conflictingJob) {
        // Handle server-side conflict detection as fallback
        const conflictJob: ConflictingJob = {
          id: result.data.triggerCatalogSync.conflictingJob.id,
          jobType: result.data.triggerCatalogSync.conflictingJob.jobType,
          status: result.data.triggerCatalogSync.conflictingJob.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
          createdAt: result.data.triggerCatalogSync.conflictingJob.createdAt,
          startedAt: result.data.triggerCatalogSync.conflictingJob.startedAt,
        };
        setConflictingJob(conflictJob);
        setShowConflictModal(true);
      } else {
        toast.error(result.data?.triggerCatalogSync.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to trigger catalog sync. Please try again.');
    }
  };

  const handleForceSync = async () => {
    setShowConflictModal(false);
    setConflictingJob(null);
    await performSync(true);
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
      icon: <Layers className="h-5 w-5" />,
      description: 'View and manage pricing configurations across all countries and bundles'
    },
    '/pricing/rules': {
      title: 'Rules Management',
      icon: <Settings className="h-5 w-5" />,
      description: 'Comprehensive pricing rules engine with markup configuration and processing fees'
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
              <Layers className="h-4 w-4" />
              Summary
            </Link>
            <Link
              to="/pricing/rules"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                currentPath === '/pricing/rules'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
              Rules
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
                  <Layers className="h-4 w-4" />
                  <span>Summary</span>
                </div>
              </SelectItem>
              <SelectItem value="/pricing/rules">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Rules</span>
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
          tripsData,
          expandCountry, 
          loading, 
          error,
          showTrips,
          setShowTrips 
        }} />
      </div>
      
      {conflictingJob && (
        <SyncConflictModal
          isOpen={showConflictModal}
          onClose={() => {
            setShowConflictModal(false);
            setConflictingJob(null);
          }}
          onConfirmForce={handleForceSync}
          conflictingJob={conflictingJob}
          syncType="catalog sync"
        />
      )}
    </div>
  );
};

export default PricingPage;