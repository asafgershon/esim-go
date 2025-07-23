import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Clock, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ConflictingJob {
  id: string;
  jobType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  bundleGroup?: string;
  bundlesProcessed?: number;
}

interface SyncConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmForce: () => void;
  conflictingJob: ConflictingJob;
  syncType?: string;
}

const formatDuration = (startTime: string): string => {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const getJobTypeDisplay = (jobType: string): string => {
  switch (jobType) {
    case 'full-sync':
      return 'Full Catalog Sync';
    case 'group-sync':
      return 'Bundle Group Sync';
    case 'country-sync':
      return 'Country Sync';
    case 'bundle-sync':
      return 'Bundle Sync';
    default:
      return jobType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function SyncConflictModal({
  isOpen,
  onClose,
  onConfirmForce,
  conflictingJob,
  syncType = 'catalog sync'
}: SyncConflictModalProps) {
  const isRunning = conflictingJob.status === 'running';
  const duration = conflictingJob.startedAt ? formatDuration(conflictingJob.startedAt) : null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Sync Job Conflict Detected
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Another sync operation is currently active
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {getJobTypeDisplay(conflictingJob.jobType)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(conflictingJob.status)}
                  >
                    {conflictingJob.status.toUpperCase()}
                  </Badge>
                </div>
                
                {conflictingJob.bundleGroup && (
                  <div className="text-sm text-muted-foreground">
                    Bundle Group: <span className="font-medium">{conflictingJob.bundleGroup}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started: {new Date(conflictingJob.createdAt).toLocaleString()}
                  </div>
                  {duration && (
                    <div>
                      Running for: <span className="font-medium">{duration}</span>
                    </div>
                  )}
                </div>
                
                {typeof conflictingJob.bundlesProcessed === 'number' && (
                  <div className="text-sm text-muted-foreground">
                    Bundles processed: <span className="font-medium">{conflictingJob.bundlesProcessed}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Forcing a new sync may cause data inconsistencies</p>
                <p className="text-muted-foreground mt-1">
                  {isRunning 
                    ? 'The current sync will be cancelled and its progress will be lost.'
                    : 'The pending sync will be cancelled before starting the new one.'
                  }
                </p>
              </div>
            </div>
            
            <div className="pl-6 text-muted-foreground">
              <p><strong>Recommended:</strong> Wait for the current sync to complete, or check if it's stuck and needs manual intervention.</p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmForce}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Force Sync Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}