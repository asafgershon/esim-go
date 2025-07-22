import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { 
  X, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Package,
  Plus,
  ArrowUp
} from 'lucide-react';

interface SyncJob {
  id: string;
  jobType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'high' | 'normal' | 'low';
  bundleGroup?: string;
  countryId?: string;
  bundlesProcessed?: number;
  bundlesAdded?: number;
  bundlesUpdated?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

interface CatalogSyncPanelProps {
  syncHistory: SyncJob[];
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
  const getStatusIcon = (status: SyncJob['status']) => {
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
  
  const getStatusBadge = (status: SyncJob['status']) => {
    const variants: Record<SyncJob['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
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
  
  const getPriorityIcon = (priority: SyncJob['priority']) => {
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
          <CardTitle className="text-lg">Sync History</CardTitle>
          <CardDescription>Recent catalog synchronization jobs</CardDescription>
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
      <CardContent>
        <ScrollArea className="h-[500px]">
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
                  
                  {job.bundleGroup && (
                    <Badge variant="outline" className="text-xs">
                      {job.bundleGroup}
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
                      {job.bundlesAdded !== undefined && job.bundlesAdded > 0 && (
                        <div className="flex items-center gap-1">
                          <Plus className="h-3 w-3 text-green-500" />
                          <span>{job.bundlesAdded} added</span>
                        </div>
                      )}
                      {job.bundlesUpdated !== undefined && job.bundlesUpdated > 0 && (
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 text-blue-500" />
                          <span>{job.bundlesUpdated} updated</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {job.startedAt && (
                    <p className="text-xs text-muted-foreground">
                      Duration: {formatDuration(job.startedAt, job.completedAt)}
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};