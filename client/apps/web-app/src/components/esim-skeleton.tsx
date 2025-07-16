export function EsimSkeleton() {
  return (
    <div className="w-full max-w-xl mx-auto bg-card rounded-2xl shadow-lg overflow-hidden" dir="rtl">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-muted to-secondary p-6 text-center">
        <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2 animate-pulse"></div>
        <div className="w-32 h-6 bg-muted rounded mx-auto mb-1 animate-pulse"></div>
        <div className="w-48 h-4 bg-muted rounded mx-auto animate-pulse"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex bg-muted p-1 m-4 rounded-xl">
        <div className="flex-1 py-3 px-4 bg-muted rounded-lg animate-pulse"></div>
        <div className="flex-1 py-3 px-4 bg-muted/10 rounded-lg animate-pulse ml-1"></div>
      </div>

      {/* Search Skeleton */}
      <div className="px-4 mb-4">
        <div className="w-full h-9 bg-muted rounded-md animate-pulse"></div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 pb-4 space-y-3">
          <div className="p-4 border border-border rounded-xl">
            <div className="flex items-center justify-between">
              
              <div className="text-left">
                <div className="w-12 h-4 bg-muted rounded mb-1 animate-pulse"></div>
                <div className="w-24 h-5 bg-muted rounded mb-1 animate-pulse"></div>
                <div className="w-12 h-3 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
      </div>

      {/* Footer Skeleton */}
      <div className="p-4 border-t bg-muted">
        <div className="w-full h-12 bg-white/70 dark:bg-black/70 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
} 