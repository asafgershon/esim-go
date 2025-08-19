export function AnnouncementBanner() {
  return (
    <div className="relative bg-brand-dark text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-2 text-sm">
          {/* Desktop Content */}
          <div className="hidden md:flex items-center gap-1">
            <span>שירות 24/7 בעברית מכל מקום בעולם.</span>
            <span className="text-brand-green font-semibold">
              בלי הגבלות, בלי הפתעות
            </span>
          </div>

          {/* Mobile Content */}
          <div className="flex md:hidden items-center gap-1 text-xs">
            <span>שירות 24/7 בעברית מכל מקום בעולם.</span>
            <span className="text-brand-green font-semibold">
              בלי הגבלות, בלי הפתעות
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
