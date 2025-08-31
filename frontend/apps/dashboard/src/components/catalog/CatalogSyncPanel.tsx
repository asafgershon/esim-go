import { CatalogSyncJob, CatalogSyncProgressSubscription, CatalogSyncProgressSubscriptionVariables, CatalogSyncProgressUpdate } from '@/__generated__/graphql';
import { gql, useSubscription } from '@apollo/client';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Progress } from '@workspace/ui/components/progress';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import {
  AlertCircle,
  ArrowUp,
  CheckCircle,
  Clock,
  Package,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const CATALOG_SYNC_PROGRESS_SUBSCRIPTION = gql`
  subscription CatalogSyncProgress {
    catalogSyncProgress {
      jobId
      jobType
      status
      bundleGroup
      countryId
      bundlesProcessed
      bundlesAdded
      bundlesUpdated
      totalBundles
      progress
      message
      errorMessage
      startedAt
      updatedAt
    }
  }
`;



interface CatalogSyncPanelProps {
  syncHistory: CatalogSyncJob[];
  loading: boolean;
  onClose: () => void;
  onSync: () => void;
  syncLoading: boolean;
}

export const CatalogSyncPanel: React.FC<CatalogSyncPanelProps> = ({
  syncHistory,
  loading,
  onClose,
  onSync,
  syncLoading
}) => {
  const [liveSyncProgress, setLiveSyncProgress] = useState<CatalogSyncProgressUpdate | null>(null);
  const [wsConnected, setWsConnected] = useState(true);
  
  // Subscribe to real-time catalog sync progress
  const { data: _syncProgressData, error: _syncError } = useSubscription<CatalogSyncProgressSubscription, CatalogSyncProgressSubscriptionVariables>(CATALOG_SYNC_PROGRESS_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.catalogSyncProgress) {
        setLiveSyncProgress(subscriptionData.data.catalogSyncProgress);
        setWsConnected(true); // Confirm connection is working when data arrives
      }
    },
    onSubscriptionComplete: () => {
      console.log('Catalog sync subscription completed');
    },
    onError: (error) => {
      console.error('Catalog sync subscription error:', error);
      setWsConnected(false);
    }
  });

  // Clear live progress when sync completes or fails
  useEffect(() => {
    if (liveSyncProgress && (liveSyncProgress.status === 'COMPLETED' || liveSyncProgress.status === 'FAILED')) {
      const timer = setTimeout(() => {
        setLiveSyncProgress(null);
      }, 3000); // Clear after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [liveSyncProgress]);

  const getLiveStatusIcon = (status: CatalogSyncProgressUpdate['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getLiveStatusBadge = (status: CatalogSyncProgressUpdate['status']) => {
    const variants: Record<CatalogSyncProgressUpdate['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      COMPLETED: 'default',
      FAILED: 'destructive',
      PROCESSING: 'secondary',
      CANCELLED: 'outline',
      PENDING: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status.toLowerCase()}
      </Badge>
    );
  };
  const getStatusIcon = (status: CatalogSyncJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: CatalogSyncJob['status']) => {
    const variants: Record<CatalogSyncJob['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline',
      cancelled: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status}
      </Badge>
    );
  };
  
  const getPriorityIcon = (priority: CatalogSyncJob['priority']) => {
    if (priority === 'high') {
      return <ArrowUp className="h-3 w-3 text-red-500" />;
    }
    return null;
  };
  
  const formatDuration = (start: string, end?: string): string => {
    if (!end) return 'In progress...';
    
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  const hasRunningJob = syncHistory.some(job => job.status === 'running');
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            Sync History
            <Tooltip>
              <TooltipTrigger>
                {wsConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>WebSocket {wsConnected ? 'connected' : 'disconnected'}</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>Real-time catalog synchronization updates</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSync}
                disabled={syncLoading || hasRunningJob}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Trigger Sync</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='overflow-y-auto'>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : syncHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No sync history available
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Live Sync Progress - Show as first card when active */}
              {liveSyncProgress && (
                <div className="border-2 border-blue-200 dark:border-blue-600 rounded-lg p-3 space-y-2 bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getLiveStatusIcon(liveSyncProgress.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{liveSyncProgress.jobType}</span>
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            LIVE
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(liveSyncProgress.startedAt)}
                        </p>
                      </div>
                    </div>
                    {getLiveStatusBadge(liveSyncProgress.status)}
                  </div>
                  
                  {liveSyncProgress.bundleGroup && (
                    <Badge variant="outline" className="text-xs">
                      {liveSyncProgress.bundleGroup}
                    </Badge>
                  )}
                  
                  {liveSyncProgress.countryId && (
                    <Badge variant="outline" className="text-xs">
                      Country: {liveSyncProgress.countryId}
                    </Badge>
                  )}
                  
                  {/* Progress Bar */}
                  {liveSyncProgress.status === 'PROCESSING' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{liveSyncProgress.progress}% complete</span>
                        {liveSyncProgress.totalBundles && (
                          <span>{liveSyncProgress.bundlesProcessed} / {liveSyncProgress.totalBundles}</span>
                        )}
                      </div>
                      <Progress value={liveSyncProgress.progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{liveSyncProgress.bundlesProcessed} processed</span>
                    </div>
                    {liveSyncProgress.bundlesAdded > 0 && (
                      <div className="flex items-center gap-1">
                        <Plus className="h-3 w-3 text-green-500" />
                        <span>{liveSyncProgress.bundlesAdded} added</span>
                      </div>
                    )}
                    {liveSyncProgress.bundlesUpdated > 0 && (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 text-blue-500" />
                        <span>{liveSyncProgress.bundlesUpdated} updated</span>
                      </div>
                    )}
                  </div>
                  
                  {liveSyncProgress.message && (
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {liveSyncProgress.message}
                    </p>
                  )}
                  
                  {liveSyncProgress.errorMessage && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {liveSyncProgress.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {syncHistory.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{job.jobType}</span>
                          {getPriorityIcon(job.priority)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(job.createdAt)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                  
                  {job.group && (
                    <Badge variant="outline" className="text-xs">
                      {job.group}
                    </Badge>
                  )}
                  
                  {job.countryId && (
                    <Badge variant="outline" className="text-xs">
                      Country: {job.countryId}
                    </Badge>
                  )}
                  
                  {(job.bundlesProcessed !== undefined || job.bundlesAdded !== undefined || job.bundlesUpdated !== undefined) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {job.bundlesProcessed !== undefined && (
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>{job.bundlesProcessed} processed</span>
                        </div>
                      )}
                      {job.bundlesAdded !== undefined && job.bundlesAdded !== null && job.bundlesAdded > 0 && (
                        <div className="flex items-center gap-1">
                          <Plus className="h-3 w-3 text-green-500" />
                          <span>{job.bundlesAdded} added</span>
                        </div>
                      )}
                      {job.bundlesUpdated !== undefined && job.bundlesUpdated !== null && job.bundlesUpdated > 0 && (
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 text-blue-500" />
                          <span>{job.bundlesUpdated} updated</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {job.startedAt && (
                    <p className="text-xs text-muted-foreground">
                      Duration: {formatDuration(job.startedAt || '', job.completedAt || '')}
                    </p>
                  )}
                  
                  {job.errorMessage && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {job.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </CardContent>
    </Card>
  );
};