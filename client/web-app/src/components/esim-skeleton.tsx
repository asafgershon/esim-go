export function EsimSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto bg-card rounded-2xl shadow-lg overflow-hidden" dir="rtl">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-muted to-secondary p-6 text-center">
        <div className="w-8 h-8 bg-muted-foreground/20 rounded-full mx-auto mb-2 animate-pulse"></div>
        <div className="w-32 h-6 bg-muted-foreground/20 rounded mx-auto mb-1 animate-pulse"></div>
        <div className="w-48 h-4 bg-muted-foreground/20 rounded mx-auto animate-pulse"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex bg-muted p-1 m-4 rounded-xl">
        <div className="flex-1 py-3 px-4 bg-muted-foreground/20 rounded-lg animate-pulse"></div>
        <div className="flex-1 py-3 px-4 bg-muted-foreground/10 rounded-lg animate-pulse ml-1"></div>
      </div>

      {/* Search Skeleton */}
      <div className="px-4 mb-4">
        <div className="w-full h-9 bg-muted-foreground/20 rounded-md animate-pulse"></div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 pb-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted-foreground/20 rounded animate-pulse"></div>
                <div>
                  <div className="w-24 h-5 bg-muted-foreground/20 rounded mb-2 animate-pulse"></div>
                  <div className="w-32 h-4 bg-muted-foreground/20 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="text-left">
                <div className="w-8 h-4 bg-muted-foreground/20 rounded mb-1 animate-pulse"></div>
                <div className="w-12 h-5 bg-muted-foreground/20 rounded mb-1 animate-pulse"></div>
                <div className="w-8 h-3 bg-muted-foreground/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="p-4 border-t bg-muted">
        <div className="w-full h-12 bg-muted-foreground/20 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
} 