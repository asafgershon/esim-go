const messages = [
  "eSIM ללא הגבלת נפח גלישה",
  "eSIM עם אין סוף ג׳יגה בייט",
  "eSIM במחיר המשתלם ביותר",
  "שירות 24/7 בעברית",
  "התקנת eSIM בקליק!",
];

export function AnnouncementBanner() {
  return (
    <div className="relative bg-brand-dark text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="py-2">
          <div className="flex items-center whitespace-nowrap">
            <div className="marquee">
              <div className="marquee__track">
                {[...messages, ...messages].map((msg, i) => (
                  <span key={i} className="mx-6 text-xs md:text-sm font-medium">
                    {msg}
                    <span className="mx-6 text-brand-green font-semibold">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
