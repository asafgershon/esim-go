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
      <div className="whitespace-nowrap flex items-center animate-marquee">
        {[...messages, ...messages].map((msg, i) => (
          <span
            key={i}
            className="mx-6 text-xs md:text-sm font-medium"
          >
            {msg}
            <span className="mx-6 text-brand-green font-semibold">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
